<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Tiếp tục code kết nối database của bạn
include_once '../../config/database.php';

// Kiểm tra bảng store_categories (Khớp với hình image_145397.png)
$sql = "SELECT id, name FROM store_categories ORDER BY name ASC";
$result = $conn->query($sql);

$categories = [];

if ($result) {
    while($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    echo json_encode([
        "status" => "success",
        "data" => $categories
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => $conn->error
    ]);
}
$conn->close();
?>