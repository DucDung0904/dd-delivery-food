<?php
// FILE: backend/api/user/save_address.php

// 1. Cấu hình CORS (Bắt buộc)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { http_response_code(200); exit(); }

include_once '../../config/database.php';

try {
    // 2. Nhận dữ liệu
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->user_id) || !isset($data->specific_address)) {
        throw new Exception("Thiếu thông tin bắt buộc.");
    }

    // Gán biến
    $id = isset($data->id) ? intval($data->id) : null; // Nếu có ID là Sửa, không có là Thêm
    $user_id = $data->user_id;
    $name = $data->recipient_name;
    $phone = $data->recipient_phone;
    $province = $data->province_id;
    $district = $data->district_id;
    $ward = $data->ward_code;
    $specific = $data->specific_address;
    $is_default = isset($data->is_default) && $data->is_default ? 1 : 0;

    // 3. Xử lý Logic Mặc định (Giống nhau cho cả Thêm và Sửa)
    // Nếu chọn địa chỉ này là mặc định, các địa chỉ cũ của user đó sẽ bị bỏ mặc định
    if ($is_default) {
        $conn->query("UPDATE user_addresses SET is_default = 0 WHERE user_id = $user_id");
    }

    // 4. Phân luồng: THÊM MỚI hay CẬP NHẬT?
    if ($id) {
        // --- TRƯỜNG HỢP SỬA (UPDATE) ---
        $sql = "UPDATE user_addresses SET 
                recipient_name=?, recipient_phone=?, province_id=?, district_id=?, ward_code=?, specific_address=?, is_default=?
                WHERE id=? AND user_id=?"; // Thêm user_id để bảo mật
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssiiisiii", $name, $phone, $province, $district, $ward, $specific, $is_default, $id, $user_id);
        $msg = "Cập nhật thành công!";

    } else {
        // --- TRƯỜNG HỢP THÊM (INSERT) ---
        $sql = "INSERT INTO user_addresses 
                (user_id, recipient_name, recipient_phone, province_id, district_id, ward_code, specific_address, is_default, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("issiiisi", $user_id, $name, $phone, $province, $district, $ward, $specific, $is_default);
        $msg = "Thêm mới thành công!";
    }

    // 5. Thực thi
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => $msg]);
    } else {
        throw new Exception("Lỗi SQL: " . $stmt->error);
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>