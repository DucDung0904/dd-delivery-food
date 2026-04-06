<?php
// File: backend/api/restaurant/assign_shipper.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->order_id) || !isset($data->shipper_id)) {
    echo json_encode(["status" => "error", "message" => "Thiếu thông tin Order ID hoặc Shipper ID"]);
    exit;
}

// Cập nhật: Chuyển trạng thái -> shipping VÀ gán shipper_id
$sql = "UPDATE orders SET status = 'shipping', shipper_id = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $data->shipper_id, $data->order_id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Đã bàn giao cho shipper!"]);
} else {
    echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $stmt->error]);
}
$conn->close();
?>