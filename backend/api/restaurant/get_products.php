<?php
// backend/api/restaurant/get_products.php

// 1. Tắt báo lỗi rác (Warning) để không làm hỏng JSON
error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// --- SỬA LỖI ĐƯỜNG DẪN TẠI ĐÂY ---
// Sử dụng __DIR__ để lấy đường dẫn tuyệt đối, tránh lỗi "failed to open stream"
$config_path = __DIR__ . '/../../config/database.php';

if (file_exists($config_path)) {
    include_once $config_path;
} else {
    // Nếu không tìm thấy file, báo lỗi JSON để Frontend hiển thị
    echo json_encode(["status" => "error", "message" => "Lỗi: Không tìm thấy file config/database.php"]);
    exit();
}

// Kiểm tra kết nối DB
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL: " . ($conn->connect_error ?? "Không xác định")]);
    exit();
}

// Kiểm tra tham số đầu vào
if (!isset($_GET['restaurant_id'])) {
    echo json_encode(["status" => "error", "message" => "Thiếu ID cửa hàng (restaurant_id)"]);
    exit();
}

$res_id = intval($_GET['restaurant_id']);

// 2. Query lấy sản phẩm
$sql = "SELECT 
            p.id, 
            p.name, 
            p.price, 
            p.image, 
            p.is_active, 
            p.description,
            c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.restaurant_id = ? 
        ORDER BY p.id DESC";

$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("i", $res_id);
    
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        $products = [];
        
        while ($row = $result->fetch_assoc()) {
            // Ép kiểu dữ liệu cho chuẩn
            $row['price'] = (float)$row['price'];
            $row['is_active'] = (int)$row['is_active'];
            
            // Xử lý ảnh
            if (empty($row['image'])) {
                $row['image'] = 'default_food.png';
            }
            
            // Xử lý tên danh mục
            if ($row['category_name'] === null) {
                $row['category_name'] = "Chưa phân loại";
            }
            
            $products[] = $row;
        }

        echo json_encode(["status" => "success", "data" => $products]);
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi thực thi SQL: " . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Lỗi Prepare SQL: " . $conn->error]);
}

$conn->close();
?>