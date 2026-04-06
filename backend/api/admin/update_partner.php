<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?? null;
    $name = $_POST['store_name'] ?? '';
    $address = $_POST['address'] ?? '';
    $category_id = $_POST['category_id'] ?? null;
    $ghn_province_id = $_POST['ghn_province_id'] ?? null;
    $ghn_district_id = $_POST['ghn_district_id'] ?? null;
    $ghn_ward_code = $_POST['ghn_ward_code'] ?? '';

    if (!$id) {
        echo json_encode(["status" => "error", "message" => "Thiếu ID cửa hàng"]);
        exit;
    }
    if (empty($name)) {
    echo json_encode(["status" => "error", "message" => "Tên cửa hàng không được để trống"]);
    exit;
}

    // Xử lý ảnh nếu có upload mới
    $image_sql = "";
    if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
        $target_dir = "../../uploads/";
        $filename = time() . "_" . basename($_FILES["image"]["name"]);
        if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_dir . $filename)) {
            $image_sql = ", image = '$filename'";
        }
    }

    $sql = "UPDATE restaurants SET 
            name = '$name', 
            address = '$address', 
            category_id = $category_id,
            ghn_province_id = $ghn_province_id,
            ghn_district_id = $ghn_district_id,
            ghn_ward_code = '$ghn_ward_code'
            $image_sql 
            WHERE id = $id";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Cập nhật cửa hàng thành công"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $conn->error]);
    }
}
?>