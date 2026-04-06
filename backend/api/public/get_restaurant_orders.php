<?php
// backend/api/order/get_restaurant_orders.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/database.php';

if (!isset($_GET['restaurant_id'])) exit(json_encode(["status" => "error", "message" => "Thiếu ID quán"]));

$res_id = intval($_GET['restaurant_id']);

// Lấy đơn hàng mới nhất lên đầu
$sql = "SELECT * FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $res_id);
$stmt->execute();
$result = $stmt->get_result();

$orders = [];
while ($row = $result->fetch_assoc()) {
    // Lấy thêm chi tiết món ăn cho từng đơn (để hiển thị tooltip hoặc modal)
    $oid = $row['id'];
    $sql_details = "SELECT product_name, quantity, price FROM order_details WHERE order_id = $oid";
    $res_details = $conn->query($sql_details);
    $items = [];
    while($d = $res_details->fetch_assoc()) {
        $items[] = $d;
    }
    $row['items'] = $items;
    $orders[] = $row;
}

echo json_encode(["status" => "success", "data" => $orders]);
$conn->close();
?>