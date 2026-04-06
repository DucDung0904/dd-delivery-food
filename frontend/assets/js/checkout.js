/**
 * CHECKOUT LOGIC - FINAL FIX
 */
const CONFIG = {
  // Đảm bảo đường dẫn này đúng folder backend của bạn
  API_URL: "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api",
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const CheckoutApp = {
  user: null,
  cart: { items: [], shopId: null },
  addresses: [],
  selectedAddressId: null,
  shippingFee: 15000,

  init: async function () {
    // 1. Check Login
    try {
      const userRaw = localStorage.getItem("user_info");
      if (!userRaw) throw new Error("Chưa đăng nhập");
      this.user = JSON.parse(userRaw);

      const navName = document.getElementById("nav-user-name");
      if (navName) navName.innerText = this.user.full_name;
    } catch (e) {
      alert("Vui lòng đăng nhập để thanh toán!");
      window.location.href = "login.html";
      return;
    }

    // 2. Load Cart
    try {
      const cartRaw = localStorage.getItem("dd_food_cart");
      if (cartRaw) this.cart = JSON.parse(cartRaw);
    } catch (e) {
      localStorage.removeItem("dd_food_cart");
    }

    this.renderCartItems();

    // 3. Load Address & Init UI
    await this.loadAddresses();
    this.updateTotalSummary();
  },

  // --- RENDER ĐỊA CHỈ (Hàm quan trọng nhất để sửa lỗi hiển thị) ---
  loadAddresses: async function () {
    const userId = this.user.id || this.user.user_id;
    // Gọi file get_address.php (Đảm bảo file này đã tồn tại và đúng đường dẫn)
    const apiUrl = `${CONFIG.API_URL}/user/get_address.php?user_id=${userId}`;

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Lỗi kết nối Server");

      const rawData = await res.json();
      // Xử lý dữ liệu trả về (có thể là mảng hoặc object {data: ...})
      this.addresses = Array.isArray(rawData) ? rawData : rawData.data || [];

      this.renderAddressUI();
    } catch (e) {
      console.error("Lỗi tải địa chỉ:", e);
      const display = document.getElementById("current-address-display");
      if (display)
        display.innerHTML =
          '<p class="text-danger small">Không thể tải địa chỉ. Vui lòng thử lại.</p>';
    }
  },

  renderAddressUI: function () {
    // Tìm vùng hiển thị theo ID mới đã thêm ở Bước 2
    const displayEl = document.getElementById("current-address-display");

    if (!displayEl) return; // Nếu không tìm thấy thẻ HTML thì dừng

    if (this.addresses.length === 0) {
      displayEl.innerHTML =
        '<p class="text-muted small">Bạn chưa có địa chỉ nào. <a href="profile.html">Thêm mới</a></p>';
      this.selectedAddressId = null;
      return;
    }

    // Ưu tiên lấy địa chỉ mặc định (is_default == 1)
    let defaultAddr =
      this.addresses.find((a) => a.is_default == 1) || this.addresses[0];
    this.selectedAddressId = defaultAddr.id;

    // Render HTML đẹp mắt
    displayEl.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="me-3 pt-1"><i class="fas fa-map-marker-alt text-danger"></i></div>
                <div>
                    <div class="fw-bold text-dark">${defaultAddr.recipient_name} <span class="fw-normal text-muted">(${defaultAddr.recipient_phone})</span></div>
                    <div class="small text-secondary mt-1">${defaultAddr.specific_address}</div>
                    <div class="small text-secondary">${defaultAddr.ward_code}, ${defaultAddr.district_id}, ${defaultAddr.province_id}</div> 
                </div>
            </div>
        `;
  },

  // --- CÁC HÀM KHÁC (GIỮ NGUYÊN) ---
  renderCartItems: function () {
    const container = document.getElementById("cart-items-container");
    if (!container) return;

    if (this.cart.items.length === 0) {
      container.innerHTML = `<div class="text-center py-4">Giỏ hàng trống</div>`;
      return;
    }

    let html = "";
    this.cart.items.forEach((item, index) => {
      html += `
                <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <div class="d-flex align-items-center">
                        <img src="${
                          item.image || "assets/img/default-food.png"
                        }" style="width:50px;height:50px;object-fit:cover" class="rounded me-2">
                        <div>
                            <div class="fw-bold small">${item.name}</div>
                            <div class="text-danger small">${formatMoney(
                              item.price
                            )}</div>
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-light border px-2" onclick="CheckoutApp.updateQty(${index}, -1)">-</button>
                        <span class="mx-2 small fw-bold">${item.quantity}</span>
                        <button class="btn btn-sm btn-light border px-2" onclick="CheckoutApp.updateQty(${index}, 1)">+</button>
                        <button class="btn btn-sm text-danger ms-2" onclick="CheckoutApp.removeItem(${index})"><i class="fa fa-times"></i></button>
                    </div>
                </div>`;
    });
    container.innerHTML = html;
  },

  updateQty: function (index, change) {
    const item = this.cart.items[index];
    item.quantity += change;
    if (item.quantity < 1) item.quantity = 1;
    this.saveCart();
    this.renderCartItems();
    this.updateTotalSummary();
  },

  removeItem: function (index) {
    if (confirm("Xóa món này?")) {
      this.cart.items.splice(index, 1);
      if (this.cart.items.length === 0) this.cart.shopId = null;
      this.saveCart();
      this.renderCartItems();
      this.updateTotalSummary();
    }
  },

  saveCart: function () {
    localStorage.setItem("dd_food_cart", JSON.stringify(this.cart));
  },

  updateTotalSummary: function () {
    let subTotal = 0;
    this.cart.items.forEach((item) => (subTotal += item.price * item.quantity));

    // Cập nhật giao diện
    const subEl = document.getElementById("sub-total");
    const shipEl = document.getElementById("shipping-fee");
    const totalEl = document.getElementById("final-total"); // ID của số tổng tiền to bự

    if (subEl) subEl.innerText = formatMoney(subTotal);
    if (shipEl) shipEl.innerText = formatMoney(this.shippingFee);
    if (totalEl) totalEl.innerText = formatMoney(subTotal + this.shippingFee);
  },

  // --- GỬI ĐƠN HÀNG ---
  submitOrder: async function () {
    if (this.cart.items.length === 0) return alert("Giỏ hàng trống!");
    if (!this.selectedAddressId) return alert("Chưa có địa chỉ giao hàng!");

    const noteEl = document.getElementById("order-note");

    // Payload gửi lên PHP
    const payload = {
      user_id: this.user.id || this.user.user_id,
      restaurant_id: this.cart.shopId || 1,
      address_id: this.selectedAddressId,
      cart_items: this.cart.items,
      note: noteEl ? noteEl.value : "",
      shipping_fee: this.shippingFee,
    };

    const btn = document.getElementById("btn-confirm-order"); // ID nút "Xác nhận đặt hàng"
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
      btn.disabled = true;
    }

    try {
      const res = await fetch(`${CONFIG.API_URL}/user/create_order.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.status === "success" || data.success) {
        // Xóa giỏ hàng & thông báo
        localStorage.removeItem("dd_food_cart");
        alert("🎉 Đặt hàng thành công! Mã đơn: #" + (data.order_id || "NEW"));
        window.location.href = "tracking.html";
      } else {
        alert("Lỗi: " + (data.message || "Không xác định"));
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối Server!");
    } finally {
      if (btn) {
        btn.innerHTML =
          'XÁC NHẬN ĐẶT HÀNG <i class="fas fa-chevron-right ms-2"></i>';
        btn.disabled = false;
      }
    }
  },
};

document.addEventListener("DOMContentLoaded", function () {
  CheckoutApp.init();
});
