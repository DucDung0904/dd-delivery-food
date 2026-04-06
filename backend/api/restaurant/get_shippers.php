<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/database.php';

$restaurant_id = isset($_GET['restaurant_id']) ? $_GET['restaurant_id'] : null;

if (!$restaurant_id) {
    echo json_encode(["status" => "error", "message" => "Thiếu ID cửa hàng"]);
    exit;
}

$sql = "SELECT * FROM restaurant_shippers WHERE restaurant_id = ? ORDER BY id DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $restaurant_id);
$stmt->execute();
$result = $stmt->get_result();

$shippers = [];
while ($row = $result->fetch_assoc()) {
    $shippers[] = $row;
}

echo json_encode(["status" => "success", "data" => $shippers]);
$conn->close();
?>