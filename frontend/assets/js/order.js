// Ví dụ hàm gọi API trong order.js
async function placeOrder() {
  const user = JSON.parse(localStorage.getItem("user_info"));
  const cart = JSON.parse(localStorage.getItem("dd_food_cart"));

  const addressId = null;

  const payload = {
    user_id: user.user_id,
    address_id: addressId,
    items: cart.items,
    total_amount: 100000,
    shipping_fee: 15000,
  };

  const res = await fetch("http://localhost:3000/api/order/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.success) {
    alert("Đặt hàng thành công!");
    localStorage.removeItem("dd_food_cart");
    window.location.href = "profile.html";
  } else {
    alert(data.message);
  }
}
