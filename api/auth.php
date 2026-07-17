<?php
// auth.php
// Handles login, registration, and session management

require_once 'db.php';
session_start();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'register') {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $name = $data['name'] ?? '';

    if (!$email || !$password) {
        sendJson(["error" => "Email and password required"], 400);
    }

    $users = read_json('users');
    foreach ($users as $u) {
        if ($u['email'] === $email) {
            sendJson(["error" => "Email already exists"], 409);
        }
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $id = uuidv4();

    $users[] = [
        "id" => $id,
        "email" => $email,
        "password_hash" => $hash,
        "display_name" => $name,
        "created_at" => date('c')
    ];
    write_json('users', $users);
    
    // Auto-login after registration
    $_SESSION['user_id'] = $id;
    $_SESSION['email'] = $email;
    sendJson(["message" => "Registration successful", "user" => ["id" => $id, "email" => $email]]);
}

if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    $users = read_json('users');
    $user = null;
    foreach ($users as $u) {
        if ($u['email'] === $email) {
            $user = $u;
            break;
        }
    }

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        sendJson(["message" => "Login successful", "user" => ["id" => $user['id'], "email" => $user['email'], "name" => $user['display_name']]]);
    } else {
        sendJson(["error" => "Invalid credentials"], 401);
    }
}

if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    sendJson(["message" => "Logged out successfully"]);
}

if ($method === 'GET' && $action === 'session') {
    if (isset($_SESSION['user_id'])) {
        sendJson(["user" => ["id" => $_SESSION['user_id'], "email" => $_SESSION['email']]]);
    } else {
        sendJson(["user" => null], 401);
    }
}

// Invalid route
sendJson(["error" => "Invalid action"], 404);
?>
