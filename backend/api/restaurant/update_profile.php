<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once '../../config/database.php';

$response = array();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // 1. Lấy dữ liệu từ FormData
    $id = $_POST['id'] ?? null; // ID của nhà hàng
    $name = $_POST['name'] ?? '';
    $address = $_POST['address'] ?? '';
    $open_time = $_POST['open_time'] ?? '';
    $description = $_POST['description'] ?? '';
    // Chuyển đổi: 'true' từ JS -> 1, ngược lại -> 0
    $is_open = (isset($_POST['is_open']) && $_POST['is_open'] == 'true') ? 1 : 0;

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Thiếu ID cửa hàng"]);
        exit;
    }

    // 2. Xử lý Upload Ảnh (Logo) - Chỉ update nếu người dùng có chọn ảnh mới
    $image_sql_part = "";
    $params = [];
    $types = "";

    // Mảng tham số cơ bản
    $params[] = $name;
    $params[] = $address;
    $params[] = $open_time;
    $params[] = $description;
    $params[] = $is_open;
    $types .= "ssssi";

    if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
        $target_dir = "../../uploads/";
        if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);
        
        $extension = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
        $new_filename = time() . "_logo." . $extension;
        
        if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_dir . $new_filename)) {
            $image_sql_part = ", image = ?";
            $params[] = $new_filename;
            $types .= "s";
        }
    }

    // 3. Tạo câu lệnh SQL động
    $params[] = $id; // Tham số cho WHERE id = ?
    $types .= "i";

    $sql = "UPDATE restaurants SET name = ?, address = ?, open_time = ?, description = ?, is_open = ? $image_sql_part WHERE id = ?";

    $stmt = $conn->prepare($sql);
    
    // Bind Params động (do số lượng tham số thay đổi tùy có ảnh hay không)
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Cập nhật thông tin thành công!", "image" => isset($new_filename) ? $new_filename : null]);
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $stmt->error]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Invalid Request"]);
}
?>