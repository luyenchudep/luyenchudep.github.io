/* ================== KHUNG 4 KHU (bản 0.14) ==================
   Thanh điều hướng 4 khu: Luyện viết, Giáo trình, Tập viết PDF, Hồ sơ.
   - Máy tính bảng, máy tính: thanh dọc bên trái (tay trái: bên phải), ẩn hiện bằng nút ☰; app nhớ trạng thái.
   - Điện thoại dọc: thanh 4 nút dưới cùng.
   Bộ xử lý nút chung: phần tử có data-action="tên" gọi HANH_DONG[tên](phần tử, sự kiện). Giao diện mới dùng cách này
   thay cho onclick="…" trong chuỗi HTML (dễ bảo trì, và để bật được chính sách bảo mật nội dung CSP). */
document.addEventListener("click", e => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const f = HANH_DONG[el.dataset.action];
  if (typeof f === "function") { e.preventDefault(); f(el, e); }
});

const KHU = [
  ["luyen", "Luyện viết", '<path d="M12 3 17 9l-2.5 9h-5L7 9z"/><path d="M12 3v7.5"/><circle cx="12" cy="11.5" r="1.3"/><path d="M9.5 21h5"/>'],
  ["giaotrinh", "Giáo trình", '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5z"/>'],
  ["pdf", "Tập viết PDF", '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'],
  ["hoso", "Hồ sơ", '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>'],
];
let khuDang = "luyen";

function dungThanhKhu() {
  const nav = document.getElementById("navKhu"); if (!nav) return;
  const nut = ([k, ten, ve]) => `<button type="button" class="khu${k === khuDang ? " on" : ""}" data-action="moKhu" data-khu="${k}" aria-label="${ten}"${k === khuDang ? ' aria-current="page"' : ""}><svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ve}</svg><span>${ten}</span></button>`;
  nav.innerHTML = `<button type="button" class="khuAn" data-action="anThanhKhu" aria-label="Ẩn thanh điều hướng"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>` + KHU.map(nut).join("");
  const mo = document.getElementById("navMo");
  if (mo) mo.innerHTML = `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
}
function datKhu(k) {
  if (khuDang === k) return;
  khuDang = k;
  document.querySelectorAll("#navKhu .khu").forEach(b => { const on = b.dataset.khu === k; b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
}
HANH_DONG.moKhu = el => {
  const k = el.dataset.khu;
  if (k === "luyen") { closeSheets(); datKhu("luyen"); return; }
  if (k === "giaotrinh") { closeSheets(); openMenu(); datKhu("giaotrinh"); return; }
  if (k === "pdf") { closeSheets(); openPdfModal(); datKhu("pdf"); return; }
  if (k === "hoso") { closeSheets(); openMenu(); setMenuTab("cai"); datKhu("hoso"); }
};

/* Ẩn hiện thanh bên (máy tính bảng, máy tính); điện thoại luôn hiện thanh dưới */
function apThanhKhu() { document.body.classList.toggle("navAn", !!GS.get("navAn", false)); setTimeout(resize, 30); }
HANH_DONG.anThanhKhu = () => { GS.set("navAn", true); apThanhKhu(); };
HANH_DONG.hienThanhKhu = () => { GS.set("navAn", false); apThanhKhu(); };

/* Đóng hết bảng thì quay về khu Luyện viết */
new MutationObserver(() => { if (!document.querySelector(".sheet.open")) datKhu("luyen"); })
  .observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

dungThanhKhu();
apThanhKhu();
