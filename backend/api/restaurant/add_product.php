<?php
include '../../config/database.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Mặc định phản hồi lỗi
$response = ["status" => "error", "message" => "Lỗi không xác định"];

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // 1. NHẬN RESTAURANT_ID TRỰC TIẾP TỪ JS
    // (Vì ở JS checkOwnerAuth đã đảm bảo lấy đúng ID rồi)
    $restaurant_id = $_POST['restaurant_id'] ?? '';
    
    if (empty($restaurant_id)) {
        echo json_encode(["status" => "error", "message" => "Thiếu ID quán (restaurant_id)!"]);
        exit();
    }

    // 2. Lấy dữ liệu sản phẩm
    $name = $_POST['name'] ?? '';
    $price = $_POST['price'] ?? 0;
    $desc = $_POST['description'] ?? '';
    $category_id = $_POST['category_id'] ?? 0;
    
    // Nhận trạng thái từ JS (1 hoặc 0). Nếu không có thì mặc định là 1 (Hiện)
    $is_active = $_POST['is_active'] ?? 1; 

    // Kiểm tra dữ liệu bắt buộc
    if(empty($name) || empty($price) || empty($category_id)) {
        echo json_encode(["status" => "error", "message" => "Vui lòng nhập Tên, Giá và chọn Danh mục!"]);
        exit();
    }

    // 3. Xử lý upload ảnh
    $image_name = "default_food.png"; // Ảnh mặc định
    
    if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
        $target_dir = "../../uploads/";
        
        // Tạo thư mục nếu chưa có
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        // Lấy đuôi file (jpg, png...)
        $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        // Đặt tên file ngẫu nhiên để không trùng
        $image_name = time() . "_" . uniqid() . "." . $extension;
        
        // Di chuyển file
        if(!move_uploaded_file($_FILES['image']['tmp_name'], $target_dir . $image_name)){
             echo json_encode(["status" => "error", "message" => "Không thể lưu ảnh vào thư mục uploads"]);
             exit();
        }
    }

    // 4. Insert vào Database
    // Lưu ý: Cột is_active là tham số cuối cùng
    $sql_add = "INSERT INTO products (restaurant_id, category_id, name, description, price, image, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    $stmt_add = $conn->prepare($sql_add);
    
    if($stmt_add) {
        // i: integer, s: string, d: double
        // restaurant_id(i), category_id(i), name(s), description(s), price(d), image(s), is_active(i)
        $stmt_add->bind_param("iissssi", $restaurant_id, $category_id, $name, $desc, $price, $image_name, $is_active);

        if ($stmt_add->execute()) {
            echo json_encode(["status" => "success", "message" => "Thêm món thành công!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Lỗi SQL: " . $stmt_add->error]);
        }
        $stmt_add->close();
    } else {
        echo json_encode(["status" => "error", "message" => "Lỗi Prepare: " . $conn->error]);
    }
}
?>