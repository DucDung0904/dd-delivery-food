<?php
include '../../config/database.php';
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') exit(json_encode(["status"=>"error"]));

$id = $_POST['product_id'];
$name = $_POST['name'];
$price = $_POST['price'];
$desc = $_POST['description'];
$cat = $_POST['category_id'];
$active = $_POST['is_active'];

$img_sql = "";
$params = [$cat, $name, $desc, $price, $active, $id];
$types = "issdii";

if (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
    $target = "../../uploads/";
    $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $fname = time() . "_" . uniqid() . "." . $ext;
    if (move_uploaded_file($_FILES['image']['tmp_name'], $target.$fname)) {
        $img_sql = ", image=?";
        array_splice($params, 5, 0, $fname);
        $types = "issdisi";
    }
}

$stmt = $conn->prepare("UPDATE products SET category_id=?, name=?, description=?, price=?, is_active=? $img_sql WHERE id=?");
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) echo json_encode(["status"=>"success"]);
else echo json_encode(["status"=>"error", "message"=>$stmt->error]);
?>