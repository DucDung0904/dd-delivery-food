<?php
// File: backend/api/restaurant/update_order_status.php

// 1. CẤU HÌNH CORS (QUAN TRỌNG ĐỂ SỬA LỖI CỦA BẠN)
// Cho phép mọi nguồn truy cập
header("Access-Control-Allow-Origin: *");
// Cho phép các method
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
// Cho phép các header gửi lên (bao gồm Content-Type mà bạn đang bị chặn)
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Xử lý request OPTIONS (Trình duyệt gửi cái này trước khi gửi POST để kiểm tra)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

// 2. KẾT NỐI DATABASE
include_once '../../config/database.php';// Đảm bảo đường dẫn này đúng

// 3. XỬ LÝ DỮ LIỆU
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->order_id) || !isset($data->status)) {
    echo json_encode(["status" => "error", "message" => "Thiếu dữ liệu"]);
    exit;
}

$order_id = $data->order_id;
$status = $data->status;

// 4. CẬP NHẬT TRẠNG THÁI VÀO DB
$sql = "UPDATE orders SET status = ? WHERE id = ?";
$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("si", $status, $order_id);
    
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Cập nhật thành công"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Lỗi Prepare: " . $conn->error]);
}

$conn->close();
?>