<?php
// FILE: backend/api/user/get_address.php

// 1. CHO PHÉP CORS (Để Frontend không bị chặn)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

// 2. KẾT NỐI DATABASE
    include_once '../../config/database.php'; 

try {
    // 3. Kiểm tra tham số user_id từ URL
    if (!isset($_GET['user_id'])) {
        echo json_encode(["status" => "error", "message" => "Thiếu user_id."]);
        exit();
    }

    $user_id = intval($_GET['user_id']);

    // 4. TRUY VẤN ĐÚNG BẢNG: user_addresses
    // (Sắp xếp địa chỉ mặc định lên đầu, sau đó đến địa chỉ mới nhất)
    $sql = "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $addresses = [];
    while ($row = $result->fetch_assoc()) {
        $addresses[] = $row;
    }

    // Trả về mảng JSON (dù rỗng hay có dữ liệu)
    echo json_encode($addresses);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>