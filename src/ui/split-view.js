/* ================== TABLET SPLIT-VIEW (GALAXY TAB / Z FOLD / PC) ================== */
let sideTab="xem";
function isTablet(){return window.innerWidth>=860}
function toggleSplit(){
  S.split=!S.split;saveS();applySplit();setTimeout(resize,80);
}
function setSideTab(t){
  sideTab=t;
  document.getElementById("stXem").classList.toggle("on",t==="xem");
  document.getElementById("stList").classList.toggle("on",t==="list");
  renderSidePane();
}
function applySplit(){
  const on=isTablet()&&S.split;
  document.body.classList.toggle("split",on);
  if(!on&&document.body.classList.contains("xemMo")&&typeof moNganXem==="function")moNganXem(false);
  if(on)renderSidePane();
}
function renderSidePane(){
  if(!document.body.classList.contains("split"))return;
  const pane=document.getElementById("sidePane");if(!pane||pane.offsetWidth<120)return;   /* bảng đang ẩn: không vẽ */
  const box=document.getElementById("sideBody");if(!box)return;
  if(sideTab==="list"){
    let h=`<div class="row" style="border:0;padding:4px 0 8px"><span>Kiểu chữ</span><div class="seg">${DS_KIEU_CHU.map(([v,t,m])=>[v,t.replace(" 10°",""),m]).map(([v,t,m])=>`<button class="${SCRIPT===v?"on":""}" title="${m||t}" data-action="chonKieuChu" data-kieu="${escHtml(v)}">${t}</button>`).join("")}</div></div>`;
    if(!sidePartOpen)sidePartOpen=new Set([curPartName()]);
    for(const p of COURSE)h+=partBlock(p,sidePartOpen,"sidePartOpen",true);
    box.innerHTML=h;return;
  }
  LEGEND=S.arrowStyle==="full"?LEGEND_FULL:LEGEND_SIMPLE;
  const l=LESSONS[cur.li],st=SOTAY[l.id]||null,items=cardItems(l);
  const animList=l.f==="AL"?[]:animableItems(items);
  let h=`<h3 style="font-size:18px;margin-bottom:6px">${cur.li>=NREAL?l.t:"Bài "+(cur.li+1)+" · "+l.t}</h3>`;
  if(st)h+=`<div class="goal" style="font-size:14.5px">${st[0]}</div>`;
  if(items.length&&l.f!=="AL")h+=`<h4 style="margin-top:10px">Thứ tự nét</h4>${LEGEND}<canvas id="sideCardCv"></canvas>`;
  if(st&&st[1].length)h+=`<h4>Cách viết</h4><ul>${st[1].map(t=>`<li style="font-size:14.5px">${t}</li>`).join("")}</ul>`;
  if(st&&st[2].length)h+=`<h4>Lỗi hay gặp</h4><ul>${st[2].map(t=>`<li style="font-size:14.5px">${t}</li>`).join("")}</ul>`;
  if(animList.length)h+=`<div class="sideAct"><button class="btn primary" data-action="moTheHocNet" data-chedo="watch">${ic("play")}Xem viết chậm</button><button class="btn ghost" data-action="moTheHocNet" data-chedo="quiz">${ic("pen")}Tự tô nét</button></div>`;
  box.innerHTML=h;
  const cv=document.getElementById("sideCardCv");if(cv)drawCard(cv,items,l.f);
}
/* Hành động mở thẻ học nét từ bảng Xem */
HANH_DONG.moTheHocNet=el=>openCard(null,el.dataset.chedo);

