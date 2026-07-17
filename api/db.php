<?php
// db.php
// Database configuration and PDO connection

// Data directory
define('DATA_DIR', __DIR__ . '/data');

if (!file_exists(DATA_DIR)) {
    mkdir(DATA_DIR, 0777, true);
}

// Read JSON data
function read_json($table) {
    $file = DATA_DIR . '/' . $table . '.json';
    if (!file_exists($file)) {
        return [];
    }
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

// Write JSON data
function write_json($table, $data) {
    $file = DATA_DIR . '/' . $table . '.json';
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

// Helper function to send JSON response
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Generate UUID v4
function uuidv4() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
?>
