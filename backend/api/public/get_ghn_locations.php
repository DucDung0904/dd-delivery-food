<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// 1. Dùng TOKEN THẬT của bạn (Token user sso.ghn.vn)
define('GHN_TOKEN', 'bd5cf8f1-ebda-11f0-aba2-4210e14e7d2d'); 

$type = isset($_GET['type']) ? $_GET['type'] : '';
$parent_id = isset($_GET['parent_id']) ? $_GET['parent_id'] : '';

$url = "";
$headers = ['Content-Type: application/json', 'Token: ' . GHN_TOKEN];

if ($type == 'province') {
    $url = "
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    ";
} elseif ($type == 'district') {
    $url = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district";
} elseif ($type == 'ward') {
    $url = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=" . $parent_id;
}
$ch = curl_init();

// Cấu hình URL và Method
if ($type == 'district') {
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['province_id' => (int)$parent_id]));
} else {
    curl_setopt($ch, CURLOPT_URL, $url);
}

// --- THÊM 2 DÒNG NÀY ĐỂ FIX LỖI LOADING TRÊN XAMPP ---
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Tắt kiểm tra chứng chỉ SSL
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
// -----------------------------------------------------

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);

// Kiểm tra nếu Curl bị lỗi
if ($response === false) {
    echo json_encode(["code" => 500, "message" => "Curl Error: " . curl_error($ch)]);
} else {
    echo $response;
}

curl_close($ch);
?>