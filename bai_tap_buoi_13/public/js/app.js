/**
 * PINTEREST CLONE FRONTEND APPLICATION
 * Kết nối toàn bộ RESTful API Buổi 13
 */

const API_BASE = "/api";

// State
let currentUser = null;
let token = null;
let currentView = "home"; // "home" | "saved" | "profile"
let currentPinDetail = null;
let searchTimeout = null;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  loadAuthFromStorage();
  loadFeedImages();
  setupSearchListener();
});

function loadAuthFromStorage() {
  const savedToken = localStorage.getItem("pinterest_token");
  const savedUser = localStorage.getItem("pinterest_user");

  if (savedToken && savedUser) {
    try {
      token = savedToken;
      currentUser = JSON.parse(savedUser);
      updateNavbarAuthUI();
    } catch (e) {
      logout();
    }
  } else {
    updateNavbarAuthUI();
  }
}

function updateNavbarAuthUI() {
  const guestActions = document.getElementById("guestActions");
  const userProfile = document.getElementById("userProfile");
  const headerUserAvatar = document.getElementById("headerUserAvatar");
  const headerUserName = document.getElementById("headerUserName");
  const currentUserCommentAvatar = document.getElementById("currentUserCommentAvatar");

  if (currentUser && token) {
    guestActions.classList.add("hidden");
    userProfile.classList.remove("hidden");
    headerUserAvatar.src = currentUser.anh_dai_dien || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
    headerUserName.textContent = currentUser.ho_ten.split(" ").slice(-1)[0]; // Tên ngắn gọn
    if (currentUserCommentAvatar) {
      currentUserCommentAvatar.src = currentUser.anh_dai_dien || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
    }
  } else {
    guestActions.classList.remove("hidden");
    userProfile.classList.add("hidden");
    if (currentUserCommentAvatar) {
      currentUserCommentAvatar.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
    }
  }
}

// ================= API CALLS =================

// 1. Lấy danh sách ảnh (Trang chủ)
async function loadFeedImages() {
  try {
    const res = await fetch(`${API_BASE}/images`);
    const data = await res.json();
    if (data.statusCode === 200) {
      renderMasonryGrid(data.content, "pinGrid");
      document.getElementById("pinCountBadge").textContent = `${data.content.length} bức ảnh`;
    }
  } catch (err) {
    showToast("Không thể tải danh sách hình ảnh từ máy chủ");
  }
}

// 2. Tìm kiếm ảnh theo tên
async function searchImages(keyword) {
  try {
    const res = await fetch(`${API_BASE}/images/search?ten=${encodeURIComponent(keyword)}`);
    const data = await res.json();
    if (data.statusCode === 200) {
      renderMasonryGrid(data.content, "pinGrid");
      document.getElementById("sectionTitle").textContent = keyword ? `Kết quả tìm kiếm cho: "${keyword}"` : "Khám phá hôm nay";
      document.getElementById("pinCountBadge").textContent = `${data.content.length} bức ảnh`;
      
      const emptyState = document.getElementById("emptyState");
      if (data.content.length === 0) {
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
      }
    }
  } catch (err) {
    showToast("Lỗi khi tìm kiếm hình ảnh");
  }
}

// 3. Render Masonry Grid
function renderMasonryGrid(images, targetGridId, isProfileCreated = false) {
  const grid = document.getElementById(targetGridId);
  grid.innerHTML = "";

  if (!images || images.length === 0) {
    return;
  }

  images.forEach(img => {
    const card = document.createElement("div");
    card.className = "pin-card";
    card.onclick = () => openPinDetail(img.hinh_id);

    const creatorName = img.nguoi_dung?.ho_ten || "CyberSoft Creator";
    const creatorAvatar = img.nguoi_dung?.anh_dai_dien || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";

    card.innerHTML = `
      <img src="${img.duong_dan}" alt="${img.ten_hinh}" loading="lazy">
      <div class="pin-overlay">
        <div class="pin-overlay-top">
          <button class="btn-save-pin" onclick="handleQuickSave(event, ${img.hinh_id})">
            Lưu
          </button>
        </div>
        <div class="pin-overlay-bottom">
          <span class="pin-title-badge">${img.ten_hinh}</span>
          ${isProfileCreated ? `
            <button class="pin-btn-delete" onclick="handleDeletePin(event, ${img.hinh_id})" title="Xóa hình ảnh này">
              <i class="fa-solid fa-trash"></i>
            </button>
          ` : ""}
        </div>
      </div>
      <div class="pin-footer">
        <img src="${creatorAvatar}" alt="${creatorName}">
        <span class="pin-creator-name">${creatorName}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ================= PIN DETAIL MODAL =================
async function openPinDetail(pinId) {
  try {
    // Gọi API chi tiết ảnh
    const res = await fetch(`${API_BASE}/images/${pinId}`);
    const data = await res.json();
    if (data.statusCode !== 200) {
      showToast(data.message || "Không thể tải chi tiết ảnh");
      return;
    }

    currentPinDetail = data.content;

    // Gán dữ liệu lên modal
    document.getElementById("modalPinImage").src = currentPinDetail.duong_dan;
    document.getElementById("modalPinTitle").textContent = currentPinDetail.ten_hinh;
    document.getElementById("modalPinDesc").textContent = currentPinDetail.mo_ta || "Bức ảnh chưa có phần mô tả chi tiết.";
    document.getElementById("modalCreatorName").textContent = currentPinDetail.nguoi_dung?.ho_ten || "Tác giả";
    document.getElementById("modalCreatorAvatar").src = currentPinDetail.nguoi_dung?.anh_dai_dien || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
    document.getElementById("modalPinDate").textContent = `Đăng ngày ${new Date(currentPinDetail.ngay_tao).toLocaleDateString('vi-VN')}`;
    document.getElementById("modalDownloadBtn").href = currentPinDetail.duong_dan;

    // Kiểm tra trạng thái đã lưu hay chưa bằng API GET check-saved
    await checkSavedStatus(pinId);

    // Tải danh sách bình luận bằng API GET comments
    await loadPinComments(pinId);

    // Mở modal
    document.getElementById("pinDetailModal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } catch (err) {
    showToast("Lỗi khi mở chi tiết hình ảnh");
  }
}

function closePinDetail() {
  document.getElementById("pinDetailModal").classList.add("hidden");
  document.body.style.overflow = "auto";
  currentPinDetail = null;
}

// Kiểm tra ảnh đã lưu chưa
async function checkSavedStatus(pinId) {
  const saveBtn = document.getElementById("modalSaveBtn");
  if (!token) {
    saveBtn.textContent = "Lưu";
    saveBtn.classList.remove("saved");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/images/check-saved/${pinId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.statusCode === 200 && data.content.daLuu) {
      saveBtn.textContent = "Đã lưu";
      saveBtn.classList.add("saved");
    } else {
      saveBtn.textContent = "Lưu";
      saveBtn.classList.remove("saved");
    }
  } catch (e) {
    saveBtn.textContent = "Lưu";
    saveBtn.classList.remove("saved");
  }
}

// Tải danh sách bình luận
async function loadPinComments(pinId) {
  try {
    const res = await fetch(`${API_BASE}/comments/image/${pinId}`);
    const data = await res.json();
    const commentsList = document.getElementById("modalCommentsList");
    commentsList.innerHTML = "";

    if (data.statusCode === 200) {
      document.getElementById("modalCommentCount").textContent = data.content.length;
      if (data.content.length === 0) {
        commentsList.innerHTML = `<p style="color: #888; font-size: 13.5px; padding: 10px 0;">Chưa có bình luận nào. Hãy là người đầu tiên để lại nhận xét!</p>`;
        return;
      }

      data.content.forEach(c => {
        const item = document.createElement("div");
        item.className = "comment-item";
        item.innerHTML = `
          <img src="${c.nguoi_dung?.anh_dai_dien || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" alt="">
          <div class="comment-bubble">
            <span class="comment-author">${c.nguoi_dung?.ho_ten || 'Người dùng'}</span>
            <span class="comment-text">${c.noi_dung}</span>
          </div>
        `;
        commentsList.appendChild(item);
      });
    }
  } catch (e) {
    console.error("Lỗi tải bình luận:", e);
  }
}

// Đăng bình luận
async function submitComment() {
  if (!token) {
    showToast("Vui lòng đăng nhập để gửi bình luận!");
    openAuthModal("login");
    return;
  }

  const input = document.getElementById("commentInput");
  const content = input.value.trim();
  if (!content || !currentPinDetail) return;

  try {
    const res = await fetch(`${API_BASE}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        hinh_id: currentPinDetail.hinh_id,
        noi_dung: content
      })
    });

    const data = await res.json();
    if (data.statusCode === 201) {
      input.value = "";
      showToast("Đã gửi bình luận!");
      await loadPinComments(currentPinDetail.hinh_id);
    } else {
      showToast(data.message || "Gửi bình luận thất bại");
    }
  } catch (e) {
    showToast("Lỗi kết nối khi gửi bình luận");
  }
}

function handleCommentKeyPress(e) {
  if (e.key === "Enter") {
    submitComment();
  }
}

// Lưu / Bỏ lưu ảnh (Toggle Save)
async function handleToggleSaveModal() {
  if (!token) {
    showToast("Vui lòng đăng nhập để lưu hình ảnh!");
    openAuthModal("login");
    return;
  }

  if (!currentPinDetail) return;

  try {
    const res = await fetch(`${API_BASE}/images/save/${currentPinDetail.hinh_id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.statusCode === 200 || data.statusCode === 201) {
      const isSaved = data.content.daLuu;
      const saveBtn = document.getElementById("modalSaveBtn");
      if (isSaved) {
        saveBtn.textContent = "Đã lưu";
        saveBtn.classList.add("saved");
        showToast("Đã lưu hình ảnh vào bộ sưu tập!");
      } else {
        saveBtn.textContent = "Lưu";
        saveBtn.classList.remove("saved");
        showToast("Đã hủy lưu hình ảnh");
      }
    }
  } catch (e) {
    showToast("Lỗi khi thao tác lưu hình ảnh");
  }
}

// Quick Save trên thẻ ảnh
async function handleQuickSave(e, pinId) {
  e.stopPropagation();
  if (!token) {
    showToast("Vui lòng đăng nhập để lưu hình ảnh!");
    openAuthModal("login");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/images/save/${pinId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.statusCode === 200 || data.statusCode === 201) {
      if (data.content.daLuu) {
        e.target.textContent = "Đã lưu";
        e.target.classList.add("saved");
        showToast("Đã lưu hình ảnh!");
      } else {
        e.target.textContent = "Lưu";
        e.target.classList.remove("saved");
        showToast("Đã hủy lưu hình ảnh");
      }
    }
  } catch (err) {
    showToast("Lỗi lưu ảnh");
  }
}

// Xóa hình ảnh
async function handleDeletePin(e, pinId) {
  e.stopPropagation();
  if (!confirm("Bạn có chắc chắn muốn xóa hình ảnh này không?")) return;

  try {
    const res = await fetch(`${API_BASE}/images/${pinId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.statusCode === 200) {
      showToast("Đã xóa hình ảnh thành công!");
      if (currentView === "profile") {
        loadProfileData();
      } else {
        loadFeedImages();
      }
    } else {
      showToast(data.message || "Xóa ảnh thất bại");
    }
  } catch (err) {
    showToast("Lỗi khi xóa hình ảnh");
  }
}

// ================= SEARCH =================
function setupSearchListener() {
  const searchInput = document.getElementById("searchInput");
  const btnClearSearch = document.getElementById("btnClearSearch");

  searchInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val) {
      btnClearSearch.classList.remove("hidden");
    } else {
      btnClearSearch.classList.add("hidden");
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (currentView !== "home") switchView("home");
      searchImages(val);
    }, 350);
  });
}

function clearSearch() {
  const searchInput = document.getElementById("searchInput");
  searchInput.value = "";
  document.getElementById("btnClearSearch").classList.add("hidden");
  searchImages("");
}

function quickSearch(tag) {
  const searchInput = document.getElementById("searchInput");
  searchInput.value = tag;
  document.getElementById("btnClearSearch").classList.remove("hidden");
  if (currentView !== "home") switchView("home");
  searchImages(tag);
}

// ================= VIEWS NAVIGATION =================
function switchView(viewName) {
  currentView = viewName;
  const heroBanner = document.getElementById("heroBanner");
  const pinGrid = document.getElementById("pinGrid");
  const profileView = document.getElementById("profileView");
  const sectionHeader = document.querySelector(".section-header");
  const btnNavHome = document.getElementById("btnNavHome");
  const btnNavSaved = document.getElementById("btnNavSaved");

  btnNavHome.classList.remove("active");
  btnNavSaved.classList.remove("active");

  if (viewName === "home") {
    btnNavHome.classList.add("active");
    heroBanner.classList.remove("hidden");
    sectionHeader.classList.remove("hidden");
    pinGrid.classList.remove("hidden");
    profileView.classList.add("hidden");
    document.getElementById("sectionTitle").textContent = "Khám phá hôm nay";
    loadFeedImages();
  } else if (viewName === "saved") {
    btnNavSaved.classList.add("active");
    heroBanner.classList.add("hidden");
    sectionHeader.classList.remove("hidden");
    pinGrid.classList.remove("hidden");
    profileView.classList.add("hidden");
    document.getElementById("sectionTitle").textContent = "Bộ sưu tập ảnh đã lưu của tôi";
    loadSavedFeed();
  } else if (viewName === "profile") {
    heroBanner.classList.add("hidden");
    sectionHeader.classList.add("hidden");
    pinGrid.classList.add("hidden");
    profileView.classList.remove("hidden");
    loadProfileData();
  }
}

function handleNavSaved() {
  if (!token) {
    showToast("Vui lòng đăng nhập để xem ảnh đã lưu!");
    openAuthModal("login");
    return;
  }
  switchView("saved");
}

async function loadSavedFeed() {
  if (!currentUser) return;
  try {
    const res = await fetch(`${API_BASE}/images/saved-by-user/${currentUser.nguoi_dung_id}`);
    const data = await res.json();
    if (data.statusCode === 200) {
      renderMasonryGrid(data.content, "pinGrid");
      document.getElementById("pinCountBadge").textContent = `${data.content.length} bức ảnh`;
    }
  } catch (e) {
    showToast("Lỗi tải ảnh đã lưu");
  }
}

// ================= PROFILE PAGE =================
let profileActiveTab = "created";

async function loadProfileData() {
  if (!token || !currentUser) {
    switchView("home");
    return;
  }

  try {
    // 1. Lấy thông tin user
    const resUser = await fetch(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dataUser = await resUser.json();
    if (dataUser.statusCode === 200) {
      const u = dataUser.content;
      document.getElementById("profileAvatar").src = u.anh_dai_dien || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200";
      document.getElementById("profileName").textContent = u.ho_ten;
      document.getElementById("profileEmail").textContent = u.email;
    }

    // 2. Lấy số lượng ảnh đã tạo
    const resCreated = await fetch(`${API_BASE}/images/created-by-user/${currentUser.nguoi_dung_id}`);
    const dataCreated = await resCreated.json();
    const createdImages = dataCreated.statusCode === 200 ? dataCreated.content : [];
    document.getElementById("statCreatedCount").textContent = createdImages.length;

    // 3. Lấy số lượng ảnh đã lưu
    const resSaved = await fetch(`${API_BASE}/images/saved-by-user/${currentUser.nguoi_dung_id}`);
    const dataSaved = await resSaved.json();
    const savedImages = dataSaved.statusCode === 200 ? dataSaved.content : [];
    document.getElementById("statSavedCount").textContent = savedImages.length;

    // Render tab hiện tại
    if (profileActiveTab === "created") {
      renderMasonryGrid(createdImages, "profileGrid", true);
    } else {
      renderMasonryGrid(savedImages, "profileGrid", false);
    }
  } catch (err) {
    showToast("Lỗi tải thông tin trang cá nhân");
  }
}

function switchProfileTab(tab) {
  profileActiveTab = tab;
  document.getElementById("tabCreated").classList.toggle("active", tab === "created");
  document.getElementById("tabSaved").classList.toggle("active", tab === "saved");
  loadProfileData();
}

// ================= AUTH MODAL =================
function openAuthModal(tab = "login") {
  document.getElementById("authModal").classList.remove("hidden");
  switchAuthTab(tab);
}

function closeAuthModal() {
  document.getElementById("authModal").classList.add("hidden");
}

function switchAuthTab(tab) {
  const tabBtnLogin = document.getElementById("tabBtnLogin");
  const tabBtnRegister = document.getElementById("tabBtnRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const modalTitle = document.getElementById("authModalTitle");

  if (tab === "login") {
    tabBtnLogin.classList.add("active");
    tabBtnRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    modalTitle.textContent = "Chào mừng bạn đến với Pinterest";
  } else {
    tabBtnLogin.classList.remove("active");
    tabBtnRegister.classList.add("active");
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    modalTitle.textContent = "Tạo tài khoản Pinterest mới";
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const mat_khau = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, mat_khau })
    });
    const data = await res.json();

    if (data.statusCode === 200) {
      token = data.content.token;
      currentUser = data.content.user;
      localStorage.setItem("pinterest_token", token);
      localStorage.setItem("pinterest_user", JSON.stringify(currentUser));

      updateNavbarAuthUI();
      closeAuthModal();
      showToast(`Chào mừng ${currentUser.ho_ten} quay trở lại! 🎉`);
      if (currentView === "home") loadFeedImages();
    } else {
      showToast(data.message || "Đăng nhập thất bại");
    }
  } catch (err) {
    showToast("Lỗi kết nối khi đăng nhập");
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const ho_ten = document.getElementById("regFullName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const mat_khau = document.getElementById("regPassword").value;
  const tuoi = document.getElementById("regAge").value;
  const anh_dai_dien = document.getElementById("regAvatar").value.trim();

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ho_ten, email, mat_khau, tuoi, anh_dai_dien })
    });
    const data = await res.json();

    if (data.statusCode === 201) {
      showToast("Đăng ký tài khoản thành công! Đang tự động đăng nhập...");
      // Tự động đăng nhập
      document.getElementById("loginEmail").value = email;
      document.getElementById("loginPassword").value = mat_khau;
      switchAuthTab("login");
      handleLoginSubmit(e);
    } else {
      showToast(data.message || "Đăng ký thất bại");
    }
  } catch (err) {
    showToast("Lỗi kết nối khi đăng ký");
  }
}

function logout() {
  localStorage.removeItem("pinterest_token");
  localStorage.removeItem("pinterest_user");
  token = null;
  currentUser = null;
  updateNavbarAuthUI();
  showToast("Đã đăng xuất tài khoản");
  switchView("home");
}

// ================= CREATE PIN MODAL =================
function openCreateModal() {
  if (!token) {
    showToast("Vui lòng đăng nhập để tạo hình ảnh mới!");
    openAuthModal("login");
    return;
  }
  document.getElementById("createPinModal").classList.remove("hidden");
}

function closeCreateModal() {
  document.getElementById("createPinModal").classList.add("hidden");
}

function previewPinImage(url) {
  const box = document.getElementById("imagePreviewContainer");
  const img = document.getElementById("imagePreview");
  if (url && url.startsWith("http")) {
    img.src = url;
    box.classList.remove("hidden");
  } else {
    box.classList.add("hidden");
  }
}

async function handleCreatePinSubmit(e) {
  e.preventDefault();
  const ten_hinh = document.getElementById("createPinTitle").value.trim();
  const duong_dan = document.getElementById("createPinUrl").value.trim();
  const mo_ta = document.getElementById("createPinDesc").value.trim();

  try {
    const res = await fetch(`${API_BASE}/images`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ten_hinh, duong_dan, mo_ta })
    });

    const data = await res.json();
    if (data.statusCode === 201) {
      showToast("Đã đăng tải hình ảnh mới thành công! 🚀");
      closeCreateModal();
      document.getElementById("createPinForm").reset();
      document.getElementById("imagePreviewContainer").classList.add("hidden");
      switchView("home");
    } else {
      showToast(data.message || "Tải ảnh thất bại");
    }
  } catch (err) {
    showToast("Lỗi kết nối khi tải ảnh");
  }
}

// ================= TOAST HELPER =================
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3500);
}
