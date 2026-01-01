<?php
require_once 'config.php';

$message = '';
$messageType = '';
$trackingLink = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $recipientPhone = sanitize($_POST['phone'] ?? '');
    $recipientName = sanitize($_POST['name'] ?? '');
    $packageDesc = sanitize($_POST['description'] ?? '');

    if (empty($recipientPhone) || empty($recipientName)) {
        $message = 'Please fill in all required fields.';
        $messageType = 'error';
    } else {
        $conn = getConnection();
        $trackingCode = generateTrackingCode();

        $stmt = $conn->prepare("INSERT INTO deliveries (tracking_code, recipient_phone, recipient_name, package_description) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $trackingCode, $recipientPhone, $recipientName, $packageDesc);

        if ($stmt->execute()) {
            $trackingLink = getBaseUrl() . '/shan/delivery_tracker/track.php?code=' . $trackingCode;
            $message = 'Delivery created! Share this link with the recipient:';
            $messageType = 'success';
        } else {
            $message = 'Error creating delivery. Please try again.';
            $messageType = 'error';
        }

        $stmt->close();
        $conn->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Tracker - Create Delivery</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; min-height: 100vh; padding: 20px; }
        .container { max-width: 500px; margin: 40px auto; }
        h1 { text-align: center; margin-bottom: 10px; color: #2c3e50; }
        .subtitle { text-align: center; color: #7f8c8d; margin-bottom: 30px; }
        .card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: #34495e; font-weight: 500; }
        input, textarea { width: 100%; padding: 12px 15px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s; }
        input:focus, textarea:focus { outline: none; border-color: #3498db; }
        textarea { resize: vertical; min-height: 80px; }
        button { width: 100%; padding: 14px; border: none; border-radius: 8px; background: #3498db; color: white; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.3s; }
        button:hover { background: #2980b9; }
        .message { padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .message.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .message.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .tracking-link { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px; word-break: break-all; }
        .tracking-link a { color: #3498db; text-decoration: none; }
        .tracking-link a:hover { text-decoration: underline; }
        .copy-btn { margin-top: 10px; background: #27ae60; padding: 10px; font-size: 14px; }
        .copy-btn:hover { background: #219a52; }
        .nav { text-align: center; margin-top: 20px; }
        .nav a { color: #3498db; text-decoration: none; }
        .required { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Delivery Tracker</h1>
        <p class="subtitle">Create a delivery and share the tracking link</p>

        <div class="card">
            <?php if ($message): ?>
                <div class="message <?= $messageType ?>">
                    <?= $message ?>
                    <?php if ($trackingLink): ?>
                        <div class="tracking-link">
                            <a href="<?= $trackingLink ?>" target="_blank"><?= $trackingLink ?></a>
                        </div>
                        <button class="copy-btn" onclick="copyLink()">Copy Link</button>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <form method="POST">
                <div class="form-group">
                    <label>Recipient Name <span class="required">*</span></label>
                    <input type="text" name="name" placeholder="Enter recipient's name" required>
                </div>

                <div class="form-group">
                    <label>Recipient Phone <span class="required">*</span></label>
                    <input type="tel" name="phone" placeholder="Enter phone number" required>
                </div>

                <div class="form-group">
                    <label>Package Description</label>
                    <textarea name="description" placeholder="Describe the package (optional)"></textarea>
                </div>

                <button type="submit">Create Delivery Link</button>
            </form>
        </div>

        <div class="nav">
            <a href="dashboard.php">View All Deliveries</a>
        </div>
    </div>

    <script>
        function copyLink() {
            const link = '<?= $trackingLink ?>';
            navigator.clipboard.writeText(link).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    </script>
</body>
</html>
