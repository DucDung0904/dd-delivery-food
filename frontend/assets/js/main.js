const CONFIG = {
  // Dựa vào ảnh của bạn, đường dẫn gốc phải là như thế này:
  API_BASE: "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api",
  IMG_BASE: "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/uploads/",
  CART_KEY: "dd_food_cart",
  USER_KEY: "user_info",
};

document.addEventListener("DOMContentLoaded", () => {
  Auth.init();
  Restaurant.init(); // Quan trọng: Gọi hàm tải danh sách
  Location.init();
  Checkout.init();
});

/* --- 1. AUTH MODULE --- */
const Auth = {
  user: null,
  init() {
    const userStr = localStorage.getItem(CONFIG.USER_KEY);
    if (userStr) {
      this.user = JSON.parse(userStr);
      this.renderUser();
    } else {
      this.renderGuest();
    }
  },
  renderUser() {
    const uNode = document.getElementById("user-actions");
    const gNode = document.getElementById("guest-actions");
    if (gNode) gNode.style.display = "none";
    if (uNode) {
      uNode.style.display = "flex";
      document.getElementById("display-username").textContent =
        this.user.full_name || "User";
      const avatar = document.querySelector(".user-avatar");
      if (avatar) avatar.innerHTML = "U";
    }
  },
  renderGuest() {
    const uNode = document.getElementById("user-actions");
    const gNode = document.getElementById("guest-actions");
    if (gNode) gNode.style.display = "flex";
    if (uNode) uNode.style.display = "none";
  },
  logout() {
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.reload();
  },
};

/* --- 2. RESTAURANT MODULE (FIX LỖI QUAY TRÒN) --- */
const Restaurant = {
  container: document.getElementById("restaurant-list"), // Phải khớp ID trong HTML

  init() {
    if (this.container) {
      this.fetchList();
    } else {
      console.error(
        "LỖI: Không tìm thấy thẻ có id='restaurant-list' trong HTML"
      );
    }
  },

  fetchList() {
    // 1. URL chính xác dựa trên ảnh bạn gửi
    const apiUrl = `${CONFIG.API_BASE}/public/get_restaurants.php`;

    console.log("Đang gọi API:", apiUrl); // Kiểm tra Console xem link này đúng chưa

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi HTTP: ${res.status}`);
        return res.json();
      })
      .then((res) => {
        console.log("Dữ liệu nhận được:", res); // Xem dữ liệu trong Console

        this.container.innerHTML = ""; // Xóa spinner loading

        if (res.status === "success" && res.data && res.data.length > 0) {
          // Render dữ liệu
          const html = res.data
            .map((shop) => {
              // Xử lý ảnh (Khớp với dữ liệu JSON của bạn)
              let imgUrl = "assets/images/default-res.png";
              if (shop.image && shop.image !== "") {
                // Kiểm tra xem ảnh có http chưa, nếu chưa thì nối chuỗi
                imgUrl = shop.image.startsWith("http")
                  ? shop.image
                  : CONFIG.IMG_BASE + shop.image;
              }

              return `
              <div class="horizontal-card" onclick="window.location.href='pages/menu.html?id=${
                shop.id
              }'">
                  <div class="card-img-wrapper">
                      <img src="${imgUrl}" onerror="this.src='assets/images/default-res.png'">
                      ${
                        shop.is_open == 0
                          ? '<span class="badge-closed">Đóng cửa</span>'
                          : ""
                      }
                  </div>
                  <div class="card-body">
                      <div class="res-name">${shop.name}</div>
                      <div class="res-address">${shop.address}</div>
                      <div class="res-info">
                        <i class="fas fa-star text-warning"></i> 4.5 • 
                        <i class="fas fa-clock"></i> ${
                          shop.open_time || "07:00"
                        }
                      </div>
                  </div>
              </div>`;
            })
            .join("");

          this.container.innerHTML = html;
        } else {
          this.container.innerHTML = `<p class="text-center">Không có dữ liệu quán ăn.</p>`;
        }
      })
      .catch((err) => {
        console.error("Lỗi Fetch:", err);
        this.container.innerHTML = `
            <div style="color: red; text-align: center; padding: 20px;">
                Lỗi tải dữ liệu!<br>
                <small>${err.message}</small>
            </div>`;
      });
  },
};

/* --- 3. CHECKOUT MODULE --- */
const Checkout = {
  modal: document.getElementById("checkout-modal"),

  init() {
    if (!this.modal) return;

    const closeBtn = this.modal.querySelector(".close-checkout-btn"); // Thêm class này vào nút đóng trong HTML
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    const addressSelect = document.getElementById("saved-address-select");
    if (addressSelect)
      addressSelect.addEventListener("change", () => this.toggleAddressInput());

    const submitBtn = document.getElementById("btn-submit-order"); // Thêm ID này vào nút Submit trong HTML
    if (submitBtn) submitBtn.addEventListener("click", () => this.submit());

    window.openCheckout = () => this.open();
  },

  open() {
    const cartJson = localStorage.getItem(CONFIG.CART_KEY);
    const cart = cartJson ? JSON.parse(cartJson) : null;

    if (!cart || !cart.items || cart.items.length === 0)
      return alert("Giỏ hàng trống!");
    if (!Auth.user) {
      alert("Vui lòng đăng nhập để đặt hàng");
      return (window.location.href = "pages/login.html");
    }

    // UI Updates...
    document.getElementById("checkout-res-name").textContent =
      cart.restaurant_name;
    const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    document.getElementById("checkout-total").textContent =
      total.toLocaleString() + "₫";

    // Address Logic
    const select = document.getElementById("saved-address-select");
    select.innerHTML = '<option value="new">-- Nhập địa chỉ mới --</option>';
    if (Auth.user.addresses && Auth.user.addresses.length > 0) {
      Auth.user.addresses.forEach((addr) => {
        const opt = document.createElement("option");
        opt.value = addr.address_line;
        opt.textContent = addr.address_line;
        select.appendChild(opt);
      });
      select.value = Auth.user.addresses[0].address_line;
    }
    this.toggleAddressInput();

    this.modal.style.display = "flex";
    if (window.Cart) window.Cart.close();
  },

  close() {
    this.modal.style.display = "none";
  },

  toggleAddressInput() {
    const val = document.getElementById("saved-address-select").value;
    const group = document.getElementById("new-address-group");
    const input = document.getElementById("checkout-address");

    if (val === "new") {
      group.style.display = "block";
      input.value = "";
      input.focus();
    } else {
      group.style.display = "none";
      input.value = val;
    }
  },

  submit() {
    const address = document.getElementById("checkout-address").value.trim();
    const note = document.getElementById("checkout-note").value.trim();
    const phone = Auth.user.phone || "0900000000";

    if (!address) return alert("Vui lòng nhập địa chỉ!");

    const cart = JSON.parse(localStorage.getItem(CONFIG.CART_KEY));
    const total = cart.items.reduce((s, i) => s + i.price * i.qty, 0);

    const payload = {
      user_id: Auth.user.id || Auth.user.user_id,
      restaurant_id: cart.restaurant_id,
      total_amount: total,
      delivery_address: address,
      customer_phone: phone,
      note: note,
      cart_items: cart.items,
    };

    const submitBtn = document.getElementById("btn-submit-order");
    if (submitBtn) submitBtn.disabled = true;

    fetch(`${CONFIG.API_BASE}/public/create_order.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Đặt hàng thành công! Mã đơn: " + data.order_id);
          if (window.Cart) window.Cart.reset();
          this.close();
        } else {
          alert("Lỗi: " + data.message);
        }
      })
      .catch((err) => alert("Lỗi kết nối Server."))
      .finally(() => {
        if (submitBtn) submitBtn.disabled = false;
      });
  },
};

/* --- 4. LOCATION MODULE --- */
const Location = {
  input: document.getElementById("address-input"),
  suggestionBox: document.getElementById("address-suggestions"),
  timeout: null,

  init() {
    if (!this.input) return; // Nếu không có ô input thì bỏ qua

    const saved = sessionStorage.getItem("current_address");
    if (saved) this.input.value = saved;

    this.input.addEventListener("input", (e) => {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.search(e.target.value), 500);
    });

    // Sự kiện click ra ngoài để đóng gợi ý
    document.addEventListener("click", (e) => {
      if (
        !this.input.contains(e.target) &&
        !this.suggestionBox.contains(e.target)
      ) {
        this.suggestionBox.style.display = "none";
      }
    });

    // Bind nút lấy vị trí hiện tại (nếu có)
    const geoBtn = document.getElementById("btn-geo-location");
    if (geoBtn) geoBtn.addEventListener("click", () => this.getCurrent());
  },

  // Các hàm search, getCurrent giữ nguyên logic cũ...
  search(query) {
    /* ... */
  },
  getCurrent() {
    /* ... */
  },
};

/* --- 5. GLOBAL UI & BINDING (MỚI) --- */
const GlobalUI = {
  init() {
    // Dropdown User Menu
    const userToggle = document.getElementById("user-menu-toggle"); // Cần thêm ID vào avatar
    const userDropdown = document.getElementById("user-dropdown");

    if (userToggle && userDropdown) {
      userToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("show");
      });
      // Click ra ngoài thì đóng menu
      document.addEventListener("click", (e) => {
        if (!userToggle.contains(e.target))
          userDropdown.classList.remove("show");
      });
    }

    // Scroll Buttons (Next/Prev)
    const prevBtn = document.getElementById("scroll-prev");
    const nextBtn = document.getElementById("scroll-next");
    const list = document.getElementById("restaurant-list");

    if (prevBtn && list)
      prevBtn.addEventListener("click", () =>
        list.scrollBy({ left: -300, behavior: "smooth" })
      );
    if (nextBtn && list)
      nextBtn.addEventListener("click", () =>
        list.scrollBy({ left: 300, behavior: "smooth" })
      );
  },
};

window.submitOrder = function () {
  // 1. Lấy dữ liệu form
  const address = document.getElementById("checkout-address").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const note = document.getElementById("checkout-note").value.trim();

  if (!address || !phone) {
    alert("Vui lòng điền địa chỉ và số điện thoại!");
    return;
  }

  // 2. Lấy dữ liệu LocalStorage
  const cartData = JSON.parse(localStorage.getItem("dd_food_cart"));
  const userData = JSON.parse(localStorage.getItem("user_info"));

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    alert("Giỏ hàng trống!");
    return;
  }

  if (!userData || !userData.user_id) {
    alert("Vui lòng đăng nhập lại!");
    window.location.href = "pages/login.html";
    return;
  }

  // 3. Chuẩn bị Payload (Dữ liệu gửi lên API)
  // Lưu ý: Chỉ gửi ID và số lượng món, giá sẽ do Backend tự tính
  const payload = {
    user_id: userData.user_id,
    shop_id: cartData.shopId || cartData.restaurant_id, // Đảm bảo lấy đúng shop ID
    customer_info: {
      address: address,
      phone: phone,
      note: note,
    },
    items: cartData.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    })),
  };

  // 4. Gửi Request
  const btn = document.querySelector("#checkout-modal .btn-primary");
  const originalText = btn.textContent;
  btn.textContent = "Đang xử lý...";
  btn.disabled = true;

  fetch(
    "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api/public/create_order.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Đặt hàng thành công! Mã đơn: #" + data.order_id);
        if (window.Cart) window.Cart.reset(); // Xóa giỏ hàng
        window.closeCheckout(); // Đóng modal
      } else {
        alert("Lỗi: " + data.message);
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Lỗi kết nối server.");
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
};

window.logout = () => Auth.logout();
window.toggleUserMenu = () =>
  document.getElementById("user-dropdown")?.classList.toggle("show");
window.scrollRestaurants = (d) =>
  document
    .getElementById("restaurant-list")
    ?.scrollBy({ left: d * 300, behavior: "smooth" });
