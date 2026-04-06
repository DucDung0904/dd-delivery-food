/**
 * RESTAURANT ORDER MANAGER - VUỐT + XÁC NHẬN MODAL
 */
const ORDER_CONFIG = {
  API_URL: "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api",
};

const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );

const OrderManager = {
  orders: [],
  currentTab: "new",
  refreshTimer: null,

  // Biến tạm để lưu thông tin khi đang vuốt dở
  pendingSwipe: {
    orderId: null,
    container: null,
    handle: null,
    overlay: null,
  },

  init: function () {
    this.loadOrders();
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => this.loadOrders(true), 10000);
  },

  loadOrders: async function (isBackground = false) {
    const storeId =
      typeof CURRENT_RES_ID !== "undefined" && CURRENT_RES_ID
        ? CURRENT_RES_ID
        : localStorage.getItem("current_restaurant_id");
    if (!storeId) return;

    try {
      const res = await fetch(
        `${
          ORDER_CONFIG.API_URL
        }/restaurant/get_order.php?restaurant_id=${storeId}&t=${Date.now()}`
      );
      const data = await res.json();

      if (data.status === "success" || Array.isArray(data.data)) {
        this.orders = data.data;
        this.updateBadges();
        // Chỉ vẽ lại nếu không phải đang chạy ngầm (để tránh giật khi đang thao tác)
        if (!isBackground) this.renderOrders();
      }
    } catch (e) {
      console.error(e);
    }
  },

  switchTab: function (tabName, btnElement) {
    this.currentTab = tabName;
    document.querySelectorAll("#orderTabs .nav-link").forEach((el) => {
      el.classList.remove("active");
      el.classList.add("text-dark");
    });
    btnElement.classList.add("active");
    btnElement.classList.remove("text-dark");
    this.renderOrders();
  },

  renderOrders: function () {
    const tbody = document.getElementById("order-list-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const filtered = this.orders.filter((o) => {
      if (this.currentTab === "new") return o.status === "pending";
      if (this.currentTab === "processing") return o.status === "confirmed";
      if (this.currentTab === "shipping") return o.status === "shipping";
      if (this.currentTab === "history")
        return o.status === "completed" || o.status === "cancelled";
      return false;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">Không có đơn hàng nào.</td></tr>`;
      return;
    }

    filtered.forEach((order) => {
      let itemsHtml = order.items
        .slice(0, 2)
        .map(
          (i) =>
            `<div class="small text-dark mb-1">• <b>${i.quantity}x</b> ${i.food_name}</div>`
        )
        .join("");
      if (order.items.length > 2)
        itemsHtml += `<div class="small text-muted fst-italic ps-2">+ thêm ${
          order.items.length - 2
        } món...</div>`;

      let shipperName =
        this.currentTab === "shipping" && order.shipper_name
          ? `<div class="small text-primary mt-1"><i class="fas fa-motorcycle"></i> ${order.shipper_name}</div>`
          : "";

      const actionBtns = this.getActionButtonsUI(order);

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td class="fw-bold text-primary">#${order.id}</td>
                <td>
                    <div class="fw-bold text-dark">${
                      order.recipient_name || "Khách lẻ"
                    }</div>
                    <div class="small text-muted">${order.recipient_phone}</div>
                </td>
                <td>${itemsHtml}</td>
                <td class="fw-bold text-danger">${formatMoney(
                  order.final_amount
                )}</td>
                <td>${this.getStatusBadge(order.status)}${shipperName}</td>
                <td class="text-end align-middle">
                    <div class="d-flex justify-content-end align-items-center gap-2">
                        ${actionBtns}
                        <button class="btn btn-sm btn-light border" onclick="OrderManager.showDetail(${
                          order.id
                        })" title="Xem chi tiết"><i class="fas fa-eye text-secondary"></i></button>
                    </div>
                </td>
            `;
      tbody.appendChild(tr);
    });

    if (this.currentTab === "shipping") {
      this.initSwipeLogic();
    }
  },

  getActionButtonsUI: function (order) {
    if (this.currentTab === "new") {
      return `<button class="btn btn-sm btn-primary" onclick="OrderManager.updateStatus(${order.id}, 'confirmed')">Nhận</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="OrderManager.updateStatus(${order.id}, 'cancelled')">Hủy</button>`;
    } else if (this.currentTab === "processing") {
      return `<button class="btn btn-sm btn-warning text-dark fw-bold" onclick="OrderManager.openAssignShipperModal(${order.id})"><i class="fas fa-motorcycle"></i> Giao hàng</button>`;
    } else if (this.currentTab === "shipping") {
      return `
                <div class="swipe-container" id="swipe-${order.id}" data-order-id="${order.id}">
                    <div class="swipe-overlay"></div>
                    <div class="swipe-text">Vuốt để xong <i class="fas fa-chevron-right ms-1"></i></div>
                    <div class="swipe-handle"><i class="fas fa-check"></i></div>
                </div>
            `;
    } else {
      return order.status === "completed"
        ? `<span class="text-success small fw-bold">Thành công</span>`
        : `<span class="text-muted small">Đã hủy</span>`;
    }
  },

  // --- LOGIC VUỐT CẬP NHẬT MỚI ---
  initSwipeLogic: function () {
    const containers = document.querySelectorAll(".swipe-container");

    containers.forEach((container) => {
      const handle = container.querySelector(".swipe-handle");
      const overlay = container.querySelector(".swipe-overlay");
      const orderId = container.dataset.orderId;
      let isDragging = false;
      let startX = 0;
      const containerWidth = container.offsetWidth;
      const handleWidth = handle.offsetWidth;
      const maxDrag = containerWidth - handleWidth - 6;

      const onMove = (clientX) => {
        if (!isDragging) return;
        let offset = clientX - startX;
        if (offset < 0) offset = 0;
        if (offset > maxDrag) offset = maxDrag;
        handle.style.left = offset + 3 + "px";
        overlay.style.width = offset + handleWidth / 2 + "px";
        overlay.style.opacity = offset / maxDrag;
      };

      const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const currentLeft = parseInt(handle.style.left || 3);

        // Nếu kéo > 90%
        if (currentLeft >= maxDrag * 0.9) {
          // 1. Kéo hết hành trình (Visual)
          handle.style.left = maxDrag + 3 + "px";
          overlay.style.width = "100%";

          // 2. Lưu trạng thái tạm
          this.pendingSwipe = { orderId, container, handle, overlay };

          // 3. MỞ MODAL XÁC NHẬN
          new bootstrap.Modal(
            document.getElementById("confirmCompleteModal")
          ).show();
        } else {
          // Reset về đầu
          this.resetSwipe(handle, overlay);
        }
      };

      handle.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX;
        e.preventDefault();
      });
      document.addEventListener("mousemove", (e) => onMove(e.clientX));
      document.addEventListener("mouseup", onEnd);

      handle.addEventListener(
        "touchstart",
        (e) => {
          isDragging = true;
          startX = e.touches[0].clientX;
        },
        { passive: true }
      );
      handle.addEventListener(
        "touchmove",
        (e) => {
          onMove(e.touches[0].clientX);
        },
        { passive: true }
      );
      handle.addEventListener("touchend", onEnd);
    });
  },

  // Hàm reset thanh trượt về vị trí cũ
  resetSwipe: function (handle, overlay) {
    if (handle) handle.style.left = "3px";
    if (overlay) overlay.style.width = "0px";
    if (overlay) overlay.style.opacity = "0.5";
  },

  // --- XỬ LÝ KHI BẤM "ĐỒNG Ý" TRONG MODAL ---
  confirmSwipeCompletion: async function () {
    const { orderId } = this.pendingSwipe;
    if (!orderId) return;

    // Ẩn modal
    bootstrap.Modal.getInstance(
      document.getElementById("confirmCompleteModal")
    ).hide();

    // Gọi API hoàn thành
    await this.updateStatus(orderId, "completed");

    // Reset biến tạm
    this.pendingSwipe = {};
  },

  // --- XỬ LÝ KHI BẤM "HỦY" TRONG MODAL ---
  cancelSwipeCompletion: function () {
    const { handle, overlay } = this.pendingSwipe;

    // Đẩy nút về vị trí ban đầu
    this.resetSwipe(handle, overlay);

    // Ẩn modal
    bootstrap.Modal.getInstance(
      document.getElementById("confirmCompleteModal")
    ).hide();
    this.pendingSwipe = {};
  },

  // --- CÁC HÀM CŨ ---
  getStatusBadge: function (status) {
    switch (status) {
      case "pending":
        return '<span class="badge bg-danger">Mới</span>';
      case "confirmed":
        return '<span class="badge bg-warning text-dark">Bếp</span>';
      case "shipping":
        return '<span class="badge bg-primary">Ship</span>';
      case "completed":
        return '<span class="badge bg-success">Xong</span>';
      case "cancelled":
        return '<span class="badge bg-secondary">Hủy</span>';
      default:
        return status;
    }
  },

  updateBadges: function () {
    const countNew = this.orders.filter((o) => o.status === "pending").length;
    const countProcess = this.orders.filter(
      (o) => o.status === "confirmed"
    ).length;
    const countShip = this.orders.filter((o) => o.status === "shipping").length;

    const setBadge = (id, count) => {
      const el = document.getElementById(`badge-${id}`);
      if (el) {
        el.innerText = count;
        el.style.display = count > 0 ? "inline-block" : "none";
      }
    };
    setBadge("new", countNew);
    setBadge("processing", countProcess);
    setBadge("shipping", countShip);
  },

  updateStatus: async function (orderId, newStatus) {
    // Nếu không phải hoàn thành (vì hoàn thành đã có modal riêng rồi), thì confirm thường
    if (
      newStatus !== "completed" &&
      !confirm(`Xác nhận đổi trạng thái đơn #${orderId}?`)
    )
      return;

    try {
      const res = await fetch(
        `${ORDER_CONFIG.API_URL}/restaurant/update_order_status.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId, status: newStatus }),
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        this.loadOrders(); // Load lại toàn bộ để cập nhật bảng
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (e) {
      alert("Lỗi kết nối!");
    }
  },

  openAssignShipperModal: async function (orderId) {
    document.getElementById("assignOrderId").value = orderId;
    new bootstrap.Modal(document.getElementById("assignShipperModal")).show();
    const select = document.getElementById("shipperSelect");
    select.innerHTML = "<option>Đang tải...</option>";

    try {
      const storeId = localStorage.getItem("current_restaurant_id");
      const res = await fetch(
        `${ORDER_CONFIG.API_URL}/restaurant/get_shippers.php?restaurant_id=${storeId}`
      );
      const data = await res.json();
      select.innerHTML = '<option value="">-- Chọn shipper --</option>';
      if (data.data)
        data.data.forEach(
          (s) =>
            (select.innerHTML += `<option value="${s.id}">${s.name}</option>`)
        );
    } catch (e) {
      select.innerHTML = "<option>Lỗi tải</option>";
    }
  },

  submitAssignShipper: async function () {
    const orderId = document.getElementById("assignOrderId").value;
    const shipperId = document.getElementById("shipperSelect").value;
    if (!shipperId) return alert("Chọn shipper!");

    try {
      const res = await fetch(
        `${ORDER_CONFIG.API_URL}/restaurant/assign_shipper.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId, shipper_id: shipperId }),
        }
      );
      const data = await res.json();
      if (data.status === "success") {
        bootstrap.Modal.getInstance(
          document.getElementById("assignShipperModal")
        ).hide();
        this.loadOrders(true);
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Lỗi mạng");
    }
  },

  showDetail: function (orderId) {
    const order = this.orders.find((o) => o.id == orderId);
    if (!order) return;
    document.getElementById("detail-order-id").innerText = order.id;
    document.getElementById("detail-customer").innerText = order.recipient_name;
    document.getElementById("detail-phone").innerText = order.recipient_phone;
    document.getElementById("detail-address").innerText =
      order.shipping_address;

    const itemsDiv = document.getElementById("detail-items-list");
    itemsDiv.innerHTML = "";
    order.items.forEach((item) => {
      itemsDiv.innerHTML += `<div class="d-flex justify-content-between border-bottom py-2"><span><b>${
        item.quantity
      }x</b> ${item.food_name}</span><span>${formatMoney(
        item.price * item.quantity
      )}</span></div>`;
    });
    document.getElementById("detail-total").innerText = formatMoney(
      order.final_amount
    );
    new bootstrap.Modal(document.getElementById("orderDetailModal")).show();
  },
};

document.addEventListener("DOMContentLoaded", () => OrderManager.init());
