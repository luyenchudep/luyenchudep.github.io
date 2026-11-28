/* ================== MỰC (NÉT VIẾT) & TẨY THÔNG MINH ================== */
let exporting=false,pendingResize=false,inkLoading=false,journalDirty=false,restoring=false;
let strokes=[],history=[],redoStack=[],live=null,tool="pen",clearArm=false,lastPalmToast=0,inkDirty=false,loadSeq=0;
/* ---- Lưu nét theo dòng ----
   Khóa: một bản ghi cho mỗi bài × chế độ × chiều máy. Mỗi nét lưu mã dòng neo (a) và tọa độ theo đơn vị thân chữ. */
function inkOrient(){return (window.innerWidth||W)>(window.innerHeight||H)?"L":"P"}
function strHash(s){let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h.toString(36)}
function key(){const l=LESSONS[cur.li];let id=l.id;
  if(id==="review")id+="@"+today();else if(id==="luyen")id+="@"+strHash((frozenLuyen||[]).join("|"));else if(id==="free")id+="@"+strHash(store.get("custom",""));
  return `ink5:${id}:${cur.mode}:${inkOrient()}`}
function idbPutInk(k,v){
  if(idb&&idb.objectStoreNames.contains("ink")){
    try{const tx=idb.transaction("ink","readwrite");tx.onerror=tx.onabort=()=>{if(!store.set(k,v))toast("Không lưu được nét viết — bạn sao lưu rồi xóa bớt bài cũ")};
      tx.objectStore("ink").put(v,PFX+k);return}catch(_){}
  }
  store.set(k,v);
}
function idbGetInk(k){
  return new Promise(res=>{
    if(!idb||!idb.objectStoreNames.contains("ink")){res(null);return}
    try{
      const r=idb.transaction("ink").objectStore("ink").get(PFX+k);
      r.onsuccess=()=>res(r.result||null);r.onerror=()=>res(null);
    }catch(_){res(null)}
  });
}
let inkCtx=null,inkOthers=[];
function anchorsOf(lay,rows){const out=[];(rows||[]).forEach((r,i)=>{if(r.rid){const b=lay.padT+i*lay.unit+lay.up*lay.m.fs;out.push(SCRIPT==="th"?{rid:r.rid,b,t:b-thTamDong(lay.up,lay.unit,lay.m.fs)}:{rid:r.rid,b})}});return out}
function normStroke(s,c){
  if(!c.anchors.length||!s.p||!s.p.length)return null;
  let y0=1e9,y1=-1e9;for(const q of s.p){if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1]}
  const mid=(y0+y1)/2;let best=c.anchors[0],bd=1e9;
  for(const a of c.anchors){const d=Math.abs(mid-(a.t??a.b-c.xh*.5));if(d<bd){bd=d;best=a}}
  const o=Object.assign({},s);delete o.a;
  o.a=best.rid;o.p=s.p.map(q=>[Math.round((q[0]-c.padL)/c.xh*1000)/1000,Math.round((q[1]-best.b)/c.xh*1000)/1000,q[2],q[3]||0]);
  return o;
}
function makeInkCtx(){return {key:key(),padL:layout.padL,xh:layout.m.xh,anchors:anchorsOf(layout,pages[cur.page]),page:cur.page,li:cur.li,mode:cur.mode}}
function serializeInk(c,strs,others){const out=others.slice();for(const s of strs){const n=normStroke(s,c);if(n)out.push(n)}return out}
/* Nhận nét từ cách lưu cũ (bản 3.0 và 4.0: lưu theo số trang) — dữ liệu cũ vẫn giữ nguyên */
async function migrateLegacy(c){
  try{
    const l=LESSONS[c.li],o=inkOrient(),pre=(c.mode==="nho"?"inkm3":"ink3")+":"+l.id+":";
    const keys=new Set();
    if(idb&&idb.objectStoreNames.contains("ink"))await new Promise(res=>{try{const r=idb.transaction("ink").objectStore("ink").getAllKeys();
      r.onsuccess=()=>{for(const k of r.result){const s=String(k);if(s.startsWith(PFX+pre))keys.add(s.slice(PFX.length))}res()};r.onerror=()=>res()}catch(_){res()}});
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PFX+pre))keys.add(k.slice(PFX.length))}
    const out=[];
    for(const k of keys){
      const mm=k.slice(pre.length).match(/^(\d+):([LP]):([\d.]+)(?::p(\d+))?$/);if(!mm||mm[2]!==o)continue;
      let data=await idbGetInk(k);if(!data)data=store.get(k,null);if(!Array.isArray(data)||!data.length)continue;
      const L=computePages(l,c.mode,+mm[3],H,mm[4]?+mm[4]:0,!mm[4]),rows=L.pages[+mm[1]];if(!rows)continue;
      const cc={padL:L.lay.padL,xh:L.lay.m.xh,anchors:anchorsOf(L.lay,rows)};
      for(const s of data){const n=normStroke(s,cc);if(n)out.push(n)}
    }
    if(out.length){idbPutInk(c.key,out);setTimeout(()=>toast("Đã chuyển nét viết từ bản cũ sang cách lưu mới"),700)}
    return out;
  }catch(e){return []}
}
async function loadInk(){
  flushSave(false);
  const seq=++loadSeq,c=makeInkCtx();inkCtx=c;inkLoading=true;
  strokes=[];history=[];redoStack=[];inkOthers=[];inkDirty=false;renderInk();
  if(!idb)await openIDB();
  let data=await idbGetInk(c.key);
  if(!data)data=store.get(c.key,null);
  if(!data)data=await migrateLegacy(c);
  if(seq!==loadSeq)return;
  const byRid=new Map(c.anchors.map(a=>[a.rid,a.b])),mine=[],others=[];
  for(const s of (Array.isArray(data)?data:[])){
    if(s&&s.a!=null&&byRid.has(s.a)&&Array.isArray(s.p)){const b=byRid.get(s.a),o=Object.assign({},s);delete o.a;
      o.p=s.p.map(q=>[c.padL+q[0]*c.xh,b+q[1]*c.xh,q[2],q[3]||0]);mine.push(o)}
    else if(s)others.push(s);
  }
  /* Nét viết trong lúc đang nạp được giữ lại và gộp vào, không ghi đè dữ liệu cũ */
  inkLoading=false;const early=strokes;strokes=mine.concat(early);inkOthers=others;
  if(early.length)saveInk();renderInk();measure();
}
let saveT=0,jT=0;
function saveInk(){
  inkDirty=true;const c=inkCtx;
  clearTimeout(saveT);
  journalDirty=true;
  saveT=setTimeout(()=>{if(c!==inkCtx||!c||inkLoading)return;idbPutInk(c.key,serializeInk(c,strokes,inkOthers));inkDirty=false},220);
  clearTimeout(jT);if(c){const snapCtx={k:c.key+":"+c.page,li:c.li,page:c.page,mode:c.mode};jT=setTimeout(()=>{journalDirty=false;journalSnap(snapCtx)},2200)}
  measure();
}
function flushSave(journal=true){
  clearTimeout(saveT);clearTimeout(jT);
  const c=inkCtx;if(!c||inkLoading||restoring)return;
  if(inkDirty){idbPutInk(c.key,serializeInk(c,strokes,inkOthers));inkDirty=false}
  /* Lỗi 2: chụp Nhật ký theo cờ riêng, không phụ thuộc việc đã lưu nét hay chưa */
  if(journal&&journalDirty&&strokes.length)journalSnap({k:c.key+":"+c.page,li:c.li,page:c.page,mode:c.mode});
  journalDirty=false;
}
/* Nén điểm nét thông minh (Ramer-Douglas-Peucker bảo toàn lực nhấn) giảm ~55% dung lượng */
function simplifyStroke(pts,tol=0.35){
  if(!pts||pts.length<6)return pts;
  const keep=new Uint8Array(pts.length);keep[0]=1;keep[pts.length-1]=1;
  const stack=[[0,pts.length-1]];
  while(stack.length){
    const[a,b]=stack.pop();if(b-a<2)continue;
    const ax=pts[a][0],ay=pts[a][1],bx=pts[b][0],by=pts[b][1],dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1;
    let maxD=-1,idx=-1;
    for(let i=a+1;i<b;i++){
      const d=Math.abs((pts[i][0]-ax)*dy-(pts[i][1]-ay)*dx)/L;
      const dp=Math.abs((pts[i][2]||.5)-((pts[a][2]||.5)+(pts[b][2]||.5))/2)*4.5;
      const sc=d+dp;
      if(sc>maxD){maxD=sc;idx=i}
    }
    if(maxD>tol&&idx>0){keep[idx]=1;stack.push([a,idx],[idx,b])}
  }
  const out=[];for(let i=0;i<pts.length;i++)if(keep[i])out.push(pts[i]);
  return out.length>=2?out:pts;
}
const CURVE={soft:[.35,1.5,1.3],med:[.22,1.9,1.6],strong:[.12,2.4,1.9],nib:[.08,2.7,2.1]};
/* v0.10.4: số mũ mới dùng sau khi đã chuẩn hóa lực theo tay người viết */
const CURVE2={soft:1,med:1,strong:1.12,nib:1.22};
const SENS={nhe:.28,vua:.38,manh:.55};
/* Đổi lực thô của S Pen ra 0..1 theo mức "nhấn vừa tay" pf: chạm nhẹ vẫn mảnh, nhấn vừa là đậm đủ */
function pNorm(p,pf){
  const lo=.02;let x=(p-lo)/Math.max(.08,(pf||.38)-lo);x=x<0?0:x>1?1:x;
  return .35*x+.65*x*x*(3-2*x);
}
function strokeType(s){return s.tp||(s.pr?"fountain":"gel")}
function segW(s,p,tm=0){
  const tp=strokeType(s),t=s.tl?(tm||0):0;
  const pr=s.pf?pNorm(p==null?.02:p,s.pf):Math.min(1,Math.max(0,p||.5));
  if(tp==="marker")return s.w;
  if(tp==="gel")return s.pr?s.w*(0.8+0.4*pr):s.w;
  if(tp==="brush")return s.w*(0.15+2.25*Math.pow(pr,1.35))*(1+t*0.85);
  if(tp==="pencil")return s.w*(0.55+0.55*pr)*(1+t*2.3);
  if(tp==="callig")return s.w*(s.pr?(0.65+0.65*pr):1)*(1+t*0.35);
  if(!s.pr)return s.w;
  const c=CURVE[s.ct||"med"];
  return s.w*(c[0]+c[1]*Math.pow(pr,s.pf?(CURVE2[s.ct||"med"]||1):c[2]));
}
/* Sửa lỗi xoắn góc hình bướm (P1 #11): luôn nối 2 tam giác không tự cắt + bo đỉnh đầu ngòi */
function drawCalligSeg(ctx,a,b,s){
  const ang=-(s.na||38)*Math.PI/180;
  const wa=segW(s,a[2],a[3])/2,wb=segW(s,b[2],b[3])/2;
  const ca=Math.cos(ang),sa=Math.sin(ang);
  const a1x=a[0]-ca*wa,a1y=a[1]-sa*wa,a2x=a[0]+ca*wa,a2y=a[1]+sa*wa;
  const b1x=b[0]-ca*wb,b1y=b[1]-sa*wb,b2x=b[0]+ca*wb,b2y=b[1]+sa*wb;
  const cross=(a2x-a1x)*(b[1]-a[1])-(a2y-a1y)*(b[0]-a[0]);
  ctx.beginPath();
  if(cross>=0){ctx.moveTo(a1x,a1y);ctx.lineTo(a2x,a2y);ctx.lineTo(b2x,b2y);ctx.lineTo(b1x,b1y)}
  else{ctx.moveTo(a2x,a2y);ctx.lineTo(a1x,a1y);ctx.lineTo(b1x,b1y);ctx.lineTo(b2x,b2y)}
  ctx.closePath();ctx.fill();
  /* Lấp khe mảnh khi nét chạy gần song song với góc vát */
  ctx.lineWidth=Math.max(0.85,Math.min(wa,wb)*0.22);
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
}
function drawVarSeg(ctx,a,b,s){
  const w0=segW(s,a[2],a[3]),w1=segW(s,b[2],b[3]);
  const dist=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(dist<2||Math.abs(w1-w0)<0.25){
    ctx.lineWidth=(w0+w1)/2;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();return;
  }
  const steps=Math.min(5,Math.ceil(dist/2.5));
  let px=a[0],py=a[1];
  for(let k=1;k<=steps;k++){
    const f=k/steps,nx=a[0]+(b[0]-a[0])*f,ny=a[1]+(b[1]-a[1])*f;
    ctx.lineWidth=w0+(w1-w0)*((k-.5)/steps);
    ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(nx,ny);ctx.stroke();
    px=nx;py=ny;
  }
}
/* Bút chì đa sợi không bị đốm đen ở mối nối & sắc nét tuyệt đối khi zoom 300% (P1 #10) */
function drawPencilPath(ctx,p,s){
  let avgP=0,avgT=0;
  for(let i=0;i<p.length;i++){avgP+=p[i][2]||.5;avgT+=p[i][3]||0}
  avgP/=p.length;avgT/=p.length;
  const w=segW(s,avgP,avgT);
  const spread=Math.max(0.45,w*(0.24+(s.tl?avgT*0.45:0)));
  const passes=s.tl&&avgT>0.2?[[0,0,0.44,w*0.85],[-spread*0.65,spread*0.45,0.22,w*0.58],[spread*0.65,-spread*0.45,0.22,w*0.58],[0,spread*0.8,0.16,w*0.42]]:
    [[0,0,0.58,w*0.92],[-spread*0.45,spread*0.35,0.24,w*0.55],[spread*0.45,-spread*0.35,0.22,w*0.5]];
  for(const[ox,oy,al,lw]of passes){
    ctx.globalAlpha=Math.min(0.92,al*(0.65+0.55*avgP));
    ctx.lineWidth=Math.max(0.7,lw);
    ctx.beginPath();ctx.moveTo(p[0][0]+ox,p[0][1]+oy);
    for(let i=1;i<p.length-1;i++){const mx=(p[i][0]+p[i+1][0])/2+ox,my=(p[i][1]+p[i+1][1])/2+oy;ctx.quadraticCurveTo(p[i][0]+ox,p[i][1]+oy,mx,my)}
    const l=p[p.length-1];ctx.lineTo(l[0]+ox,l[1]+oy);ctx.stroke();
  }
}
function drawStroke(ctx,s,isFx=false){
  const p=s.p,col=inkColor(s.c),tp=strokeType(s);
  if(!p||!p.length)return;
  ctx.save();
  ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineCap="round";ctx.lineJoin="round";
  if(tp==="marker"){
    /* Sửa lỗi P0 #1: khi vẽ tạm trên lớp trong suốt #fx dùng source-over để thấy rõ nét ngay lập tức */
    ctx.globalAlpha=isFx?0.34:(themeName()==="dark"?0.42:0.34);
    ctx.globalCompositeOperation=isFx?"source-over":(themeName()==="dark"?"screen":"multiply");
    ctx.lineCap="square";ctx.lineWidth=s.w;
    if(p.length===1){ctx.fillRect(p[0][0]-s.w/2,p[0][1]-s.w/2,s.w,s.w);ctx.restore();return}
    ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);
    for(let i=1;i<p.length-1;i++){const mx=(p[i][0]+p[i+1][0])/2,my=(p[i][1]+p[i+1][1])/2;ctx.quadraticCurveTo(p[i][0],p[i][1],mx,my)}
    const l=p[p.length-1];ctx.lineTo(l[0],l[1]);ctx.stroke();ctx.restore();return;
  }
  if(tp==="callig"){
    const ang=-(s.na||38)*Math.PI/180,ca=Math.cos(ang),sa=Math.sin(ang);
    if(p.length===1){
      const w=segW(s,p[0][2],p[0][3])/2;
      ctx.lineWidth=Math.max(1.2,w*.45);ctx.beginPath();
      ctx.moveTo(p[0][0]-ca*w,p[0][1]-sa*w);ctx.lineTo(p[0][0]+ca*w,p[0][1]+sa*w);ctx.stroke();
      ctx.restore();return;
    }
    for(let i=1;i<p.length;i++)drawCalligSeg(ctx,p[i-1],p[i],s);
    ctx.restore();return;
  }
  if(tp==="pencil"){
    if(p.length===1){
      ctx.globalAlpha=0.58;ctx.beginPath();ctx.arc(p[0][0],p[0][1],segW(s,p[0][2],p[0][3])/2,0,7);ctx.fill();ctx.restore();return;
    }
    drawPencilPath(ctx,p,s);
    ctx.restore();return;
  }
  if(tp==="brush")ctx.globalAlpha=0.94;
  if(p.length===1){ctx.beginPath();ctx.arc(p[0][0],p[0][1],segW(s,p[0][2],p[0][3])/2,0,7);ctx.fill();ctx.restore();return}
  if(tp==="gel"&&!s.pr){
    ctx.lineWidth=s.w;ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);
    for(let i=1;i<p.length-1;i++){const mx=(p[i][0]+p[i+1][0])/2,my=(p[i][1]+p[i+1][1])/2;ctx.quadraticCurveTo(p[i][0],p[i][1],mx,my)}
    const l=p[p.length-1];ctx.lineTo(l[0],l[1]);ctx.stroke();ctx.restore();return;
  }
  for(let i=1;i<p.length;i++)drawVarSeg(ctx,p[i-1],p[i],s);
  ctx.restore();
}
let view={z:1,x:0,y:0},zoomRAF=0;
function setViewTransform(ctx){ctx.setTransform(DPR*view.z,0,0,DPR*view.z,view.x*DPR,view.y*DPR)}
function clampView(z,x,y){
  z=Math.min(3,Math.max(1,z));
  if(z<=1.01)return {z:1,x:0,y:0};
  x=Math.min(0,Math.max(W-W*z,x));
  y=Math.min(0,Math.max(H-H*z,y));
  return {z,x,y};
}
function updZoomUI(){
  const pill=document.getElementById("zoomPill"),val=document.getElementById("zoomVal");
  if(!pill)return;
  const on=view.z>1.01;
  pill.classList.toggle("on",on);
  if(val)val.textContent=Math.round(view.z*100)+"% · ✕";
}
function applyView(z,x,y){
  view=clampView(z,x,y);
  updZoomUI();
  if(!zoomRAF)zoomRAF=requestAnimationFrame(()=>{zoomRAF=0;renderInk()});
}
function resetZoom(silent){
  view={z:1,x:0,y:0};updZoomUI();
  if(!silent){renderInk();toast("Đã thu trang về 100%")}
}
function setZoomLevel(targetZ){
  const nz=Math.min(3,Math.max(1,targetZ));
  const cx=W/2,cy=H/2,px=(cx-view.x)/view.z,py=(cy-view.y)/view.z;
  applyView(nz,cx-px*nz,cy-py*nz);
  toast(nz<=1.01?"Trang giấy: 100%":`Phóng to trang giấy: ${Math.round(nz*100)}% (kéo 2 ngón để di chuyển)`);
}
function zoomStep(delta){
  const nz=Math.min(3,Math.max(1,Math.round((view.z+delta)*100)/100));
  const cx=W/2,cy=H/2,px=(cx-view.x)/view.z,py=(cy-view.y)/view.z;
  applyView(nz,cx-px*nz,cy-py*nz);
}
function renderInk(){
  if(exporting)return;
  if(view.z<=1.01){
    ictx.setTransform(1,0,0,1,0,0);if(bg.width&&bg.height)ictx.drawImage(bg,0,0);
    ictx.setTransform(DPR,0,0,DPR,0,0);
  }else{
    /* Vẽ trực tiếp bằng vector khi phóng to để nét chữ & dòng kẻ sắc nét tuyệt đối tới 300% */
    ictx.setTransform(1,0,0,1,0,0);ictx.fillStyle=T.paper;ictx.fillRect(0,0,ink.width,ink.height);
    setViewTransform(ictx);
    drawBgTo(ictx);
  }
  for(const s of strokes)drawStroke(ictx,s);
  if(comparing)drawCompare(ictx);
  if(zbox.on)drawZBoxHighlight(ictx);
  if(zbox.on)renderZBox();
  updUndo();
}
function snapshot(){history.push(strokes.slice());if(history.length>40)history.shift();redoStack=[];updUndo()}
function undo(){if(!history.length)return;redoStack.push(strokes.slice());strokes=history.pop();renderInk();saveInk()}
function redo(){if(!redoStack.length)return;history.push(strokes.slice());strokes=redoStack.pop();renderInk();saveInk()}
function updUndo(){
  const bu=document.getElementById("bUndo"),br=document.getElementById("redoBtn");
  if(bu)bu.disabled=!history.length;
  if(br)br.classList.toggle("on",redoStack.length>0);
}
function clearPage(){
  if(!strokes.length){toast("Trang đang trống");closeSheets();return}
  snapshot();strokes=[];renderInk();saveInk();closeSheets();
  toast("Đã xóa nét trên trang · chạm Hoàn tác để lấy lại");
}
function confirmClearBtn(btn){
  if(!strokes.length){toast("Trang đang trống");return}
  if(!clearArm){
    clearArm=true;btn.classList.add("arm");btn.textContent="Chạm lần nữa để xác nhận xóa trang";
    setTimeout(()=>{clearArm=false;if(btn){btn.classList.remove("arm");btn.textContent="Xóa toàn bộ nét trên trang này"}},3500);
    return;
  }
  clearArm=false;clearPage();
}

function tiltMagOf(e){
  if(e.pointerType!=="pen")return 0;
  let deg=0;
  if(typeof e.altitudeAngle==="number"&&e.altitudeAngle>0&&e.altitudeAngle<Math.PI/2){
    deg=(Math.PI/2-e.altitudeAngle)*180/Math.PI;
  }else if(e.tiltX||e.tiltY){
    const tx=Math.tan((e.tiltX||0)*Math.PI/180),ty=Math.tan((e.tiltY||0)*Math.PI/180);
    deg=Math.atan(Math.hypot(tx,ty))*180/Math.PI;
  }
  return Math.round(Math.min(1,Math.max(0,(deg-12)/52))*100)/100;
}
function rawP(e){
  if(e.pointerType!=="pen")return Math.round((S.pFull||.38)*.6*1000)/1000;
  const p=typeof e.pressure==="number"?e.pressure:.5;return Math.max(.01,Math.min(1,p));
}
function pos(e){
  const r=ink.getBoundingClientRect();const p=rawP(e);
  const px=(e.clientX-r.left-view.x)/view.z,py=(e.clientY-r.top-view.y)/view.z;
  return [Math.round(px*10)/10,Math.round(py*10)/10,Math.round(p*1000)/1000,tiltMagOf(e)];
}
function clearFx(){fctx.setTransform(1,0,0,1,0,0);fctx.clearRect(0,0,fx.width,fx.height)}
function drawHoverCursor(e){
  const r=ink.getBoundingClientRect(),hx=e.clientX-r.left,hy=e.clientY-r.top;
  clearFx();fctx.setTransform(DPR,0,0,DPR,0,0);
  const sidePressed=!!((e.buttons&2)||(e.buttons&32));
  if(tool==="eraser"||(sidePressed&&S.sideBtn==="eraser")){
    fctx.beginPath();fctx.arc(hx,hy,S.eraserR||16,0,7);
    fctx.strokeStyle="rgba(201,28,23,.85)";fctx.lineWidth=1.8;fctx.setLineDash([4,3]);fctx.stroke();fctx.setLineDash([]);
    return;
  }
  const col=inkColor(S.color),tp=S.penType;
  if(tp==="callig"){
    const ang=-(S.nibAngle||38)*Math.PI/180,hw=Math.max(5,(S.width*view.z)/2);
    const dx=Math.cos(ang)*hw,dy=Math.sin(ang)*hw;
    fctx.lineCap="round";
    fctx.strokeStyle=T.paper;fctx.lineWidth=4.5;fctx.beginPath();fctx.moveTo(hx-dx,hy-dy);fctx.lineTo(hx+dx,hy+dy);fctx.stroke();
    fctx.strokeStyle=col;fctx.lineWidth=2.4;fctx.beginPath();fctx.moveTo(hx-dx,hy-dy);fctx.lineTo(hx+dx,hy+dy);fctx.stroke();
    return;
  }
  if(tp==="marker"){
    const w=Math.max(8,S.width*view.z);
    fctx.save();fctx.globalAlpha=0.45;fctx.fillStyle=col;fctx.fillRect(hx-w/2,hy-w/2,w,w);
    fctx.globalAlpha=0.9;fctx.strokeStyle=T.ink.k;fctx.lineWidth=1.2;fctx.strokeRect(hx-w/2,hy-w/2,w,w);fctx.restore();
    return;
  }
  const tm=S.tiltOn?tiltMagOf(e):0;
  const rad=Math.max(3.6,Math.min(22,segW({tp,w:S.width,pr:S.pressure,ct:S.contrast,tl:S.tiltOn,pf:S.pFull||.38},(S.pFull||.38)*.6,tm)*view.z/2));
  fctx.fillStyle=T.paper;fctx.beginPath();fctx.arc(hx,hy,rad+2,0,7);fctx.fill();
  fctx.fillStyle=col;fctx.beginPath();fctx.arc(hx,hy,rad,0,7);fctx.fill();
  if(tm>0.25&&(tp==="pencil"||tp==="brush")){
    fctx.strokeStyle=col;fctx.globalAlpha=0.55;fctx.lineWidth=1.4;
    fctx.beginPath();fctx.arc(hx,hy,rad+5+tm*5,0,7);fctx.stroke();fctx.globalAlpha=1;
  }
}
function drawSegOn(c,a,b,s){
  const tp=strokeType(s);c.save();const col=inkColor(s.c);
  c.strokeStyle=col;c.fillStyle=col;c.lineCap="round";c.lineJoin="round";
  if(tp==="callig")drawCalligSeg(c,a,b,s);else{if(tp==="brush")c.globalAlpha=0.94;drawVarSeg(c,a,b,s)}
  c.restore();
}
function drawLiveSegment(a,b,s){
  const tp=strokeType(s);
  if(tp==="marker"||tp==="pencil"){
    /* Vẽ mượt trên lớp fx giúp dạ quang hiện rõ (source-over) và bút chì không bị đốm đen ở mối nối */
    clearFx();setViewTransform(fctx);drawStroke(fctx,s,true);return;
  }
  setViewTransform(ictx);
  ictx.save();
  const col=inkColor(s.c);
  ictx.strokeStyle=col;ictx.fillStyle=col;ictx.lineCap="round";ictx.lineJoin="round";
  if(tp==="callig"){drawCalligSeg(ictx,a,b,s)}
  else{
    if(tp==="brush")ictx.globalAlpha=0.94;
    drawVarSeg(ictx,a,b,s);
  }
  ictx.restore();
}
let fingerStart=null,pinch=null,penMiss=0;const touches=new Map();
/* Chạm ngón tay vào chữ mẫu đầu dòng → mở bút viết chậm đúng chữ đó */
function modelAt(e){
  if(!layout||!pages[cur.page]||LESSONS[cur.li].f==="AL")return null;
  const q=pos(e),{padT,unit,up,m,padL}=layout,rows=pages[cur.page];
  const ri=Math.floor((q[1]-padT)/unit);const row=rows[ri];if(!row)return null;
  if(row.hide||row.k==="blank"||row.k==="dots"||row.k==="sdots"||typeof row.s!=="string"||!row.s)return null;
  const x=q[0]-padL;if(x<-m.xh*.3)return null;
  const stk=row.k==="stroke"?row.s:(row.src&&row.src.k==="stroke"?row.src.s:null);
  if(stk)return x<m.xh*3&&DUCTUS["~"+stk]?"~"+stk:null;
  if(laPhongTH(m.fam)){const c=chuTaiTH(row.s,x/m.fs);return c&&DUCTUS[c.ch]?c.ch:null}
  const chars=[...row.s];let acc=0;
  for(const ch of chars){const w=mw(ch,m.fs,m.fam);if(x<=acc+w+m.xh*.1)return DUCTUS[ch]?ch:null;acc+=w}
  return null;
}
function openModelAt(e){
  const ch=modelAt(e);if(!ch)return false;
  openCard(ch,'watch');
  return true;
}
function tapOnMeas(e){const el=document.getElementById("meas");if(!el||!el.classList.contains("on"))return false;
  const r=el.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom}
function openPenHelp(){document.getElementById("genBox").innerHTML=`<h3>Chưa nhận ra S Pen</h3>
  <div class="prog">Ứng dụng đang bật <b>Chỉ nhận S Pen</b> để tay tựa lên màn hình không để lại nét. Máy này chưa báo nét nào là của viết; có thể trình duyệt đang coi viết của máy như ngón tay (thường gặp ở máy đọc sách, máy tính bảng không phải Samsung).</div>
  <button class="btn primary" data-action="tatChiNhanSPen">Tắt “Chỉ nhận S Pen” để viết được</button>
  <button class="btn ghost" data-action="dongBang">Giữ nguyên</button>`;openSheet("gen")}
/* Hành động tắt chế độ Chỉ nhận S Pen từ hộp hướng dẫn */
HANH_DONG.tatChiNhanSPen=()=>{S.penOnly=false;saveS();closeSheets();toast("Đã tắt Chỉ nhận S Pen — viết và ngón tay đều dùng được")};
function startPinch(){
  const pts=[...touches.values()];if(pts.length<2)return;
  const r=ink.getBoundingClientRect();
  const a=pts[0],b=pts[1];
  const d0=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const mx0=(a.x+b.x)/2-r.left,my0=(a.y+b.y)/2-r.top;
  pinch={d0,mx0,my0,z0:view.z,x0:view.x,y0:view.y};
  fingerStart=null;
}
ink.addEventListener("pointerdown",e=>{
  if(exporting)return;
  clearFx();
  if(e.pointerType==="touch"){
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(touches.size>=2&&(!live||live.fromTouch)){
      e.preventDefault();
      if(live&&live.fromTouch){if(live.erase){if(gomHen){cancelAnimationFrame(gomHen);gomHen=0}gomCho.length=0;gomTruoc=null;clearFx()}if(live.redo0)redoStack=live.redo0;live=null;paperSoundStop();if(history.length)strokes=history.pop();renderInk()}
      startPinch();return;
    }
  }
  /* Lỗi 1: đang có nét bút thì bỏ qua mọi điểm chạm khác (lòng bàn tay, ngón tay) */
  if(live&&e.pointerId!==live.pid)return;
  if(e.pointerType==="touch"&&touches.size===1&&tapOnMeas(e)){openScoreReport();return}
  if(zbox.on&&layout&&e.pointerType==="touch"&&touches.size===1){
    zboxCancelAdv();
    const tp=pos(e),tx=tp[0],ty=tp[1];
    const ri=Math.max(0,Math.min((pages[cur.page]||[]).length-1,Math.floor((ty-layout.padT)/layout.unit)));
    const {srcW}=zboxViewRect();
    zbox.row=ri;zbox.x=Math.max(0,Math.min(Math.max(0,W-srcW),tx-srcW*0.35));
    renderInk();return;
  }
  if(e.pointerType!=="pen"&&tapOnMeas(e)){openScoreReport();return}
  if(e.pointerType==="pen"&&!GS.get("penSeen",false))GS.set("penSeen",true);
  const isPen=e.pointerType==="pen"||e.pointerType==="mouse"||(!S.penOnly);
  if(!isPen){fingerStart={x:e.clientX,y:e.clientY,t:Date.now()};return}
  if(e.pointerType==="pen")pinch=null;
  e.preventDefault();try{ink.setPointerCapture(e.pointerId)}catch(_){}
  const sideBtn=e.pointerType==="pen"&&(e.button===5||(e.buttons&32)||(e.buttons&2));
  if(sideBtn&&S.sideBtn==="undo"){undo();toast("Hoàn tác (nút thân S Pen)");return}
  if(sideBtn&&S.sideBtn==="fav"){cycleFavPen();return}
  const erase=tool==="eraser"||(sideBtn&&S.sideBtn==="eraser");
  const redo0=redoStack.slice();
  if(erase&&S.eraseMode==="vung"){live={erase:true,vung:[pos(e)],changed:false,fromTouch:e.pointerType==="touch",pid:e.pointerId,redo0};snapshot();return}
  if(erase){live={erase:true,changed:false,fromTouch:e.pointerType==="touch",pid:e.pointerId,redo0};snapshot();
    if(e.pointerType==="pen"&&tapOnMeas(e)){live.meas={t:Date.now(),x:e.clientX,y:e.clientY};return}
    eraseAt(pos(e));return}
  snapshot();
  const q=pos(e);q[2]=Math.min(q[2],(S.pFull||.38)*.45);
  live={tp:S.penType,c:S.color,w:S.width,pr:S.pressure,ct:S.contrast,na:S.nibAngle,tl:S.tiltOn,pf:S.pFull||.38,p:[q],fromTouch:e.pointerType==="touch",pid:e.pointerId,redo0};
  if(e.pointerType==="pen"&&tapOnMeas(e))live.meas={t:Date.now(),x:e.clientX,y:e.clientY};
  if(live.tp==="marker"||live.tp==="pencil"){clearFx();setViewTransform(fctx);drawStroke(fctx,live,true)}
  else{setViewTransform(ictx);drawStroke(ictx,live)}
},{passive:false});
ink.addEventListener("pointermove",e=>{
  if(e.pointerType==="touch"&&touches.has(e.pointerId)){
    touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&touches.size>=2){
      e.preventDefault();
      const pts=[...touches.values()],a=pts[0],b=pts[1],r=ink.getBoundingClientRect();
      const d1=Math.hypot(b.x-a.x,b.y-a.y)||1;
      const mx1=(a.x+b.x)/2-r.left,my1=(a.y+b.y)/2-r.top;
      const nz=Math.min(3,Math.max(1,pinch.z0*(d1/Math.max(10,pinch.d0))));
      const px=(pinch.mx0-pinch.x0)/pinch.z0,py=(pinch.my0-pinch.y0)/pinch.z0;
      applyView(nz,mx1-px*nz,my1-py*nz);
      return;
    }
  }
  if(!live||e.pointerId!==live.pid){
    if(!live&&S.hover&&e.pointerType==="pen"&&!(e.buttons&1))drawHoverCursor(e);
    return}
  e.preventDefault();
  let evs=e.getCoalescedEvents?e.getCoalescedEvents():[];if(!evs.length)evs=[e];
  if(live.erase&&live.vung){const v=live.vung,buoc=4/view.z;for(const ev of evs){const q=pos(ev),c=v[v.length-1];if(Math.abs(q[0]-c[0])+Math.abs(q[1]-c[1])>=buoc)v.push(q)}veVongKhoanh(v);return}
  if(live.erase){
    if(live.meas){if(Math.hypot(e.clientX-live.meas.x,e.clientY-live.meas.y)<10)return;delete live.meas}
    for(const ev of evs)eraseAt(pos(ev));return}
  const minStep=.55/view.z,stb=Math.min(0.75,Math.max(0,S.stab||0));
  for(const ev of evs){
    const raw=pos(ev),p=live.p[live.p.length-1];
    const q=stb>0?[
      Math.round((p[0]*stb+raw[0]*(1-stb))*10)/10,
      Math.round((p[1]*stb+raw[1]*(1-stb))*10)/10,
      Math.round((p[2]*.38+raw[2]*.62)*1000)/1000,
      Math.round(((p[3]||0)*.65+raw[3]*.35)*100)/100
    ]:[raw[0],raw[1],Math.round((p[2]*.38+raw[2]*.62)*1000)/1000,Math.round(((p[3]||0)*.65+raw[3]*.35)*100)/100];
    if(Math.abs(q[0]-p[0])+Math.abs(q[1]-p[1])<minStep){if(Math.abs(q[2]-p[2])>=.03)p[2]=q[2];continue}
    live.p.push(q);
    drawLiveSegment(p,q,live);
    paperSoundStep(p,q);
  }
  /* dự đoán nét: vẽ tạm trên lớp riêng (bỏ qua với dạ quang vì dạ quang đang vẽ tạm trên fx) */
  if(live.tp!=="marker"&&live.tp!=="pencil"){
    clearFx();
    if(S.predict&&e.getPredictedEvents){const pr=e.getPredictedEvents();if(pr.length){
      let p=live.p[live.p.length-1];setViewTransform(fctx);
      for(const ev of pr){const q=pos(ev);q[2]=p[2];q[3]=p[3];drawSegOn(fctx,p,q,live);p=q}}}
  }
},{passive:false});
ink.addEventListener("pointerleave",e=>{if(!live)clearFx()});
ink.addEventListener("wheel",e=>{
  if(!e.ctrlKey&&!e.metaKey)return;
  e.preventDefault();
  const r=ink.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  const factor=e.deltaY<0?1.14:0.88;
  const nz=Math.min(3,Math.max(1,view.z*factor));
  const px=(mx-view.x)/view.z,py=(my-view.y)/view.z;
  applyView(nz,mx-px*nz,my-py*nz);
},{passive:false});
function endStroke(e){
  clearFx();
  if(e&&e.pointerType==="touch"){
    touches.delete(e.pointerId);
    if(pinch){
      if(touches.size<2)pinch=null;
      fingerStart=null;
      if(!live)return;
    }
  }
  if(fingerStart&&e){
    const dx=e.clientX-fingerStart.x,dy=e.clientY-fingerStart.y;
    if(view.z<=1.01&&S.fingerSwipe&&Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*1.6&&Date.now()-fingerStart.t<650)go(dx<0?1:-1);
    else if(S.penOnly&&!GS.get("penSeen",false)&&Math.hypot(dx,dy)>12&&++penMiss>=2){penMiss=0;openPenHelp()}
    else if(Math.abs(dx)<8&&Math.abs(dy)<8&&Date.now()-fingerStart.t<450&&openModelAt(e)){}
    else if(S.penOnly&&Math.abs(dx)<8&&Math.abs(dy)<8&&Date.now()-lastPalmToast>25000){
      lastPalmToast=Date.now();
      toast("Đang bật Chỉ nhận S Pen · tách 2 ngón để phóng to trang");
    }
    fingerStart=null;
  }
  if(!live)return;
  if(e&&live.pid!=null&&e.pointerId!==live.pid)return;
  /* bút chấm nhanh vào ô điểm (không kéo): mở bảng phân tích, không để lại chấm mực */
  if(live.meas&&e&&Date.now()-live.meas.t<450&&Math.hypot(e.clientX-live.meas.x,e.clientY-live.meas.y)<10){
    if(history.length)history.pop();if(live.redo0)redoStack=live.redo0;paperSoundStop();live=null;renderInk();openScoreReport();return}
  delete live.meas;const redo0=live.redo0;delete live.redo0;delete live.pid;
  if(live.erase){if(live.vung){if(xoaTrongVong(live.vung))live.changed=true;clearFx()}else gomXong()}
  const gomVua=live.erase&&live.changed&&tool==="eraser";
  if(!live.erase){delete live.fromTouch;live.p=simplifyStroke(live.p,0.32);strokes.push(live)}
  else if(!live.changed&&history.length){history.pop();if(redo0)redoStack=redo0}
  const doiNet=!live.erase||live.changed;paperSoundStop();live=null;renderInk();if(doiNet)saveInk();
  if(gomVua&&S.gomVeViet)setTool("pen");   /* Tự quay về viết sau khi gôm (Bật/Tắt trong bảng Gôm) */
}
ink.addEventListener("pointerup",endStroke);ink.addEventListener("pointercancel",endStroke);
window.addEventListener("pointerup",e=>{if(e.pointerType==="touch"){touches.delete(e.pointerId);if(touches.size<2)pinch=null}});
window.addEventListener("pointercancel",e=>{if(e.pointerType==="touch"){touches.delete(e.pointerId);if(touches.size<2)pinch=null}});
window.addEventListener("blur",()=>{if(live)endStroke();if(zbox.live)endZBoxStroke();touches.clear();pinch=null;paperSoundStop()});
window.addEventListener("pagehide",flushSave);
document.addEventListener("visibilitychange",()=>{if(document.hidden)flushSave()});

function segDist2(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy;let u=L2?((px-a[0])*dx+(py-a[1])*dy)/L2:0;u=Math.max(0,Math.min(1,u));
  const x=a[0]+dx*u-px,y=a[1]+dy*u-py;return x*x+y*y}
function strokeHit(s,q,r2){const p=s.p;if(p.length===1){const dx=p[0][0]-q[0],dy=p[0][1]-q[1];return dx*dx+dy*dy<r2}
  for(let i=1;i<p.length;i++)if(segDist2(q[0],q[1],p[i-1],p[i])<r2)return true;return false}
function densify(p,step){const out=[p[0]];for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(d>step){const n=Math.ceil(d/step);for(let k=1;k<n;k++){const t=k/n;out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,(a[2]||.5)+((b[2]||.5)-(a[2]||.5))*t,(a[3]||0)+((b[3]||0)-(a[3]||0))*t])}}
  out.push(b)}return out}
/* ================== GÔM ==================
   S Pen gửi tới khoảng 240 điểm mỗi giây. Trước đây mỗi điểm đều dò lại mọi nét và vẽ lại cả trang nên gôm rất chậm.
   Nay: gom các điểm gôm lại, mỗi khung hình xử lý một lần; nét nào nằm ngoài vùng gôm (theo khung bao) thì bỏ qua ngay;
   xong mới vẽ lại một lần. Ba kiểu: Xóa từng đoạn (part), Xóa cả nét (stroke), Khoanh vùng để xóa (vung, xử lý lúc nhấc viết). */
const _khungNet=new WeakMap();
function khungNet(s){let k=_khungNet.get(s);if(k)return k;let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const p of s.p){if(p[0]<a)a=p[0];if(p[0]>c)c=p[0];if(p[1]<b)b=p[1];if(p[1]>d)d=p[1]}k=[a,b,c,d];_khungNet.set(s,k);return k}
let gomCho=[],gomHen=0,gomTruoc=null;
function eraseAt(q,z=view.z){
  const r=(S.eraserR||16)/Math.max(1,z||1);
  /* Đưa viết nhanh thì hai điểm cách xa: chèn thêm điểm giữa để không sót đoạn */
  if(gomTruoc&&gomTruoc.r===r){const dx=q[0]-gomTruoc.q[0],dy=q[1]-gomTruoc.q[1],d=Math.hypot(dx,dy),n=Math.floor(d/(r*.5));
    for(let k=1;k<n;k++)gomCho.push([gomTruoc.q[0]+dx*k/n,gomTruoc.q[1]+dy*k/n,r])}
  gomCho.push([q[0],q[1],r]);gomTruoc={q,r};
  if(!gomHen)gomHen=requestAnimationFrame(xuLyGom);
}
function xuLyGom(){
  gomHen=0;if(!gomCho.length)return;
  const ds=gomCho;gomCho=[];
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[x,y,r]of ds){x0=Math.min(x0,x-r);y0=Math.min(y0,y-r);x1=Math.max(x1,x+r);y1=Math.max(y1,y+r)}
  const gan=(p)=>{for(const[x,y,r]of ds){const dx=p[0]-x,dy=p[1]-y;if(dx*dx+dy*dy<r*r)return true}return false};
  const cham=s=>{const k=khungNet(s);if(k[2]<x0||k[0]>x1||k[3]<y0||k[1]>y1)return false;
    for(const[x,y,r]of ds)if(strokeHit(s,[x,y],r*r))return true;return false};
  let changed=false;const next=[];
  if(S.eraseMode==="stroke"){for(const s of strokes){if(cham(s))changed=true;else next.push(s)}}
  else for(const s of strokes){
    if(!cham(s)){next.push(s);continue}
    /* Xóa từng đoạn: chèn thêm điểm dọc nét rồi cắt, nên tẩy được cả khúc giữa nét thẳng.
       Đầu gôm chỉ sượt mép (không điểm nào bị xóa) thì giữ nguyên nét gốc. */
    const pts=densify(s.p,Math.max(1,ds[0][2]*.35)),manh=[];let seg=[],cat=false;
    for(const p of pts){if(gan(p)){cat=true;if(seg.length>1)manh.push(Object.assign({},s,{p:seg}));seg=[]}else seg.push(p)}
    if(!cat){next.push(s);continue}
    changed=true;
    if(seg.length>1)manh.push(Object.assign({},s,{p:seg}));
    next.push(...manh);
  }
  if(changed){strokes=next;if(live)live.changed=true;if(typeof zbox!=="undefined"&&zbox.live)zbox.live.changed=true;renderInk()}
}
/* Chốt mọi thao tác đang dở (nét đang viết, gôm đang kéo, điểm gôm còn chờ) trước khi đổi trang */
function chotThaoTac(){if(live)endStroke();if(typeof zbox!=="undefined"&&zbox.live)endZBoxStroke();if(gomHen||gomCho.length)gomXong();gomTruoc=null}
/* Gôm hết các điểm còn chờ ngay (gọi khi nhấc viết) */
function gomXong(){if(gomHen){cancelAnimationFrame(gomHen);gomHen=0}xuLyGom();gomTruoc=null}
/* Khoanh vùng để xóa: nét có từ một nửa số điểm trở lên nằm trong vòng khoanh thì bị xóa */
function trongVong(p,v){let o=false;for(let i=0,j=v.length-1;i<v.length;j=i++){const a=v[i],b=v[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])o=!o}return o}
function xoaTrongVong(v){
  if(!v||v.length<3)return false;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const[x,y]of v){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  const next=strokes.filter(s=>{const k=khungNet(s);if(k[2]<x0||k[0]>x1||k[3]<y0||k[1]>y1)return true;let n=0;for(const p of s.p)if(trongVong(p,v))n++;return n*2<s.p.length});
  if(next.length===strokes.length)return false;
  strokes=next;renderInk();return true;
}
function veVongKhoanh(v){
  clearFx();if(!v||v.length<2)return;
  setViewTransform(fctx);
  fctx.beginPath();v.forEach((p,i)=>i?fctx.lineTo(p[0],p[1]):fctx.moveTo(p[0],p[1]));fctx.closePath();
  fctx.fillStyle="rgba(201,28,23,.08)";fctx.fill();fctx.strokeStyle="rgba(201,28,23,.85)";fctx.lineWidth=1.6/view.z;fctx.setLineDash([6/view.z,4/view.z]);fctx.stroke();fctx.setLineDash([]);
}

