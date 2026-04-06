<?php
class Product {
    private $conn;
    private $table = 'products';

    // Thuộc tính món ăn
    public $id;
    public $restaurant_id;
    public $category_id;
    public $name;
    public $description;
    public $price;
    public $image;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Hàm lấy món ăn theo ID nhà hàng
    public function readByRestaurant($restaurant_id) {
        // Query: Lấy món ăn, kèm tên danh mục (JOIN bảng categories)
        $query = 'SELECT 
                    p.id, 
                    p.name, 
                    p.description, 
                    p.price, 
                    p.image, 
                    c.name as category_name
                  FROM ' . $this->table . ' p
                  LEFT JOIN categories c ON p.category_id = c.id
                  WHERE p.restaurant_id = :restaurant_id
                  ORDER BY p.category_id ASC, p.id DESC';

        $stmt = $this->conn->prepare($query);

        // Gán giá trị tham số (Sanitize input)
        $restaurant_id = htmlspecialchars(strip_tags($restaurant_id));
        $stmt->bindParam(':restaurant_id', $restaurant_id);

        $stmt->execute();
        return $stmt;
    }
}
?>