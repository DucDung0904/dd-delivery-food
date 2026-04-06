<?php
// File: backend/api/restaurant/add_shipper.php

// --- CẤU HÌNH CORS (BẮT BUỘC ĐỂ FIX LỖI CỦA BẠN) ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Xử lý request kiểm tra (OPTIONS) của trình duyệt
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/database.php';

// Nhận dữ liệu
$data = json_decode(file_get_contents("php://input"));

// Kiểm tra dữ liệu
if (!isset($data->restaurant_id) || !isset($data->name) || !isset($data->phone)) {
    echo json_encode(["status" => "error", "message" => "Thiếu thông tin (Tên hoặc SĐT)"]);
    exit;
}

// Thêm vào DB
$sql = "INSERT INTO restaurant_shippers (restaurant_id, name, phone) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("iss", $data->restaurant_id, $data->name, $data->phone);
    
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Thêm shipper thành công"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối DB"]);
}

$conn->close();
?>