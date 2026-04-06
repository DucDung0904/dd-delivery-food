<?php
// FILE: backend/api/store/get_orders.php

// 1. Cấu hình Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// 2. Tắt báo lỗi HTML
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {

    $paths = [
        __DIR__ . '/../../config/database.php',
        $_SERVER['DOCUMENT_ROOT'] . '/DACS2/FOOD-DELIVERY-APP/backend/config/database.php'
    ];

    $realPath = null;
    foreach ($paths as $path) {
        if (file_exists($path)) {
            $realPath = $path;
            break;
        }
    }

    if (!$realPath) {
       
        if(file_exists(__DIR__ . '../../config/database.php')) {
                include_once '../../config/database.php';
        } else {

             $conn = new mysqli("localhost", "root", "", "food_delivery_db");
        }
    } else {
        require_once $realPath;
        $conn = null;
        if (class_exists('Database')) { $db = new Database(); $conn = $db->connect(); }
        elseif (class_exists('database')) { $db = new database(); $conn = $db->connect(); }
        else { $conn = new mysqli("localhost", "root", "", "food_delivery_db"); }
    }

    if (!$conn || $conn->connect_error) throw new Exception("Kết nối CSDL thất bại.");
    // -----------------------------------------------------

    // 3. Lấy ID quán
    $restaurant_id = isset($_GET['restaurant_id']) ? $_GET['restaurant_id'] : null;
    
    if (!$restaurant_id) {
        $restaurant_id = 1; // ID mặc định để test
    }

    // 4. TRUY VẤN ĐƠN HÀNG (CẬP NHẬT JOIN VỚI SHIPPER VÀ USER)
    // Sửa: Lấy thêm thông tin khách hàng (users) và shipper (restaurant_shippers)
    // Lấy thông tin người nhận trực tiếp từ bảng orders, chỉ JOIN bảng shippers
    $sql = "SELECT o.*, 
                   o.recipient_name as customer_name,    
                   o.recipient_phone as customer_phone,  
                   o.shipping_address as customer_address, 
                   s.name as shipper_name, 
                   s.phone as shipper_phone
            FROM orders o
            LEFT JOIN restaurant_shippers s ON o.shipper_id = s.id
            WHERE o.restaurant_id = ? 
            ORDER BY o.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    if(!$stmt) throw new Exception("Lỗi SQL: " . $conn->error);
    
    $stmt->bind_param("i", $restaurant_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $orders = [];

    // 5. Lấy chi tiết món ăn
    while ($row = $result->fetch_assoc()) {
        $order_id = $row['id'];
        
        // Fix lỗi hiển thị tên khách hàng nếu null (Khách vãng lai hoặc lỗi data)
        if(empty($row['customer_name'])) $row['customer_name'] = "Khách hàng (Ẩn danh)";
        if(empty($row['customer_phone'])) $row['customer_phone'] = "Không có SĐT";

        // Lấy danh sách món
        $sql_items = "SELECT * FROM order_details WHERE order_id = ?";
        $stmt_items = $conn->prepare($sql_items);
        $stmt_items->bind_param("i", $order_id);
        $stmt_items->execute();
        $res_items = $stmt_items->get_result();
        
        $items = [];
        while ($item = $res_items->fetch_assoc()) {
            $items[] = $item;
        }
        
        $row['items'] = $items;
        $row['final_amount'] = (int)$row['final_amount'];
        
        $orders[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $orders]);

} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>