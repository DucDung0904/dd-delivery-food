Nền tảng Đặt đồ ăn & Giao hàng

Dự án Web Application đặt đồ ăn trực tuyến (Food Delivery) được xây dựng theo mô hình **Multi-vendor** (Đa nhà hàng)

## ✨ Tính năng nổi bật

* **🏪 Mô hình Đa nhà hàng (Multi-vendor):** Hỗ trợ nhiều quán ăn/nhà hàng đăng ký kinh doanh trên cùng một nền tảng. Mỗi món ăn được gắn liền với một cửa hàng cụ thể.
* **🛒 Quản lý Option món ăn phức tạp:** Hỗ trợ cấu trúc dữ liệu cho phép một món ăn có nhiều tùy chọn (Ví dụ: Size M/L, Topping, Mức đường, Mức đá).
* **🛵 Quản lý Trạng thái Đơn hàng:** Luồng xử lý đơn hàng rõ ràng: `Chờ xác nhận` -> `Đang chuẩn bị` -> `Đang giao (Kèm thông tin Shipper)` -> `Hoàn thành`.
* **💻 Kiến trúc MVC rõ ràng:** Backend tách biệt hoàn toàn với Frontend, giao tiếp thông qua RESTful API kết hợp chuẩn bảo mật PDO chống SQL Injection.

---

## 🛠 Công nghệ sử dụng

* **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox/Grid), Vanilla Javascript (Fetch API).
* **Backend:** PHP (OOP, PDO, RESTful API Concept) node.js.
* **Cơ sở dữ liệu:** MySQL / MariaDB.
* **Thư viện/Dịch vụ bên thứ 3:**
    * FontAwesome (Icons).
    * OpenStreetMap API (Reverse Geocoding & Address Autocomplete).

---

## 📂 Cấu trúc thư mục (Folder Structure)

Dự án được chia thành 2 phần rõ rệt: `frontend` và `backend`.

```text
FOOD-DELIVERY-APP/
│
├── backend/                  # Chứa toàn bộ mã nguồn PHP xử lý Server-side
│   ├── api/                  # Các file API trả về JSON (Ví dụ: restaurant/read.php)
│   ├── config/               # Cấu hình hệ thống (Database.php)
│   ├── controller/           # (Tùy chọn) Xử lý logic trung gian
│   ├── middlewares/          # (Tùy chọn) Xử lý xác thực Token/Quyền
│   ├── models/               # Các Class tương tác trực tiếp với Database (Restaurant.php, Product.php)
│   └── utils/                # Các hàm tiện ích dùng chung
│
└── frontend/                 # Chứa toàn bộ mã nguồn giao diện (Client-side)
    ├── assets/
    │   ├── css/              # Chứa style.css (Tông màu Ocean Blue)
    │   ├── images/           # Chứa hình ảnh tĩnh, logo
    │   └── js/               # Chứa main.js (Xử lý DOM, gọi API, Autocomplete Map)
    ├── pages/                # Chứa các trang phụ (menu.html, cart.html...)
    └── index.html            # Trang chủ (Dashboard Layout)
