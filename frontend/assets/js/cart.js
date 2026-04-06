const Cart = {
  KEY: "dd_food_cart",
  data: {
    shopId: null,
    shopName: "",
    items: [],
  },

  init() {
    const saved = localStorage.getItem(this.KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {}
    }

    const btn = document.getElementById("cart-btn");
    if (btn) {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.open();
      });
    }

    this.updateUI();
  },

  updateUI() {
    const headerBtn = document.getElementById("cart-btn");

    // Tính toán
    const count = this.data.items.reduce((s, i) => s + i.quantity, 0);
    const total = this.data.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalStr = total.toLocaleString() + "₫";

    if (headerBtn) {
      let btnHtml = `<i class="fas fa-shopping-basket" style="font-size: 18px;"></i>`;

      // Chỉ hiện Tiền và Vạch ngăn cách khi có món
      if (count > 0) {
        btnHtml += `
                    <div class="cart-divider"></div>
                    <span class="cart-btn-total">${totalStr}</span>
                `;
      }

      // Badge số lượng (Luôn render nhưng ẩn/hiện bằng CSS display)
      btnHtml += `
                <span id="cart-badge" class="cart-badge" 
                      style="${count > 0 ? "display:flex" : "display:none"}">
                      ${count}
                </span>
            `;

      headerBtn.innerHTML = btnHtml;
    }

    const container = document.getElementById("cart-items");
    const footer = document.getElementById("cart-footer");
    const emptyMsg = document.getElementById("empty-cart-msg");
    const totalEl = document.getElementById("cart-total");
    const headerTitle = document.querySelector(".cart-header h3");

    if (headerTitle) {
      if (this.data.items.length > 0 && this.data.shopName) {
        headerTitle.innerHTML = `<i class="fas fa-store me-2"></i> ${this.data.shopName}`;
      } else {
        headerTitle.innerHTML = `<i class="fas fa-shopping-basket me-2"></i> Giỏ hàng`;
      }
    }

    if (!container) return;

    if (this.data.items.length === 0) {
      container.innerHTML = "";
      if (emptyMsg) emptyMsg.style.display = "flex";
      if (footer) footer.style.display = "none";
    } else {
      if (emptyMsg) emptyMsg.style.display = "none";
      if (footer) footer.style.display = "block";
      if (totalEl) totalEl.textContent = totalStr;

      container.innerHTML = this.data.items
        .map(
          (item) => `
                <div class="cart-item">
                    <img src="${
                      item.image
                    }" onerror="this.src='assets/images/default-food.png'">
                    <div class="cart-info">
                        <div class="cart-title">${item.name}</div>
                        <div class="cart-price">${item.price.toLocaleString()}₫</div>
                    </div>
                    <div class="cart-controls">
                        <button class="btn-qty" onclick="Cart.changeQty(${
                          item.id
                        }, -1)">-</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="btn-qty" onclick="Cart.changeQty(${
                          item.id
                        }, 1)">+</button>
                    </div>
                    <button class="btn-remove" onclick="Cart.remove(${
                      item.id
                    })">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `
        )
        .join("");
    }
  },

  changeQty(id, delta) {
    const item = this.data.items.find((i) => i.id == id);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) this.remove(id);
      else {
        this.save();
        this.updateUI();
      }
    }
  },

  remove(id) {
    this.data.items = this.data.items.filter((i) => i.id != id);
    if (this.data.items.length === 0) {
      this.data.shopId = null;
      this.data.shopName = "";
    }
    this.save();
    this.updateUI();
  },

  save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.data));
  },

  open() {
    const panel = document.getElementById("cart-panel");
    const overlays = document.querySelectorAll(".cart-overlay");
    if (panel) panel.classList.add("show");
    overlays.forEach((o) => o.classList.add("show"));
  },

  close() {
    const panel = document.getElementById("cart-panel");
    const overlays = document.querySelectorAll(".cart-overlay");
    if (panel) panel.classList.remove("show");
    overlays.forEach((o) => o.classList.remove("show"));
  },
};

window.Cart = Cart;
document.addEventListener("DOMContentLoaded", () => {
  Cart.init();
});
