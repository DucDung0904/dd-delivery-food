<?php

error_reporting(0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php';

if (!isset($_GET['id'])) exit(json_encode(["status" => "error", "message" => "Thiếu ID"]));

$res_id = intval($_GET['id']);

$sql = "SELECT id, name, address, image, open_time, is_open FROM restaurants WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $res_id);
$stmt->execute();
$shop = $stmt->get_result()->fetch_assoc();

if (!$shop) exit(json_encode(["status" => "error", "message" => "Không tìm thấy quán"]));

$shop['is_open_now'] = ($shop['is_open'] == 1); 
$shop['image'] = !empty($shop['image']) ? $shop['image'] : 'default_store.png';

$sql2 = "SELECT p.id, p.name, p.price, p.image, p.description, p.is_active, c.name as category_name 
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.restaurant_id = ? 
         ORDER BY c.id ASC, p.id DESC";

$stmt2 = $conn->prepare($sql2);
$stmt2->bind_param("i", $res_id);
$stmt2->execute();
$res2 = $stmt2->get_result();

$menu = [];
while ($row = $res2->fetch_assoc()) {
    $row['image'] = !empty($row['image']) ? $row['image'] : 'default_food.png';
    $row['price'] = (float)$row['price'];
    $row['category_name'] = $row['category_name'] ?? "Khác";
    $menu[] = $row;
}

echo json_encode(["status" => "success", "shop" => $shop, "menu" => $menu]);
$conn->close();
?>