/* ================== BẢNG NỔI (Aa, bút nhanh) ================== */
let popKind="";
function closePop(){const L=document.getElementById("popLayer");if(L)L.classList.remove("open");popKind=""}
function openPop(kind,html,anchor,dir){
  const L=document.getElementById("popLayer"),B=document.getElementById("popBox");
  B.innerHTML=html;L.classList.add("open");popKind=kind;
  const tt=document.getElementById("toast");if(tt){tt.style.opacity=0;clearTimeout(tT)}
  const r=anchor.getBoundingClientRect(),bw=B.offsetWidth,bh=B.offsetHeight,vw=innerWidth,vh=innerHeight;
  let x,y;
  const trongRail=document.body.classList.contains("congCuRail")&&anchor.closest&&anchor.closest("#navKhu");
  if(dir==="up"&&trongRail&&!document.body.classList.contains("lefthand")){x=r.right+8;y=r.top+r.height/2-bh/2}
  else if(dir==="up"&&trongRail){x=r.left-bw-8;y=r.top+r.height/2-bh/2}
  else{x=dir==="down"?r.right-bw:r.left+r.width/2-bw/2;y=dir==="down"?r.bottom+8:r.top-bh-8}
  x=Math.max(8,Math.min(vw-bw-8,x));y=Math.max(8,Math.min(vh-bh-8,y));
  B.style.left=x+"px";B.style.top=y+"px";
}
function openAa(){
  const th=themeName(),acc=S.accent==="black"?"black":"blue";
  const papers=[["sepia","Ấm","#F7F2E7"],["light","Sáng","#FFFFFF"],["dark","Tối","#1B1E23"],["eink","Trắng đen","#FFFFFF"]];
  let h=`<div class="popT">Cỡ dòng kẻ</div>
  <div class="stepRow"><button data-action="aaCoDong" data-buoc="-0.15" aria-label="Thu nhỏ cỡ dòng">${ic("minus")}</button><b>${Math.round(S.scale*100)}%</b><button data-action="aaCoDong" data-buoc="0.15" aria-label="Phóng to cỡ dòng">${ic("plus")}</button></div>
  <div class="popT" style="margin-top:12px">Màu giấy</div>
  <div class="papers4">${papers.map(([v,t,c])=>`<button class="${th===v?"on":""}" data-action="aaMauGiay" data-mau="${escHtml(v)}"><span style="background-color:${c};${v==="eink"?"box-shadow:0 0 0 2px #000":""}"></span>${t}</button>`).join("")}</div>
  <div class="popT" style="margin-top:10px">Màu nhấn</div>
  <div class="popSeg">${[["blue","Xanh mực"],["black","Đen"]].map(([v,t])=>`<button class="${acc===v?"on":""}" data-action="aaMauNhan" data-mau="${escHtml(v)}">${t}</button>`).join("")}</div>`;
  if(isTablet())h+=`<div class="popT" style="margin-top:10px">Chia đôi màn hình (mẫu bên ${S.leftHand?"phải":"trái"})</div>
  <div class="popSeg">${[[true,"Bật"],[false,"Tắt"]].map(([v,t])=>`<button class="${!!S.split===v?"on":""}" data-action="aaChiaDoi" data-bat="${v?"1":"0"}">${t}</button>`).join("")}</div>`;
  h+=`<button class="popBtn" data-action="aaToanMan">${ic(focusOn?"collapse":"expand")}${focusOn?"Thoát toàn màn hình":"Toàn màn hình, ẩn thanh chế độ"}</button>`;
  openPop("aa",h,document.getElementById("bAa"),"down");
}
/* Hành động cho bảng nổi cỡ dòng và màu giấy */
HANH_DONG.aaCoDong=el=>{stepScale(+el.dataset.buoc);openAa()};
HANH_DONG.aaMauGiay=el=>{setTheme(el.dataset.mau);openAa()};
HANH_DONG.aaMauNhan=el=>{S.accent=el.dataset.mau;saveS();applyTheme();openAa()};
HANH_DONG.aaChiaDoi=el=>{const b=el.dataset.bat==="1";if(!!S.split!==b)toggleSplit();setTimeout(openAa,120)};
HANH_DONG.aaToanMan=()=>{closePop();toggleFocus()};
function openFavPop(){
  const h=`<div class="popT">Viết yêu thích</div><div class="favPick">${S.favs.map((f,idx)=>{const p=PEN_MAP[f.penType]||PEN_TYPES[0];
    return `<button class="${tool==="pen"&&S.activeFav===idx?"on":""}" data-action="popVietYeuThich" data-i="${idx}"><span class="fc">${ic(p.ic)}<em style="background:${inkColor(f.color)}"></em></span>${f.name}</button>`}).join("")}</div>
  <button class="popBtn" data-action="popChinhViet">${ic("sliders")}Chỉnh viết, màu mực, cỡ nét</button>`;
  openPop("fav",h,document.getElementById("bPen"),"up");
}
/* Hành động cho bảng nổi chọn nhanh viết yêu thích */
HANH_DONG.popVietYeuThich=el=>{closePop();useFav(+el.dataset.i)};
HANH_DONG.popChinhViet=()=>{closePop();penTap(true)};
(function(){const b=document.getElementById("bPen");let t=0,lp=false;
  b.addEventListener("pointerdown",()=>{lp=false;clearTimeout(t);t=setTimeout(()=>{lp=true;if(navigator.vibrate)try{navigator.vibrate(12)}catch(_){}openFavPop()},450)});
  for(const ev of["pointerup","pointerleave","pointercancel"])b.addEventListener(ev,()=>clearTimeout(t));
  b.addEventListener("click",()=>{if(lp){lp=false;return}penTap()});
})();
window.addEventListener("resize",closePop);

function placeToast(t){try{const r=document.getElementById("canvasWrap").getBoundingClientRect();
  const sheetOpen=!!document.querySelector(".sheet.open");
  if(sheetOpen||r.height<60){t.style.top="calc(env(safe-area-inset-top) + 14px)";t.style.left="50%";t.style.right="auto";t.style.transform="translateX(-50%)";return}
  t.style.transform="none";
  let minL=r.right;for(const id of["redoBtn","grade","cmp"]){const e=document.getElementById(id);if(e&&e.classList.contains("on")){const q=e.getBoundingClientRect();if(q.width)minL=Math.min(minL,S.leftHand?r.right:q.left)}}
  const room=minL-r.left-24;
  if(room>=200){t.style.maxWidth=Math.min(520,room)+"px";t.style.top=(r.top+6)+"px"}else{t.style.maxWidth=Math.min(520,r.width-24)+"px";t.style.top=(r.top+58)+"px"}
  if(S.leftHand){t.style.left="auto";t.style.right=(innerWidth-r.right+12)+"px"}else{t.style.right="auto";t.style.left=(r.left+12)+"px"}}catch(_){}}
