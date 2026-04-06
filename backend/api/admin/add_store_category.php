<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
include_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    
    // Xử lý upload ảnh (nếu có)
    $image = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
        $target_dir = "../../uploads/categories/";
        if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);
        
        $ext = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
        $image = time() . "_cat." . $ext;
        move_uploaded_file($_FILES["image"]["tmp_name"], $target_dir . $image);
    }

    if (!empty($name)) {
        $stmt = $conn->prepare("INSERT INTO store_categories (name, image) VALUES (?, ?)");
        $stmt->bind_param("ss", $name, $image);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Thêm thành công"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Lỗi SQL"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Tên không được để trống"]);
    }
}
?>