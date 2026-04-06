<?php
// backend/api/restaurant/get_my_restaurant.php

// 1. Cấu hình Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// 2. Kết nối Database
// Lưu ý: Vì file này nằm trong api/restaurant/ nên cần ra ngoài 2 cấp để thấy folder config
include_once '../../config/database.php';

// Kiểm tra kết nối
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL"]);
    exit();
}

// 3. Nhận User ID từ tham số
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id == 0) {
    echo json_encode(["status" => "error", "message" => "Thiếu ID người dùng"]);
    exit();
}

// 4. Tìm quán ăn dựa trên partner_id
// Logic: Tìm quán nào có chủ là user_id này
$sql = "SELECT * FROM restaurants WHERE partner_id = $user_id LIMIT 1";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        "status" => "success",
        "data" => $row
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Không tìm thấy quán nào của tài khoản này!"
    ]);
}
?>