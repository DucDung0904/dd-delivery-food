/* assets/js/restaurant.js - Cleaned & Fixed CORS */

const API_URL =
  "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api/restaurant";
const IMG_BASE = "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/uploads/";
let CURRENT_RES_ID = null;

let ORDER_POLLING_INTERVAL = null; // Biến lưu vòng lặp tự động
let ALL_ORDERS = []; // Lưu trữ tạm danh sách đơn để lọc

document.addEventListener("DOMContentLoaded", () => {
  checkOwnerAuth();
});

// ============================================================
// 1. XÁC THỰC & LẤY THÔNG TIN
// ============================================================
function checkOwnerAuth() {
  const userStr = localStorage.getItem("user_info");
  if (!userStr) {
    window.location.href = "../../pages/login.html";
    return;
  }
  const user = JSON.parse(userStr);

  fetch(`${API_URL}/get_my_restaurant.php?user_id=${user.id}`)
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "success") {
        CURRENT_RES_ID = res.data.id;

        // Header Info
        document
          .querySelectorAll(".shop-name")
          .forEach((el) => (el.textContent = res.data.name));
        const avatar = document.getElementById("shop-avatar");
        if (avatar && res.data.image) avatar.src = formatImgUrl(res.data.image);

        // Header Toggle Status
        const isOpen = res.data.is_open == 1;
        updateHeaderStatus(isOpen);

        // Load Menu
        loadProducts();
      } else {
        alert("Tài khoản này chưa đăng ký cửa hàng!");
      }
    })
    .catch((err) => console.error("Lỗi Auth:", err));
}

function logout() {
  if (confirm("Đăng xuất?")) {
    localStorage.removeItem("user_info");
    window.location.href = "../../pages/login.html";
  }
}

// ============================================================
function switchTab(tabId) {
  // 1. Reset UI: Ẩn tất cả nội dung, bỏ active
  document
    .querySelectorAll(".nav-link")
    .forEach((el) => el.classList.remove("active"));
  const navEl = document.getElementById(`nav-${tabId}`);
  if (navEl) navEl.classList.add("active");

  document
    .querySelectorAll(".content-section")
    .forEach((el) => (el.style.display = "none"));

  // 2. Hiện Tab được chọn
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) targetTab.style.display = "block";

  // 3. XỬ LÝ LOGIC RIÊNG TỪNG TAB
  if (tabId === "menu") {
    switchMenuSubTab("list");
  } else if (tabId === "settings") {
    loadStoreSettings();
  }
  // --- KẾT NỐI VỚI FILE ĐƠN HÀNG MỚI ---
  else if (tabId === "orders") {
    if (typeof OrderManager !== "undefined") {
      console.log("Đang gọi OrderManager từ file restaurant_orders.js...");
      OrderManager.init(); // <--- DÒNG QUAN TRỌNG NHẤT
    } else {
      console.error("Lỗi: Chưa load được file restaurant_orders.js");
    }
  }

  // 4. Dừng auto-refresh khi rời tab Đơn hàng
  if (tabId !== "orders" && typeof OrderManager !== "undefined") {
    OrderManager.stop();
  }
}

function switchMenuSubTab(subTabId) {
  document
    .querySelectorAll(".sub-nav-item")
    .forEach((el) => el.classList.remove("active"));
  let targetId =
    subTabId === "list" || subTabId === "add"
      ? "sub-tab-list"
      : "sub-tab-category";
  document.getElementById(targetId)?.classList.add("active");

  document.getElementById("view-product-list").style.display = "none";
  document.getElementById("view-add-product").style.display = "none";
  document.getElementById("view-category").style.display = "none";

  if (subTabId === "list") {
    document.getElementById("view-product-list").style.display = "block";
    loadProducts();
  } else if (subTabId === "add") {
    document.getElementById("view-add-product").style.display = "block";
    loadCategoriesToSelect();
  } else if (subTabId === "category") {
    document.getElementById("view-category").style.display = "block";
    loadCategoryList();
  }
}

// ============================================================
// 3. CÀI ĐẶT & TRẠNG THÁI (FIXED)
// ============================================================

function loadStoreSettings() {
  if (!CURRENT_RES_ID) return;

  fetch(`${API_URL}/get_restaurant_details.php?id=${CURRENT_RES_ID}`)
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "success") {
        const data = res.data;

        // Fill Form
        document.getElementById("setStoreName").value = data.name || "";
        document.getElementById("setStorePhone").value = data.phone || "";
        document.getElementById("setStoreAddress").value = data.address || "";
        document.getElementById("setStoreOpenTime").value =
          data.open_time || "";
        document.getElementById("setStoreDesc").value = data.description || "";

        // Logo
        if (data.image) {
          document.getElementById("settingLogoPreview").src = formatImgUrl(
            data.image
          );
        }

        // Trạng thái
        const isOpen = data.is_open == 1;
        document.getElementById("storeStatusToggle").checked = isOpen;
        updateRealtimeStatusUI(isOpen ? "open" : "closed");
      }
    })
    .catch((err) => console.error("Lỗi Settings:", err));
}

// --- HÀM GẠT NÚT ---
function toggleStoreStatus() {
  const toggle = document.getElementById("storeStatusToggle");
  const isChecked = toggle.checked;
  const statusValue = isChecked ? 1 : 0;

  if (!CURRENT_RES_ID) {
    alert("Lỗi: Chưa lấy được ID cửa hàng.");
    toggle.checked = !isChecked;
    return;
  }

  console.log(`Đang gửi: StoreID=${CURRENT_RES_ID}, Status=${statusValue}`);

  fetch(`${API_URL}/update_store_status.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      store_id: CURRENT_RES_ID,
      is_open: statusValue,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server Error ${response.status}: ${text}`);
      }
      return response.json();
    })
    .then((res) => {
      console.log("Server Response:", res);
      if (res.status === "success") {
        updateRealtimeStatusUI(isChecked ? "open" : "closed");
        updateHeaderStatus(isChecked);
      } else {
        alert("Lỗi cập nhật: " + res.message);
        toggle.checked = !isChecked;
      }
    })
    .catch((err) => {
      console.error("Fetch Error:", err);
      alert("Lỗi kết nối Server! Vui lòng kiểm tra file PHP.");
      toggle.checked = !isChecked;
    });
}

function quickToggleStatus(el) {
  const settingToggle = document.getElementById("storeStatusToggle");
  if (settingToggle) settingToggle.checked = el.checked;
  toggleStoreStatus();
}

function updateRealtimeStatusUI(status) {
  const badge = document.getElementById("realtimeStatusBadge");
  const helperText = document.getElementById("statusHelperText");
  const statusCard = document.querySelector(".card-status-accent");

  if (status === "open") {
    badge.className = "badge rounded-pill px-4 py-2 fs-6 shadow-sm bg-success";
    badge.innerHTML = '<i class="fas fa-check-circle me-2"></i>ĐANG MỞ CỬA';
    helperText.innerHTML =
      '<span class="text-success">Khách hàng có thể đặt món.</span>';
    if (statusCard) statusCard.style.borderTop = "4px solid #198754";
  } else {
    badge.className = "badge rounded-pill px-4 py-2 fs-6 shadow-sm bg-danger";
    badge.innerHTML = '<i class="fas fa-store-slash me-2"></i>ĐANG ĐÓNG CỬA';
    helperText.innerHTML =
      '<span class="text-danger">Đã tạm ngưng nhận đơn.</span>';
    if (statusCard) statusCard.style.borderTop = "4px solid #dc3545";
  }
}

function updateHeaderStatus(isOpen) {
  const headerToggle = document.getElementById("headerStatusSwitch");
  const headerLabel = document.getElementById("headerStatusLabel");
  if (headerToggle) headerToggle.checked = isOpen;
  if (headerLabel) {
    headerLabel.textContent = isOpen ? "Đang mở cửa" : "Đóng cửa";
    headerLabel.className = isOpen
      ? "form-check-label small fw-bold text-success"
      : "form-check-label small fw-bold text-secondary";
  }
}
async function saveStoreProfile() {
  const btn = document.getElementById("btnSaveSettings"); // ID đúng: btnSaveSettings

  // Hiệu ứng Loading
  const originalText = btn.innerHTML;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm"></span> Đang lưu...';
  btn.disabled = true;

  try {
    // 1. Lấy dữ liệu từ các ô Input (Sử dụng đúng ID trong HTML mới)
    const name = document.getElementById("setStoreName").value; // HTML: setStoreName
    const phone = document.getElementById("setStorePhone").value; // HTML: setStorePhone
    const openTime = document.getElementById("setStoreOpenTime").value; // HTML: setStoreOpenTime
    const address = document.getElementById("setStoreAddress").value; // HTML: setStoreAddress
    const description = document.getElementById("setStoreDesc").value; // HTML: setStoreDesc

    // Lấy trạng thái từ nút gạt
    const isOpen = document.getElementById("storeStatusToggle").checked; // HTML: storeStatusToggle

    // Lấy file ảnh
    const imageFile = document.getElementById("uploadLogoInput").files[0]; // HTML: uploadLogoInput

    // 2. Đóng gói vào FormData
    const formData = new FormData();
    formData.append("id", CURRENT_RES_ID);
    formData.append("name", name);
    formData.append("address", address);
    formData.append("open_time", openTime);
    formData.append("description", description);
    // Chuyển boolean true/false sang 1/0 để PHP dễ xử lý
    formData.append("is_open", isOpen ? 1 : 0);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    // 3. Gửi lên Server
    const res = await fetch(`${API_URL}/update_profile.php`, {
      // Đảm bảo đường dẫn API đúng (update_profile.php nằm trong folder restaurant)
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (json.status === "success") {
      alert("✅ Cập nhật thông tin cửa hàng thành công!");

      // Cập nhật lại ảnh hiển thị ngay lập tức nếu có upload ảnh mới
      if (json.image) {
        document.getElementById("settingLogoPreview").src = formatImgUrl(
          json.image
        );
        // Cập nhật luôn avatar trên góc phải header
        const headerAvatar = document.getElementById("shop-avatar");
        if (headerAvatar) headerAvatar.src = formatImgUrl(json.image);
      }

      // Cập nhật tên trên header
      document
        .querySelectorAll(".shop-name")
        .forEach((el) => (el.textContent = name));
    } else {
      alert("❌ Lỗi: " + json.message);
    }
  } catch (e) {
    console.error(e);
    alert("❌ Lỗi kết nối server! Vui lòng kiểm tra Console (F12).");
  } finally {
    // Reset nút bấm về trạng thái cũ
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ============================================================
// 4. HÀM HỖ TRỢ & MÓN ĂN
// ============================================================

function formatImgUrl(img) {
  if (!img || img === "") return "https://via.placeholder.com/150";
  return img.startsWith("http") ? img : IMG_BASE + img;
}

function previewSettingImage(input, imgId) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById(imgId).src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function loadProducts() {
  if (!CURRENT_RES_ID) return;
  const tbody = document.getElementById("product-list-body");
  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center">Đang tải...</td></tr>';

  fetch(
    `${API_URL}/get_products.php?restaurant_id=${CURRENT_RES_ID}&t=${Date.now()}`
  )
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "success") {
        const products = res.data;
        document.getElementById("stat-total-products").textContent =
          products.length;
        document.getElementById("stat-active-products").textContent =
          products.filter((p) => p.is_active == 1).length;

        if (products.length === 0) {
          tbody.innerHTML =
            '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có món ăn nào</td></tr>';
          return;
        }

        tbody.innerHTML = products
          .map((p) => {
            const price = parseInt(p.price).toLocaleString("vi-VN");
            const statusBadge =
              p.is_active == 1
                ? '<span class="badge bg-success-subtle text-success border">Đang bán</span>'
                : '<span class="badge bg-secondary-subtle text-secondary border">Tạm ẩn</span>';
            const pStr = JSON.stringify(p)
              .replace(/'/g, "&#39;")
              .replace(/"/g, "&quot;");

            return `<tr>
                    <td><img src="${formatImgUrl(
                      p.image
                    )}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
                    <td class="fw-bold">${p.name}</td>
                    <td><span class="badge bg-light text-dark border fw-normal">${
                      p.category_name || "-"
                    }</span></td>
                    <td class="text-primary fw-bold">${price}đ</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick='openEditProductModal(${pStr})'><i class="fas fa-edit"></i></button>
                    </td>
                </tr>`;
          })
          .join("");
      }
    });
}

function submitAddProduct() {
  const form = document.getElementById("addProductForm");
  const formData = new FormData(form);
  formData.append("restaurant_id", CURRENT_RES_ID);
  formData.append(
    "is_active",
    document.getElementById("activeSwitch").checked ? 1 : 0
  );

  fetch(`${API_URL}/add_product.php`, { method: "POST", body: formData })
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "success") {
        alert("Thêm thành công!");
        form.reset();
        document.getElementById("imgPreview").style.display = "none";
        document.getElementById("uploadPlaceholder").style.display = "block";
        switchMenuSubTab("list");
      } else alert(res.message);
    });
}

function loadCategoryList() {
  if (!CURRENT_RES_ID) return;
  fetch(`${API_URL}/get_categories.php?restaurant_id=${CURRENT_RES_ID}`)
    .then((res) => res.json())
    .then((res) => {
      const tbody = document.getElementById("category-list-body");
      document.getElementById("stat-categories").textContent =
        res.status === "success" ? res.data.length : 0;

      if (res.status === "success" && res.data.length > 0) {
        tbody.innerHTML = res.data
          .map(
            (c) => `
                <tr>
                    <td>${c.name}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`
          )
          .join("");
      } else {
        tbody.innerHTML =
          '<tr><td colspan="2" class="text-center">Chưa có danh mục</td></tr>';
      }
    });
}

function submitAddCategory() {
  const name = document.getElementById("newCategoryName").value.trim();
  if (!name) return alert("Vui lòng nhập tên danh mục");
  fetch(`${API_URL}/category_actions.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create",
      restaurant_id: CURRENT_RES_ID,
      name: name,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "success") {
        document.getElementById("newCategoryName").value = "";
        loadCategoryList();
      } else alert(res.message);
    });
}

function deleteCategory(id) {
  if (!confirm("Xóa danh mục này?")) return;
  fetch(`${API_URL}/category_actions.php`, {
    method: "POST",
    body: JSON.stringify({ action: "delete", id: id }),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "success") loadCategoryList();
    });
}

function loadCategoriesToSelect() {
  loadCategoriesToSelectElement("formCategorySelect");
}

function loadCategoriesToSelectElement(elementId, selectedId = null) {
  if (!CURRENT_RES_ID) return;
  fetch(`${API_URL}/get_categories.php?restaurant_id=${CURRENT_RES_ID}`)
    .then((res) => res.json())
    .then((res) => {
      const select = document.getElementById(elementId);
      let html =
        elementId === "editCategory"
          ? ""
          : '<option value="">-- Chọn danh mục --</option>';
      if (res.status === "success") {
        res.data.forEach((c) => {
          const isSelected = selectedId == c.id ? "selected" : "";
          html += `<option value="${c.id}" ${isSelected}>${c.name}</option>`;
        });
      }
      select.innerHTML = html;
    });
}

function openEditProductModal(product) {
  document.getElementById("editProdId").value = product.id;
  document.getElementById("editName").value = product.name;
  document.getElementById("editPrice").value = product.price;
  document.getElementById("editDesc").value = product.description || "";
  document.getElementById("editActive").checked = product.is_active == 1;
  document.getElementById("displayEditName").textContent = product.name;
  document.getElementById("displayEditCat").textContent =
    product.category_name || "-";
  document.getElementById("editImgPreview").src = formatImgUrl(product.image);
  loadCategoriesToSelectElement("editCategory", product.category_id);
  new bootstrap.Modal(document.getElementById("editProductModal")).show();
}

function previewEditImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) =>
      (document.getElementById("editImgPreview").src = e.target.result);
    reader.readAsDataURL(input.files[0]);
  }
}

function submitEditProduct() {
  const form = document.getElementById("editProductForm");
  const formData = new FormData(form);
  formData.set(
    "is_active",
    document.getElementById("editActive").checked ? "1" : "0"
  );
  fetch(`${API_URL}/update_product.php`, { method: "POST", body: formData })
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "success") {
        alert("Cập nhật thành công!");
        bootstrap.Modal.getInstance(
          document.getElementById("editProductModal")
        ).hide();
        loadProducts();
      } else alert(res.message);
    });
}

function deleteProductFromEdit() {
  if (confirm("Xóa vĩnh viễn món này?")) {
    const id = document.getElementById("editProdId").value;
    fetch(`${API_URL}/delete_product.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          alert("Đã xóa món ăn.");
          bootstrap.Modal.getInstance(
            document.getElementById("editProductModal")
          ).hide();
          loadProducts();
        } else alert("Lỗi xóa: " + res.message);
      });
  }
}

function showAddProductForm() {
  switchMenuSubTab("add");
}

function previewImage(input) {
  const preview = document.getElementById("imgPreview");
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = "block";
      document.getElementById("uploadPlaceholder").style.display = "none";
    };
    reader.readAsDataURL(input.files[0]);
  }
}
