const API_URL = "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api";

const TrackingApp = {
  user: null,
  orders: [],

  init: function () {
    const userStr = localStorage.getItem("user_info");
    if (!userStr) return (window.location.href = "../../pages/login.html");
    this.user = JSON.parse(userStr);

    this.loadOrders();
    setInterval(() => this.loadOrders(true), 10000);
  },

  loadOrders: async function (isSilent = false) {
    const container = document.getElementById("orders-container");
    if (!isSilent)
      container.innerHTML =
        '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    try {
      const res = await fetch(
        `${API_URL}/user/get_my_orders.php?user_id=${this.user.id}`
      );
      const json = await res.json();

      if (json.status === "success") {
        this.orders = json.data;
        const isHistory = document
          .getElementById("tab-history")
          .classList.contains("active");
        this.filterOrders(isHistory ? "history" : "active");
      } else if (!isSilent) {
        container.innerHTML = `<div class="text-center py-5 fs-5 text-muted">Chưa có đơn hàng nào.</div>`;
      }
    } catch (e) {
      console.error(e);
    }
  },

  filterOrders: function (type) {
    document
      .querySelectorAll(".nav-link")
      .forEach((el) => el.classList.remove("active"));
    document.getElementById(`tab-${type}`).classList.add("active");

    const container = document.getElementById("orders-container");
    const filtered = this.orders.filter((o) => {
      return type === "active"
        ? ["pending", "confirmed", "cooking", "shipping"].includes(o.status)
        : ["completed", "cancelled"].includes(o.status);
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="text-center py-5 fs-5 text-muted">Không có đơn hàng nào.</div>`;
      return;
    }

    container.innerHTML = filtered
      .map((order) => this.renderCard(order))
      .join("");
  },

  // --- RENDER THẺ ĐƠN HÀNG (CARD) ---
  renderCard: function (order) {
    const total = parseInt(order.final_amount).toLocaleString("vi-VN");
    const date = new Date(order.created_at).toLocaleString("vi-VN");
    const orderStr = encodeURIComponent(JSON.stringify(order));
    const statusConfig = this.getStatusConfig(order.status);
    let actionAreaHtml = "";

    // TRƯỜNG HỢP: ĐANG GIAO HÀNG (Xóa Avatar, Chữ to)
    if (order.status === "shipping") {
      const sName = order.shipper_name || "Đang tìm tài xế...";
      const sPhone = order.shipper_phone || "";

      actionAreaHtml = `
                <div class="d-flex gap-2 w-100 align-items-center bg-light p-2 rounded border border-primary border-opacity-25">
                    <div class="flex-grow-1 ps-2">
                        <div class="fw-bold text-primary fs-5">${sName}</div>
                        <div class="text-dark fs-6"><i class="fas fa-phone-alt me-2"></i>${sPhone}</div>
                    </div>
                    <button class="btn btn-outline-dark" onclick="TrackingApp.openDetail(decodeURIComponent('${orderStr}'))">
                        Chi tiết
                    </button>
                </div>`;
    }
    // TRƯỜNG HỢP: CHỜ XÁC NHẬN (Nút Hủy to rõ)
    else if (order.status === "pending") {
      actionAreaHtml = `
                <div class="d-flex gap-2 w-100">
                    <button class="btn btn-outline-danger w-50 fw-bold" onclick="TrackingApp.openCancelModal(${order.id})">
                        Hủy đơn
                    </button>
                    <button class="btn btn-outline-dark w-50 fw-bold" onclick="TrackingApp.openDetail(decodeURIComponent('${orderStr}'))">
                        Chi tiết
                    </button>
                </div>`;
    } else {
      actionAreaHtml = `
                <button class="btn btn-outline-dark w-100 fw-bold py-2" onclick="TrackingApp.openDetail(decodeURIComponent('${orderStr}'))">
                    Xem chi tiết
                </button>`;
    }

    return `
            <div class="col-md-6 mb-4 tracking-font-large">
                <div class="card border-0 shadow-sm h-100" style="border-radius:16px;">
                    <div class="card-header bg-white pt-3 px-3 border-0 d-flex justify-content-between align-items-center">
                        <span class="h5 fw-bold text-primary mb-0">#${
                          order.id
                        }</span>
                        <span class="badge ${
                          statusConfig.badgeClass
                        } fs-6 px-3 py-2">${statusConfig.text}</span>
                    </div>

                    <div class="card-body px-3 py-2 cursor-pointer" onclick="TrackingApp.openDetail(decodeURIComponent('${orderStr}'))">
                        <h5 class="fw-bold mb-1 text-truncate">${
                          order.restaurant_name
                        }</h5>
                        <p class="text-muted mb-3 fs-6">${date}</p>
                        
                        <div class="fs-6 border-start border-3 border-warning ps-3 mb-3">
                            <div class="text-truncate mb-1"><span class="fw-bold">Quán:</span> ${
                              order.restaurant_address || "..."
                            }</div>
                            <div class="text-truncate"><span class="fw-bold">Đến:</span> ${
                              order.shipping_address
                            }</div>
                        </div>

                        <div class="bg-light p-3 rounded text-secondary fst-italic fs-6 text-truncate">
                            ${order.items || "Chi tiết món ăn..."}
                        </div>
                    </div>

                    <div class="card-footer bg-white border-0 pb-3 px-3">
                        <div class="d-flex justify-content-between align-items-center mb-3 pt-2 border-top">
                            <span class="fs-6 text-muted">Tổng tiền</span>
                            <span class="h4 text-danger fw-bold mb-0">${total}đ</span>
                        </div>
                        ${actionAreaHtml}
                    </div>
                </div>
            </div>`;
  },

  // --- MODAL CHI TIẾT (Đã xóa avatar, chữ to) ---
  openDetail: function (orderStr) {
    const order = JSON.parse(orderStr);

    document.getElementById("detail-id").innerText = `#${order.id}`;
    document.getElementById("detail-date").innerText = new Date(
      order.created_at
    ).toLocaleString("vi-VN");
    document.getElementById("detail-total").innerText =
      parseInt(order.final_amount).toLocaleString("vi-VN") + "đ";

    const itemsDiv = document.getElementById("detail-items-list");
    itemsDiv.innerHTML = "";
    if (order.items_detail) {
      order.items_detail.forEach((item) => {
        itemsDiv.innerHTML += `
                    <div class="d-flex justify-content-between py-2 border-bottom">
                        <div class="fs-5"><span class="fw-bold text-primary me-2">${
                          item.quantity
                        }x</span> ${item.food_name}</div>
                        <div class="fw-bold fs-5">${parseInt(
                          item.price * item.quantity
                        ).toLocaleString()}đ</div>
                    </div>`;
      });
    }

    // Render Shipper Info (Không Avatar)
    const shipperArea = document.getElementById("detail-shipper-area");
    if (
      ["shipping", "completed"].includes(order.status) &&
      order.shipper_name
    ) {
      shipperArea.style.display = "block";
      shipperArea.innerHTML = `
                <div class="p-3 bg-info bg-opacity-10 rounded border border-info d-flex align-items-center justify-content-between">
                    <div>
                        <div class="h5 fw-bold text-dark mb-1">Tài xế: ${
                          order.shipper_name
                        }</div>
                        <div class="fs-6 text-muted"><i class="fas fa-motorcycle me-2"></i>${
                          order.shipper_plate || "Biển số: ..."
                        }</div>
                    </div>
                    <div class="h4 fw-bold text-primary mb-0"><i class="fas fa-phone me-2"></i>${
                      order.shipper_phone
                    }</div>
                </div>
            `;
    } else {
      shipperArea.style.display = "none";
    }

    // Stepper
    this.renderStepper(order.status);

    new bootstrap.Modal(document.getElementById("orderDetailModal")).show();
  },

  renderStepper: function (status) {
    const container = document.getElementById("detail-stepper");
    if (status === "cancelled") {
      container.innerHTML =
        '<div class="alert alert-danger text-center h5 fw-bold py-4">Đơn hàng đã bị hủy</div>';
      return;
    }

    const steps = [
      { key: "pending", label: "Đã đặt" },
      { key: "confirmed", label: "Bếp nấu" },
      { key: "shipping", label: "Đang giao" },
      { key: "completed", label: "Hoàn thành" },
    ];

    let currentIndex = 0;
    if (status === "confirmed" || status === "cooking") currentIndex = 1;
    else if (status === "shipping") currentIndex = 2;
    else if (status === "completed") currentIndex = 3;

    const percent = (currentIndex / (steps.length - 1)) * 100;

    let stepsHtml = steps
      .map((step, idx) => {
        const isActive = idx <= currentIndex ? "active" : "";
        const icon =
          idx < currentIndex ? '<i class="fas fa-check"></i>' : idx + 1;
        return `
                <div class="stepper-item ${isActive}">
                    <div class="step-counter shadow-sm">${icon}</div>
                    <div class="step-name">${step.label}</div>
                </div>`;
      })
      .join("");

    container.innerHTML = `
            <div style="position:relative; display:flex; justify-content:space-between; margin:30px 10px;">
                <div style="position:absolute; top:20px; left:0; width:100%; height:4px; background:#e9ecef; z-index:1;"></div>
                <div style="position:absolute; top:20px; left:0; width:${percent}%; height:4px; background:#198754; z-index:1; transition: width 0.4s;"></div>
                ${stepsHtml}
            </div>`;
  },

  // --- XỬ LÝ HỦY ĐƠN (Đã sửa lỗi gửi form) ---
  openCancelModal: function (orderId) {
    document.getElementById("cancel-order-id").value = orderId;
    new bootstrap.Modal(document.getElementById("confirmCancelModal")).show();
  },

  submitCancelOrder: async function () {
    const orderId = document.getElementById("cancel-order-id").value;
    if (!orderId) return;

    // SỬ DỤNG URLSearchParams ĐỂ GỬI DẠNG FORM DATA (QUAN TRỌNG)
    const params = new URLSearchParams();
    params.append("order_id", orderId);
    params.append("user_id", this.user.id);
    params.append("action", "cancel");

    try {
      const res = await fetch(`${API_URL}/user/user_cancel_order.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      // Xử lý JSON trả về
      const data = await res.json();

      if (data.status === "success") {
        bootstrap.Modal.getInstance(
          document.getElementById("confirmCancelModal")
        ).hide();
        alert("Đã hủy đơn hàng thành công!");
        this.loadOrders(true); // Load lại danh sách ngay lập tức
      } else {
        alert("Lỗi: " + data.message);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối đến server.");
    }
  },

  // --- Helper Colors ---
  getStatusConfig: function (status) {
    switch (status) {
      case "pending":
        return { text: "Chờ xác nhận", badgeClass: "bg-warning text-dark" };
      case "confirmed":
        return { text: "Đang nấu", badgeClass: "bg-info text-dark" };
      case "cooking":
        return { text: "Đang nấu", badgeClass: "bg-info text-dark" };
      case "shipping":
        return { text: "Đang giao", badgeClass: "bg-primary" };
      case "completed":
        return { text: "Hoàn thành", badgeClass: "bg-success" };
      case "cancelled":
        return { text: "Đã hủy", badgeClass: "bg-danger" };
      default:
        return { text: status, badgeClass: "bg-secondary" };
    }
  },
};

window.filterOrders = (t) => TrackingApp.filterOrders(t);
document.addEventListener("DOMContentLoaded", () => TrackingApp.init());
