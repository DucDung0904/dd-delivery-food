/**
 * MODULE QUẢN LÝ SHIPPER
 * File: assets/js/shipper_manager.js
 */

const ShipperManager = {
  // Đảm bảo đường dẫn này đúng với máy của bạn
  API_URL: "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api/restaurant",

  // 1. Lấy danh sách Shipper
  loadShippers: async function () {
    const storeId = localStorage.getItem("current_restaurant_id");
    const tbody = document.getElementById("shipper-list-body");

    if (!storeId || !tbody) return;

    try {
      // Thêm timestamp để tránh cache
      const res = await fetch(
        `${
          this.API_URL
        }/get_shippers.php?restaurant_id=${storeId}&t=${Date.now()}`
      );
      const data = await res.json();

      tbody.innerHTML = "";

      if (data.status === "success" && data.data.length > 0) {
        data.data.forEach((shipper) => {
          tbody.innerHTML += `
                        <tr>
                            <td class="fw-bold text-primary">
                                <i class="fas fa-user-circle me-2"></i>${shipper.name}
                            </td>
                            <td>${shipper.phone}</td>
                            <td><span class="badge bg-success">Hoạt động</span></td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-danger" onclick="ShipperManager.deleteShipper(${shipper.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
        });
      } else {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Chưa có shipper nào.</td></tr>`;
      }
    } catch (e) {
      console.error("Lỗi tải shipper:", e);
    }
  },

  // 2. Mở Modal (Hỗ trợ cả Bootstrap 5 mới và cũ)
  showAddModal: function () {
    const modalEl = document.getElementById("addShipperModal");
    if (typeof bootstrap !== "undefined") {
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
      }
      modalInstance.show();
    } else {
      // Fallback nếu không có bootstrap object
      modalEl.classList.add("show");
      modalEl.style.display = "block";
      document.body.classList.add("modal-open");
      // Tạo backdrop thủ công nếu cần
      if (!document.querySelector(".modal-backdrop")) {
        const backdrop = document.createElement("div");
        backdrop.className = "modal-backdrop fade show";
        document.body.appendChild(backdrop);
      }
    }
  },

  // 3. Ẩn Modal
  hideAddModal: function () {
    const modalEl = document.getElementById("addShipperModal");
    if (typeof bootstrap !== "undefined") {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    } else {
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
      document.body.classList.remove("modal-open");
      const backdrop = document.querySelector(".modal-backdrop");
      if (backdrop) backdrop.remove();
    }
  },

  // 4. Thêm Shipper Mới
  addShipper: async function () {
    const nameInput = document.getElementById("newShipperName");
    const phoneInput = document.getElementById("newShipperPhone");

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const storeId = localStorage.getItem("current_restaurant_id");

    if (!name || !phone) {
      alert("Vui lòng nhập tên và số điện thoại!");
      return;
    }

    // Khóa nút để tránh bấm nhiều lần
    const btn = document.querySelector("#addShipperModal .btn-primary");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    btn.disabled = true;

    try {
      const res = await fetch(`${this.API_URL}/add_shipper.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurant_id: storeId,
          name: name,
          phone: phone,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        alert("✅ Thêm thành công!");
        this.hideAddModal();
        nameInput.value = "";
        phoneInput.value = "";
        this.loadShippers();
      } else {
        alert("❌ Lỗi: " + data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối Server! Vui lòng kiểm tra lại file add_shipper.php");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  },

  // ... (Các phần trên giữ nguyên)

  // 5. CHỨC NĂNG XÓA SHIPPER
  deleteShipper: async function (id) {
    // 1. Hỏi xác nhận trước khi xóa
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa nhân viên giao hàng này không? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      // 2. Gửi yêu cầu xóa lên Server
      const res = await fetch(`${this.API_URL}/delete_shipper.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }), // Gửi ID cần xóa
      });

      // 3. Xử lý phản hồi
      // Kiểm tra nếu file PHP không tồn tại (Lỗi 404)
      if (!res.ok) {
        throw new Error(
          "Không tìm thấy file delete_shipper.php. Vui lòng kiểm tra lại Backend."
        );
      }

      const data = await res.json();

      if (data.status === "success") {
        // Xóa thành công -> Load lại danh sách
        alert("✅ Đã xóa shipper thành công!");
        this.loadShippers();
      } else {
        alert("❌ Lỗi: " + data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối: " + e.message);
    }
  },
};

// Tự động load khi trang web chạy xong
document.addEventListener("DOMContentLoaded", () => {
  // Nếu đang ở tab shipper thì load luôn
  const activeTab = document.querySelector(".nav-link.active");
  if (activeTab && activeTab.id === "nav-shippers") {
    ShipperManager.loadShippers();
  }
});
