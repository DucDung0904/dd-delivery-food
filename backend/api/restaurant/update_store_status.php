<?php
// File: backend/api/restaurant/update_store_status.php

// 1. CẤU HÌNH CORS (Bắt buộc để Frontend gọi được)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Xử lý request OPTIONS (kiểm tra trước khi gửi dữ liệu)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

// 2. KẾT NỐI DATABASE
include_once '../../config/database.php';

// 3. NHẬN DỮ LIỆU TỪ FRONTEND
$data = json_decode(file_get_contents("php://input"));

// --- PHẦN QUAN TRỌNG: TỰ ĐỘNG NHẬN DIỆN TÊN BIẾN ---

// A. Tìm ID Cửa hàng (Chấp nhận: store_id, restaurant_id, StoreID, id)
$res_id = null;
if (isset($data->store_id)) $res_id = $data->store_id;       // <- Đây là cái Frontend bạn đang gửi
elseif (isset($data->restaurant_id)) $res_id = $data->restaurant_id;
elseif (isset($data->StoreID)) $res_id = $data->StoreID;
elseif (isset($data->id)) $res_id = $data->id;

// B. Tìm Trạng thái (Chấp nhận: is_open, status, Status)
$new_status = null;
if (isset($data->is_open)) $new_status = $data->is_open;     // <- Cột trong DB bạn là is_open
elseif (isset($data->status)) $new_status = $data->status;
elseif (isset($data->Status)) $new_status = $data->Status;

// Nếu vẫn không tìm thấy dữ liệu
if ($res_id === null || $new_status === null) {
    echo json_encode([
        "status" => "error", 
        "message" => "Thiếu dữ liệu. Backend cần 'store_id' và 'is_open'. Dữ liệu nhận được: " . json_encode($data)
    ]);
    exit;
}

// 4. CẬP NHẬT VÀO DATABASE
// Dựa trên ảnh Database bạn gửi, tên bảng là 'restaurants' (hoặc partner?), cột trạng thái là 'is_open'

// LƯU Ý: Hãy chắc chắn tên bảng của bạn là 'restaurants'. 
// Nếu tên bảng là 'partners' hay tên khác, hãy đổi chữ `restaurants` bên dưới.
$sql = "UPDATE restaurants SET is_open = ? WHERE id = ?";

$stmt = $conn->prepare($sql);

if ($stmt) {
    // "ii" nghĩa là: is_open (integer), id (integer)
    $stmt->bind_param("ii", $new_status, $res_id);
    
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Cập nhật trạng thái thành công!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Lỗi kết nối CSDL: " . $conn->error]);
}

$conn->close();
?>