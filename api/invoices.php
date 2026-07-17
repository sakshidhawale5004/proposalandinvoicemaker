<?php
// invoices.php
// CRUD operations for invoices

require_once 'db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    sendJson(["error" => "Unauthorized"], 401);
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch invoices
if ($method === 'GET') {
    $invoices = read_json('invoices');
    $user_invoices = array_values(array_filter($invoices, fn($i) => $i['user_id'] === $user_id));
    
    // Sort by created_at DESC
    usort($user_invoices, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

    $id = $_GET['id'] ?? null;
    if ($id) {
        $invoice = array_filter($user_invoices, fn($i) => $i['id'] === $id);
        if ($invoice) {
            sendJson(["data" => reset($invoice)]);
        } else {
            sendJson(["error" => "Invoice not found"], 404);
        }
    } else {
        sendJson(["data" => $user_invoices]);
    }
}

// POST: Create invoice
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['number'])) sendJson(["error" => "Number is required"], 400);
    
    $id = uuidv4();
    $invoices = read_json('invoices');
    
    $newInvoice = [
        "id" => $id,
        "user_id" => $user_id,
        "proposal_id" => $data['proposal_id'] ?? null,
        "template_id" => $data['template_id'] ?? null,
        "number" => $data['number'],
        "client_name" => $data['client_name'] ?? null,
        "client_email" => $data['client_email'] ?? null,
        "client_address" => $data['client_address'] ?? null,
        "issue_date" => $data['issue_date'] ?? null,
        "due_date" => $data['due_date'] ?? null,
        "items" => $data['items'] ?? [],
        "notes" => $data['notes'] ?? null,
        "terms" => $data['terms'] ?? null,
        "total" => $data['total'] ?? 0,
        "status" => $data['status'] ?? 'draft',
        "authorized_by" => $data['authorized_by'] ?? null,
        "created_at" => date('c'),
        "updated_at" => date('c')
    ];
    
    $invoices[] = $newInvoice;
    write_json('invoices', $invoices);
    
    sendJson(["message" => "Invoice created", "data" => ["id" => $id]]);
}

// PUT/PATCH: Update invoice
if ($method === 'PUT' || $method === 'PATCH') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendJson(["error" => "ID required"], 400);

    $data = json_decode(file_get_contents("php://input"), true);
    $invoices = read_json('invoices');
    $found = false;
    
    $allowedFields = ['proposal_id', 'template_id', 'number', 'client_name', 'client_email', 'client_address', 'issue_date', 'due_date', 'notes', 'terms', 'total', 'status', 'authorized_by', 'items'];
    
    foreach ($invoices as &$invoice) {
        if ($invoice['id'] === $id && $invoice['user_id'] === $user_id) {
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $invoice[$field] = $data[$field];
                }
            }
            $invoice['updated_at'] = date('c');
            $found = true;
            break;
        }
    }
    
    if ($found) {
        write_json('invoices', $invoices);
        sendJson(["message" => "Invoice updated"]);
    } else {
        sendJson(["error" => "Update failed"], 500);
    }
}

// DELETE: Delete invoice
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendJson(["error" => "ID required"], 400);
    
    $invoices = read_json('invoices');
    $initialCount = count($invoices);
    $invoices = array_filter($invoices, fn($i) => !($i['id'] === $id && $i['user_id'] === $user_id));
    
    if (count($invoices) < $initialCount) {
        write_json('invoices', array_values($invoices));
        sendJson(["message" => "Invoice deleted"]);
    } else {
        sendJson(["error" => "Deletion failed"], 500);
    }
}

sendJson(["error" => "Method not allowed"], 405);
?>
