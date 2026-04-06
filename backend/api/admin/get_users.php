<?php
header("Access-Control-Allow-Origin: *"); header("Content-Type: application/json");
include_once '../../config/database.php';

try {
    // Chỉ lấy user thường (loại trừ admin và restaurant nếu cần)
    $sql = "SELECT id, full_name, email, phone, created_at, role FROM users WHERE role = 'user' ORDER BY created_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $users]);
} catch (PDOException $e) { echo json_encode(["status" => "error", "message" => $e->getMessage()]); }
?>