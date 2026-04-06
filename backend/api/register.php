<?php
// backend/api/register.php

// 1. Cấu hình
error_reporting(0);
ini_set('display_errors', 0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->full_name) && 
    !empty($data->email) && 
    !empty($data->password) &&
    !empty($data->phone)
) {
    $full_name = htmlspecialchars(strip_tags($data->full_name));
    $email = htmlspecialchars(strip_tags($data->email));
    $phone = htmlspecialchars(strip_tags($data->phone));
    $password = htmlspecialchars(strip_tags($data->password));
    
    // --- QUAN TRỌNG: ÉP CỨNG ROLE LÀ USER ---
    // Không nhận $data->role từ bên ngoài để tránh bảo mật
    $role = 'customer'; 

    try {
        // Kiểm tra Email trùng
        $check_query = "SELECT id FROM users WHERE email = :email";
        $stmt = $conn->prepare($check_query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if($stmt->rowCount() > 0){
            echo json_encode(["status" => "error", "message" => "Email này đã được đăng ký!"]);
        } else {
            // Insert
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $query = "INSERT INTO users (full_name, email, phone, password, role) VALUES (:full_name, :email, :phone, :password, :role)";
            
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':full_name', $full_name);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':phone', $phone);
            $stmt->bindParam(':password', $password_hash);
            $stmt->bindParam(':role', $role); 

            if($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Đăng ký thành công!"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Lỗi hệ thống."]);
            }
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Lỗi: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Thiếu thông tin."]);
}
?>