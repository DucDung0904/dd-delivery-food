const CONFIG = {
  API_URL: "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api",

  GHN_TOKEN: "bd5cf8f1-ebda-11f0-aba2-4210e14e7d2d",

  GHN_API: "https://online-gateway.ghn.vn/shiip/public-api/master-data",
};

// --- QUẢN LÝ GHN (Giao Hàng Nhanh) ---
const GHNService = {
  headers: { "Content-Type": "application/json", Token: CONFIG.GHN_TOKEN },

  loadProvinces: async function () {
    try {
      const res = await fetch(`${CONFIG.GHN_API}/province`, {
        headers: this.headers,
      });
      const data = await res.json();
      if (data.code === 200) {
        const select = document.getElementById("ghn-province");
        if (!select) return;
        select.innerHTML = '<option value="">-- Chọn Tỉnh/Thành --</option>';
        const sorted = data.data.sort((a, b) =>
          a.ProvinceName.localeCompare(b.ProvinceName)
        );
        sorted.forEach((p) => {
          select.innerHTML += `<option value="${p.ProvinceID}">${p.ProvinceName}</option>`;
        });
      }
    } catch (error) {
      console.error("Lỗi GHN:", error);
    }
  },

  loadDistricts: async function (provinceId) {
    if (!provinceId) return;
    try {
      const res = await fetch(`${CONFIG.GHN_API}/district`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ province_id: parseInt(provinceId) }),
      });
      const data = await res.json();
      const select = document.getElementById("ghn-district");
      select.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
      select.disabled = false;

      // Reset xã
      document.getElementById("ghn-ward").innerHTML =
        '<option value="">-- Chọn Phường/Xã --</option>';
      document.getElementById("ghn-ward").disabled = true;

      if (data.data) {
        data.data.forEach(
          (d) =>
            (select.innerHTML += `<option value="${d.DistrictID}">${d.DistrictName}</option>`)
        );
      }
    } catch (error) {
      console.error(error);
    }
  },

  loadWards: async function (districtId) {
    if (!districtId) return;
    try {
      const res = await fetch(
        `${CONFIG.GHN_API}/ward?district_id=${districtId}`,
        { headers: this.headers }
      );
      const data = await res.json();
      const select = document.getElementById("ghn-ward");
      select.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
      select.disabled = false;
      if (data.data) {
        data.data.forEach(
          (w) =>
            (select.innerHTML += `<option value="${w.WardCode}">${w.WardName}</option>`)
        );
      }
    } catch (error) {
      console.error(error);
    }
  },
};

// --- LOGIC CHÍNH ---
const ProfileApp = {
  user: null,
  addresses: [], // Lưu danh sách địa chỉ để dùng lại khi Sửa
  editingId: null, // Biến check: null là Thêm, có số là Sửa

  init: function () {
    const userRaw = localStorage.getItem("user_info");
    if (!userRaw) {
      alert("Vui lòng đăng nhập!");
      window.location.href = "index.html";
      return;
    }
    this.user = JSON.parse(userRaw);

    this.renderUserInfo();
    this.loadUserAddresses();
    GHNService.loadProvinces();
  },

  switchTab: function (tabName, btnElement) {
    if (btnElement) {
      document
        .querySelectorAll(".menu-btn")
        .forEach((btn) => btn.classList.remove("active"));
      btnElement.classList.add("active");
    }
    document
      .querySelectorAll(".tab-panel")
      .forEach((panel) => panel.classList.remove("active"));
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.classList.add("active");
  },

  renderUserInfo: function () {
    const u = this.user;
    ["header-username", "sidebar-name"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerText = u.full_name;
    });
    const inpName = document.getElementById("inp-fullname");
    const inpEmail = document.getElementById("inp-email");
    const inpPhone = document.getElementById("inp-phone");
    if (inpName) inpName.value = u.full_name || "";
    if (inpEmail) inpEmail.value = u.email || "";
    if (inpPhone) inpPhone.value = u.phone || "";
  },

  // --- 1. MỞ MODAL THÊM MỚI ---
  openAddModal: function () {
    this.editingId = null; // Reset về chế độ Thêm

    // Reset form
    document.getElementById("form-add-address").reset();
    document.getElementById("addr-name").value = "";
    document.getElementById("addr-phone").value = "";
    document.getElementById("addr-specific").value = "";

    // Reset Select box GHN
    document.getElementById("ghn-province").value = "";
    document.getElementById("ghn-district").innerHTML =
      '<option value="">Chọn Quận/Huyện</option>';
    document.getElementById("ghn-district").disabled = true;
    document.getElementById("ghn-ward").innerHTML =
      '<option value="">Chọn Phường/Xã</option>';
    document.getElementById("ghn-ward").disabled = true;

    // Đổi tiêu đề modal (nếu có thẻ id="modal-title")
    const title = document.querySelector(".modal-title");
    if (title) title.innerText = "Thêm địa chỉ mới";

    new bootstrap.Modal(document.getElementById("addressModal")).show();
  },

  // --- 2. MỞ MODAL SỬA ---
  openEditModal: async function (id) {
    this.editingId = id; // Đánh dấu đang sửa ID này

    const title = document.querySelector(".modal-title");
    if (title) title.innerText = "Cập nhật địa chỉ";

    // Tìm dữ liệu cũ
    const addr = this.addresses.find((a) => a.id === id);
    if (!addr) return;

    // Điền dữ liệu text
    document.getElementById("addr-name").value = addr.recipient_name;
    document.getElementById("addr-phone").value = addr.recipient_phone;
    document.getElementById("addr-specific").value = addr.specific_address;
    document.getElementById("addr-default").checked = addr.is_default == 1;

    // Điền dữ liệu GHN (Phải chờ load tuần tự)
    document.getElementById("ghn-province").value = addr.province_id;

    await GHNService.loadDistricts(addr.province_id);
    document.getElementById("ghn-district").value = addr.district_id;

    await GHNService.loadWards(addr.district_id);
    document.getElementById("ghn-ward").value = addr.ward_code;

    new bootstrap.Modal(document.getElementById("addressModal")).show();
  },

  handleSaveAddress: async function () {
    // 1. Lấy dữ liệu form
    const name = document.getElementById("addr-name").value.trim();
    const phone = document.getElementById("addr-phone").value.trim();
    const province = document.getElementById("ghn-province").value;
    const district = document.getElementById("ghn-district").value;
    const ward = document.getElementById("ghn-ward").value;
    const specific = document.getElementById("addr-specific").value.trim();
    const isDefault = document.getElementById("addr-default").checked;

    // 2. Validate
    if (!name || !phone || !province || !district || !ward || !specific) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // 3. Tạo Payload
    const payload = {
      user_id: this.user.user_id,
      recipient_name: name,
      recipient_phone: phone,
      province_id: province,
      district_id: district,
      ward_code: ward,
      specific_address: specific,
      is_default: isDefault ? 1 : 0,
    };

    // NẾU ĐANG SỬA: Gửi kèm ID vào payload
    if (this.editingId) {
      payload.id = this.editingId;
    }

    // 4. GỌI 1 API DUY NHẤT
    // Thêm ?t=... để tránh cache trình duyệt
    const url = `${CONFIG.API_URL}/user/add_address.php?t=${Date.now()}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message); // Thông báo server trả về (Thêm hay Sửa thành công)

        // Đóng modal & Load lại
        bootstrap.Modal.getInstance(
          document.getElementById("addressModal")
        ).hide();
        this.loadUserAddresses();
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối Server!");
    }
  },

  // --- 4. TẢI DANH SÁCH ---
  loadUserAddresses: async function () {
    const container = document.getElementById("address-list-container");
    if (!container) return;

    // ... (các đoạn code loading giữ nguyên) ...

    try {
      // ❌ DÒNG CŨ (SAI):
      // const res = await fetch(`${CONFIG.API_URL}/address/${this.user.user_id}`);

      // ✅ DÒNG MỚI (ĐÚNG): Trỏ thẳng vào file PHP và truyền tham số user_id
      const res = await fetch(
        `${CONFIG.API_URL}/user/get_address.php?user_id=${this.user.user_id}`
      );

      if (!res.ok) throw new Error("Lỗi kết nối Server PHP");

      this.addresses = await res.json();
      container.innerHTML = "";

      if (this.addresses.length === 0) {
        container.innerHTML = '<p class="text-center">Chưa có địa chỉ nào.</p>';
        return;
      }

      this.addresses.forEach((addr) => {
        const isDefault = addr.is_default == 1;
        const badge = isDefault
          ? `<span class="badge bg-success">Mặc định</span>`
          : `<button class="btn btn-sm text-primary" onclick="ProfileApp.setDefault(${addr.id})">Đặt làm mặc định</button>`; // Lưu ý: Bạn cần thêm API setDefault nếu muốn nút này chạy

        // Thêm nút Sửa
        const editBtn = `<button class="btn btn-sm btn-outline-primary me-2" onclick="ProfileApp.openEditModal(${addr.id})"><i class="fa-solid fa-pen"></i> Sửa</button>`;

        const html = `
            <div class="card mb-2 shadow-sm">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between">
                        <strong>${addr.recipient_name} - ${addr.recipient_phone}</strong>
                        <div>
                            ${editBtn}
                            ${badge}
                        </div>
                    </div>
                    <small>${addr.specific_address}</small>
                </div>
            </div>`;
        container.innerHTML += html;
      });
    } catch (error) {
      console.error(error);
      container.innerHTML = `<div class="alert alert-danger">Lỗi kết nối Server!</div>`;
    }
  },

  updateProfile: async function () {
    const newName = document.getElementById("inp-fullname").value;
    const newPhone = document.getElementById("inp-phone").value;
    try {
      const res = await fetch(`${CONFIG.API_URL}/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: this.user.user_id,
          full_name: newName,
          phone: newPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Cập nhật thành công!");
        this.user.full_name = newName;
        this.user.phone = newPhone;
        localStorage.setItem("user_info", JSON.stringify(this.user));
      }
    } catch (e) {
      alert("Lỗi server!");
    }
  },

  logout: function () {
    localStorage.removeItem("user_info");
    window.location.href = "../index.html";
  },
};

window.ProfileApp = ProfileApp;
window.GHNService = GHNService;

document.addEventListener("DOMContentLoaded", () => {
  ProfileApp.init();
});
