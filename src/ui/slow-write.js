/* ================== SỔ TAY, HOẠT ẢNH BÚT VIẾT MẪU & NHẬP MÔN ================== */
const LEGEND_FULL=`<div class="leg"><span><i class="dot">1</i>đặt viết, thứ tự nét</span><span><i class="ln"></i>kéo xuống, nhấn</span><span><i class="ln d"></i>đưa lên, nhẹ tay</span></div>`;
const LEGEND_SIMPLE=`<div class="leg"><span><i class="dot" style="background:#15803D">1</i>đặt viết, số = thứ tự</span><span><i class="ln" style="width:18px"></i>hướng viết</span><span><i class="dot" style="width:10px;height:10px"></i>dừng viết</span></div>`;
let LEGEND=LEGEND_SIMPLE;
function cardItems(l){
  const out=[],rows=lessonRows(l);if(!rows)return out;
  for(const r of rows){if(out.length>=8)break;
    if(r[0]==="stroke"){if(!out.includes("~"+r[1]))out.push("~"+r[1])}
    else if(r[0]==="rep"){for(const w of r[1].split(" ")){if(w&&!out.includes(w)&&out.length<8)out.push(w)}}}
  const single=out.filter(x=>[...x].length===1||x[0]==="~");if(single.length)return single.slice(0,8);if(out.length)return out.slice(0,4);
  for(const r of rows)if(r[0]==="pair"){
    const w=r[1].split(" ").filter(Boolean).sort((a,b)=>b.length-a.length)[0];
    if(w){const cl=w.replace(/[,.?!;:]/g,"");if(cl&&!out.includes(cl))out.push(cl)}
    if(out.length>=3)break}
  return out}
function drawCard(cv,items,fam){
  const Wc=cv.parentElement.clientWidth-2,d=Math.min(devicePixelRatio||1,3),F=FONTS[fam||SC.font],xh=Math.min(44,Wc/7.5),fs=xh/F.x;
  const th=SCRIPT==="th",up=(th?2.5:2.3)*xh,dn=(th?1.5:1.3)*xh,pitch=up+dn+(th?12:10),ctx=cv.getContext("2d");
  ctx.font=fnt(fs,F.fam);
  const widths=items.map(it=>it[0]==="~"?(STROKES[it.slice(1)].w+1.3)*xh:ctx.measureText(it).width+xh*1.2);
  const rows=[];let row=[],x=0;
  items.forEach((it,i)=>{const w=widths[i]+xh*.8;if(x+w>Wc-xh*.6&&row.length){rows.push(row);row=[];x=0}row.push([it,x]);x+=w});if(row.length)rows.push(row);
  const Hc=rows.length*pitch+12;cv.width=Wc*d;cv.height=Hc*d;cv.style.height=Hc+"px";ctx.setTransform(d,0,0,d,0,0);
  const dark=themeName()==="dark";
  const cardTheme=THEMES[themeName()]||THEMES.sepia;
  ctx.fillStyle=cardTheme.paper;ctx.fillRect(0,0,Wc,Hc);
  const m={xh,fs,asc:fs*F.asc,desc:fs*F.desc,tan:Math.tan(F.slant*Math.PI/180),co:thCoBaiDangMo()},save=T,saveL=layout;T=cardTheme;layout={padL:12,safeSide:12};
  rows.forEach((r,i)=>{const b=6+up+i*pitch;guides(ctx,b,m,6,Wc-6);
    for(const[it,x0]of r){const x=x0+xh*.9+(it==="g"||it[0]==="j"?xh*.5:0);
      if(it[0]==="~"){drawBasic(ctx,it.slice(1),x,b,xh,cardTheme.model,m.tan);drawGuide(ctx,it,x,b,xh,dark)}
      else{text(ctx,it,x,b,fs,cardTheme.model,F.fam);arrowsOnText(ctx,it,x,b,fs,xh,F.fam)}}});
  T=save;layout=saveL}

/* Hoạt ảnh bút viết chậm & Tự tô từng nét tương tác kiểu Hanzi Writer */
let animState={ch:null,mode:"watch",list:[],playing:false,slow:true,big:false,progress:0,t:0,dur:0,tl:[],strokes:[],bounds:null};
let quiz={idx:0,misses:0,live:null,failPts:null,failUntil:0,hint:null,geom:null,timer:0,doneSet:new Set(),msg:"",msgKind:""};
function animableItems(items){
  const res=[];
  for(const it of items){
    if(DUCTUS[it]){if(!res.includes(it))res.push(it)}
    else if(it[0]!=="~"){for(const ch of [...it])if(DUCTUS[ch]&&!res.includes(ch))res.push(ch)}
  }
  return res.slice(0,8);
}
function buildAnimData(ch){
  const list=[];
  let minX=99,maxX=-99,minY=99,maxY=-99;
  for(const st of (DUCTUS[ch]||[])){
    const runs=[];let totalLen=0;
    for(const raw of st.r){
      const pts=aCatmull(raw,20);
      if(pts.length<2)continue;
      const cum=[0];
      for(let i=0;i<pts.length;i++){
        if(pts[i][0]<minX)minX=pts[i][0];if(pts[i][0]>maxX)maxX=pts[i][0];
        if(pts[i][1]<minY)minY=pts[i][1];if(pts[i][1]>maxY)maxY=pts[i][1];
        if(i>0)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
      }
      const len=cum[cum.length-1]||0.001;
      runs.push({pts,cum,len,startAt:totalLen});
      totalLen+=len;
    }
    const side=Array.isArray(st.s)?st.s[0]:(st.s||1);
    if(runs.length)list.push({runs,totalLen:totalLen||0.001,mark:!!st.mark,side});
  }
  const F=FONTS[SC.font];
  /* Tiểu học: khung bám sát chữ (tối thiểu thân chữ và một chút trên dưới) để chữ thấp như a, o không bị nhỏ; hai kiểu kia giữ khung theo phông */
  minY=Math.min(minY,SCRIPT==="th"?-0.3:-F.desc/F.x);
  maxY=Math.max(maxY,SCRIPT==="th"?1.3:F.asc/F.x);
  if(minX>maxX){minX=0;maxX=1}
  return {list,bounds:{minX,maxX,minY,maxY}};
}
function sliceRun(run,dist){
  const {pts,cum,len}=run;
  if(dist<=0)return [pts[0]];
  if(dist>=len)return pts;
  const out=[pts[0]];
  for(let i=1;i<pts.length;i++){
    if(cum[i]<=dist){out.push(pts[i])}
    else{
      const seg=cum[i]-cum[i-1]||1,t=(dist-cum[i-1])/seg;
      out.push([pts[i-1][0]+(pts[i][0]-pts[i-1][0])*t,pts[i-1][1]+(pts[i][1]-pts[i-1][1])*t]);
      break;
    }
  }
  return out;
}
/* Bút viết chậm: tốc độ đều theo chiều dài nét; cọ thu hẹp nét lên để giảm lem tại giao điểm */
const ANIM_V={slow:1.5,mid:2.7};
const ANIM_PAUSE=.4,ANIM_HOLD=1.8;
function animTimeline(){
  const v=animState.slow?ANIM_V.slow:ANIM_V.mid;let t=0;const tl=[];
  for(const st of animState.strokes){const d=Math.max(.3,st.totalLen/v);tl.push({s:t,e:t+d});t+=d+ANIM_PAUSE}
  animState.tl=tl;animState.dur=Math.max(0,t-ANIM_PAUSE);
}
function animProgressAt(t){const tl=animState.tl||[];
  for(let i=0;i<tl.length;i++){if(t<tl[i].s)return i;if(t<tl[i].e)return i+(t-tl[i].s)/(tl[i].e-tl[i].s)}
  return tl.length}
function animTimeOf(p){const tl=animState.tl||[];if(!tl.length)return 0;const i=Math.min(tl.length-1,Math.floor(p));
  if(p>=tl.length)return animState.dur;return tl[i].s+(p-i)*(tl[i].e-tl[i].s)}
function charLabel(ch){return ch[0]==="~"?(STROKE_NAME[ch.slice(1)]||ch.slice(1)):`Chữ “${ch}”`}
function updAnimChips(){
  document.querySelectorAll(".animChip").forEach(b=>{
    b.classList.toggle("on",b.dataset.ch===animState.ch);
    b.classList.toggle("done",quiz.doneSet.has(b.dataset.ch));
  });
}
function renderAnimCtrl(){
  const box=document.getElementById("animCtrl");if(!box)return;
  if(animState.mode==="quiz"){
    const total=animState.strokes.length,doneAll=quiz.idx>=total&&total>0;
    const curI=animState.list.indexOf(animState.ch),hasNext=curI>=0&&curI<animState.list.length-1;
    let h="";
    if(doneAll&&hasNext){
      h+=`<button class="play" onclick="quizNextChar()">Chữ tiếp theo ›</button>`;
    }else{
      h+=`<button class="play" onclick="quizShowHint()">${ic("play")}Gợi ý nét</button>`;
    }
    h+=`<button onclick="quizReset()">${ic("replay")}Tô lại</button>`;
    h+=`<button id="animZoomBtn" onclick="toggleAnimZoom()">${animState.big?ic("collapse")+"Thu gọn":ic("zbox")+"Phóng to"}</button>`;
    box.innerHTML=h;return;
  }
  box.innerHTML=`<button class="play" id="animPlayBtn" onclick="toggleAnimPlay()">${animState.playing?ic("pause")+"Tạm dừng":ic("play")+"Tiếp tục"}</button>
    <button id="animSpdBtn" onclick="toggleAnimSpeed()">Tốc độ: ${animState.slow?"Chậm":"Vừa"}</button>
    <button onclick="initAnim(animState.ch,true)">${ic("replay")}Viết lại</button>
    <button id="animZoomBtn" onclick="toggleAnimZoom()">${animState.big?ic("collapse")+"Thu gọn":ic("zbox")+"Phóng to"}</button>`;
}
function setAnimMode(mode){
  if(mode!=="watch"&&mode!=="quiz")return;
  animState.mode=mode;
  const w=document.getElementById("atWatch"),q=document.getElementById("atQuiz"),cv=document.getElementById("animCv");
  if(w)w.classList.toggle("on",mode==="watch");
  if(q)q.classList.toggle("on",mode==="quiz");
  if(cv)cv.classList.toggle("quizOn",mode==="quiz");
  if(animState.ch)initAnim(animState.ch,mode==="watch");
}
function initAnim(ch,autoPlay=true){
  stopAnim();
  const cv=document.getElementById("animCv");if(!cv||!DUCTUS[ch])return;
  const built=buildAnimData(ch);
  animState.ch=ch;animState.progress=0;animState.t=0;animState.playing=animState.mode==="watch"&&autoPlay;
  animState.strokes=built.list;animState.bounds=built.bounds;animTimeline();
  quiz.idx=0;quiz.misses=0;quiz.live=null;quiz.failPts=null;quiz.failUntil=0;quiz.hint=null;quiz.msg="";quiz.msgKind="";
  cv.classList.toggle("quizOn",animState.mode==="quiz");
  updAnimChips();
  renderAnimCtrl();
  lastAnimT=0;
  if(animState.mode==="quiz"){
    drawQuizFrame();
    startQuizIdleLoop();
  }else if(animState.playing){
    animLoop();
  }else{
    drawAnimFrame();
  }
}
function drawPenTip(ctx,tip){
  ctx.save();
  const ek=themeName()==="eink";
  ctx.fillStyle=ek?"rgba(0,0,0,.18)":"rgba(201,28,23,.26)";ctx.beginPath();ctx.arc(tip[0],tip[1],14,0,7);ctx.fill();
  ctx.fillStyle=ek?"#000000":"#D21F1A";ctx.beginPath();ctx.arc(tip[0],tip[1],6.5,0,7);ctx.fill();
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(tip[0],tip[1],2.4,0,7);ctx.fill();
  ctx.restore();
}
function drawStartBadge(ctx,pt,num,active,dark,paper,pulse=0){
  const r=active?9.5:7;
  ctx.save();
  if(active&&pulse>0){
    const pr=r+3+pulse*11,al=Math.max(0,(1-pulse)*.55);
    ctx.strokeStyle=dark?`rgba(56,211,113,${al})`:`rgba(21,128,61,${al})`;
    ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(pt[0],pt[1],pr,0,7);ctx.stroke();
  }
  ctx.globalAlpha=active?1:.62;
  ctx.fillStyle=paper;ctx.beginPath();ctx.arc(pt[0],pt[1],r+1.8,0,7);ctx.fill();
  ctx.fillStyle=themeName()==="eink"?"#000000":(dark?"#38D371":"#15803D");ctx.beginPath();ctx.arc(pt[0],pt[1],r,0,7);ctx.fill();
  ctx.fillStyle="#fff";ctx.font=`700 ${active?12:10}px 'QS',sans-serif`;
  ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(num,pt[0],pt[1]+0.5);
  ctx.restore();
}
function ensureAnimGlyph(cv,ch,xPos,b,xh,fs,tan,F,d,Wc,Hc,dark,ct){
  const tn=themeName();
  const key=[animState.mode,ch,Wc,Hc,d,tn,SCRIPT,Math.round(xPos),Math.round(b),xh.toFixed(2)].join("|");
  if(animGlyph.key!==key){
    const mk=col=>{const g=document.createElement("canvas");g.width=cv.width;g.height=cv.height;const c=g.getContext("2d");c.setTransform(d,0,0,d,0,0);
      if(ch[0]==="~")drawBasic(c,ch.slice(1),xPos,b,xh,col,tan);else text(c,ch,xPos,b,fs,col,F.fam);return g};
    animGlyph={key,model:mk(ct.model),act:mk(dark?"#82B4FF":tn==="eink"?"#555555":"#184E9E")};
  }
}
/* Tô theo vùng (v0.10.2): mỗi điểm mực của chữ mẫu được giao cho điểm gần nhất trên đường nét,
   nhớ nét thứ mấy và vị trí dọc theo nét. Hoạt hình hiện điểm mực khi bút đi qua vị trí đó,
   nên chữ luôn được tô đủ 100% và đúng thứ tự nét, kể cả các phần nét mảnh nằm xa đường nét. */
let revealOwn=null;
function revealOwnerMap(src,Tp,d,all){
  const p0=Tp([0,0]),p1=Tp([1,1]);
  const key=[src.width,src.height,d,p0[0].toFixed(2),p0[1].toFixed(2),p1[0].toFixed(2),p1[1].toFixed(2),all.length,all.map(s=>s.totalLen.toFixed(4)+":"+s.runs[0].pts[0].map(v=>v.toFixed(3)).join(",")).join(";")].join("|");
  if(revealOwn&&revealOwn.key===key){
    let img=revealOwn.imgs.get(src);
    if(!img){img=src.getContext("2d").getImageData(revealOwn.bx,revealOwn.by,revealOwn.bw,revealOwn.bh);revealOwn.imgs.set(src,img)}
    revealOwn.img=img;return revealOwn}
  const W=src.width,H=src.height,sc=src.getContext("2d"),full=sc.getImageData(0,0,W,H).data;
  let x0=W,y0=H,x1=-1,y1=-1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(full[(y*W+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0){revealOwn={key,imgs:new Map(),bx:0,by:0,bw:1,bh:1,pix:new Int32Array(0),sk:new Uint16Array(0),st:new Float32Array(0)};revealOwn.img=sc.getImageData(0,0,1,1);revealOwn.imgs.set(src,revealOwn.img);return revealOwn}
  const bw=x1-x0+1,bh=y1-y0+1;
  const P=[];all.forEach((st,k)=>{for(const run of st.runs)run.pts.forEach((q,n)=>{const t=Tp(q);P.push(t[0]*d,t[1]*d,k,run.startAt+run.cum[n])})});
  const np=P.length/4,pix=[],sk=[],stt=[];
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    if(full[(y*W+x)*4+3]<=8)continue;
    let best=1e18,bi=0;for(let n=0;n<np;n++){const dx=P[n*4]-x,dy=P[n*4+1]-y,dd=dx*dx+dy*dy;if(dd<best){best=dd;bi=n}}
    pix.push((y-y0)*bw+(x-x0));sk.push(P[bi*4+2]);stt.push(P[bi*4+3])}
  revealOwn={key,imgs:new Map(),bx:x0,by:y0,bw,bh,pix:Int32Array.from(pix),sk:Uint16Array.from(sk),st:Float32Array.from(stt)};
  revealOwn.img=sc.getImageData(x0,y0,bw,bh);revealOwn.imgs.set(src,revealOwn.img);
  return revealOwn;
}
function revealGlyphLayer(ctx,cv,d,xh,Tp,src,strokesLim,all){
  all=all||(animState&&animState.strokes)||strokesLim.map(x=>x[0]);
  const lim=new Float32Array(all.length).fill(-1);let any=false;
  for(const[st,l]of strokesLim){const k=all.indexOf(st);if(k>=0&&l>0){lim[k]=l;any=true}}
  if(!any)return;
  const O=revealOwnerMap(src,Tp,d,all);
  /* Lưu sẵn hình đã tô theo tiến độ: khung hình giống nhau (Tự tô đứng chờ) không phải tính lại */
  if(!O.out)O.out=new Map();
  const ok=Array.from(lim,v=>v.toFixed(4)).join(",");
  let g=O.out.get(src)&&O.out.get(src).k===ok?O.out.get(src).c:null;
  if(!g){
    const out=new ImageData(O.bw,O.bh),a=O.img.data,b=out.data;
    for(let n=0;n<O.pix.length;n++){if(O.st[n]<=lim[O.sk[n]]+1e-6){const p=O.pix[n]*4;b[p]=a[p];b[p+1]=a[p+1];b[p+2]=a[p+2];b[p+3]=a[p+3]}}
    const prev=O.out.get(src);g=prev&&prev.c.width===O.bw&&prev.c.height===O.bh?prev.c:document.createElement("canvas");
    g.width=O.bw;g.height=O.bh;g.getContext("2d").putImageData(out,0,0);O.out.set(src,{k:ok,c:g});
  }
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(g,O.bx,O.by);ctx.restore();
}
function drawAnimFrame(){
  const cv=document.getElementById("animCv");if(!cv||!animState.ch)return;
  if(animState.mode==="quiz"){drawQuizFrame();return}
  const Wc=cv.parentElement.clientWidth-2,Hc=animState.big?290:200,d=Math.min(devicePixelRatio||1,3);
  const cwPx=Math.round(Wc*d),chPx=Math.round(Hc*d);
  if(cv.width!==cwPx||cv.height!==chPx){cv.width=cwPx;cv.height=chPx;cv.style.height=Hc+"px"}
  const ctx=cv.getContext("2d");ctx.setTransform(d,0,0,d,0,0);
  const tn=themeName(),dark=tn==="dark",ct=THEMES[tn]||THEMES.sepia;
  ctx.fillStyle=ct.paper;ctx.fillRect(0,0,Wc,Hc);

  const midX=Math.round(Wc/2),halfW=midX-12,topBar=26;
  const F=FONTS[SC.font],B=animState.bounds;
  const spanY=(B.maxY-B.minY)+0.42,spanX=(B.maxX-B.minX)+0.75;
  const xh=Math.min(animState.big?62:44,(Hc-topBar-16)/spanY,(halfW-14)/spanX);
  const fs=xh/F.x,tan=Math.tan(F.slant*Math.PI/180);
  const b=topBar+((Hc-topBar-10)-(B.maxY-B.minY)*xh)/2+B.maxY*xh;
  const m={xh,fs,asc:fs*F.asc,desc:fs*F.desc,tan,co:thCoBaiDangMo()};

  const saveT=T,saveL=layout;T=ct;
  ctx.save();ctx.beginPath();ctx.rect(0,topBar,Wc,Hc-topBar);ctx.clip();   /* lưới không tràn lên dòng tiêu đề */
  layout={padL:12,safeSide:12};guides(ctx,b,m,8,midX-8);
  layout={padL:midX+12,safeSide:12};guides(ctx,b,m,midX+8,Wc-8);
  ctx.restore();
  T=saveT;layout=saveL;

  ctx.save();
  ctx.strokeStyle=ct.asc;ctx.lineWidth=1.5;ctx.setLineDash([5,5]);
  ctx.beginPath();ctx.moveTo(midX,8);ctx.lineTo(midX,Hc-8);ctx.stroke();
  ctx.setLineDash([]);
  ctx.font="700 13.5px 'QS',sans-serif";ctx.textAlign="center";ctx.textBaseline="top";
  ctx.fillStyle=ct.hint;ctx.fillText("Chữ mẫu chuẩn",midX/2,6);
  ctx.fillStyle=dark?"#82B4FF":tn==="eink"?"#000000":"#184E9E";ctx.fillText("Viết chậm",midX+midX/2,6);
  ctx.restore();

  const ch=animState.ch,centerOff=((B.minX+B.maxX)/2)*xh;
  const xL=midX/2-centerOff;
  const xR=midX+midX/2-centerOff;
  const TpR=p=>[xR+p[0]*xh,b-p[1]*xh];

  if(ch[0]==="~")drawBasic(ctx,ch.slice(1),xL,b,xh,ct.model,tan);
  else text(ctx,ch,xL,b,fs,ct.model,F.fam);

  const total=animState.strokes.length;
  const doneAll=animState.progress>=total;
  const curIdx=Math.min(total-1,Math.floor(animState.progress));
  const frac=doneAll?1:(animState.progress-curIdx);
  let activeTip=null;

  ensureAnimGlyph(cv,ch,xR,b,xh,fs,tan,F,d,Wc,Hc,dark,ct);
  if(doneAll){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(animGlyph.model,0,0);ctx.restore()}
  else{
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=.15;ctx.drawImage(animGlyph.model,0,0);ctx.restore();
    const doneList=[];for(let s=0;s<curIdx;s++)doneList.push([animState.strokes[s],animState.strokes[s].totalLen]);
    revealGlyphLayer(ctx,cv,d,xh,TpR,animGlyph.model,doneList);
    const st=animState.strokes[curIdx],lim=frac*st.totalLen;
    revealGlyphLayer(ctx,cv,d,xh,TpR,animGlyph.act,[[st,lim]]);
    for(const run of st.runs){if(lim<=run.startAt)continue;const pts=sliceRun(run,Math.min(run.len,lim-run.startAt));activeTip=TpR(pts[pts.length-1])}
    if(!activeTip)activeTip=TpR(st.runs[0].pts[0]);
  }
  for(let s=0;s<=curIdx&&s<total;s++){
    const st=animState.strokes[s];
    drawStartBadge(ctx,TpR(st.runs[0].pts[0]),s+1,!doneAll&&s===curIdx,dark,ct.paper);
  }
  if(activeTip)drawPenTip(ctx,activeTip);

  const info=document.getElementById("animInfo");
  if(info){
    info.className="";
    const label=charLabel(ch);
    info.textContent=doneAll?`${label} · Hoàn thành (${total} nét)`:`${label} · Đang viết nét ${curIdx+1}/${total}`;
  }
}

