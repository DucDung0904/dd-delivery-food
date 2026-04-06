<?php
// 1. Sửa lỗi CORS (Hình image_145b75.png)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit; }

    include_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->id) && isset($data->status)) {
    $id = intval($data->id);
    $new_status = intval($data->status); // 0 là Khóa, 1 là Mở

    // 2. Kiểm tra trạng thái đóng/mở cửa hiện tại của quán
    $checkSql = "SELECT is_open FROM restaurants WHERE id = $id";
    $result = $conn->query($checkSql);
    $row = $result->fetch_assoc();

    if ($new_status == 0) { // Nếu Admin đang muốn KHÓA
        if ($row['is_open'] == 1) { // Nếu quán đang mở (is_open = 1)
            echo json_encode([
                "status" => "error", 
                "message" => "Không thể khóa! Quán ăn phải được ĐÓNG CỬA trước khi thực hiện khóa tài khoản."
            ]);
            exit;
        }
    }

    // 3. Thực hiện cập nhật nếu thỏa mãn điều kiện
    $sql = "UPDATE restaurants SET is_active = $new_status WHERE id = $id";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            "status" => "success", 
            "message" => ($new_status == 0) ? "Đã khóa tài khoản thành công." : "Đã mở khóa tài khoản."
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $conn->error]);
    }
}
$conn->close();