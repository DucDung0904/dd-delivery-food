// frontend/assets/js/register.js

document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // 1. Lấy dữ liệu từ các ID trong HTML (registerName, registerPhone...)
      const name = document.getElementById("registerName").value;
      const phone = document.getElementById("registerPhone").value;
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;
      const confirmPassword = document.getElementById(
        "registerConfirmPassword"
      ).value;

      // 2. Validate phía Client
      if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
      }
      if (password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
      }

      // 3. Cấu hình API URL
      // LƯU Ý: Sửa 'DACS2/FOOD-DELIVERY-APP' cho đúng tên thư mục thật trong htdocs của bạn
      const API_URL =
        "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api/register.php";

      console.log("Đang gửi dữ liệu tới:", API_URL);

      // 4. Gửi Fetch Request
      fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Body phải khớp với cái PHP đang nhận (full_name, email, phone...)
        body: JSON.stringify({
          full_name: name,
          email: email,
          phone: phone,
          password: password,
        }),
      })
        .then((response) => {
          // Bước quan trọng: Đọc text trước để xem server trả về cái gì
          return response.text().then((text) => {
            return {
              ok: response.ok,
              status: response.status,
              text: text, // Nội dung thô server trả về
            };
          });
        })
        .then((result) => {
          console.log("Server trả về:", result.text); // Xem cái này trong F12 nếu lỗi

          try {
            // Cố gắng parse JSON
            const data = JSON.parse(result.text);

            if (data.status === "success") {
              alert("Đăng ký thành công!");
              window.location.href = "login.html";
            } else {
              alert("Thất bại: " + data.message);
            }
          } catch (e) {
            // Nếu nhảy vào đây nghĩa là PHP in ra lỗi (Warning/Fatal Error) chứ không phải JSON
            console.error("Lỗi JSON Parse:", e);
            alert(
              "Lỗi server (Không phải JSON). Kiểm tra Console (F12) để xem chi tiết."
            );
          }
        })
        .catch((error) => {
          console.error("Lỗi mạng:", error);
          alert("Không thể kết nối tới Server. Hãy kiểm tra XAMPP.");
        });
    });
  }
});
