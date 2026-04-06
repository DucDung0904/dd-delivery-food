<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "food_delivery_db";

$conn = new mysqli($servername, $username,
 $password, $dbname);

if ($conn->connect_error) {
 
    die(json_encode(["status" => "error", "message" 
    => "Kết nối DB thất bại: " . $conn->connect_error]));
}
// thiết lập tiếng việt
$conn->set_charset("utf8");
?>