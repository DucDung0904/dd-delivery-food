<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

ini_set('display_errors', 0);
error_reporting(E_ALL);

include_once '../../config/database.php';

try {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    
    if ($user_id <= 0) {
        throw new Exception("Thiếu User ID hoặc ID không hợp lệ.");
    }

    // --- [QUERY CHÍNH] ---
    // Sửa JOIN shippers -> JOIN restaurant_shippers
    // Thêm r.address để hiển thị điểm đi
    $sql = "SELECT 
                o.*, 
                r.name as restaurant_name, 
                r.image as restaurant_image,
                r.address as restaurant_address,
                s.name as shipper_name, 
                s.phone as shipper_phone 
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            LEFT JOIN restaurant_shippers s ON o.shipper_id = s.id 
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    if(!$stmt) throw new Exception("Lỗi SQL Order: " . $conn->error);
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Kiểm tra nếu result lỗi
    if(!$result) throw new Exception("Không lấy được dữ liệu đơn hàng.");

    $orders = [];

    // --- [QUERY CHI TIẾT MÓN ĂN] ---
    while ($row = $result->fetch_assoc()) {
        $order_id = $row['id'];
        
        // Lưu ý: Kiểm tra lại bảng order_details dùng 'food_id' hay 'product_id'
        // Ở đây tôi dùng 'food_id' theo code cũ của bạn
        $sql_items = "SELECT od.quantity, od.price, f.name as food_name 
                      FROM order_details od
                      JOIN products f ON od.food_id = f.id
                      WHERE od.order_id = ?";
                      
        $stmt_items = $conn->prepare($sql_items);
        if($stmt_items) {
            $stmt_items->bind_param("i", $order_id);
            $stmt_items->execute();
            $res_items = $stmt_items->get_result();
            
            $item_strings = [];
            $items_detail = []; // Mảng chi tiết để dùng cho Modal
            
            while ($item = $res_items->fetch_assoc()) {
                $item_strings[] = "<b>" . $item['quantity'] . "x</b> " . $item['food_name'];
                $items_detail[] = $item;
            }
            
            // String hiển thị ngắn gọn ở card
            $row['items'] = !empty($item_strings) ? implode(', ', $item_strings) : "Chi tiết món";
            // Array hiển thị đầy đủ ở Modal
            $row['items_detail'] = $items_detail;
        } else {
            $row['items'] = "Lỗi lấy món";
            $row['items_detail'] = [];
        }

        // Fallback ảnh
        if (empty($row['restaurant_image'])) {
            $row['restaurant_image'] = 'default_store.png';
        }
        
        $row['final_amount'] = (int)$row['final_amount'];
        $orders[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $orders]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>