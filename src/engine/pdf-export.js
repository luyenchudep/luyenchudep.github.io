/* ================== XUẤT VỞ PDF CHUẨN REMARKABLE & IN A4/A5 (100% OFFLINE) ================== */
/* Khổ trang lấy từ src/data/presets.js (tính bằng mm); đổi ra pt cho file PDF: 1 mm = 72/25,4 pt */
const MM_SANG_PT = 72 / 25.4;
function khoPdf(k) {
  return { name: k.ten, ptW: k.wMm * MM_SANG_PT, ptH: k.hMm * MM_SANG_PT, pxW: k.pxW, pxH: k.pxH, bar: k.barPx, mono: k.mono, links: k.links, desc: k.moTa, wMm: k.wMm, hMm: k.hMm };
}
const PDF_PRESETS = Object.fromEntries(Object.entries(KHO_TRANG).map(([ma, k]) => [ma, khoPdf(k)]));
/* Khổ tự nhập: rộng × cao (mm), vẽ theo PX_MOI_MM */
function khoTuNhap(wMm, hMm) {
  const w = Number(wMm), h = Number(hMm);
  if (!(w >= 40 && w <= 500 && h >= 40 && h <= 500)) throw new Error("Khổ tự nhập phải từ 40 tới 500 mm mỗi chiều");
  return khoPdf({ ten: `Khổ ${w}×${h} mm`, wMm: w, hMm: h, pxW: Math.round(w * PX_MOI_MM), pxH: Math.round(h * PX_MOI_MM), barPx: 68, mono: false, links: true, moTa: `${w}×${h} mm · khổ tự nhập` });
}
const pdfOpt={preset:"rm2",scope:"cur",mode:"to",grid:null,barSide:"left",arrows:true,busy:false};

function openPdfModal(keepScroll=false){
  if(pdfOpt.busy){toast("Đang tạo PDF — chờ xong rồi đổi tùy chọn");return}
  if(pdfOpt.grid===null)pdfOpt.grid=S.gridStyle||"french";
  const curL=LESSONS[cur.li],pr=PDF_PRESETS[pdfOpt.preset];
  document.getElementById("genBox").innerHTML=`<h3>${ic("download")} Xuất tập viết PDF</h3>
  <div class="prog">Tạo tập viết PDF sắc nét ngay trên máy, không cần mạng — canh đúng tỉ lệ màn hình reMarkable, chừa lề thanh công cụ và có <b>mục lục chạm để chuyển trang</b>.</div>
  <div class="row"><span>Khổ giấy hoặc máy</span><div class="seg">${Object.entries(KHO_TRANG).map(([v,k])=>[v,k.ngan]).map(([v,t])=>`<button class="${pdfOpt.preset===v?"on":""}" onclick="pdfOpt.preset='${v}';openPdfModal(true)">${t}</button>`).join("")}</div></div>
  <div class="prog" style="margin:4px 0 8px"><b>${pr.name}:</b> ${pr.desc}</div>
  <div class="row"><span>Nội dung xuất</span><div class="seg">${[["cur","Bài này"],["part","Cả phần"],["weak","Luyện thêm"],["free","Bài tự do"]].map(([v,t])=>`<button class="${pdfOpt.scope===v?"on":""}" onclick="pdfOpt.scope='${v}';openPdfModal(true)">${t}</button>`).join("")}</div></div>
  <div class="prog" style="margin:4px 0 8px">${pdfOpt.scope==="cur"?`Xuất bài đang mở: <b>${curL.t}</b>`:pdfOpt.scope==="part"?`Xuất toàn bộ <b>${curL.part}</b> kèm trang mục lục.`:pdfOpt.scope==="weak"?`Xuất các chữ yếu trong Luyện thêm (${WEAK.length||"tự lấy Bài ôn"}).`:`Xuất nội dung Bài tự do / Tên riêng của bạn.`}</div>
  <div class="row"><span>Cách tập trên dòng</span><div class="seg">${[["to","② Tô"],["nho","③ Chép"]].map(([v,t])=>`<button class="${pdfOpt.mode===v?"on":""}" onclick="pdfOpt.mode='${v}';openPdfModal(true)">${t}</button>`).join("")}</div></div>
  <div class="row"><span>Kiểu dòng kẻ</span><div class="seg">${[["french","Lưới xiên Pháp"],["oly4","4 ô li Việt Nam"]].map(([v,t])=>`<button class="${pdfOpt.grid===v?"on":""}" onclick="pdfOpt.grid='${v}';openPdfModal(true)">${t}</button>`).join("")}</div></div>
  <div class="row"><span>Chừa lề thanh công cụ</span><div class="seg">${[["left","Lề trái (tay phải)"],["right","Lề phải (tay trái)"]].map(([v,t])=>`<button class="${pdfOpt.barSide===v?"on":""}" onclick="pdfOpt.barSide='${v}';openPdfModal(true)">${t}</button>`).join("")}</div></div>
  <div class="row"><span>Mũi tên thứ tự nét ở chữ mẫu</span><div class="seg">${[[true,"Bật"],[false,"Tắt"]].map(([v,t])=>`<button class="${pdfOpt.arrows===v?"on":""}" onclick="pdfOpt.arrows=${v};openPdfModal(true)">${t}</button>`).join("")}</div></div>
  <div id="pdfProg" class="prog" style="display:none;color:var(--accent);font-weight:700;margin-top:8px"></div>
  <button class="btn primary" id="pdfGoBtn" onclick="generateWorkbookPdf()">${ic("download")}Tạo và tải file PDF</button>
  <button class="btn ghost" onclick="closeSheets()">Đóng</button>`;
  openSheet("gen",keepScroll);
}


