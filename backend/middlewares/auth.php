<?php
session_start();

function requireRole($role){
    if(!isset($_SESSION['role']) || $_SESSION['role'] !== $role){
        http_response_code(403);
        echo json_encode(["error"=>"Access denied"]);
        exit;
    }
}
