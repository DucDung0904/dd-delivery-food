<?php
// backend/api/restaurant/category_actions.php

// 1. CẤU HÌNH CORS (Bắt buộc để trình duyệt không chặn)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Cho phép POST và OPTIONS
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 2. Xử lý Preflight Request (Lệnh kiểm tra của trình duyệt)
// Khi gửi JSON, trình duyệt sẽ hỏi đường trước bằng lệnh OPTIONS. Ta phải trả lời OK.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. Tắt báo lỗi rác PHP
error_reporting(0);
ini_set('display_errors', 0);

include '../../config/database.php';

// Kiểm tra kết nối
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL"]);
    exit();
}

// 4. Nhận dữ liệu JSON
$data = json_decode(file_get_contents("php://input"));

if (is_null($data)) {
    echo json_encode(["status" => "error", "message" => "Không nhận được dữ liệu JSON"]);
    exit();
}

$action = $data->action ?? '';

// --- XỬ LÝ CREATE ---
if ($action == 'create') {
    if (empty($data->restaurant_id) || empty($data->name)) {
        echo json_encode(["status" => "error", "message" => "Thiếu ID quán hoặc tên danh mục"]);
        exit();
    }

    $res_id = intval($data->restaurant_id);
    $name = trim($data->name);

    $sql = "INSERT INTO categories (restaurant_id, name) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    
    if ($stmt) {
        $stmt->bind_param("is", $res_id, $name);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Thêm thành công"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $stmt->error]);
        }
        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi Prepare: " . $conn->error]);
    }
}
// --- XỬ LÝ DELETE ---
elseif ($action == 'delete') {
    if (empty($data->id)) {
        echo json_encode(["status" => "error", "message" => "Thiếu ID"]); exit();
    }
    $sql = "DELETE FROM categories WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $data->id);
    if($stmt->execute()) echo json_encode(["status" => "success"]);
    else echo json_encode(["status" => "error", "message" => $stmt->error]);
}
// --- XỬ LÝ UPDATE ---
elseif ($action == 'update') {
    if (empty($data->id) || empty($data->name)) {
        echo json_encode(["status" => "error", "message" => "Thiếu dữ liệu"]); exit();
    }
    $sql = "UPDATE categories SET name = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $data->name, $data->id);
    if($stmt->execute()) echo json_encode(["status" => "success"]);
    else echo json_encode(["status" => "error", "message" => $stmt->error]);
}
else {
    echo json_encode(["status" => "error", "message" => "Hành động không hợp lệ"]);
}
?>