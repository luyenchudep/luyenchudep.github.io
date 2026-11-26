/* ================== CHẾ ĐỘ TẬP & PHÓNG TO / TẬP TRUNG ================== */
/* Phần đang tập: dòng chính của mỗi nhóm (tô rõ ở chế độ Tô, tên chữ ở chế độ Chép) */
function rowItemKey(r){
  if(!r)return null;
  if(r.k==="hint")return r.item||(r.src&&r.src.k==="stroke"?"~"+r.src.s:null);
  if(r.tag==="tô rõ"&&(r.k==="stroke"||r.k==="rep"))return r.k==="stroke"?"~"+r.s:r.s;
  return null;
}
function pageItemOf(pgs,pi){
  for(let i=Math.min(pi,pgs.length-1);i>=0;i--){const k=(pgs[i]||[]).map(rowItemKey).find(Boolean);if(k)return k}
  return null;
}
function pageHasItem(pg,key){return (pg||[]).some(r=>rowItemKey(r)===key)}
function findItemPage(pgs,key){
  if(!key)return -1;
  let i=pgs.findIndex(pg=>pageHasItem(pg,key));
  if(i<0&&key[0]!=="~"&&[...key].length===1)i=pgs.findIndex(pg=>(pg||[]).some(r=>{const k=rowItemKey(r);return k&&k[0]!=="~"&&k.includes(key)}));
  return i;
}
/* Chuyển tới đúng phần cần tập (có thể đổi luôn chế độ). Trả về true nếu đã đổi trang */
function jumpToItem(key,mode){
  mode=mode||cur.mode;
  const r=computePages(LESSONS[cur.li],mode,S.scale,H,0,false),pi=findItemPage(r.pages,key);
  if(pi<0)return false;
  const moved=pi!==cur.page||mode!==cur.mode;
  flushSave();cur.mode=mode;cur.page=pi;comparing=false;show();
  if(moved)toast(`Tới phần: ${charLabel(key).replace(/^Chữ /,"")}`);
  return true;
}
let cardFrom=null;
const POS=store.get("pos",{});
/* Rời bảng Xem: nếu đã chọn phần khác với trang đang mở thì nhảy tới phần đó */
function cardTarget(){
  const ch=animState&&animState.ch,from=cardFrom;cardFrom=null;
  if(!ch||!from||ch===from)return null;
  if(pageHasItem(pages[cur.page],ch))return null;
  return ch;
}
function leaveCard(m){
  const t=cardTarget();closeSheets();
  const key=t||pageItemOf(pages,cur.page);
  if(!(key&&jumpToItem(key,m)))setMode(m);
}
function setMode(m){
  if(m!==cur.mode&&pages.length){const key=pageItemOf(pages,cur.page);
    if(key){const r=computePages(LESSONS[cur.li],m,S.scale,H,0,false),pi=findItemPage(r.pages,key);if(pi>=0)cur.page=pi}}
  flushSave();cur.mode=m;comparing=false;show();if(m==="nho")toast(LESSONS[cur.li].id==="review"?"Viết theo trí nhớ · xong chạm So sánh":"Nhìn mẫu đầu dòng rồi chép tiếp · xong chạm So sánh")}
function pageItems(){return[...new Set((pages[cur.page]||[]).filter(r=>r.item).map(r=>r.item))]}
function grade(ok){const its=pageItems();if(!its.length){toast("Trang này không có chữ để chấm");return}
  for(const it of its){const v=SR[it]||{lv:0};
    if(ok){if(!SR[it])v.lv=0;else if(!v.due||v.due<=today())v.lv=Math.min(v.lv+1,GAP.length-1);v.due=addDays(GAP[v.lv]);WEAK=WEAK.filter(w=>w!==it)}
    else{v.lv=0;v.due=addDays(1);if(!WEAK.includes(it))WEAK.unshift(it)}SR[it]=v}
  WEAK=WEAK.slice(0,40);store.set("sr",SR);store.set("weak",WEAK);
  toast(ok?`✓ Đạt · ôn lại sau ${GAP[SR[its[0]].lv]} ngày`:`Đã thêm ${its.length} mục vào Luyện thêm`);
  comparing=false;
  document.getElementById("cmp").classList.remove("act");
  setCmpLabel();
  document.getElementById("grade").classList.remove("on");
  renderInk()}
function setCmpLabel(){const c=document.getElementById("cmp");if(c)c.innerHTML=ic(comparing?"eyeoff":"eye")+(comparing?"Ẩn mẫu":"So sánh")}
function toggleCompare(){comparing=!comparing;document.getElementById("cmp").classList.toggle("act",comparing);
  setCmpLabel();
  document.getElementById("grade").classList.toggle("on",comparing&&pageItems().length>0);renderInk()}

const SCALES=[0.85,1,1.15,1.25,1.4,1.5,1.65,1.85];
function stepScale(delta){
  let k=SCALES.reduce((bi,v,i)=>Math.abs(v-S.scale)<Math.abs(SCALES[bi]-S.scale)?i:bi,0);
  if(Math.abs(SCALES[k]-S.scale)<.001)k+=delta>0?1:-1;else if((delta>0)!==(SCALES[k]>S.scale))k+=delta>0?1:-1;
  const nv=SCALES[Math.max(0,Math.min(SCALES.length-1,k))];
  if(nv===S.scale){toast(delta>0?"Đã ở cỡ lớn nhất":"Đã ở cỡ nhỏ nhất");return}
  S.scale=nv;saveS();show();toast(`Cỡ dòng kẻ: ${Math.round(S.scale*100)}%`);
}
function toggleFocus(){
  focusOn=!focusOn;
  document.body.classList.toggle("focus",focusOn);

  try{
    if(focusOn&&document.documentElement.requestFullscreen&&!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});
    else if(!focusOn&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(()=>{});
  }catch(_){}
  setTimeout(resize,120);
  toast(focusOn?"Toàn màn hình · chạm Aa để thoát":"Đã hiện lại thanh chế độ");
}

