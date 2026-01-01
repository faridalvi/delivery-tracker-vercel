<?php
require_once 'config.php';

$id = intval($_GET['id'] ?? 0);

if ($id > 0) {
    $conn = getConnection();
    $stmt = $conn->prepare("DELETE FROM deliveries WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    $conn->close();
}

header('Location: dashboard.php');
exit;
?>
