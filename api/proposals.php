<?php
// proposals.php
// CRUD operations for proposals

require_once 'db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    sendJson(["error" => "Unauthorized"], 401);
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch proposals
if ($method === 'GET') {
    $proposals = read_json('proposals');
    $user_proposals = array_values(array_filter($proposals, fn($p) => $p['user_id'] === $user_id));
    
    // Sort by created_at DESC
    usort($user_proposals, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

    $id = $_GET['id'] ?? null;
    if ($id) {
        $proposal = array_filter($user_proposals, fn($p) => $p['id'] === $id);
        if ($proposal) {
            sendJson(["data" => reset($proposal)]);
        } else {
            sendJson(["error" => "Proposal not found"], 404);
        }
    } else {
        sendJson(["data" => $user_proposals]);
    }
}

// POST: Create proposal
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['number'])) sendJson(["error" => "Number is required"], 400);
    
    $id = uuidv4();
    $proposals = read_json('proposals');
    
    $newProposal = [
        "id" => $id,
        "user_id" => $user_id,
        "client_id" => $data['client_id'] ?? null,
        "template_id" => $data['template_id'] ?? null,
        "number" => $data['number'],
        "title" => $data['title'] ?? null,
        "client_name" => $data['client_name'] ?? null,
        "client_email" => $data['client_email'] ?? null,
        "client_address" => $data['client_address'] ?? null,
        "issue_date" => $data['issue_date'] ?? null,
        "valid_until" => $data['valid_until'] ?? null,
        "items" => $data['items'] ?? [],
        "sections" => $data['sections'] ?? [],
        "notes" => $data['notes'] ?? null,
        "terms" => $data['terms'] ?? null,
        "total" => $data['total'] ?? 0,
        "status" => $data['status'] ?? 'draft',
        "created_at" => date('c'),
        "updated_at" => date('c')
    ];
    
    $proposals[] = $newProposal;
    write_json('proposals', $proposals);
    
    sendJson(["message" => "Proposal created", "data" => ["id" => $id]]);
}

// PUT/PATCH: Update proposal
if ($method === 'PUT' || $method === 'PATCH') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendJson(["error" => "ID required"], 400);

    $data = json_decode(file_get_contents("php://input"), true);
    $proposals = read_json('proposals');
    $found = false;
    
    $allowedFields = ['client_id', 'template_id', 'number', 'title', 'client_name', 'client_email', 'client_address', 'issue_date', 'valid_until', 'notes', 'terms', 'total', 'status', 'items', 'sections'];
    
    foreach ($proposals as &$proposal) {
        if ($proposal['id'] === $id && $proposal['user_id'] === $user_id) {
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $proposal[$field] = $data[$field];
                }
            }
            $proposal['updated_at'] = date('c');
            $found = true;
            break;
        }
    }
    
    if ($found) {
        write_json('proposals', $proposals);
        sendJson(["message" => "Proposal updated"]);
    } else {
        sendJson(["error" => "Update failed"], 500);
    }
}

// DELETE: Delete proposal
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendJson(["error" => "ID required"], 400);
    
    $proposals = read_json('proposals');
    $initialCount = count($proposals);
    $proposals = array_filter($proposals, fn($p) => !($p['id'] === $id && $p['user_id'] === $user_id));
    
    if (count($proposals) < $initialCount) {
        write_json('proposals', array_values($proposals));
        sendJson(["message" => "Proposal deleted"]);
    } else {
        sendJson(["error" => "Deletion failed"], 500);
    }
}

sendJson(["error" => "Method not allowed"], 405);
?>
