<?php
require_once 'config.php';

header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

$trackingCode = $input['tracking_code'] ?? '';
$latitude = $input['latitude'] ?? null;
$longitude = $input['longitude'] ?? null;
$accuracy = $input['accuracy'] ?? null;
$consentGiven = $input['consent_given'] ?? false;

// Validate required fields
if (empty($trackingCode) || $latitude === null || $longitude === null) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

// Validate consent
if (!$consentGiven) {
    echo json_encode(['success' => false, 'error' => 'Consent is required']);
    exit;
}

// Validate coordinates
if (!is_numeric($latitude) || !is_numeric($longitude)) {
    echo json_encode(['success' => false, 'error' => 'Invalid coordinates']);
    exit;
}

if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
    echo json_encode(['success' => false, 'error' => 'Coordinates out of range']);
    exit;
}

$conn = getConnection();

// Find the delivery
$stmt = $conn->prepare("SELECT id, status FROM deliveries WHERE tracking_code = ?");
$stmt->bind_param("s", $trackingCode);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'Delivery not found']);
    $stmt->close();
    $conn->close();
    exit;
}

$delivery = $result->fetch_assoc();
$stmt->close();

// Check if location already received
if ($delivery['status'] === 'location_received') {
    echo json_encode(['success' => false, 'error' => 'Location already shared']);
    $conn->close();
    exit;
}

// Get client info
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? '';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

// Generate Google Maps link
$googleMapsLink = "https://www.google.com/maps?q={$latitude},{$longitude}";

// Start transaction
$conn->begin_transaction();

try {
    // Insert location with Google Maps link
    $stmt = $conn->prepare("INSERT INTO locations (delivery_id, latitude, longitude, accuracy, consent_given, ip_address, user_agent, google_maps_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("idddssss", $delivery['id'], $latitude, $longitude, $accuracy, $consentGiven, $ipAddress, $userAgent, $googleMapsLink);
    $stmt->execute();
    $stmt->close();

    // Update delivery status
    $stmt = $conn->prepare("UPDATE deliveries SET status = 'location_received' WHERE id = ?");
    $stmt->bind_param("i", $delivery['id']);
    $stmt->execute();
    $stmt->close();

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Location saved successfully']);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'error' => 'Database error']);
}

$conn->close();
?>
