/* ================== KHUNG 4 KHU (bản 0.14) ==================
   Thanh điều hướng 4 khu: Luyện viết, Giáo trình, Tập viết PDF, Hồ sơ.
   - Máy tính bảng, máy tính: thanh dọc bên trái (tay trái: bên phải), ẩn hiện bằng nút ☰; app nhớ trạng thái.
   - Điện thoại dọc: thanh 4 nút dưới cùng.
   Bộ xử lý nút chung: phần tử có data-action="tên" gọi HANH_DONG[tên](phần tử, sự kiện). Giao diện mới dùng cách này
   thay cho thuộc tính onclick trong chuỗi HTML (dễ bảo trì, và để bật được chính sách bảo mật nội dung CSP).
   Các sự kiện khác cũng theo cách đó, mỗi loại một thuộc tính:
     data-action (click) · data-doi (change) · data-nhap (input) · data-mo (toggle của <details>) · data-nhan (pointerdown)
   Ví dụ: <input data-nhap="coViet"> gọi HANH_DONG.coViet(phần tử, sự kiện) mỗi lần gõ. App không còn thuộc tính on…= nào. */
function goiHanhDong(ten, el, e) {
  const f = HANH_DONG[ten];
  if (typeof f === "function") f(el, e);
  else console.warn("Chưa có hành động:", ten);
}
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest("[data-action]");
  if (!el) return;
  if (el.tagName === "A") e.preventDefault();
  goiHanhDong(el.dataset.action, el, e);
});
/* toggle không nổi lên nên bắt cả bốn ở pha capture. change, input, toggle: thuộc tính đặt ngay trên phần tử phát sự kiện
   (ô nhập, <details>), không tìm lên cha để <details> lồng nhau không gọi nhầm. pointerdown: tìm lên phần tử gần nhất. */
for (const [loai, khoa, timLen] of [["change", "doi"], ["input", "nhap"], ["toggle", "mo"], ["pointerdown", "nhan", true]]) {
  document.addEventListener(loai, e => {
    const t = e.target;
    const el = !t || !t.closest ? null : timLen ? t.closest(`[data-${khoa}]`) : (t.dataset && t.dataset[khoa] ? t : null);
    if (el) goiHanhDong(el.dataset[khoa], el, e);
  }, true);
}

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
/* Các khu mở thành trang đầy đủ (không phải bảng trượt) */
function datTrang(id) { document.querySelectorAll(".sheet.trang").forEach(s => s.classList.remove("trang")); if (id) { const s = document.getElementById(id); if (s) s.classList.add("trang"); } lopBang(); }
/* body.coBang: đang mở một bảng; body.coTrang: đang mở một khu dạng trang (CSS dùng để ẩn thanh công cụ nổi, nút góc) */
function lopBang() {
  document.body.classList.toggle("coBang", !!document.querySelector(".sheet.open"));
  document.body.classList.toggle("coTrang", !!document.querySelector(".sheet.open.trang"));
}
/* Nút tải xuống trên từng bài trong Giáo trình: mở Tập viết PDF đúng bài đó, không đổi bài đang tập */
HANH_DONG.pdfBai = el => {
  if (pdfBusyFlag) { toast("Đang tạo PDF, chờ xong rồi chuyển khu"); return; }
  const l = LESSONS.find(x => x.id === el.dataset.id);
  if (l) { const i = LESSONS.indexOf(l); pdfOpt.scope = i === cur.li ? "cur" : "pick"; pdfOpt.lessons = [l.id]; }
  closeSheets(); openPdfModal(); datTrang("gen"); datKhu("pdf");
};
HANH_DONG.moKhu = el => {
  const k = el.dataset.khu;
  if (typeof pdfBusyFlag !== "undefined" && pdfBusyFlag) { toast("Đang tạo PDF, chờ xong rồi chuyển khu"); return; }
  if (k === "luyen") { closeSheets(); datKhu("luyen"); return; }
  if (k === "giaotrinh") { closeSheets(); openMenu(); datTrang("menu"); datKhu("giaotrinh"); return; }
  if (k === "pdf") { closeSheets(); openPdfModal(); datTrang("gen"); datKhu("pdf"); return; }
  if (k === "hoso") { closeSheets(); openMenu(); setMenuTab("cai"); datTrang("menu"); datKhu("hoso"); }
};

/* Ẩn hiện thanh bên (máy tính bảng, máy tính); điện thoại luôn hiện thanh dưới */
function apThanhKhu() { document.body.classList.toggle("navAn", !!GS.get("navAn", false)); datCongCu(); setTimeout(resize, 30); }

/* Công cụ viết (Trước, Viết, Gôm, Hoàn tác, Sau):
   - điện thoại dọc: hàng dưới trang như cũ;
   - máy tính bảng, máy tính: nằm trong thanh bên, dưới 4 khu (một thanh dọc thay vì hai);
   - thanh bên ẩn hoặc Toàn trang viết: thanh nhỏ nổi ở cạnh dưới trang. */
const DT_DOC = matchMedia("(max-width:700px) and (orientation:portrait)");
function datCongCu() {
  const f = document.querySelector("footer"); if (!f) return;
  const b = document.body, noi = b.classList.contains("navAn") || b.classList.contains("tapTrung");
  const dich = DT_DOC.matches ? document.getElementById("app") : noi ? b : document.getElementById("navKhu");
  if (f.parentElement !== dich) dich.appendChild(f);
  b.classList.toggle("congCuRail", dich.id === "navKhu");
  b.classList.toggle("congCuNoi", dich === b);
}
DT_DOC.addEventListener("change", () => { datCongCu(); setTimeout(resize, 30); });

/* Ngăn kéo Xem (màn rộng): nổi đè lên trang viết, không làm hẹp trang; tự đóng khi đặt viết xuống trang; ghim được */
const laManRong = () => document.body.classList.contains("split");
function moNganXem(mo) {
  const truoc = document.body.classList.contains("xemMo");
  document.body.classList.toggle("xemMo", mo); if (mo) renderSidePane();
  const x = document.getElementById("mXem"); if (x) x.classList.toggle("on", mo);
  if (S.xemGhim && truoc !== mo) setTimeout(resize, 30);   /* bảng ghim nằm cạnh trang nên trang đổi bề ngang */
}
HANH_DONG.moXem = () => {
  if (!laManRong()) { openCard(); return; }
  moNganXem(!document.body.classList.contains("xemMo"));
};
/* Chọn Tô hay Chép thì đóng bảng Xem */
{ const datCheDoCu = setMode; setMode = function (...a) { moNganXem(false); return datCheDoCu.apply(this, a); }; }
HANH_DONG.dongXem = () => { if (S.xemGhim) { S.xemGhim = false; saveS(); apGhimXem(); } moNganXem(false); };
HANH_DONG.ghimXem = () => { S.xemGhim = !S.xemGhim; saveS(); apGhimXem(); if (S.xemGhim) moNganXem(true); };
function apGhimXem() {
  document.body.classList.toggle("xemGhim", !!S.xemGhim);
  const b = document.getElementById("bGhimXem"); if (b) { b.classList.toggle("on", !!S.xemGhim); b.setAttribute("aria-pressed", S.xemGhim ? "true" : "false"); }
  setTimeout(resize, 30);
}
for (const id of ["ink", "zboxCv"]) { const c = document.getElementById(id); if (c) c.addEventListener("pointerdown", () => { if (!S.xemGhim && document.body.classList.contains("xemMo")) moNganXem(false); }, true); }

/* Toàn trang viết: ẩn thanh đầu, thanh bên, bảng Xem; công cụ thành thanh nổi; nút Thoát ở góc */
HANH_DONG.tapTrung = () => {
  document.body.classList.toggle("tapTrung");
  if (document.body.classList.contains("tapTrung")) moNganXem(false);
  datCongCu(); setTimeout(resize, 30);
};
HANH_DONG.anThanhKhu = () => { GS.set("navAn", true); apThanhKhu(); };
HANH_DONG.hienThanhKhu = () => { GS.set("navAn", false); apThanhKhu(); };

/* Đóng hết bảng thì quay về khu Luyện viết (bọc closeSheets, thay cho theo dõi mọi thay đổi trên trang).
   Đang tạo PDF thì không đóng được: trả về false để openSheet không mở chồng bảng mới lên. */
let dangMoBang = false;
{ const dongCu = closeSheets; closeSheets = function (...a) {
  if (pdfBusyFlag) { dongCu.apply(this, a); return false; }
  dongCu.apply(this, a);
  if (!document.querySelector(".sheet.open")) { if (!dangMoBang) datKhu("luyen"); datTrang(null); }
  lopBang(); return true;
}; }
/* Mở một bảng: bỏ dạng trang còn sót (VD Nhật ký mở vào #gen đang là trang Tập viết PDF); giữ khu đang sáng
   khi mở bảng con từ một khu (VD Nhật ký từ Hồ sơ). Khu dạng trang gọi datTrang ngay sau đó. */
{ const moCu = openSheet; openSheet = function (id, ...a) {
  const el = document.getElementById(id); if (!el) return;
  if (!el.classList.contains("open") && document.querySelector(".sheet.open") && pdfBusyFlag) { toast("Đang tạo PDF — chờ xong rồi mở"); return; }
  el.classList.remove("trang");
  dangMoBang = true; try { moCu.call(this, id, ...a); } finally { dangMoBang = false; }
  lopBang();
}; }
/* Vẽ lại nội dung khu (đổi lựa chọn trong Tập viết PDF, Giáo trình, Hồ sơ) thì giữ dạng trang */
{ const veCu = openPdfModal; openPdfModal = function (...a) { const kq = veCu.apply(this, a); if (khuDang === "pdf") datTrang("gen"); return kq; }; }
{ const veCu = openMenu; openMenu = function (...a) { const kq = veCu.apply(this, a); if (khuDang === "giaotrinh" || khuDang === "hoso") datTrang("menu"); return kq; }; }
/* Nút ☰ trên thanh đầu mở khu Giáo trình */
{ const b = document.getElementById("bMenu"); if (b) { b.removeAttribute("onclick"); b.dataset.action = "moKhu"; b.dataset.khu = "giaotrinh"; } }

dungThanhKhu();
apGhimXem();
apThanhKhu();
