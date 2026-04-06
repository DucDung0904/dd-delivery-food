<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/database.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Method không hợp lệ"]);
    exit;
}

// ========================
// 1. LẤY DỮ LIỆU
// ========================
$store_name = trim($_POST['store_name'] ?? '');
$address = trim($_POST['address'] ?? '');
$category_id = isset($_POST['category_id']) ? intval($_POST['category_id']) : 0;
$phone = trim($_POST['phone'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '123456';

$ghn_province_id = isset($_POST['ghn_province_id']) ? intval($_POST['ghn_province_id']) : null;
$ghn_district_id = isset($_POST['ghn_district_id']) ? intval($_POST['ghn_district_id']) : null;
$ghn_ward_code = $_POST['ghn_ward_code'] ?? null;

// ========================
// 2. VALIDATE
// ========================
if ($store_name === '' || $email === '' || $category_id <= 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Vui lòng nhập đầy đủ: Tên quán, Email, Loại hình"
    ]);
    exit;
}

// ========================
// 3. SETUP MẶC ĐỊNH
// ========================
$image_name = "default_store.png";
$desc = "Chưa có mô tả";
$open_time = "07:00 - 22:00";
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// ========================
// 4. TRANSACTION
// ========================
$conn->begin_transaction();

try {
    // ========================
    // 4.1 CHECK EMAIL
    // ========================
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        throw new Exception("Email đã tồn tại trong hệ thống!");
    }
    $stmt->close();

    // ========================
    // 4.2 TẠO USER
    // ========================
    $stmt = $conn->prepare("
        INSERT INTO users (full_name, email, password, phone, role, created_at)
        VALUES (?, ?, ?, ?, 'partner', NOW())
    ");
    $stmt->bind_param("ssss", $store_name, $email, $hashed_password, $phone);
    if (!$stmt->execute()) {
        throw new Exception("Không thể tạo tài khoản user!");
    }
    $partner_id = $stmt->insert_id;
    $stmt->close();

    // ========================
    // 4.3 TẠO CỬA HÀNG
    // ========================
    $stmt = $conn->prepare("
        INSERT INTO restaurants 
        (partner_id, name, address, image, description, category_id, open_time, is_open, ghn_province_id, ghn_district_id, ghn_ward_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    ");

    $stmt->bind_param(
    "issssiiiis",
        $partner_id,
        $store_name,
        $address,
        $image_name,
        $desc,
        $category_id,
        $open_time,
        $ghn_province_id,
        $ghn_district_id,
        $ghn_ward_code
    );

    if (!$stmt->execute()) {
        throw new Exception("Không thể tạo cửa hàng!");
    }

    $stmt->close();

    // ========================
    // 4.4 COMMIT
    // ========================
    $conn->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Tạo cửa hàng thành công!"
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
