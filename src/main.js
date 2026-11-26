/* ================== KHỞI ĐỘNG ================== */
function resize(){
  if(exporting){pendingResize=true;return}
  if(live)endStroke();if(zbox.live)endZBoxStroke();
  applySplit();
  const st=document.getElementById("canvasWrap").getBoundingClientRect();
  DPR=Math.min(window.devicePixelRatio||1,3);W=Math.max(200,Math.floor(st.width));H=Math.max(120,Math.floor(st.height));
  for(const c of [bg,ink,fx]){c.width=W*DPR;c.height=H*DPR;c.style.width=W+"px";c.style.height=H+"px"}
  bctx=bg.getContext("2d");
  show();
  const card=document.getElementById("card");
  if(card&&card.classList.contains("open")&&animState.ch)(animState.mode==="quiz"?drawQuizFrame():drawAnimFrame());
}
let rT=0;window.addEventListener("resize",()=>{clearTimeout(rT);rT=setTimeout(resize,150)});
document.addEventListener("contextmenu",e=>e.preventDefault());
(async()=>{
  try{await Promise.all([document.fonts.load("400 20px 'PS'","Tập viết ỡ Ổ"),document.fonts.load("400 20px 'AL'","Tập viết ỡ"),document.fonts.load("500 20px 'QS'","Aăâđ Tập viết ỡ")]);await document.fonts.ready}catch(e){}
  if(SCRIPT==="qs"&&!store.get("importedV3",false)){try{
    const od=localStorage.getItem("tv3:done"),oc=localStorage.getItem("tv3:custom");
    if(od&&!localStorage.getItem("qs1:done")){localStorage.setItem("qs1:done",od);done=new Set(JSON.parse(od))}
    if(oc&&!localStorage.getItem("qs1:custom"))localStorage.setItem("qs1:custom",oc);
    if(od||oc)setTimeout(()=>toast("Đã nhận tiến độ và bài tự do từ bản 3"),1200)}catch(e){}store.set("importedV3",true)}
  /* Đăng ký PWA Manifest động để cài lên màn hình chính Samsung Phone / Galaxy Tab */
  try{
    const mf={name:"Tập viết S Pen",short_name:"Tập viết",display:"standalone",background_color:"#F7F2E7",theme_color:"#F7F2E7"};
    const lk=document.createElement("link");lk.rel="manifest";lk.href="data:application/manifest+json,"+encodeURIComponent(JSON.stringify(mf));
    document.head.appendChild(lk);
  }catch(_){}
  if(!GS.get("v45Tip",false)){GS.set("v45Tip",true);setTimeout(()=>toast("Mẹo: mở ① Xem rồi chọn Tự tô từng nét để tập từng nét bằng S Pen"),3800)}
  if(!GS.get("v42Init",false)){S.favBar=false;saveS();GS.set("v42Init",true);setTimeout(()=>toast("Mẹo: nhấn giữ nút Viết để chọn nhanh viết yêu thích"),1800)}
  applyTheme();
  resize();
  if(paperDue()&&store.get("paperLast",null))setTimeout(()=>toast("Đã 2 tuần rồi — tới lúc kiểm tra chữ trên giấy (☰ → Công cụ → Kiểm tra trên giấy)"),2500);
  let ok=false;try{localStorage.setItem("td1:probe","1");ok=localStorage.getItem("td1:probe")==="1"}catch(e){}
  if(!ok)document.getElementById("warn").style.display="block";
  if(!store.get("seenGuide3",false)&&!location.hash.startsWith("#cfg=")){store.set("seenGuide3",true);setTimeout(openNhapMon,300)}
  apDungCfgTuLink();
})();
