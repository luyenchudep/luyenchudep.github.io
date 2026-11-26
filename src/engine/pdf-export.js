/* ================== XUẤT VỞ PDF CHUẨN REMARKABLE & IN A4/A5 (100% OFFLINE) ================== */
const PDF_PRESETS={
  rm2:{name:"reMarkable 2",ptW:445,ptH:593,pxW:1404,pxH:1872,bar:126,mono:true,desc:"157×209mm · màn hình mực điện tử đen trắng"},
  rmpp:{name:"reMarkable Paper Pro",ptW:508,ptH:678,pxW:1620,pxH:2160,bar:138,mono:false,desc:"179×239mm · màn hình mực điện tử màu"},
  a4:{name:"Giấy A4 (In ấn)",ptW:595.28,ptH:841.89,pxW:1654,pxH:2339,bar:76,mono:false,desc:"210×297mm · in sắc nét"},
  a5:{name:"Sổ tay A5",ptW:419.53,ptH:595.28,pxW:1240,pxH:1754,bar:64,mono:false,desc:"148×210mm · gọn nhẹ"}
};
const pdfOpt={preset:"rm2",scope:"cur",mode:"to",grid:null,barSide:"left",arrows:true,busy:false};

function openPdfModal(keepScroll=false){
  if(pdfOpt.busy){toast("Đang tạo PDF — chờ xong rồi đổi tùy chọn");return}
  if(pdfOpt.grid===null)pdfOpt.grid=S.gridStyle||"french";
  const curL=LESSONS[cur.li],pr=PDF_PRESETS[pdfOpt.preset];
  document.getElementById("genBox").innerHTML=`<h3>${ic("download")} Xuất tập viết PDF</h3>
  <div class="prog">Tạo tập viết PDF sắc nét ngay trên máy, không cần mạng — canh đúng tỉ lệ màn hình reMarkable, chừa lề thanh công cụ và có <b>mục lục chạm để chuyển trang</b>.</div>
  <div class="row"><span>Khổ giấy hoặc máy</span><div class="seg">${[["rm2","reMarkable 2"],["rmpp","Paper Pro"],["a4","A4"],["a5","A5"]].map(([v,t])=>`<button class="${pdfOpt.preset===v?"on":""}" onclick="pdfOpt.preset='${v}';openPdfModal(true)">${t}</button>`).join("")}</div></div>
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


