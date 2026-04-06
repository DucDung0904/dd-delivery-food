const API_URL = "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api/";
const GHN_TOKEN = "bd5cf8f1-ebda-11f0-aba2-4210e14e7d2d";
const GHN_API = "https://online-gateway.ghn.vn/shiip/public-api/master-data";

const LOCATION_CACHE = { provinces: [] };

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadDashboard();
  loadProvinces("pProvince");
  loadProvinces("editProvince");
  loadCategoriesForSelect("pCategory");
  loadCategoriesForSelect("editCategory");
});

// ============================================================
// 2. XỬ LÝ ĐỊA CHỈ GHN
// ============================================================
async function loadProvinces(elementId) {
  const select = document.getElementById(elementId);
  if (!select) return;
  try {
    const res = await fetch(`${GHN_API}/province`, {
      headers: { token: GHN_TOKEN, "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (json.code === 200) {
      LOCATION_CACHE.provinces = json.data;
      let html = '<option value="">-- Chọn Tỉnh/Thành --</option>';
      json.data.forEach((p) => {
        html += `<option value="${p.ProvinceID}">${p.ProvinceName}</option>`;
      });
      select.innerHTML = html;
    }
  } catch (err) {
    console.error("Lỗi GHN Province:", err);
  }
}

async function loadDistricts(provinceId, districtElId, wardElId) {
  const select = document.getElementById(districtElId);
  const wardSelect = document.getElementById(wardElId);
  select.innerHTML = '<option value="">-- Quận/Huyện --</option>';
  if (wardSelect)
    wardSelect.innerHTML = '<option value="">-- Phường/Xã --</option>';
  if (!provinceId) return;
  try {
    const res = await fetch(`${GHN_API}/district`, {
      method: "POST",
      headers: { token: GHN_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ province_id: parseInt(provinceId) }),
    });
    const json = await res.json();
    if (json.code === 200) {
      let html = '<option value="">-- Chọn Quận/Huyện --</option>';
      json.data.forEach((d) => {
        html += `<option value="${d.DistrictID}">${d.DistrictName}</option>`;
      });
      select.innerHTML = html;
    }
  } catch (err) {
    console.error("Lỗi GHN District:", err);
  }
}

async function loadWards(districtId, wardElId) {
  const select = document.getElementById(wardElId);
  if (!select) return;
  select.innerHTML = '<option value="">-- Phường/Xã --</option>';
  if (!districtId) return;
  try {
    const res = await fetch(`${GHN_API}/ward?district_id=${districtId}`, {
      headers: { token: GHN_TOKEN, "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (json.code === 200) {
      let html = '<option value="">-- Chọn Phường/Xã --</option>';
      json.data.forEach((w) => {
        html += `<option value="${w.WardCode}">${w.WardName}</option>`;
      });
      select.innerHTML = html;
    }
  } catch (err) {
    console.error("Lỗi GHN Ward:", err);
  }
}

// ============================================================
// 3. QUẢN LÝ CỬA HÀNG
// ============================================================
async function loadPartners() {
  const tbody = document.getElementById("partner-table-body");
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="8" class="text-center">Đang tải...</td></tr>';
  try {
    const res = await fetch(`${API_URL}admin/get_partners.php`);
    const json = await res.json();
    if (json.status === "success") {
      if (LOCATION_CACHE.provinces.length === 0)
        await loadProvinces("pProvince");
      tbody.innerHTML = json.data
        .map((p) => {
          const prov = LOCATION_CACHE.provinces.find(
            (i) => i.ProvinceID == p.ghn_province_id
          );
          const provinceName = prov ? prov.ProvinceName : "---";
          const lockBtn =
            p.is_active == 1
              ? `<button class="btn btn-sm btn-outline-warning" onclick="togglePartnerStatus(${p.id}, 0)"><i class="fas fa-lock"></i></button>`
              : `<button class="btn btn-sm btn-success" onclick="togglePartnerStatus(${p.id}, 1)"><i class="fas fa-lock-open"></i></button>`;
          const pStr = JSON.stringify(p)
            .replace(/'/g, "&apos;")
            .replace(/"/g, "&quot;");
          return `<tr class="${
            p.is_active == 0 ? "table-danger opacity-75" : ""
          }">
                        <td>${p.id}</td>
                        <td><strong>${p.name}</strong> ${
            p.is_active == 0
              ? '<span class="badge bg-danger">Bị khóa</span>'
              : ""
          }</td>
                        <td><small>${p.address}</small></td>
                        <td>${provinceName}</td>
                        <td><span class="badge bg-light text-dark border">${
                          p.category_name || "-"
                        }</span></td>
                        <td>${p.phone || "---"}</td><td>${p.email}</td>
                        <td><div class="d-flex gap-1"><button class="btn btn-sm btn-outline-primary" onclick='openEditPartner(${pStr})'><i class="fas fa-edit"></i></button>${lockBtn}</div></td>
                    </tr>`;
        })
        .join("");
    }
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

window.openEditPartner = async function (p) {
  document.getElementById("editPartnerId").value = p.id;
  document.getElementById("editStoreName").value = p.name;
  document.getElementById("editAddress").value = p.address;
  document.getElementById("editPhone").value = p.phone || "";

  await loadCategoriesForSelect("editCategory");
  document.getElementById("editCategory").value = p.category_id;

  if (p.ghn_province_id) {
    document.getElementById("editProvince").value = p.ghn_province_id;
    await loadDistricts(p.ghn_province_id, "editDistrict", "editWard");
    document.getElementById("editDistrict").value = p.ghn_district_id;
    await loadWards(p.ghn_district_id, "editWard");
    document.getElementById("editWard").value = p.ghn_ward_code;
  }
  new bootstrap.Modal(document.getElementById("modalEditPartner")).show();
};

document
  .getElementById("formEditPartner")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append(
      "ghn_province_id",
      document.getElementById("editProvince").value
    );
    formData.append(
      "ghn_district_id",
      document.getElementById("editDistrict").value
    );
    formData.append("ghn_ward_code", document.getElementById("editWard").value);

    try {
      const res = await fetch(`${API_URL}admin/update_partner.php`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.status === "success") {
        alert(json.message);
        bootstrap.Modal.getInstance(
          document.getElementById("modalEditPartner")
        ).hide();
        loadPartners();
      } else alert(json.message);
    } catch (err) {
      alert("Lỗi kết nối server!");
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  const formPartner = document.getElementById("formPartner");
  if (formPartner) {
    formPartner.addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("SUBMIT FORM PARTNER OK"); // 👈 để test

      const storeName = document.getElementById("pStoreName").value.trim();
      const email = document.getElementById("pEmail").value.trim();

      if (!storeName || !email) {
        alert("Vui lòng nhập Tên quán và Email!");
        return;
      }

      const btn = this.querySelector("button[type=submit]");
      btn.disabled = true;

      const formData = new FormData(this);
      formData.set("store_name", storeName);
      formData.set("email", email);
      formData.append(
        "ghn_province_id",
        document.getElementById("pProvince").value
      );
      formData.append(
        "ghn_district_id",
        document.getElementById("pDistrict").value
      );
      formData.append("ghn_ward_code", document.getElementById("pWard").value);

      fetch(`${API_URL}admin/create_partner.php`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((res) => {
          console.log("API RESPONSE:", res);
          if (res.status === "success") {
            alert(res.message);
            bootstrap.Modal.getInstance(
              document.getElementById("modalPartner")
            ).hide();
            this.reset();
            loadPartners();
          } else {
            alert(res.message);
          }
        })
        .catch((err) => {
          console.error(err);
          alert("Lỗi kết nối server!");
        })
        .finally(() => (btn.disabled = false));
    });
  }
});

async function loadUsers() {
  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';

  try {
    const res = await fetch(`${API_URL}admin/get_users.php`);
    const json = await res.json();

    if (json.status === "success") {
      tbody.innerHTML = json.data
        .map(
          (u) => `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.full_name}</td>
                    <td>${u.email}</td>
                    <td>${u.phone || "---"}</td>
                    <td>${new Date(u.created_at).toLocaleDateString(
                      "vi-VN"
                    )}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${
                          u.id
                        })">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `
        )
        .join("");
    }
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">Lỗi tải dữ size</td></tr>';
  }
}

async function loadOrders() {
  const tbody = document.getElementById("orders-table-body");
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';

  try {
    const res = await fetch(`${API_URL}admin/get_orders.php`);
    const json = await res.json();

    if (json.status === "success") {
      tbody.innerHTML = json.data
        .map((o) => {
          let statusBadge = "";
          switch (o.status) {
            case "pending":
              statusBadge = '<span class="badge bg-warning">Chờ xử lý</span>';
              break;
            case "completed":
              statusBadge = '<span class="badge bg-success">Hoàn thành</span>';
              break;
            case "cancelled":
              statusBadge = '<span class="badge bg-danger">Đã hủy</span>';
              break;
            default:
              statusBadge = `<span class="badge bg-secondary">${o.status}</span>`;
          }

          return `
                    <tr>
                        <td>#${o.id}</td>
                        <td>${o.customer_name}</td>
                        <td>${o.restaurant_name}</td>
                        <td>${new Date(o.created_at).toLocaleString(
                          "vi-VN"
                        )}</td>
                        <td><strong>${formatMoney(o.total_amount)}</strong></td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
        })
        .join("");
    }
  } catch (err) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">Lỗi tải dữ liệu đơn hàng</td></tr>';
  }
}

async function loadCategoriesForSelect(elementId) {
  const select = document.getElementById(elementId);
  if (!select) return;
  try {
    const response = await fetch(
      `${API_URL}public/get_restaurant_categories.php`
    );
    const json = await response.json();
    if (json.status === "success") {
      let html = '<option value="">-- Chọn loại hình --</option>';
      json.data.forEach((cat) => {
        html += `<option value="${cat.id}">${cat.name}</option>`;
      });
      select.innerHTML = html;
    }
  } catch (e) {
    select.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
  }
}

window.togglePartnerStatus = async function (id, status) {
  if (
    !confirm(
      `Bạn chắc chắn muốn ${status === 0 ? "KHÓA" : "MỞ KHÓA"} cửa hàng này?`
    )
  )
    return;
  try {
    const res = await fetch(`${API_URL}admin/toggle_partner_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json();
    if (json.status === "success") loadPartners();
    else alert(json.message);
  } catch (err) {
    alert("Lỗi kết nối!");
  }
};

function previewImageEdit(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("previewImageEdit").src = e.target.result;
      document.getElementById("previewContainerEdit").style.display = "block";
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function switchView(viewId, element) {
  // 1. Ẩn tất cả các view và bỏ class active ở menu
  document
    .querySelectorAll(".content-view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((i) => i.classList.remove("active"));

  // 2. Hiện view được chọn và thêm active vào menu
  document.getElementById("view-" + viewId).classList.add("active");
  element.classList.add("active");

  // 3. Tự động gọi hàm load dữ liệu tương ứng
  if (viewId === "orders") loadOrders();
  if (viewId === "users") loadUsers();
  if (viewId === "partners") loadPartners();
}

function checkAuth() {
  const userStr = localStorage.getItem("user_info");
  if (!userStr) {
    window.location.href = "../../pages/login.html";
    return;
  }
  const user = JSON.parse(userStr);
  if (user.role !== "admin") window.location.href = "../../index.html";
  const nameEl = document.querySelector(".profile-box .name");
  if (nameEl) nameEl.textContent = user.full_name || "Admin";
}

function loadDashboard() {
  fetch(`${API_URL}admin/dashboard_stats.php`)
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "success") {
        const d = res.data;
        if (document.getElementById("stat-today"))
          document.getElementById("stat-today").textContent =
            d.orders_today || 0;
        if (document.getElementById("stat-revenue"))
          document.getElementById("stat-revenue").textContent = formatMoney(
            d.revenue_week || 0
          );
        if (document.getElementById("stat-partners"))
          document.getElementById("stat-partners").textContent =
            d.total_partners || 0;
        if (document.getElementById("stat-users"))
          document.getElementById("stat-users").textContent = d.new_users || 0;
      }
    });
}

function logout() {
  localStorage.removeItem("user_info");
  window.location.href = "../../pages/login.html";
}
function formatMoney(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
