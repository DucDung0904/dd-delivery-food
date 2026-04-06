const GHN_CONFIG = {
  TOKEN: "bd5cf8f1-ebda-11f0-aba2-4210e14e7d2d",
  SHOP_ID: 5119476,
  API_URL: "https://online-gateway.ghn.vn/ship/public-api",
};

// --- QUẢN LÝ ĐỊA CHỈ & API ---
const LocationManager = {
  headers: {
    "Content-Type": "application/json",
    Token: GHN_CONFIG.TOKEN,
  },

  // 1. Lấy danh sách Tỉnh/Thành
  getProvinces: async function () {
    try {
      const res = await fetch(`${GHN_CONFIG.API_URL}/master-data/province`, {
        headers: this.headers,
      });
      const data = await res.json();
      return data.data; // Trả về mảng tỉnh thành
    } catch (error) {
      console.error("Lỗi lấy tỉnh:", error);
    }
  },

  // 2. Lấy Quận/Huyện theo ID Tỉnh
  getDistricts: async function (provinceId) {
    try {
      const res = await fetch(`${GHN_CONFIG.API_URL}/master-data/district`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ province_id: provinceId }),
      });
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error("Lỗi lấy huyện:", error);
    }
  },

  // 3. Lấy Phường/Xã theo ID Huyện
  getWards: async function (districtId) {
    try {
      const res = await fetch(
        `${GHN_CONFIG.API_URL}/master-data/ward?district_id=${districtId}`,
        { headers: this.headers }
      );
      const data = await res.json();
      return data.data;
    } catch (error) {
      console.error("Lỗi lấy xã:", error);
    }
  },

  // 4. TÍNH PHÍ SHIP (Quan trọng nhất)
  calculateFee: async function (toDistrictId, toWardCode, weight = 200) {
    // weight: Đơn vị gram. Ví dụ 1 phần cơm ~ 500g
    try {
      const res = await fetch(`${GHN_CONFIG.API_URL}/v2/shipping-order/fee`, {
        method: "POST",
        headers: { ...this.headers, ShopId: GHN_CONFIG.SHOP_ID }, // API tính phí cần thêm ShopId
        body: JSON.stringify({
          service_type_id: 2, // 2 là Chuyển phát chuẩn
          insurance_value: 0, // Giá trị đơn hàng (để tính bảo hiểm nếu cần)
          coupon: null,
          from_district_id: 1454, // ID Quận của CỬA HÀNG (Ví dụ: Quận 3, TP.HCM) -> BẠN CẦN SỬA CÁI NÀY
          to_district_id: toDistrictId,
          to_ward_code: toWardCode,
          height: 15,
          length: 15,
          width: 15,
          weight: weight, // Kích thước gói hàng giả định
        }),
      });
      const data = await res.json();
      return data.data ? data.data.total : 0; // Trả về tiền ship
    } catch (error) {
      console.error("Lỗi tính phí ship:", error);
      return 30000; // Nếu lỗi API thì trả về phí mặc định 30k
    }
  },
};

// --- ORDER MANAGER (Được nâng cấp) ---
const OrderManager = {
  KEYS: { CART: "dd_food_cart", USER: "user_info" },

  // Biến lưu phí ship tạm tính
  shippingFee: 0,

  getCartData: function () {
    return JSON.parse(localStorage.getItem(this.KEYS.CART));
  },
  getUserData: function () {
    return JSON.parse(localStorage.getItem(this.KEYS.USER));
  },

  calculateTotal: function (items) {
    return items.reduce(
      (total, item) => total + item.price * (item.quantity || 1),
      0
    );
  },

  // Hàm khởi tạo để tự động điền địa chỉ từ User Profile (nếu có)
  initCheckout: async function () {
    const user = this.getUserData();
    if (user && user.address_default) {
      // Tự động tính phí ship dựa trên địa chỉ trong profile
      const addr = user.address_default;
      console.log("Đang tính phí ship cho địa chỉ hồ sơ...");

      // Giả định đơn hàng nặng 500g
      this.shippingFee = await LocationManager.calculateFee(
        addr.district_id,
        addr.ward_code,
        500
      );

      // Update giao diện (Giả sử bạn có thẻ span id="shipping-fee")
      const shipElement = document.getElementById("shipping-fee");
      if (shipElement)
        shipElement.innerText = this.shippingFee.toLocaleString() + "đ";

      console.log("Phí ship tính được:", this.shippingFee);
      this.updateTotalOrderUI();
    }
  },

  updateTotalOrderUI: function () {
    // Hàm cập nhật tổng tiền cuối cùng (Món ăn + Ship) lên giao diện
    const cart = this.getCartData();
    if (!cart) return;
    const subTotal = this.calculateTotal(cart.items);
    const finalTotal = subTotal + this.shippingFee;

    // Update vào thẻ HTML (Ví dụ id="final-total")
    const totalElement = document.getElementById("final-total");
    if (totalElement)
      totalElement.innerText = finalTotal.toLocaleString() + "đ";
  },

  submitOrder: async function () {
    const cart = this.getCartData();
    const user = this.getUserData();

    if (!user || !user.user_id) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    if (!cart || !cart.items.length) {
      alert("Giỏ hàng trống!");
      return;
    }

    // Logic kiểm tra địa chỉ
    // Ưu tiên: Lấy địa chỉ nhập từ form -> Nếu không có thì lấy từ Profile
    // Ở đây tôi giả sử lấy từ Profile cho nhanh
    let shippingAddress = "";
    let districtId = 0;
    let wardCode = "";

    if (user.address_default) {
      shippingAddress = user.address_default.specific;
      districtId = user.address_default.district_id;
      wardCode = user.address_default.ward_code;
    } else {
      alert("Vui lòng cập nhật địa chỉ giao hàng!");
      return;
    }

    // Nếu phí ship chưa được tính (do mạng lag hoặc chưa init), tính lại ngay lúc bấm nút
    if (this.shippingFee === 0) {
      this.shippingFee = await LocationManager.calculateFee(
        districtId,
        wardCode,
        500
      );
    }

    const subTotal = this.calculateTotal(cart.items);

    const orderPayload = {
      customer_id: user.user_id,
      customer_name: user.full_name,
      customer_phone: user.phone, // Lấy từ hồ sơ
      shop_id: cart.shopId,
      items: cart.items,
      sub_total: subTotal,
      shipping_fee: this.shippingFee, // Phí ship từ API GHN
      total_amount: subTotal + this.shippingFee, // Tổng thanh toán
      shipping_address: shippingAddress,
      payment_method: "COD",
      created_at: new Date().toISOString(),
    };

    console.log("ĐƠN HÀNG HOÀN CHỈNH:", orderPayload);
    alert(
      `Đặt hàng thành công!\nTiền món: ${subTotal}đ\nPhí ship (GHN): ${this.shippingFee}đ\nTổng: ${orderPayload.total_amount}đ`
    );

    // Reset giỏ hàng...
  },
};

// Gọi hàm này khi trang thanh toán vừa load xong
// document.addEventListener('DOMContentLoaded', () => {
//     OrderManager.initCheckout();
// });
