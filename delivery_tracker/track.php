<?php
require_once 'config.php';

$trackingCode = sanitize($_GET['code'] ?? '');
$delivery = null;
$error = '';

if (empty($trackingCode)) {
    $error = 'Invalid tracking link.';
} else {
    $conn = getConnection();
    $stmt = $conn->prepare("SELECT id, recipient_name, package_description, status FROM deliveries WHERE tracking_code = ?");
    $stmt->bind_param("s", $trackingCode);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $error = 'Delivery not found.';
    } else {
        $delivery = $result->fetch_assoc();
    }

    $stmt->close();
    $conn->close();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Share Your Delivery Location</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .container { background: white; border-radius: 16px; padding: 40px; max-width: 450px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .icon { font-size: 50px; text-align: center; margin-bottom: 20px; }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 10px; font-size: 22px; }
        .delivery-info { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .delivery-info p { margin: 8px 0; color: #34495e; }
        .delivery-info strong { color: #2c3e50; }
        .consent-box { background: #e8f4fd; border: 2px solid #3498db; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .consent-box h3 { color: #2980b9; margin-bottom: 10px; font-size: 16px; }
        .consent-box ul { margin-left: 20px; color: #34495e; font-size: 14px; line-height: 1.8; }
        .consent-check { display: flex; align-items: flex-start; gap: 10px; margin: 20px 0; }
        .consent-check input { margin-top: 4px; width: 18px; height: 18px; cursor: pointer; }
        .consent-check label { color: #34495e; font-size: 14px; cursor: pointer; }
        button { width: 100%; padding: 15px; border: none; border-radius: 10px; background: #3498db; color: white; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        button:hover:not(:disabled) { background: #2980b9; transform: translateY(-2px); }
        button:disabled { background: #bdc3c7; cursor: not-allowed; }
        .status { margin-top: 20px; padding: 15px; border-radius: 10px; text-align: center; display: none; }
        .status.success { background: #d4edda; color: #155724; display: block; }
        .status.error { background: #f8d7da; color: #721c24; display: block; }
        .status.loading { background: #fff3cd; color: #856404; display: block; }
        .error-page { text-align: center; color: #e74c3c; }
        .privacy-note { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 12px; color: #7f8c8d; text-align: center; }
        .already-shared { background: #d4edda; padding: 20px; border-radius: 10px; text-align: center; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <?php if ($error): ?>
            <div class="error-page">
                <div class="icon">&#10060;</div>
                <h1><?= $error ?></h1>
            </div>
        <?php elseif ($delivery['status'] === 'location_received'): ?>
            <div class="icon">&#9989;</div>
            <div class="already-shared">
                <h2>Location Already Shared</h2>
                <p style="margin-top: 10px;">Thank you, <?= htmlspecialchars($delivery['recipient_name']) ?>! Your delivery location has been received.</p>
            </div>
        <?php else: ?>
            <div class="icon">&#128230;</div>
            <h1>Help Us Deliver Your Package</h1>

            <div class="delivery-info">
                <p><strong>Hello, <?= htmlspecialchars($delivery['recipient_name']) ?>!</strong></p>
                <?php if ($delivery['package_description']): ?>
                    <p><strong>Package:</strong> <?= htmlspecialchars($delivery['package_description']) ?></p>
                <?php endif; ?>
                <p>Please share your location to help us deliver accurately.</p>
            </div>

            <div class="consent-box">
                <h3>What we collect and why:</h3>
                <ul>
                    <li>Your GPS coordinates (for delivery)</li>
                    <li>Location accuracy data</li>
                    <li>This is a one-time collection</li>
                    <li>Data is only used for this delivery</li>
                </ul>
            </div>

            <div class="consent-check">
                <input type="checkbox" id="consent" onchange="toggleButton()">
                <label for="consent">I understand and consent to sharing my location for delivery purposes. I can contact the sender if I have questions.</label>
            </div>

            <button id="shareBtn" onclick="shareLocation()" disabled>Share My Location</button>

            <div id="status" class="status"></div>

            <div class="privacy-note">
                Your location data is stored securely and used only for completing this delivery.
                You may decline by simply closing this page.
            </div>
        <?php endif; ?>
    </div>

    <script>
        const trackingCode = '<?= $trackingCode ?>';
        let bestPosition = null;
        let watchId = null;
        let attempts = 0;
        const maxAttempts = 10;
        const targetAccuracy = 20; // meters

        function toggleButton() {
            const checkbox = document.getElementById('consent');
            const button = document.getElementById('shareBtn');
            button.disabled = !checkbox.checked;
        }

        function shareLocation() {
            const btn = document.getElementById('shareBtn');
            const status = document.getElementById('status');

            btn.disabled = true;
            btn.textContent = 'Getting GPS...';
            status.className = 'status loading';
            status.textContent = 'Acquiring precise GPS location... Please wait.';

            if (!navigator.geolocation) {
                status.className = 'status error';
                status.textContent = 'Geolocation is not supported by your browser.';
                btn.disabled = false;
                btn.textContent = 'Share My Location';
                return;
            }

            bestPosition = null;
            attempts = 0;

            // Use watchPosition for better accuracy - collects multiple readings
            watchId = navigator.geolocation.watchPosition(
                function(position) {
                    attempts++;
                    const accuracy = position.coords.accuracy;

                    // Keep the most accurate reading
                    if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
                        bestPosition = position;
                    }

                    status.textContent = `Getting precise location... (Accuracy: ${Math.round(bestPosition.coords.accuracy)}m)`;
                    btn.textContent = `GPS Lock: ${Math.round(bestPosition.coords.accuracy)}m`;

                    // If we have good accuracy or reached max attempts, send it
                    if (accuracy <= targetAccuracy || attempts >= maxAttempts) {
                        navigator.geolocation.clearWatch(watchId);
                        sendLocation(bestPosition);
                    }
                },
                function(error) {
                    if (watchId) navigator.geolocation.clearWatch(watchId);

                    // If we have a position from previous attempts, use it
                    if (bestPosition) {
                        sendLocation(bestPosition);
                        return;
                    }

                    status.className = 'status error';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            status.textContent = 'Location access was denied. Please enable GPS/Location in your device settings.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            status.textContent = 'Location unavailable. Please ensure GPS is enabled and you are outdoors.';
                            break;
                        case error.TIMEOUT:
                            status.textContent = 'GPS timeout. Please try again in an open area.';
                            break;
                        default:
                            status.textContent = 'Location error. Please try again.';
                    }
                    btn.disabled = false;
                    btn.textContent = 'Try Again';
                    document.getElementById('consent').checked = false;
                },
                {
                    enableHighAccuracy: true,  // Force GPS (not WiFi/Cell)
                    timeout: 30000,            // Wait up to 30 seconds
                    maximumAge: 0              // No cached positions
                }
            );

            // Fallback: After 25 seconds, use best position we have
            setTimeout(() => {
                if (watchId && bestPosition) {
                    navigator.geolocation.clearWatch(watchId);
                    sendLocation(bestPosition);
                }
            }, 25000);
        }

        function sendLocation(position) {
            const status = document.getElementById('status');
            const btn = document.getElementById('shareBtn');

            status.textContent = `Sending location (Accuracy: ${Math.round(position.coords.accuracy)}m)...`;

            fetch('save_location.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tracking_code: trackingCode,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    consent_given: true
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    status.className = 'status success';
                    status.textContent = `Location shared! Accuracy: ${Math.round(position.coords.accuracy)} meters`;
                    btn.textContent = 'Location Shared';
                    btn.style.background = '#27ae60';
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            })
            .catch(error => {
                status.className = 'status error';
                status.textContent = 'Failed to share location. Please try again.';
                btn.disabled = false;
                btn.textContent = 'Share My Location';
                document.getElementById('consent').checked = false;
            });
        }
    </script>
</body>
</html>
