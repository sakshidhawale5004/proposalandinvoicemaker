<?php
// clients.php
// CRUD operations for clients

require_once 'db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    sendJson(["error" => "Unauthorized"], 401);
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch clients
if ($method === 'GET') {
    $clients = read_json('clients');
    $user_clients = array_values(array_filter($clients, fn($c) => $c['user_id'] === $user_id));
    
    // Sort by created_at DESC
    usort($user_clients, fn($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

    $id = $_GET['id'] ?? null;
    if ($id) {
        $client = array_filter($user_clients, fn($c) => $c['id'] === $id);
        if ($client) sendJson(["data" => reset($client)]);
        else sendJson(["error" => "Client not found"], 404);
    } else {
        sendJson(["data" => $user_clients]);
    }
}

// POST: Create client
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['name'])) {
        sendJson(["error" => "Name is required"], 400);
    }
    
    $id = uuidv4();
    $clients = read_json('clients');
    
    $newClient = [
        "id" => $id,
        "user_id" => $user_id,
        "name" => $data['name'],
        "email" => $data['email'] ?? null,
        "phone" => $data['phone'] ?? null,
        "address" => $data['address'] ?? null,
        "gstin" => $data['gstin'] ?? null,
        "notes" => $data['notes'] ?? null,
        "whatsapp_number" => $data['whatsapp_number'] ?? null,
        "whatsapp_consent" => $data['whatsapp_consent'] ?? 0,
        "created_at" => date('c'),
        "updated_at" => date('c')
    ];
    
    $clients[] = $newClient;
    write_json('clients', $clients);
    
    sendJson(["message" => "Client created", "data" => ["id" => $id]]);
}

// PUT/PATCH: Update client
if ($method === 'PUT' || $method === 'PATCH') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendJson(["error" => "ID required"], 400);

    $data = json_decode(file_get_contents("php://input"), true);
    $clients = read_json('clients');
    $found = false;
    
    $allowedFields = ['name', 'email', 'phone', 'address', 'gstin', 'notes', 'whatsapp_number', 'whatsapp_consent'];
    
    foreach ($clients as &$client) {
        if ($client['id'] === $id && $client['user_id'] === $user_id) {
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $client[$field] = $data[$field];
                }
            }
            $client['updated_at'] = date('c');
            $found = true;
            break;
        }
    }
    
    if ($found) {
        write_json('clients', $clients);
        sendJson(["message" => "Client updated"]);
    } else {
        sendJson(["error" => "Update failed"], 500);
    }
}

// DELETE: Delete client
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendJson(["error" => "ID required"], 400);
    
    $clients = read_json('clients');
    $initialCount = count($clients);
    $clients = array_filter($clients, fn($c) => !($c['id'] === $id && $c['user_id'] === $user_id));
    
    if (count($clients) < $initialCount) {
        write_json('clients', array_values($clients));
        sendJson(["message" => "Client deleted"]);
    } else {
        sendJson(["error" => "Deletion failed"], 500);
    }
}

sendJson(["error" => "Method not allowed"], 405);
?>
