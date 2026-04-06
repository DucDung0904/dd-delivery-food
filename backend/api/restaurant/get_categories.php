<?php
// backend/api/restaurant/get_categories.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include '../../config/database.php';

// Nhận restaurant_id từ Frontend gửi lên
if (!isset($_GET['restaurant_id'])) {
    echo json_encode(["status" => "error", "message" => "Thiếu restaurant_id"]);
    exit();
}

$res_id = intval($_GET['restaurant_id']);

// Query đúng cột restaurant_id như trong ảnh 2
$sql = "SELECT * FROM categories WHERE restaurant_id = ? ORDER BY id DESC";

$stmt = $conn->prepare($sql);
if ($stmt) {
    $stmt->bind_param("i", $res_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $categories]);
} else {
    echo json_encode(["status" => "error", "message" => "Lỗi SQL"]);
}
?>