/* ================== ĐIỀU HƯỚNG ================== */
function show(){
  if(exporting)return;
  view={z:1,x:0,y:0};updZoomUI();zboxCancelAdv();
  const l=LESSONS[cur.li];
  buildPages();if(zbox.on){zbox.row=0;zbox.x=Math.max(0,layout.padL-10)}drawBg();loadInk();measure();
  if(cur.li<NREAL){const k=pageItemOf(pages,cur.page);POS[l.id]={m:cur.mode,k,p:cur.page};store.set("pos",POS)}
  document.getElementById("partTxt").textContent=l.part;
  const special=cur.li>=NREAL;
  document.getElementById("ttext").textContent=special?l.t:`Bài ${cur.li+1} · ${l.t}`;
  const nt=document.getElementById("note");document.getElementById("noteTxt").textContent=l.note||"";
  if(nt.dataset.l!==l.id){nt.dataset.l=l.id;nt.classList.remove("open")}
  nt.style.display=l.note?"":"none";
  document.getElementById("pageinfo").textContent=`trang ${cur.page+1}/${pages.length}`;
  const d=document.getElementById("done");d.classList.toggle("on",done.has(l.id));d.querySelector(".dl").textContent="Đã tập";
  d.style.display=special?"none":"";
  document.getElementById("mTo").classList.toggle("on",cur.mode==="to");
  document.getElementById("mNho").classList.toggle("on",cur.mode==="nho");
  const c=document.getElementById("cmp");c.classList.toggle("on",cur.mode==="nho");c.classList.toggle("act",comparing);setCmpLabel();
  document.getElementById("grade").classList.toggle("on",comparing&&cur.mode==="nho"&&pageItems().length>0);
  document.getElementById("bPrev").disabled=cur.page===0&&(cur.li===0||cur.li>=NREAL);
  document.getElementById("bNext").disabled=cur.page===pages.length-1&&(cur.li===NREAL-1||l.id==="review"||l.id==="luyen"&&!WEAK.length);
  updatePenBadge();renderSidePane();
  store.set("last",cur);sessUpdate();
  requestAnimationFrame(()=>{const rh=document.querySelector("header").offsetHeight;if(Math.abs(rh-lastHeader)>2){lastHeader=rh;resize()}});
}
let lastHeader=0;
function go(d){
  flushSave();
  const last=NREAL-1,l=LESSONS[cur.li];comparing=false;
  if(d>0){if(cur.page<pages.length-1)cur.page++;
    else if(l.id==="luyen"&&WEAK.length){luyenRounds++;cur.page++;toast("Đã thêm một vòng luyện")}
    else if(cur.li<last){cur.li++;cur.page=0;toast(LESSONS[cur.li].t)}else return}
  else{if(cur.page>0)cur.page--;else if(cur.li>0&&cur.li<=last){cur.li--;cur.page=9999}else return}
  show();
}
function openLesson(i,mode){flushSave();if(LESSONS[i].id==="review")buildReview(true);if(LESSONS[i].id==="luyen"){luyenRounds=1;buildLuyen(true)}
  let md=mode||(LESSONS[i].id==="review"?"nho":"to"),pg0=0,resumeKey=null;
  const q=POS[LESSONS[i].id];
  if(!mode&&q&&i<NREAL&&!done.has(LESSONS[i].id)){md=q.m||"to";
    const r=computePages(LESSONS[i],md,S.scale,H,0,false),same=q.p<r.pages.length&&pageItemOf(r.pages,q.p)===q.k,pi=same?q.p:findItemPage(r.pages,q.k);
    pg0=pi>=0?pi:Math.max(0,Math.min(q.p||0,r.pages.length-1));if(pg0>0)resumeKey=q.k}
  cur={li:i,page:pg0,mode:md};comparing=false;closeSheets();show();if(resumeKey)toast(`Tập tiếp: ${charLabel(resumeKey).replace(/^Chữ /,"")} · trang ${cur.page+1}/${pages.length}`);if(LESSONS[i].id==="review"&&cur.mode==="nho")toast("Bài ôn không có chữ mẫu · viết theo trí nhớ rồi chạm So sánh")}
function toggleDone(){const l=LESSONS[cur.li],id=l.id;if(done.has(id))done.delete(id);else{done.add(id);schedule(l)}store.set("done",[...done]);show();toast(done.has(id)?"Đã đánh dấu hoàn thành bài này":"Đã bỏ đánh dấu")}

