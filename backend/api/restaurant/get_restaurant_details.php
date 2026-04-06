<?php
// File: backend/api/restaurant/get_restaurant_details.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../config/database.php'; // Đảm bảo đúng tên file database.php

if (!isset($_GET['id'])) {
    echo json_encode(["status" => "error", "message" => "Thiếu ID quán"]);
    exit();
}

$id = intval($_GET['id']);

// Query chuẩn: BỎ cover_image
$sql = "SELECT 
            r.id, r.name, r.description, r.address, r.open_time, r.image, r.is_open,
            u.phone 
        FROM restaurants r
        INNER JOIN users u ON r.partner_id = u.id
        WHERE r.id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $row['image'] = !empty($row['image']) ? $row['image'] : 'default_store.png';
        
        // Trạng thái thực tế
        $row['actual_status'] = ($row['is_open'] == 1) ? 'open' : 'closed';

        echo json_encode(["status" => "success", "data" => $row]);
    } else {
        echo json_encode(["status" => "error", "message" => "Không tìm thấy quán"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $conn->error]);
}
$conn->close();
?>