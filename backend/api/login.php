<?php
// backend/api/login.php

// 1. Cấu hình Headers (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Xử lý Preflight Request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Kết nối Database
include_once '../config/database.php';

// Kiểm tra biến kết nối $conn từ file database.php
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL."]);
    exit();
}

// 3. Nhận dữ liệu JSON
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->login_input) && !empty($data->password)) {
    $login_input = $data->login_input;
    $password = $data->password;

    // 4. Tìm User (MySQLi Prepared Statement)
    $sql = "SELECT id, full_name, email, phone, password, role, address FROM users WHERE email = ? OR phone = ?";
    
    $stmt = $conn->prepare($sql);
    
    if ($stmt) {
        // "ss" nghĩa là 2 tham số đều là String
        $stmt->bind_param("ss", $login_input, $login_input);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();

            // 5. Kiểm tra mật khẩu
            if (password_verify($password, $user['password'])) {
                
                // Trả về dữ liệu chuẩn
                $user_data = [
                    "id" => (int)$user['id'],
                    "user_id" => (int)$user['id'],
                    "full_name" => $user['full_name'],
                    "email" => $user['email'],
                    "phone" => $user['phone'],
                    "role" => $user['role'],
                    "address" => $user['address'] ?? ""
                ];

                echo json_encode([
                    "status" => "success",
                    "message" => "Đăng nhập thành công!",
                    "data" => $user_data
                ]);
            } else {
                echo json_encode(["status" => "error", "message" => "Mật khẩu không chính xác!"]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Tài khoản không tồn tại!"]);
        }
        $stmt->close();
    } else {
         echo json_encode(["status" => "error", "message" => "Lỗi truy vấn SQL: " . $conn->error]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Vui lòng nhập đầy đủ thông tin."]);
}
?>