<?php
header("Access-Control-Allow-Origin: *"); // Sửa lỗi CORS
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

// SQL JOIN để lấy tên loại hình (category_name) thay vì r.category bị lỗi
$sql = "SELECT 
            r.*, 
            c.name as category_name, 
            u.email, u.phone 
        FROM restaurants r
        LEFT JOIN store_categories c ON r.category_id = c.id
        LEFT JOIN users u ON r.partner_id = u.id
        ORDER BY r.id DESC";

$result = $conn->query($sql);
$partners = [];

if ($result) {
    while($row = $result->fetch_assoc()) {
        $partners[] = $row;
    }
    echo json_encode(["status" => "success", "data" => $partners]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}