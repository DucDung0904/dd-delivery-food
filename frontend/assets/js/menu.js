/* ============================================================
 * FILE: assets/js/menu.js
 * NHIỆM VỤ: Load Menu, Render & Xử lý ScrollSpy Danh mục
 * ============================================================ */

const API_BASE = "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api";
const IMG_BASE = "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/uploads/";
const CART_KEY = "dd_food_cart";
const USER_KEY = "user_info";

const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get("id");

let currentShopName = "";
let isShopOpen = false;
let cart = { shopId: null, shopName: "", items: [] };

document.addEventListener("DOMContentLoaded", () => {
  if (!shopId) {
    alert("Không tìm thấy quán!");
    window.location.href = "../index.html";
    return;
  }

  localStorage.setItem("current_restaurant_id", shopId);

  loadShopMenu();
  initCart();

  // Sự kiện lướt trang để active danh mục (ScrollSpy)
  window.addEventListener("scroll", highlightActiveTab);
});

// --- 1. TẢI & RENDER MENU ---
function loadShopMenu() {
  fetch(`${API_BASE}/user/get_public_menu.php?id=${shopId}&t=${Date.now()}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        renderShopInfo(data.shop);
        renderMenu(data.menu);
        highlightSelectedItems(); // Đánh dấu món đã chọn
      } else {
        document.getElementById(
          "menu-container"
        ).innerHTML = `<div class="text-center py-5 text-muted">${data.message}</div>`;
      }
    })
    .catch((err) => console.error(err));
}

function renderShopInfo(shop) {
  document.title = shop.name;
  document.getElementById("res-name").textContent = shop.name;
  document.getElementById("res-address").textContent = shop.address;
  document.getElementById("res-time").textContent = shop.open_time;

  let img = shop.image
    ? shop.image.startsWith("http")
      ? shop.image
      : IMG_BASE + shop.image
    : "../assets/images/default-store.png";
  document.getElementById("res-avatar").src = img;

  currentShopName = shop.name;
  isShopOpen = shop.is_open_now;

  const badge = document.getElementById("res-status");
  if (isShopOpen) {
    badge.className = "badge bg-success rounded-1 fw-normal";
    badge.textContent = "Mở cửa";
  } else {
    badge.className = "badge bg-secondary rounded-1 fw-normal";
    badge.textContent = "Đóng cửa";
  }
}

function renderMenu(products) {
  const tabsContainer = document.getElementById("category-tabs");
  const menuContainer = document.getElementById("menu-container");

  if (products.length === 0) {
    menuContainer.innerHTML =
      '<div class="text-center text-muted py-5 fs-5">Quán chưa có món ăn nào.</div>';
    return;
  }

  // Nhóm món ăn
  const grouped = {};
  products.forEach((p) => {
    const c = p.category_name || "Món Khác";
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(p);
  });

  // Biến chứa HTML (Tạo chuỗi trước để tối ưu hiệu năng)
  let tabsHtml = "";
  let contentHtml = "";
  let index = 0;

  for (const [catName, items] of Object.entries(grouped)) {
    const catId = `cat-${index}`;
    const isActive = index === 0 ? "active" : "";

    // Tạo Tab
    tabsHtml += `<li class="nav-item">
            <a class="cat-link ${isActive}" href="#${catId}" data-target="${catId}">${catName}</a>
        </li>`;

    // Tạo Danh sách món (Items)
    const itemsHtml = items
      .map((p) => {
        let img = p.image
          ? p.image.startsWith("http")
            ? p.image
            : IMG_BASE + p.image
          : "../assets/images/default-food.png";
        const active = p.is_active == 1;

        let cardClass = "product-card";
        let overlay = "";
        let btnAction = "";

        if (!isShopOpen) {
          cardClass += " disabled";
          overlay = `<div class="badge-sold-out">TẠM ĐÓNG</div>`;
        } else if (!active) {
          cardClass += " disabled";
          overlay = `<div class="badge-sold-out">HẾT MÓN</div>`;
        } else {
          btnAction = `
                <button class="btn-add-cart" onclick="addToCart({
                    id: ${p.id}, name: '${p.name.replace(
            /'/g,
            "\\'"
          )}', price: ${p.price}, image: '${img}'
                })"><i class="fas fa-plus"></i></button>`;
        }

        return `
            <div class="col-lg-6 col-md-12 mb-4">
                <div class="${cardClass}" id="card-${p.id}">
                    <div class="product-thumb">
                        <img src="${img}" loading="lazy">
                        ${overlay}
                    </div>
                    <div class="product-info">
                        <div>
                            <h3 class="product-title" title="${p.name}">${
          p.name
        }</h3>
                            <p class="product-desc">${
                              p.description || "Món ngon chất lượng"
                            }</p>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="product-price">${parseInt(
                              p.price
                            ).toLocaleString()}đ</span>
                            ${btnAction}
                        </div>
                    </div>
                </div>
            </div>`;
      })
      .join("");

    contentHtml += `
            <div id="${catId}" class="section-category scroll-offset mb-4">
                <h5 class="fw-bold mb-3 text-secondary text-uppercase fs-6 border-start border-4 border-primary ps-2">${catName}</h5>
                <div class="row g-3">${itemsHtml}</div>
            </div>`;

    index++;
  }

  // Render 1 lần duy nhất vào DOM
  tabsContainer.innerHTML = tabsHtml;
  menuContainer.innerHTML = contentHtml;

  // Gắn sự kiện CLICK cho Tab (Scroll mượt)
  const links = document.querySelectorAll(".cat-link");
  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Xóa active cũ
      links.forEach((l) => l.classList.remove("active"));
      // Active tab mới
      this.classList.add("active");

      const targetId = this.getAttribute("href").substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        // Tính toán vị trí scroll trừ đi chiều cao header
        const headerOffset = 160;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}

// --- 2. LOGIC SCROLLSPY (Lướt đến đâu sáng đến đó) ---
function highlightActiveTab() {
  const sections = document.querySelectorAll(".section-category");
  const navLinks = document.querySelectorAll(".cat-link");

  let currentId = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    // Offset 180px (trừ hao navbar + tab bar)
    if (window.scrollY >= sectionTop - 200) {
      currentId = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + currentId) {
      link.classList.add("active");
      // Tự động cuộn thanh tab ngang để tab đang xem luôn hiển thị
      link.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  });
}

// --- 3. LOGIC GIỎ HÀNG (Giữ nguyên) ---
function initCart() {
  const saved = localStorage.getItem(CART_KEY);
  if (saved) cart = JSON.parse(saved);
  updateCartUI();
}

function highlightSelectedItems() {
  document
    .querySelectorAll(".product-card")
    .forEach((el) => el.classList.remove("selected-item"));
  if (cart.shopId == shopId) {
    cart.items.forEach((item) => {
      const card = document.getElementById(`card-${item.id}`);
      if (card) card.classList.add("selected-item");
    });
  }
}

function addToCart(product) {
  if (cart.items.length > 0 && cart.shopId != shopId) {
    if (!confirm(`Xóa giỏ hàng quán cũ để đặt quán này?`)) return;
    cart = { shopId: null, shopName: "", items: [] };
    document
      .querySelectorAll(".product-card")
      .forEach((el) => el.classList.remove("selected-item"));
  }

  localStorage.setItem("current_restaurant_id", shopId);

  cart.shopId = shopId;
  cart.shopName = currentShopName;

  const exist = cart.items.find((i) => i.id == product.id);
  if (exist) exist.quantity++;
  else cart.items.push({ ...product, quantity: 1 });

  saveCart();
  updateCartUI();
  highlightSelectedItems();
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartUI() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const emptyMsg = document.getElementById("empty-cart-msg");
  const footer = document.getElementById("cart-footer");

  // Header Btn
  const headerTotal = document.getElementById("header-cart-total");
  const headerBadge = document.getElementById("header-cart-badge");

  const count = cart.items.reduce((s, i) => s + i.quantity, 0);
  const total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalStr = total.toLocaleString() + "đ";

  if (headerTotal) headerTotal.textContent = total > 0 ? totalStr : "0đ";
  if (headerBadge) {
    headerBadge.textContent = count;
    headerBadge.style.display = count > 0 ? "flex" : "none";
  }

  if (cart.items.length === 0) {
    emptyMsg.style.display = "flex";
    footer.style.display = "none";
    container.innerHTML = "";
  } else {
    emptyMsg.style.display = "none";
    footer.style.display = "block";
    totalEl.textContent = totalStr;

    container.innerHTML = cart.items
      .map(
        (item, index) => `
            <div class="cart-item">
                <img src="${item.image}">
                <div class="cart-info">
                    <div class="cart-title text-truncate">${item.name}</div>
                    <div class="cart-price">${item.price.toLocaleString()}đ</div>
                </div>
                <div class="cart-controls">
                    <button class="btn-qty" onclick="changeQty(${index}, -1)">-</button>
                    <span class="fw-bold px-2">${item.quantity}</span>
                    <button class="btn-qty" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>
        `
      )
      .join("");
  }
}

function changeQty(index, delta) {
  const item = cart.items[index];
  item.quantity += delta;
  if (item.quantity <= 0) cart.items.splice(index, 1);
  if (cart.items.length === 0) {
    cart.shopId = null;
    cart.shopName = "";
  }

  saveCart();
  updateCartUI();
  highlightSelectedItems();
}

function toggleCart() {
  document.getElementById("cart-panel").classList.toggle("show");
  document.getElementById("cart-overlay").classList.toggle("show");
}

function openCheckoutModal() {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) {
    if (confirm("Đăng nhập để đặt hàng?"))
      window.location.href = "../pages/login.html";
    return;
  }
  const user = JSON.parse(userStr);
  document.getElementById("uName").value = user.full_name || "";
  document.getElementById("uPhone").value = user.phone || "";
  document.getElementById("uAddress").value =
    user.addresses && user.addresses[0] ? user.addresses[0].address_line : "";
  document.getElementById("checkout-res-name").textContent = cart.shopName;
  document.getElementById("checkout-modal-total").textContent =
    document.getElementById("header-cart-total").textContent;

  const modal = new bootstrap.Modal(document.getElementById("checkoutModal"));
  modal.show();
  document.getElementById("cart-panel").classList.remove("show");
  document.getElementById("cart-overlay").classList.remove("show");
}

function submitOrder() {
  alert("Đã đặt hàng thành công!");
  cart = { shopId: null, shopName: "", items: [] };
  saveCart();
  updateCartUI();
  highlightSelectedItems();
  bootstrap.Modal.getInstance(document.getElementById("checkoutModal")).hide();
}
