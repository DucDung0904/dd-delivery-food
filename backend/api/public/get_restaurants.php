<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Kiểm tra lại đường dẫn file config của bạn (dựa trên file bạn gửi là database.php)
include_once '../../config/database.php'; 

// Nhận tham số từ URL
$keyword = isset($_GET['keyword']) ? $_GET['keyword'] : '';
$category_id = isset($_GET['category_id']) ? $_GET['category_id'] : ''; // Đổi từ category sang category_id

// 1. Câu lệnh SQL với JOIN
// Lấy tất cả thông tin quán (r.*) và tên danh mục (c.name)
$sql = "SELECT r.*, c.name as category_name 
        FROM restaurants r 
        LEFT JOIN store_categories c ON r.category_id = c.id 
        WHERE 1=1";

// 2. Xử lý tìm kiếm từ khóa
if (!empty($keyword)) {
    $safe_keyword = $conn->real_escape_string($keyword);
    // Tìm trong tên quán, mô tả quán HOẶC tên danh mục (ví dụ tìm "Cơm" sẽ ra các quán thuộc danh mục Cơm)
    $sql .= " AND (r.name LIKE '%$safe_keyword%' OR r.description LIKE '%$safe_keyword%' OR c.name LIKE '%$safe_keyword%')";
}

// 3. Xử lý lọc danh mục theo ID (Số)
if (!empty($category_id) && $category_id !== 'all') {
    $safe_cat_id = intval($category_id); // Chuyển về số nguyên để bảo mật
    $sql .= " AND r.category_id = $safe_cat_id";
}

// 4. Sắp xếp: Ngẫu nhiên nếu không tìm kiếm, ngược lại theo ID giảm dần
if (empty($keyword) && (empty($category_id) || $category_id === 'all')) {
    $sql .= " ORDER BY RAND()";
} else {
    $sql .= " ORDER BY r.id DESC";
}

$result = $conn->query($sql);
$restaurants = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // --- XỬ LÝ DỮ LIỆU BỔ SUNG ---
        
        // 1. Rating giả lập
        $row['rating'] = number_format((float)(rand(40, 50) / 10), 1, '.', '');
        
        // 2. Thời gian giao giả lập
        $row['delivery_time'] = rand(15, 40) . " phút";
        
        // 3. Xử lý ảnh null
        if (empty($row['image'])) {
            $row['image'] = null;
        }

        // 4. Xử lý tên danh mục (fallback nếu null)
        if (empty($row['category_name'])) {
            $row['category_name'] = "Quán ăn"; 
        }

        $restaurants[] = $row;
    }
}

echo json_encode([
    "status" => "success",
    "data" => $restaurants
]);
?>