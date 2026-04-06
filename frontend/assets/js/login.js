async function handleLogin(event) {
  event.preventDefault();

  // 1. Lấy dữ liệu
  const inputVal = document.getElementById("loginInput").value.trim();
  const passwordVal = document.getElementById("loginPassword").value;

  if (!inputVal || !passwordVal) {
    alert("Vui lòng nhập đầy đủ thông tin!");
    return;
  }

  // 2. Cấu hình API
  // Đảm bảo đường dẫn này đúng với máy của bạn
  const API_URL =
    "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api/login.php";

  const btn = event.target.querySelector("button");
  const originalText = btn.innerText;

  try {
    btn.innerText = "Đang xử lý...";
    btn.disabled = true;

    // 3. Gửi Request
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login_input: inputVal,
        password: passwordVal,
      }),
    });

    // 4. Xử lý kết quả
    const text = await response.text();

    try {
      const data = JSON.parse(text);

      if (data.status === "success") {
        console.log("User Info:", data.data); // Debug xem có ID chưa

        // Lưu thông tin vào LocalStorage
        localStorage.setItem("user_info", JSON.stringify(data.data));

        alert("Đăng nhập thành công!");

        // 5. Điều hướng trang (Relative Paths)
        // Giả sử file login.html nằm ở: /frontend/pages/login.html
        const role = data.data.role;

        if (role === "admin") {
          window.location.href = "admin/dashboard.html";
        } else if (role === "partner") {
          window.location.href = "restaurant/dashboard.html";
        } else {
          // Khách hàng -> Về trang chủ (ra khỏi thư mục pages)
          window.location.href = "../index.html";
        }
      } else {
        alert(data.message || "Đăng nhập thất bại.");
      }
    } catch (jsonError) {
      console.error("Lỗi JSON:", text);
      alert("Lỗi dữ liệu từ Server (Kiểm tra Console)");
    }
  } catch (error) {
    console.error("Lỗi mạng:", error);
    alert("Không thể kết nối đến Server.");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}
