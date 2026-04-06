const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// --- CẤU HÌNH MIDDLEWARE ---
app.use(cors()); // Cho phép Frontend gọi API
app.use(bodyParser.json()); // Cho phép đọc dữ liệu JSON gửi lên

// --- 1. KẾT NỐI DATABASE ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // User mặc định của XAMPP
  password: "", // Mật khẩu mặc định để trống
  database: "food_delivery_db", // Tên database của bạn
});

db.connect((err) => {
  if (err) {
    console.error("❌ Lỗi kết nối MySQL:", err.message);
    return;
  }
  console.log("✅ Đã kết nối thành công với MySQL!");
});

// ============================================
// KHU VỰC API ĐỊA CHỈ (ADDRESS API)
// ============================================

// 1. API Lấy danh sách địa chỉ của User
// Logic: Sắp xếp địa chỉ mặc định (is_default = 1) lên đầu tiên
app.get("/api/address/:user_id", (req, res) => {
  const userId = req.params.user_id;
  const sql =
    "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC";

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Lỗi lấy danh sách:", err);
      return res.status(500).json({ error: "Lỗi Server" });
    }
    res.json(results);
  });
});

// 2. API Thêm địa chỉ mới
app.post("/api/address/add", (req, res) => {
  const {
    user_id,
    recipient_name,
    recipient_phone,
    province_id,
    district_id,
    ward_code,
    specific_address,
    is_default,
  } = req.body;

  // Bước 1: Nếu người dùng chọn địa chỉ này là mặc định
  // Ta phải reset tất cả địa chỉ cũ của user này về không mặc định (is_default = 0)
  if (is_default) {
    const resetSql =
      "UPDATE user_addresses SET is_default = 0 WHERE user_id = ?";
    db.query(resetSql, [user_id], (err) => {
      if (err) console.error("Lỗi reset mặc định:", err);
    });
  }

  // Bước 2: Thêm địa chỉ mới vào DB
  const insertSql = `INSERT INTO user_addresses 
    (user_id, recipient_name, recipient_phone, province_id, district_id, ward_code, specific_address, is_default) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    insertSql,
    [
      user_id,
      recipient_name,
      recipient_phone,
      province_id,
      district_id,
      ward_code,
      specific_address,
      is_default ? 1 : 0,
    ],
    (err, result) => {
      if (err) {
        console.error("Lỗi thêm địa chỉ:", err);
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, message: "Thêm địa chỉ thành công!" });
    }
  );
});

// 3. API Cập nhật địa chỉ
app.post("/api/address/update", (req, res) => {
  const {
    id,
    user_id,
    recipient_name,
    recipient_phone,
    province_id,
    district_id,
    ward_code,
    specific_address,
    is_default,
  } = req.body;

  // Bước 1: Xử lý logic mặc định tương tự như thêm mới
  if (is_default) {
    db.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [
      user_id,
    ]);
  }

  // Bước 2: Cập nhật thông tin
  const updateSql = `UPDATE user_addresses SET 
        recipient_name=?, recipient_phone=?, province_id=?, district_id=?, ward_code=?, specific_address=?, is_default=? 
        WHERE id=?`;

  db.query(
    updateSql,
    [
      recipient_name,
      recipient_phone,
      province_id,
      district_id,
      ward_code,
      specific_address,
      is_default ? 1 : 0,
      id,
    ],
    (err, result) => {
      if (err)
        return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: "Cập nhật thành công!" });
    }
  );
});

// 4. API Xóa địa chỉ
app.delete("/api/address/delete/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM user_addresses WHERE id = ?", [id], (err, result) => {
    if (err)
      return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: "Đã xóa địa chỉ!" });
  });
});

// 5. API Thiết lập địa chỉ mặc định nhanh (Set Default)
app.post("/api/address/set-default", (req, res) => {
  const { user_id, address_id } = req.body;

  // B1: Reset hết về 0
  db.query(
    "UPDATE user_addresses SET is_default = 0 WHERE user_id = ?",
    [user_id],
    (err) => {
      if (err) return res.status(500).json({ success: false });

      // B2: Set cái được chọn thành 1
      db.query(
        "UPDATE user_addresses SET is_default = 1 WHERE id = ?",
        [address_id],
        (err) => {
          if (err) return res.status(500).json({ success: false });
          res.json({ success: true, message: "Đã đặt làm mặc định!" });
        }
      );
    }
  );
});

// ============================================
// KHU VỰC API USER PROFILE
// ============================================

app.post("/api/user/update", (req, res) => {
  const { user_id, full_name, phone } = req.body;
  const sql = "UPDATE users SET full_name = ?, phone = ? WHERE id = ?";

  db.query(sql, [full_name, phone, user_id], (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// --- KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
