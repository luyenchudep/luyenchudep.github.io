/* ================== HỘP VIẾT PHÓNG TO TỰ TRƯỢT (AUTO-ADVANCING ZOOM BOX) ================== */
const zbox={on:false,row:0,x:0,zoom:2.4,advTimer:0,live:null};
const zboxCv=document.getElementById("zboxCv"),zboxFx=document.getElementById("zboxFx");
let zbCtx=zboxCv.getContext("2d"),zbfCtx=zboxFx.getContext("2d");
function toggleZBox(){
  zbox.on=!zbox.on;
  document.getElementById("zboxWrap").classList.toggle("on",zbox.on);
  document.getElementById("bZBox").classList.toggle("on",zbox.on);
  if(zbox.on){
    resetZoom(true);
    zbox.row=0;zbox.x=layout?Math.max(0,layout.padL-10):0;
  }
  zboxCancelAdv();
  setTimeout(()=>{resize();if(zbox.on)toast("Hộp viết phóng to: viết vào vùng xanh bên phải để tự trượt")},60);
}
/* Mức phóng đang dùng. Tiểu học: hạ mức phóng nếu cần để hộp chứa trọn một dòng 4 ô li (chữ cao 5 ô li, đuôi 3 ô li) */
function zboxZoom(){
  if(SCRIPT!=="th"||!layout)return zbox.zoom;
  const zh=Math.max(80,zboxStageRect().height);
  return Math.min(zbox.zoom,zh/(layout.unit*1.04));
}
function zboxStageRect(){const st=document.getElementById("zboxStage");return(st||zboxCv).getBoundingClientRect()}
function zboxViewRect(){
  const r=zboxStageRect();
  const zw=Math.max(120,r.width),zh=Math.max(80,r.height);
  const srcW=zw/zboxZoom(),srcH=zh/zboxZoom();
  const rows=pages[cur.page]||[];
  const ri=Math.min(Math.max(0,zbox.row),Math.max(0,rows.length-1));
  const {m,padT,unit,up}=layout;
  const b=padT+ri*unit+up*m.fs;
  const th=SCRIPT==="th",cy=th?b-thTamDong(up,unit,m.fs):b-m.xh*0.35;   /* Tiểu học: giữa dải dòng (có chữ hoa thì dải cao hơn) */
  const sy=Math.max(0,Math.min(Math.max(0,H-srcH),cy-srcH*(th?0.5:0.54)));
  const sx=Math.max(0,Math.min(Math.max(0,W-srcW),zbox.x));
  return {sx,sy,srcW,srcH,zw,zh,ri};
}
function drawZBoxHighlight(ctx){
  if(!zbox.on||!layout)return;
  const {sx,sy,srcW,srcH}=zboxViewRect();
  ctx.save();
  const tz=themeName();
  ctx.strokeStyle=tz==="dark"?"#82B4FF":tz==="eink"?"#000000":"#184E9E";
  ctx.fillStyle=tz==="dark"?"rgba(130,180,255,.10)":tz==="eink"?"rgba(0,0,0,.06)":"rgba(24,78,158,.08)";
  ctx.lineWidth=2;ctx.fillRect(sx,sy,srcW,srcH);ctx.strokeRect(sx,sy,srcW,srcH);
  ctx.restore();
}
function renderZBox(){
  if(!zbox.on||!layout)return;
  const r=zboxStageRect();if(r.width<20||r.height<20)return;
  const d=Math.min(devicePixelRatio||1,3);
  const cw=Math.round(r.width*d),ch=Math.round(r.height*d);
  if(zboxCv.width!==cw||zboxCv.height!==ch||zboxCv.style.width!==r.width+"px"||zboxCv.style.height!==r.height+"px"){
    zboxCv.width=cw;zboxCv.height=ch;zboxCv.style.width=r.width+"px";zboxCv.style.height=r.height+"px";
    zboxFx.width=cw;zboxFx.height=ch;zboxFx.style.width=r.width+"px";zboxFx.style.height=r.height+"px";
  }
  const {sx,sy,srcW,zw,zh,ri}=zboxViewRect();
  zbCtx.setTransform(1,0,0,1,0,0);zbCtx.fillStyle=T.paper;zbCtx.fillRect(0,0,cw,ch);
  zbCtx.setTransform(d*zboxZoom(),0,0,d*zboxZoom(),-sx*d*zboxZoom(),-sy*d*zboxZoom());
  drawBgTo(zbCtx);
  for(const s of strokes)drawStroke(zbCtx,s);
  if(comparing)drawCompare(zbCtx);
  if(S.autoAdv){
    const advX=zw*0.78;
    zbCtx.setTransform(d,0,0,d,0,0);
    zbCtx.fillStyle=themeName()==="dark"?"rgba(56,211,113,.12)":"rgba(21,122,59,.09)";
    zbCtx.fillRect(advX,0,zw-advX,zh);
    zbCtx.strokeStyle=themeName()==="dark"?"rgba(56,211,113,.45)":"rgba(21,122,59,.35)";
    zbCtx.setLineDash([5,4]);zbCtx.lineWidth=1.5;
    zbCtx.beginPath();zbCtx.moveTo(advX,0);zbCtx.lineTo(advX,zh);zbCtx.stroke();zbCtx.setLineDash([]);
  }
  const ttl=document.getElementById("zbTitle");
  if(ttl)ttl.innerHTML=ic("zbox")+`Dòng ${ri+1}/${(pages[cur.page]||[]).length} · ${zboxZoom().toFixed(1).replace(".",",")}×`;
}
function zboxCancelAdv(){clearTimeout(zbox.advTimer);zbox.advArmed=false}
function zboxMove(dir,auto){
  if(!auto)zboxCancelAdv();
  if(!zbox.on||!layout)return;
  const {srcW}=zboxViewRect(),step=srcW*0.58;
  const maxX=Math.max(0,W-srcW);
  if(dir>0&&zbox.x>=maxX-8){zboxNextLine(auto);return}
  zbox.x=Math.max(0,Math.min(maxX,zbox.x+dir*step));
  renderInk();
}
function zboxNextLine(auto){
  if(!auto)zboxCancelAdv();
  if(!zbox.on||!layout)return;
  const total=(pages[cur.page]||[]).length;
  if(zbox.row<total-1){zbox.row++;zbox.x=Math.max(0,layout.padL-10);renderInk()}
  else toast("Đã tới dòng cuối của trang");
}
function zboxScale(delta){
  zbox.zoom=Math.round(Math.min(3.6,Math.max(1.6,zbox.zoom+delta))*10)/10;
  renderInk();
}
function zboxPos(e){
  const r=zboxCv.getBoundingClientRect(),{sx,sy}=zboxViewRect();
  const p=rawP(e);
  const px=sx+(e.clientX-r.left)/zboxZoom(),py=sy+(e.clientY-r.top)/zboxZoom();
  return [Math.round(px*10)/10,Math.round(py*10)/10,Math.round(p*1000)/1000,tiltMagOf(e)];
}
function clearZBFx(){zbfCtx.setTransform(1,0,0,1,0,0);zbfCtx.clearRect(0,0,zboxFx.width,zboxFx.height)}
zboxCv.addEventListener("pointerdown",e=>{
  if(exporting)return;
  if(zbox.live&&e.pointerId!==zbox.live.pid)return;
  const isPen=e.pointerType==="pen"||e.pointerType==="mouse"||(!S.penOnly);
  if(!isPen)return;
  clearZBFx();clearTimeout(zbox.advTimer);
  e.preventDefault();try{zboxCv.setPointerCapture(e.pointerId)}catch(_){}
  const sideBtn=e.pointerType==="pen"&&(e.button===5||(e.buttons&32)||(e.buttons&2));
  if(sideBtn&&S.sideBtn==="undo"){undo();toast("Hoàn tác");return}
  if(sideBtn&&S.sideBtn==="fav"){cycleFavPen();return}
  const erase=tool==="eraser"||(sideBtn&&S.sideBtn==="eraser");
  if(erase){zbox.live={erase:true,changed:false,pid:e.pointerId,redo0:redoStack.slice()};snapshot();eraseAt(zboxPos(e),zboxZoom());return}
  snapshot();
  const q=zboxPos(e);q[2]=Math.min(q[2],(S.pFull||.38)*.45);
  zbox.live={tp:S.penType,c:S.color,w:S.width,pr:S.pressure,ct:S.contrast,na:S.nibAngle,tl:S.tiltOn,pf:S.pFull||.38,p:[q],pid:e.pointerId};
  const d=Math.min(devicePixelRatio||1,3),{sx,sy}=zboxViewRect();
  zbfCtx.setTransform(d*zboxZoom(),0,0,d*zboxZoom(),-sx*d*zboxZoom(),-sy*d*zboxZoom());
  drawStroke(zbfCtx,zbox.live,true);
},{passive:false});
zboxCv.addEventListener("pointermove",e=>{
  if(!zbox.live||e.pointerId!==zbox.live.pid)return;
  e.preventDefault();
  let evs=e.getCoalescedEvents?e.getCoalescedEvents():[];if(!evs.length)evs=[e];
  if(zbox.live.erase){for(const ev of evs)eraseAt(zboxPos(ev),zboxZoom());return}
  const minStep=0.45/zboxZoom(),stb=Math.min(0.75,Math.max(0,S.stab||0));
  const ztp=strokeType(zbox.live),zinc=ztp!=="marker"&&ztp!=="pencil";
  const zd=Math.min(devicePixelRatio||1,3),zvr=zboxViewRect();
  zbfCtx.setTransform(zd*zboxZoom(),0,0,zd*zboxZoom(),-zvr.sx*zd*zboxZoom(),-zvr.sy*zd*zboxZoom());
  for(const ev of evs){
    const raw=zboxPos(ev),p=zbox.live.p[zbox.live.p.length-1];
    const q=stb>0?[
      Math.round((p[0]*stb+raw[0]*(1-stb))*10)/10,
      Math.round((p[1]*stb+raw[1]*(1-stb))*10)/10,
      Math.round((p[2]*.38+raw[2]*.62)*1000)/1000,
      Math.round(((p[3]||0)*.65+raw[3]*.35)*100)/100
    ]:[raw[0],raw[1],Math.round((p[2]*.38+raw[2]*.62)*1000)/1000,Math.round(((p[3]||0)*.65+raw[3]*.35)*100)/100];
    if(Math.abs(q[0]-p[0])+Math.abs(q[1]-p[1])<minStep){if(Math.abs(q[2]-p[2])>=.03)p[2]=q[2];continue}
    zbox.live.p.push(q);paperSoundStep(p,q);
    if(zinc)drawSegOn(zbfCtx,p,q,zbox.live);
  }
  if(!zinc){clearZBFx();zbfCtx.setTransform(zd*zboxZoom(),0,0,zd*zboxZoom(),-zvr.sx*zd*zboxZoom(),-zvr.sy*zd*zboxZoom());drawStroke(zbfCtx,zbox.live,true)}
},{passive:false});
function endZBoxStroke(e){
  if(!zbox.live)return;
  if(e&&e.pointerId!=null&&e.pointerId!==zbox.live.pid)return;
  if(zbox.live.erase)gomXong();   /* xử lý hết điểm gôm còn chờ trước khi kết thúc */
  clearZBFx();paperSoundStop();
  const st=zbox.live;zbox.live=null;const redo0=st.redo0;delete st.pid;delete st.redo0;
  if(!st.erase){
    st.p=simplifyStroke(st.p,0.32);
    strokes.push(st);
    if(S.autoAdv&&layout){
      /* Nét ngắn (chấm i, dấu thanh) không tính; chờ 1,05 giây để kịp quay lại bỏ dấu */
      const {sx,srcW}=zboxViewRect(),xs=st.p.map(q=>q[0]),ys=st.p.map(q=>q[1]);
      const ext=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
      const shortSt=ext<layout.m.xh*0.45;
      if(!shortSt)zbox.advArmed=Math.max(...xs)>=sx+srcW*0.76;
      if(zbox.advArmed){clearTimeout(zbox.advTimer);zbox.advTimer=setTimeout(()=>{zbox.advArmed=false;zboxMove(1,true)},1050)}
    }
  }else if(!st.changed&&history.length){history.pop();if(redo0)redoStack=redo0}
  renderInk();saveInk();
}
zboxCv.addEventListener("pointerup",endZBoxStroke);zboxCv.addEventListener("pointercancel",endZBoxStroke);

