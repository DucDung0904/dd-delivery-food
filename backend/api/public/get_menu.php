<?php
include '../../config/database.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = new mysqli("localhost", "root", "", "food_delivery_db");
if ($conn->connect_error) { die(json_encode(["status" => "error", "message" => "Kết nối DB thất bại"])); }

$res_id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($res_id == 0) {
    echo json_encode(["status" => "error", "message" => "ID quán không hợp lệ"]);
    exit();
}

// 1. Lấy thông tin quán
$sql_res = "SELECT * FROM restaurants WHERE id = $res_id";
$res_info = $conn->query($sql_res)->fetch_assoc();

if (!$res_info) {
    echo json_encode(["status" => "error", "message" => "Quán không tồn tại"]);
    exit();
}

// 2. Lấy danh sách món ăn + Tên danh mục
$sql_products = "
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.restaurant_id = $res_id AND p.is_active = 1
    ORDER BY p.category_id ASC
";
$result_products = $conn->query($sql_products);

$menu = [];
while($row = $result_products->fetch_assoc()) {
    if(empty($row['category_name'])) {
        $row['category_name'] = "Món khác"; 
    }
    $menu[] = $row;
}

echo json_encode([
    "status" => "success", 
    "data" => [
        "restaurant" => $res_info,
        "menu" => $menu
    ]
]);
?>