<?php
require_once 'config.php';

$conn = getConnection();

// Get all deliveries with their locations
$query = "
    SELECT
        d.id,
        d.tracking_code,
        d.recipient_name,
        d.recipient_phone,
        d.package_description,
        d.status,
        d.created_at,
        l.latitude,
        l.longitude,
        l.accuracy,
        l.consent_given,
        l.google_maps_link,
        l.created_at as location_time
    FROM deliveries d
    LEFT JOIN locations l ON d.id = l.delivery_id
    ORDER BY d.created_at DESC
";

$result = $conn->query($query);
$deliveries = [];
while ($row = $result->fetch_assoc()) {
    $deliveries[] = $row;
}

$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; min-height: 100vh; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #2c3e50; margin-bottom: 10px; }
        .subtitle { color: #7f8c8d; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .stat-card h3 { font-size: 32px; color: #2c3e50; }
        .stat-card p { color: #7f8c8d; margin-top: 5px; }
        .stat-card.pending h3 { color: #f39c12; }
        .stat-card.received h3 { color: #27ae60; }
        .deliveries { background: white; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); overflow: hidden; }
        .delivery-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #eee; }
        .delivery-header h2 { color: #2c3e50; }
        .add-btn { padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
        .add-btn:hover { background: #2980b9; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 15px 20px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; color: #7f8c8d; font-weight: 600; font-size: 13px; text-transform: uppercase; }
        tr:hover { background: #f8f9fa; }
        .status { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status.pending { background: #fff3e0; color: #f57c00; }
        .status.location_received { background: #e8f5e9; color: #2e7d32; }
        .status.delivered { background: #e3f2fd; color: #1976d2; }
        .location-link { color: #3498db; text-decoration: none; }
        .location-link:hover { text-decoration: underline; }
        .actions a { color: #e74c3c; text-decoration: none; font-size: 13px; }
        .actions a:hover { text-decoration: underline; }
        .empty { padding: 60px 20px; text-align: center; color: #7f8c8d; }
        .tracking-code { font-family: monospace; background: #f0f0f0; padding: 3px 8px; border-radius: 4px; font-size: 13px; }
        .consent-badge { font-size: 11px; color: #27ae60; margin-left: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Delivery Dashboard</h1>
        <p class="subtitle">Manage and track all deliveries</p>

        <?php
        $total = count($deliveries);
        $pending = count(array_filter($deliveries, fn($d) => $d['status'] === 'pending'));
        $received = count(array_filter($deliveries, fn($d) => $d['status'] === 'location_received'));
        ?>

        <div class="stats">
            <div class="stat-card">
                <h3><?= $total ?></h3>
                <p>Total Deliveries</p>
            </div>
            <div class="stat-card pending">
                <h3><?= $pending ?></h3>
                <p>Awaiting Location</p>
            </div>
            <div class="stat-card received">
                <h3><?= $received ?></h3>
                <p>Location Received</p>
            </div>
        </div>

        <div class="deliveries">
            <div class="delivery-header">
                <h2>All Deliveries</h2>
                <a href="index.php" class="add-btn">+ New Delivery</a>
            </div>

            <?php if (empty($deliveries)): ?>
                <div class="empty">
                    <p>No deliveries yet. Create your first delivery to get started!</p>
                </div>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Tracking Code</th>
                            <th>Recipient</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Location</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($deliveries as $d): ?>
                        <tr>
                            <td><span class="tracking-code"><?= htmlspecialchars($d['tracking_code']) ?></span></td>
                            <td><?= htmlspecialchars($d['recipient_name']) ?></td>
                            <td><?= htmlspecialchars($d['recipient_phone']) ?></td>
                            <td>
                                <span class="status <?= $d['status'] ?>">
                                    <?= ucfirst(str_replace('_', ' ', $d['status'])) ?>
                                </span>
                            </td>
                            <td>
                                <?php if ($d['google_maps_link']): ?>
                                    <a href="<?= htmlspecialchars($d['google_maps_link']) ?>"
                                       target="_blank" class="location-link">
                                        View Map
                                    </a>
                                    <?php if ($d['consent_given']): ?>
                                        <span class="consent-badge">&#10003; Consent</span>
                                    <?php endif; ?>
                                <?php else: ?>
                                    <span style="color: #999;">--</span>
                                <?php endif; ?>
                            </td>
                            <td><?= date('M j, Y g:ia', strtotime($d['created_at'])) ?></td>
                            <td class="actions">
                                <a href="delete.php?id=<?= $d['id'] ?>" onclick="return confirm('Delete this delivery?')">Delete</a>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
