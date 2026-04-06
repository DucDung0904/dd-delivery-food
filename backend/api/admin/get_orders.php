<?php
header("Access-Control-Allow-Origin: *"); header("Content-Type: application/json");
include_once '../../config/database.php';

try {
    // Lấy tất cả đơn hàng, nối bảng User và Restaurant để lấy tên
    $sql = "SELECT o.id, u.full_name as customer, r.name as restaurant, o.total_amount, o.status, o.created_at 
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
            ORDER BY o.created_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $orders]);
} catch (PDOException $e) { echo json_encode(["status" => "error", "message" => $e->getMessage()]); }
?>