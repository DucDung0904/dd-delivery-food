<?php
header("Access-Control-Allow-Origin: *"); header("Content-Type: application/json");
include_once '../../config/database.php';

try {
    $sql = "SELECT f.id, u.full_name, u.email, f.subject, f.message, f.status, f.created_at 
            FROM feedbacks f JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $data]);
} catch (PDOException $e) { echo json_encode(["status" => "error", "message" => $e->getMessage()]); }
?>