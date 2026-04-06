<?php
// FILE: backend/api/user/create_order.php

// 1. Cấu hình
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/database.php';

try {
    // 2. Nhận dữ liệu từ Frontend
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->user_id) || !isset($data->cart_items) || empty($data->cart_items)) {
        throw new Exception("Dữ liệu giỏ hàng trống hoặc thiếu thông tin.");
    }

    $user_id = intval($data->user_id);
    $note = isset($data->note) ? $data->note : "";
    $shipping_fee = isset($data->shipping_fee) ? floatval($data->shipping_fee) : 0;
    
    // --- [LOGIC MỚI] TRA CỨU ĐỊA CHỈ TỪ ID ---
    $address_id = isset($data->address_id) ? intval($data->address_id) : 0;
    
    // Mặc định dữ liệu nếu không tìm thấy
    $recipient_name = "Khách hàng";
    $recipient_phone = "";
    $shipping_address_text = "";
    $province_id = null;
    $district_id = null;
    $ward_code = null;

    if ($address_id > 0) {
        // Query lấy chi tiết địa chỉ
        $sql_addr = "SELECT * FROM user_addresses WHERE id = ? AND user_id = ?";
        $stmt_addr = $conn->prepare($sql_addr);
        $stmt_addr->bind_param("ii", $address_id, $user_id);
        $stmt_addr->execute();
        $res_addr = $stmt_addr->get_result();
        
        if ($row_addr = $res_addr->fetch_assoc()) {
            // Gán dữ liệu tìm được vào biến
            $recipient_name = $row_addr['recipient_name'];
            $recipient_phone = $row_addr['recipient_phone'];
            $shipping_address_text = $row_addr['specific_address']; // Có thể nối thêm xã/huyện/tỉnh nếu muốn
            $province_id = $row_addr['province_id'];
            $district_id = $row_addr['district_id'];
            $ward_code = $row_addr['ward_code'];
        } else {
            throw new Exception("Địa chỉ giao hàng không hợp lệ (ID: $address_id)");
        }
    } else {
        throw new Exception("Vui lòng chọn địa chỉ giao hàng.");
    }

    // 3. Tách đơn hàng theo quán (Logic cũ vẫn giữ nguyên)
    $orders_by_restaurant = [];
    foreach ($data->cart_items as $item) {
        $res_id = isset($item->restaurant_id) ? intval($item->restaurant_id) : 1;
        
        if (!isset($orders_by_restaurant[$res_id])) {
            $orders_by_restaurant[$res_id] = [
                'total_amount' => 0,
                'items' => []
            ];
        }

        $price = floatval($item->price);
        $qty = intval($item->quantity);
        $subtotal = $price * $qty; // Tính subtotal

        $orders_by_restaurant[$res_id]['items'][] = [
            'food_id' => $item->id,
            'food_name' => $item->name,
            'price' => $price,
            'quantity' => $qty,
            'subtotal' => $subtotal
        ];
        $orders_by_restaurant[$res_id]['total_amount'] += $subtotal;
    }

    // 4. Lưu vào Database
    $conn->begin_transaction();
    $is_first_order = true; // Chỉ cộng ship vào đơn đầu tiên
    $last_order_id = 0;

    foreach ($orders_by_restaurant as $res_id => $group) {
        $current_ship = $is_first_order ? $shipping_fee : 0;
        $is_first_order = false;

        $total_items = $group['total_amount'];
        $final_amount = $total_items + $current_ship;

        // INSERT ORDER (Lưu đầy đủ thông tin địa chỉ vừa tra cứu được)
        $sql_order = "INSERT INTO orders 
        (user_id, restaurant_id, recipient_name, recipient_phone, shipping_address, 
         to_province_id, to_district_id, to_ward_code, 
         total_amount, shipping_fee, final_amount, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())";

        $stmt = $conn->prepare($sql_order);
        // Bind params: iisssiiiddd (Lưu ý kiểu dữ liệu: i=int, s=string, d=double)
        $stmt->bind_param("iisssiiiddd", 
            $user_id, $res_id, $recipient_name, $recipient_phone, $shipping_address_text,
            $province_id, $district_id, $ward_code,
            $total_items, $current_ship, $final_amount
        );

        if (!$stmt->execute()) {
            throw new Exception("Lỗi tạo đơn: " . $stmt->error);
        }
        $last_order_id = $conn->insert_id;

        // INSERT ORDER DETAILS
        $sql_detail = "INSERT INTO order_details (order_id, food_id, food_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt_detail = $conn->prepare($sql_detail);

        foreach ($group['items'] as $detail) {
            $stmt_detail->bind_param("iisdid", $last_order_id, $detail['food_id'], $detail['food_name'], $detail['price'], $detail['quantity'], $detail['subtotal']);
            $stmt_detail->execute();
        }
    }

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Thành công", "order_id" => $last_order_id]);

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>