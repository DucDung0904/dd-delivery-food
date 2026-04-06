<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/database.php';

try {
    $res = [];

    // 1. THỐNG KÊ 4 THẺ (CARDS)
    // Đơn hàng hôm nay
    $stmt = $conn->query("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()");
    $res['orders_today'] = $stmt->fetchColumn();

    // Doanh thu tuần này (Tuần hiện tại)
    $stmt = $conn->query("SELECT SUM(total_amount) FROM orders WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) AND status = 'success'");
    $res['revenue_week'] = $stmt->fetchColumn() ?: 0;

    // Tổng nhà hàng
    $stmt = $conn->query("SELECT COUNT(*) FROM restaurants"); // Hoặc users where role='restaurant'
    $res['total_partners'] = $stmt->fetchColumn();

    // Khách hàng mới (Trong tháng này)
    $stmt = $conn->query("SELECT COUNT(*) FROM users WHERE role='user' AND MONTH(created_at) = MONTH(CURDATE())");
    $res['new_users'] = $stmt->fetchColumn();

    // 2. BIỂU ĐỒ DOANH THU (12 Tuần gần nhất hoặc 7 ngày - demo lấy 7 ngày)
    $stmt = $conn->query("
        SELECT DATE_FORMAT(created_at, '%d/%m') as date, SUM(total_amount) as total 
        FROM orders WHERE status='success' 
        GROUP BY DATE(created_at) ORDER BY created_at DESC LIMIT 7
    ");
    $chartData = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC)); // Đảo ngược để ngày cũ bên trái
    $res['chart'] = $chartData;

    // 3. TOP SẢN PHẨM BÁN CHẠY (Top Products)
    $stmt = $conn->query("
        SELECT food_name, SUM(quantity) as sold 
        FROM order_items 
        GROUP BY food_name 
        ORDER BY sold DESC LIMIT 4
    ");
    $res['top_products'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. ĐƠN HÀNG MỚI NHẤT (Latest Orders)
    $stmt = $conn->query("
        SELECT o.id, u.full_name, o.created_at, o.total_amount, o.status 
        FROM orders o JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC LIMIT 5
    ");
    $res['recent_orders'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $res]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>