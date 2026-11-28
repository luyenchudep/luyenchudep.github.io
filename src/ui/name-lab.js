/* ================== LUYỆN TÊN RIÊNG & CHỮ KÝ (NAME & SIGNATURE LAB) ================== */
function openNameLab(){
  const prev=store.get("myName","");
  document.getElementById("genBox").innerHTML=`<h3>${ic("sign")} Luyện tên riêng và chữ ký</h3>
  <div class="prog">Nhập họ tên hoặc chữ ký bạn muốn luyện. Ứng dụng sẽ tự tạo bài tập từ cỡ lớn, ghép tên, tới câu giới thiệu hoàn chỉnh.</div>
  <input id="nameInp" type="text" value="${prev.replace(/"/g,"&quot;")}" placeholder="Ví dụ: Anna · An An · Minh Minh · Đăng Định" style="width:100%;font:inherit;font-size:18px;padding:12px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);color:var(--ink)">
  <button class="btn primary" onclick="applyNameLab()">Tạo bài luyện tên và tập ngay</button>
  <button class="btn ghost" onclick="closeSheets()">Đóng</button>`;
  openSheet("gen");
}
let nameArm=false;
function applyNameLab(){
  const nm=(document.getElementById("nameInp").value||"").trim();
  if(!nm){toast("Nhập tên bạn muốn luyện trước nha");return}
  const parts=nm.split(/\s+/),last=parts[parts.length-1],sp=SCRIPT==="th"?" ":"   ";
  const txt=[nm,`${nm}${sp}${nm}`,last!==nm?`${last}${sp}${last}${sp}${last}`:"",`Trân trọng, ${nm}.`].filter(Boolean).join("\n");
  const old=store.get("custom","");
  if(old.trim()&&old!==txt&&old!==store.get("nameLabTxt","")&&!nameArm){
    nameArm=true;const bt=document.querySelector("#genBox .btn.primary");
    if(bt)bt.textContent="Bài tự do đang có nội dung của bạn — chạm lần nữa để thay (nội dung cũ vẫn được giữ lại)";
    setTimeout(()=>{nameArm=false},5000);return}
  nameArm=false;
  if(old.trim()&&old!==txt)store.set("customPrev",old);
  store.set("myName",nm);store.set("nameLabTxt",txt);
  store.set("custom",txt);
  closeSheets();
  {const i=LESSONS.findIndex(l=>l.id==="free");if(i>=0)openLesson(i,"to")}
  toast("Đã tạo bài luyện tên và chữ ký!");
}

