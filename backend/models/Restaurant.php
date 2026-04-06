<?php
class Restaurant {
    // DB stuff
    private $conn;
    private $table = 'restaurants';

    // Các thuộc tính của bảng Restaurant
    public $id;
    public $partner_id;
    public $name;
    public $description;
    public $address;
    public $image;
    public $is_open;

    // Constructor nhận kết nối DB
    public function __construct($db) {
        $this->conn = $db;
    }

    // Hàm lấy danh sách tất cả nhà hàng
    public function read() {
        // Tạo câu truy vấn
        $query = 'SELECT 
                    id, 
                    name, 
                    description, 
                    address, 
                    image, 
                    is_open 
                  FROM ' . $this->table . '
                  ORDER BY id DESC'; // Quán mới nhất lên đầu

        // Chuẩn bị statement
        $stmt = $this->conn->prepare($query);

        // Thực thi query
        $stmt->execute();

        return $stmt;
    }
}
?>