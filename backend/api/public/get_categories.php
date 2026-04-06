<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once '../../config/database.php';

// Lấy danh sách danh mục cửa hàng để hiển thị lên thanh Menu ngang
$sql = "SELECT * FROM store_categories ORDER BY id ASC";
$result = $conn->query($sql);
$data = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
}
echo json_encode(["status" => "success", "data" => $data]);
?>