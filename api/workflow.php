<?php
// workflow.php
// Workflow custom actions for proposals and invoices

require_once 'db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    sendJson(["error" => "Unauthorized"], 401);
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method !== 'POST') {
    sendJson(["error" => "Method not allowed"], 405);
}

$data = json_decode(file_get_contents("php://input"), true);
$proposalId = $data['proposalId'] ?? null;
$invoiceId = $data['invoiceId'] ?? null;

function logAudit($entityId, $entityType, $actionStr, $oldStatus, $newStatus, $userId) {
    $audits = read_json('audit_trails');
    $audits[] = [
        "id" => uuidv4(),
        "user_id" => $userId,
        "entity_type" => $entityType,
        "entity_id" => $entityId,
        "action" => $actionStr,
        "old_status" => $oldStatus,
        "new_status" => $newStatus,
        "created_at" => date('c')
    ];
    write_json('audit_trails', $audits);
}

function logMessage($entityId, $entityType, $channel, $status, $userId) {
    $logs = read_json('message_logs');
    $logs[] = [
        "id" => uuidv4(),
        "user_id" => $userId,
        "entity_type" => $entityType,
        "entity_id" => $entityId,
        "channel" => $channel,
        "direction" => "outbound",
        "status" => $status,
        "created_at" => date('c')
    ];
    write_json('message_logs', $logs);
}

if ($action === 'verify_proposal') {
    if (!$proposalId) sendJson(["error" => "proposalId required"], 400);

    $proposals = read_json('proposals');
    $found = false;
    foreach ($proposals as &$p) {
        if ($p['id'] === $proposalId && $p['user_id'] === $user_id) {
            if (!in_array($p['status'], ['draft', 'in_review'])) {
                sendJson(["error" => "Invalid state"], 400);
            }
            $oldStatus = $p['status'];
            $p['status'] = 'verified';
            $p['verified_by'] = $user_id;
            $p['updated_at'] = date('c');
            $found = true;
            logAudit($proposalId, 'proposal', 'verified', $oldStatus, 'verified', $user_id);
            break;
        }
    }
    
    if (!$found) sendJson(["error" => "Proposal not found"], 404);
    
    write_json('proposals', $proposals);
    sendJson(["message" => "Proposal verified"]);
}

if ($action === 'send_proposal') {
    if (!$proposalId) sendJson(["error" => "proposalId required"], 400);

    $proposals = read_json('proposals');
    $found = false;
    foreach ($proposals as &$p) {
        if ($p['id'] === $proposalId && $p['user_id'] === $user_id) {
            if ($p['status'] !== 'verified') {
                sendJson(["error" => "Must be verified first"], 400);
            }
            $p['status'] = 'sent';
            $p['sent_at'] = date('c');
            $p['reminder_count'] = 0;
            $p['updated_at'] = date('c');
            $found = true;
            logAudit($proposalId, 'proposal', 'sent_to_client', 'verified', 'sent', $user_id);
            logMessage($proposalId, 'proposal', 'email', 'sent', $user_id);
            logMessage($proposalId, 'proposal', 'whatsapp', 'sent', $user_id);
            break;
        }
    }
    
    if (!$found) sendJson(["error" => "Proposal not found"], 404);
    
    write_json('proposals', $proposals);
    sendJson(["message" => "Proposal sent"]);
}

if ($action === 'submit_detailing') {
    if (!$proposalId) sendJson(["error" => "proposalId required"], 400);

    $details = read_json('proposal_details');
    $details[] = [
        "id" => uuidv4(),
        "user_id" => $user_id,
        "proposal_id" => $proposalId,
        "scope_fields" => ["scope" => $data['scope'] ?? ""],
        "schedule_fields" => ["schedule" => $data['schedule'] ?? ""],
        "filled_by" => $user_id,
        "filled_at" => date('c')
    ];
    write_json('proposal_details', $details);
    
    logAudit($proposalId, 'proposal', 'detailing_submitted', 'approved', 'approved', $user_id);
    sendJson(["message" => "Details submitted"]);
}

if ($action === 'authorize_invoice') {
    if (!$proposalId) sendJson(["error" => "proposalId required"], 400);

    $proposals = read_json('proposals');
    $foundProposal = null;
    
    foreach ($proposals as &$p) {
        if ($p['id'] === $proposalId && $p['user_id'] === $user_id) {
            $oldStatus = $p['status'];
            $p['status'] = 'invoice_authorized';
            $p['updated_at'] = date('c');
            $foundProposal = $p;
            logAudit($proposalId, 'proposal', 'invoice_authorized', $oldStatus, 'invoice_authorized', $user_id);
            break;
        }
    }
    
    if (!$foundProposal) sendJson(["error" => "Proposal not found"], 404);
    
    write_json('proposals', $proposals);
    
    // Generate Invoice
    $invoices = read_json('invoices');
    $invId = uuidv4();
    $invNum = str_replace('PROP-', 'INV-', $foundProposal['number']);
    
    $invoices[] = [
        "id" => $invId,
        "user_id" => $user_id,
        "proposal_id" => $proposalId,
        "template_id" => $foundProposal['template_id'] ?? null,
        "number" => $invNum,
        "client_name" => $foundProposal['client_name'],
        "client_email" => $foundProposal['client_email'],
        "client_address" => $foundProposal['client_address'],
        "issue_date" => date('Y-m-d'),
        "due_date" => null,
        "items" => $foundProposal['items'],
        "notes" => null,
        "terms" => null,
        "total" => $foundProposal['total'],
        "status" => 'draft',
        "authorized_by" => $user_id,
        "created_at" => date('c'),
        "updated_at" => date('c')
    ];
    write_json('invoices', $invoices);
    
    sendJson(["message" => "Invoice authorized", "invoiceId" => $invId]);
}

sendJson(["error" => "Invalid action"], 400);
?>
