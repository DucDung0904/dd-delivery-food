<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once '../../config/database.php';

try {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->order_id) || !isset($data->user_id)) {
        throw new Exception("Thiếu thông tin.");
    }

    // 1. Kiểm tra trạng thái đơn hàng (Chỉ cho hủy khi 'pending')
    $checkSql = "SELECT status FROM orders WHERE id = ? AND user_id = ?";
    $stmt = $conn->prepare($checkSql);
    $stmt->bind_param("ii", $data->order_id, $data->user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $order = $result->fetch_assoc();

    if (!$order) {
        throw new Exception("Đơn hàng không tồn tại.");
    }

    if ($order['status'] !== 'pending') {
        throw new Exception("Không thể hủy đơn hàng này vì quán đã nhận đơn hoặc đang giao.");
    }

    // 2. Cập nhật trạng thái thành 'cancelled'
    $updateSql = "UPDATE orders SET status = 'cancelled' WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("i", $data->order_id);

    if ($updateStmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Đã hủy đơn hàng thành công."]);
    } else {
        throw new Exception("Lỗi hệ thống, vui lòng thử lại.");
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>