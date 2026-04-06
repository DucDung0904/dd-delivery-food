const API_URL = "http://localhost/DACS2/FOOD-DELIVERY-APP/backend/api";

let currentCategoryId = "all"; // Biến lưu ID danh mục đang chọn
let searchTimeout = null;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Tải danh mục từ bảng store_categories
  await loadCategories();

  // 2. Tải quán ăn
  loadRestaurants();

  // 3. Sự kiện tìm kiếm
  document.getElementById("search-input").addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadRestaurants(e.target.value);
    }, 500);
  });
});

// --- HÀM TẢI DANH MỤC ---
async function loadCategories() {
  const wrapper = document.getElementById("category-wrapper");
  const indicator = document.getElementById("cat-indicator");

  try {
    // Gọi API lấy từ bảng store_categories
    const res = await fetch(`${API_URL}/public/get_categories.php`);
    const json = await res.json();

    // Tạo nút "Tất cả"
    let html = `<button class="btn-category active" onclick="filterByCategory('all', this)">Tất cả</button>`;

    // Render danh mục động
    if (json.status === "success" && json.data.length > 0) {
      json.data.forEach((cat) => {
        // Truyền ID vào hàm filter
        html += `<button class="btn-category" onclick="filterByCategory(${cat.id}, this)">${cat.name}</button>`;
      });
    }

    wrapper.innerHTML = html;
    wrapper.appendChild(indicator);

    // Set vị trí thanh gạch chân ban đầu
    const firstBtn = wrapper.querySelector(".btn-category.active");
    if (firstBtn) setTimeout(() => moveIndicator(firstBtn), 100);
  } catch (e) {
    console.error("Lỗi tải danh mục:", e);
  }
}

// --- HÀM DI CHUYỂN GẠCH CHÂN ---
function moveIndicator(element) {
  const indicator = document.getElementById("cat-indicator");
  if (indicator && element) {
    indicator.style.width = `${element.offsetWidth}px`;
    indicator.style.left = `${element.offsetLeft}px`;
  }
}

// --- HÀM LỌC (NHẬN ID) ---
function filterByCategory(id, btn) {
  // Update UI
  document
    .querySelectorAll(".btn-category")
    .forEach((el) => el.classList.remove("active"));
  btn.classList.add("active");
  moveIndicator(btn);

  // Update Logic
  currentCategoryId = id; // Lưu ID (số) hoặc 'all'
  document.getElementById("search-input").value = "";
  loadRestaurants();
}

// --- HÀM TẢI QUÁN ĂN ---
async function loadRestaurants(keyword = "") {
  const grid = document.getElementById("restaurant-grid");
  grid.style.opacity = "0.5";

  try {
    let url = `${API_URL}/public/get_restaurants.php?t=${new Date().getTime()}`;

    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

    // Gửi ID lên server
    if (currentCategoryId !== "all") url += `&category_id=${currentCategoryId}`;

    const res = await fetch(url);
    const json = await res.json();

    grid.innerHTML = "";
    grid.style.opacity = "1";

    if (json.status === "success" && json.data.length > 0) {
      grid.innerHTML = json.data
        .map((res) => renderRestaurantCard(res))
        .join("");
    } else {
      grid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="bg-light rounded-circle d-inline-flex p-4 mb-3">
                        <i class="fas fa-utensils text-secondary fa-3x opacity-50"></i>
                    </div>
                    <h5 class="text-muted fw-bold">Không tìm thấy quán nào!</h5>
                </div>`;
    }
  } catch (e) {
    console.error(e);
    grid.style.opacity = "1";
  }
}

// --- HÀM RENDER CARD ---
function renderRestaurantCard(res) {
  const imgUrl = res.image
    ? `http://localhost/DACS2/FOOD-DELIVERY-APP/backend/uploads/${res.image}`
    : "../assets/images/default-restaurant.png";

  // Dữ liệu fallback
  const rating = res.rating || "4.5";
  const time = res.delivery_time || "15-30 phút";

  // Hiển thị tên danh mục lấy từ bảng store_categories
  const categoryName = res.category_name || "Quán ăn";
  // Ưu tiên hiển thị mô tả, nếu ko có thì hiện tên danh mục
  const badgeText =
    res.description && res.description !== "Chưa có mô tả"
      ? res.description
      : categoryName;

  return `
    <div class="col-md-6 col-lg-3">
        <div class="res-card h-100 shadow-sm" onclick="window.location.href='menu.html?id=${
          res.id
        }'">
            <div class="res-img-wrapper position-relative overflow-hidden bg-light">
                <img src="${imgUrl}" class="res-img w-100" style="height: 180px; object-fit: cover; transition: transform 0.5s;" 
                     onerror="this.src='../assets/images/default-restaurant.png'">
                
                <div class="res-badge position-absolute top-0 start-0 m-2 px-2 py-1 bg-primary text-white rounded small fw-bold shadow-sm">
                    Đối tác
                </div>
                <div class="position-absolute bottom-0 end-0 m-2 px-2 py-1 bg-white rounded-pill small fw-bold shadow-sm d-flex align-items-center gap-1">
                    <i class="fas fa-clock text-primary"></i> ${time}
                </div>
            </div>
            
            <div class="res-info p-3 d-flex flex-column h-100">
                <div class="res-name text-truncate fw-bold mb-1 text-dark" style="font-size: 1.1rem;" title="${
                  res.name
                }">
                    ${res.name}
                </div>
                
                <div class="res-meta d-flex align-items-center text-muted small mb-2">
                    <span class="text-warning fw-bold me-1"><i class="fas fa-star"></i> ${rating}</span>
                    <span class="mx-1">•</span>
                    <span class="text-truncate" style="max-width: 150px;">${
                      res.address || "Đà Nẵng"
                    }</span>
                </div>

                <div class="mt-auto">
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-normal">
                        ${badgeText}
                    </span>
                </div>
            </div>
        </div>
    </div>`;
}
