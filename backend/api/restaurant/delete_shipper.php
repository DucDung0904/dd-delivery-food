<?php
// File: backend/api/restaurant/delete_shipper.php

// 1. CẤU HÌNH CORS (Để không bị lỗi chặn truy cập)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Xử lý request OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

// 2. KẾT NỐI DATABASE
include_once '../../config/database.php';

// 3. NHẬN DỮ LIỆU TỪ JS
$data = json_decode(file_get_contents("php://input"));

// Kiểm tra có gửi ID lên không
if (!isset($data->id)) {
    echo json_encode(["status" => "error", "message" => "Thiếu ID shipper cần xóa"]);
    exit;
}

// 4. THỰC HIỆN XÓA
$sql = "DELETE FROM restaurant_shippers WHERE id = ?";
$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("i", $data->id);
    
    if ($stmt->execute()) {
        // Kiểm tra xem có dòng nào bị xóa không
        if ($stmt->affected_rows > 0) {
            echo json_encode(["status" => "success", "message" => "Đã xóa shipper thành công!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Không tìm thấy shipper hoặc đã bị xóa trước đó."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL"]);
}

$conn->close();
?>