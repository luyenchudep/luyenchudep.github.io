/* ---------- CHẾ ĐỘ TỰ TÔ TỪNG NÉT TƯƠNG TÁC (HANZI WRITER QUIZ MODE) ---------- */
function drawQuizDirArrow(ctx,st,Tp,xh,dark,eink){
  if(st.totalLen<0.23||!st.runs.length)return;
  const run=st.runs[0];
  let a0=0.22;if(run.len<a0+0.15)a0=0;
  const offPts=aOffset(run.pts,st.side||1);
  const seg=aHead(aTrim(offPts,a0,0),Math.min(0.62,Math.max(0.20,run.len*0.48)));
  if(seg.length<2)return;
  const col=eink?"#333333":(dark?ARROW.redDark:ARROW.red);
  const lw=Math.max(1.8,.055*xh);
  ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=lw;ctx.lineCap="round";ctx.lineJoin="round";
  ctx.beginPath();const s=Tp(seg[0]);ctx.moveTo(s[0],s[1]);
  for(let i=1;i<seg.length;i++){const q=Tp(seg[i]);ctx.lineTo(q[0],q[1])}ctx.stroke();
  const A=Tp(seg[Math.max(0,seg.length-3)]),B=Tp(seg[seg.length-1]);
  const L=Math.hypot(B[0]-A[0],B[1]-A[1])||1,ux=(B[0]-A[0])/L,uy=(B[1]-A[1])/L;
  const ah=Math.max(7,.22*xh),aw=ah*.58;
  ctx.beginPath();ctx.moveTo(B[0]+ux*ah*.35,B[1]+uy*ah*.35);
  ctx.lineTo(B[0]-ux*ah*.65-uy*aw,B[1]-uy*ah*.65+ux*aw);
  ctx.lineTo(B[0]-ux*ah*.65+uy*aw,B[1]-uy*ah*.65-ux*aw);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawQuizFrame(nowTs){
  const cv=document.getElementById("animCv");if(!cv||!animState.ch||animState.mode!=="quiz")return;
  const Wc=cv.parentElement.clientWidth-2,Hc=(animState.big?440:330)+(SCRIPT==="td"?20:0),d=Math.min(devicePixelRatio||1,3);
  const cwPx=Math.round(Wc*d),chPx=Math.round(Hc*d);
  if(cv.width!==cwPx||cv.height!==chPx){cv.width=cwPx;cv.height=chPx;cv.style.height=Hc+"px"}
  const ctx=cv.getContext("2d");ctx.setTransform(d,0,0,d,0,0);
  const tn=themeName(),dark=tn==="dark",eink=tn==="eink",ct=THEMES[tn]||THEMES.sepia;
  ctx.fillStyle=ct.paper;ctx.fillRect(0,0,Wc,Hc);

  const topBar=28,padX=20;
  const F=FONTS[SC.font],B=animState.bounds;
  const spanY=(B.maxY-B.minY)+0.46,spanX=(B.maxX-B.minX)+0.9;
  const xh=Math.min(animState.big?170:130,(Hc-topBar-18)/spanY,(Wc-padX*2)/spanX);
  const fs=xh/F.x,tan=Math.tan(F.slant*Math.PI/180);
  const b=topBar+((Hc-topBar-12)-(B.maxY-B.minY)*xh)/2+B.maxY*xh;
  const m={xh,fs,asc:fs*F.asc,desc:fs*F.desc,tan};
  const ch=animState.ch,xC=Wc/2-((B.minX+B.maxX)/2)*xh;
  const Tp=p=>[xC+p[0]*xh,b-p[1]*xh];
  quiz.geom={x0:xC,b,xh,Wc,Hc};

  const saveT=T,saveL=layout;T=ct;layout={padL:14,safeSide:14};guides(ctx,b,m,10,Wc-10);T=saveT;layout=saveL;

  const total=animState.strokes.length,doneAll=quiz.idx>=total&&total>0;
  ctx.save();ctx.font="700 13.5px 'QS',sans-serif";ctx.textAlign="center";ctx.textBaseline="top";
  ctx.fillStyle=doneAll?(eink?"#000000":dark?"#38D371":"#157A3B"):(eink?"#000000":dark?"#82B4FF":"#184E9E");
  ctx.fillText(doneAll?`${charLabel(ch)} · Hoàn thành ✓`:`Tự tô từng nét · Nét ${quiz.idx+1}/${total}`,Wc/2,6);
  ctx.restore();

  ensureAnimGlyph(cv,ch,xC,b,xh,fs,tan,F,d,Wc,Hc,dark,ct);
  if(doneAll){
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(animGlyph.model,0,0);ctx.restore();
  }else{
    /* bóng chữ mẫu mờ để người học bám tỉ lệ */
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=.17;ctx.drawImage(animGlyph.model,0,0);ctx.restore();
    /* các nét đã tô đúng */
    if(quiz.idx>0){
      const doneList=[];for(let s=0;s<quiz.idx;s++)doneList.push([animState.strokes[s],animState.strokes[s].totalLen]);
      revealGlyphLayer(ctx,cv,d,xh,Tp,animGlyph.model,doneList);
    }
    const curSt=animState.strokes[quiz.idx];
    /* chạy gợi ý 1 nét nếu đang hiện gợi ý */
    if(quiz.hint){
      const lim=quiz.hint.frac*curSt.totalLen;
      revealGlyphLayer(ctx,cv,d,xh,Tp,animGlyph.act,[[curSt,lim]]);
      let tip=Tp(curSt.runs[0].pts[0]);
      for(const run of curSt.runs){if(lim<=run.startAt)continue;const pts=sliceRun(run,Math.min(run.len,lim-run.startAt));tip=Tp(pts[pts.length-1])}
      drawStartBadge(ctx,Tp(curSt.runs[0].pts[0]),quiz.idx+1,true,dark,ct.paper,0);
      drawPenTip(ctx,tip);
    }else{
      drawQuizDirArrow(ctx,curSt,Tp,xh,dark,eink);
      const now=nowTs||performance.now();
      const pulse=(!quiz.live&&!eink&&!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches))?((now%1400)/1400):0;
      drawStartBadge(ctx,Tp(curSt.runs[0].pts[0]),quiz.idx+1,true,dark,ct.paper,pulse);
    }
    /* nét sai chớp đỏ ngắn để nhận biết chỗ lệch */
    const now=nowTs||performance.now();
    if(quiz.failPts&&now<quiz.failUntil){
      const al=Math.max(0,(quiz.failUntil-now)/380)*.58;
      ctx.save();ctx.strokeStyle=eink?`rgba(0,0,0,${al})`:dark?`rgba(255,120,112,${al})`:`rgba(201,28,23,${al})`;
      ctx.lineWidth=Math.max(3,xh*.09);ctx.lineCap="round";ctx.lineJoin="round";
      if(eink)ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.moveTo(quiz.failPts[0][0],quiz.failPts[0][1]);
      for(let i=1;i<quiz.failPts.length;i++)ctx.lineTo(quiz.failPts[i][0],quiz.failPts[i][1]);
      ctx.stroke();ctx.restore();
    }
    /* nét người học đang kéo bằng S Pen */
    if(quiz.live&&quiz.live.p.length){
      drawStroke(ctx,quiz.live);
    }
  }
  const info=document.getElementById("animInfo");
  if(info){
    if(quiz.msg){info.textContent=quiz.msg;info.className=quiz.msgKind||""}
    else if(doneAll){info.textContent=`${charLabel(ch)} · Hoàn thành (${total}/${total} nét) ✓`;info.className="ok"}
    else{
      const st=animState.strokes[quiz.idx];
      info.className="";
      info.textContent=st.totalLen<0.23?`Nét ${quiz.idx+1}/${total} · Chấm nhẹ vào chấm xanh số ${quiz.idx+1}`:`Nét ${quiz.idx+1}/${total} · Đặt viết ở chấm xanh số ${quiz.idx+1}, kéo theo mũi tên`;
    }
  }
}
function evalQuizStroke(uPts,st){
  const refRaw=[];for(const run of st.runs)refRaw.push(...run.pts);
  const refLen=aLen(refRaw),uLen=aLen(uPts);
  /* 1. Chấm nhỏ (chấm i, j, dấu nặng): chỉ cần chấm gần vị trí chấm */
  if(refLen<0.23){
    const rcx=refRaw.reduce((a,p)=>a+p[0],0)/refRaw.length,rcy=refRaw.reduce((a,p)=>a+p[1],0)/refRaw.length;
    const ucx=uPts.reduce((a,p)=>a+p[0],0)/uPts.length,ucy=uPts.reduce((a,p)=>a+p[1],0)/uPts.length;
    const dist=Math.hypot(ucx-rcx,ucy-rcy);
    return dist<=0.65&&uLen<=1.0?{ok:true}:{ok:false,why:dist>0.65?"start":"far"};
  }
  const N=28,R=resamplePts(refRaw,N),U=uPts.length<2?Array.from({length:N},()=>uPts[0]):resamplePts(uPts,N);
  const uSmoothLen=aLen(U);
  const startTol=Math.max(0.55,Math.min(0.95,0.45+refLen*0.14));
  const dStart=Math.hypot(uPts[0][0]-refRaw[0][0],uPts[0][1]-refRaw[0][1]);
  const dEndAsStart=Math.hypot(uPts[0][0]-refRaw[refRaw.length-1][0],uPts[0][1]-refRaw[refRaw.length-1][1]);
  let dFwd=0,dRev=0;
  for(let i=0;i<N;i++){
    dFwd+=Math.hypot(U[i][0]-R[i][0],U[i][1]-R[i][1]);
    dRev+=Math.hypot(U[N-1-i][0]-R[i][0],U[N-1-i][1]-R[i][1]);
  }
  dFwd/=N;dRev/=N;
  let dotSum=0,dotCnt=0;
  for(let i=0;i<N-3;i+=2){
    const rx=R[i+3][0]-R[i][0],ry=R[i+3][1]-R[i][1],ux=U[i+3][0]-U[i][0],uy=U[i+3][1]-U[i][1];
    const rl=Math.hypot(rx,ry),ul=Math.hypot(ux,uy);
    if(rl>1e-4&&ul>1e-4){dotSum+=(rx*ux+ry*uy)/(rl*ul);dotCnt++}
  }
  const dirAlign=dotCnt?dotSum/dotCnt:1;
  if(uSmoothLen>=refLen*0.35&&(dRev<dFwd*0.78||dirAlign<0.15))return {ok:false,why:"dir"};
  if(dStart>startTol){
    if(dEndAsStart<startTol&&Math.hypot(refRaw[0][0]-refRaw[refRaw.length-1][0],refRaw[0][1]-refRaw[refRaw.length-1][1])>0.35)return {ok:false,why:"dir"};
    return {ok:false,why:"start"};
  }
  if(uSmoothLen<refLen*0.52)return {ok:false,why:"short"};
  if(uSmoothLen>refLen*2.1+0.7)return {ok:false,why:"far"};
  const pathTol=Math.max(0.45,Math.min(0.82,0.36+refLen*0.11));
  if(dFwd>pathTol)return {ok:false,why:"far"};
  return {ok:true};
}
function startQuizIdleLoop(){
  if(animRAF){cancelAnimationFrame(animRAF);animRAF=0}
  const reduced=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tick=ts=>{
    if(animState.mode!=="quiz"||!document.getElementById("card").classList.contains("open")){animRAF=0;return}
    const now=ts||performance.now();
    if(quiz.hint){
      const dt=Math.min(0.05,(now-(quiz.hint.last||now))/1000);quiz.hint.last=now;
      quiz.hint.t+=dt;
      const st=animState.strokes[quiz.idx],dur=Math.max(0.42,st.totalLen/(animState.slow?1.55:2.4));
      if(quiz.hint.t>=dur+0.42){quiz.hint=null}
      else{quiz.hint.frac=Math.min(1,quiz.hint.t/dur)}
      drawQuizFrame(now);
      animRAF=requestAnimationFrame(tick);return;
    }
    const needFail=quiz.failPts&&now<quiz.failUntil;
    const needPulse=!quiz.live&&quiz.idx<animState.strokes.length&&!reduced&&themeName()!=="eink";
    if(needFail||needPulse){
      if(!needFail&&quiz.failPts)quiz.failPts=null;
      drawQuizFrame(now);
      animRAF=requestAnimationFrame(tick);return;
    }
    if(quiz.failPts){quiz.failPts=null;drawQuizFrame(now)}
    animRAF=0;
  };
  animRAF=requestAnimationFrame(tick);
}
function quizShowHint(){
  if(animState.mode!=="quiz"||quiz.idx>=animState.strokes.length)return;
  if(quiz.timer){clearTimeout(quiz.timer);quiz.timer=0}
  quiz.live=null;quiz.failPts=null;quiz.hint={t:0,frac:0,last:performance.now()};
  startQuizIdleLoop();
}
function quizReset(){
  if(animState.mode!=="quiz")return;
  if(quiz.timer){clearTimeout(quiz.timer);quiz.timer=0}
  quiz.idx=0;quiz.misses=0;quiz.live=null;quiz.failPts=null;quiz.failUntil=0;quiz.hint=null;quiz.msg="";quiz.msgKind="";
  renderAnimCtrl();drawQuizFrame();startQuizIdleLoop();
}
function quizNextChar(){
  const i=animState.list.indexOf(animState.ch);
  if(i>=0&&i<animState.list.length-1)initAnim(animState.list[i+1],false);
}
function bindQuizCanvas(){
  const cv=document.getElementById("animCv");if(!cv)return;
  const ptOf=e=>{
    const r=cv.getBoundingClientRect();
    const p=rawP(e);
    return [Math.round((e.clientX-r.left)*10)/10,Math.round((e.clientY-r.top)*10)/10,Math.round(p*1000)/1000,tiltMagOf(e)];
  };
  cv.onpointerdown=e=>{
    if(animState.mode!=="quiz"||!quiz.geom||quiz.idx>=animState.strokes.length)return;
    if(quiz.live&&e.pointerId!==quiz.live.pid)return;
    if(e.pointerType==="pen"&&!GS.get("penSeen",false))GS.set("penSeen",true);
    const allow=e.pointerType==="pen"||e.pointerType==="mouse"||!S.penOnly||!GS.get("penSeen",false);
    if(!allow){if(e.pointerType==="touch"){quiz.msg="Dùng S Pen để tô · đang bật Chỉ nhận S Pen";quiz.msgKind="err";drawQuizFrame()}return}
    e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}
    if(quiz.timer){clearTimeout(quiz.timer);quiz.timer=0}
    quiz.hint=null;quiz.failPts=null;quiz.failUntil=0;
    const q=ptOf(e);q[2]=Math.min(q[2],(S.pFull||.38)*.45);
    const col=themeName()==="dark"?"#82B4FF":themeName()==="eink"?"#333333":"#184E9E";
    const w=Math.max(2.8,Math.min(6.5,quiz.geom.xh*(SCRIPT!=="td"?0.11:0.085)));
    quiz.live={tp:SCRIPT==="td"?"fountain":"gel",c:col,w,pr:SCRIPT==="td",ct:"med",na:38,tl:false,pf:S.pFull||.38,p:[q],pid:e.pointerId};
    drawQuizFrame();
  };
  cv.onpointermove=e=>{
    if(!quiz.live||animState.mode!=="quiz"||e.pointerId!==quiz.live.pid)return;
    e.preventDefault();
    let evs=e.getCoalescedEvents?e.getCoalescedEvents():[];if(!evs.length)evs=[e];
    for(const ev of evs){
      const raw=ptOf(ev),p=quiz.live.p[quiz.live.p.length-1];
      if(Math.hypot(raw[0]-p[0],raw[1]-p[1])<1.2)continue;
      quiz.live.p.push([raw[0],raw[1],Math.round((p[2]*.38+raw[2]*.62)*1000)/1000,raw[3]]);
    }
    drawQuizFrame();
  };
  const endQuiz=e=>{
    if(!quiz.live||animState.mode!=="quiz"||(e&&e.pointerId!==quiz.live.pid))return;
    const stObj=quiz.live;quiz.live=null;
    const g=quiz.geom,target=animState.strokes[quiz.idx];
    if(!g||!target){drawQuizFrame();return}
    const uNorm=stObj.p.map(q=>[(q[0]-g.x0)/g.xh,(g.b-q[1])/g.xh]);
    const res=evalQuizStroke(uNorm,target);
    if(res.ok){
      quiz.idx++;quiz.misses=0;quiz.failPts=null;
      const total=animState.strokes.length;
      if(quiz.idx>=total){
        quiz.doneSet.add(animState.ch);updAnimChips();
        quiz.msg=`${charLabel(animState.ch)} · Hoàn thành (${total}/${total} nét) ✓`;quiz.msgKind="ok";
        renderAnimCtrl();
      }else{
        quiz.msg=`Đúng nét ${quiz.idx} ✓ · Tiếp nét ${quiz.idx+1}/${total}`;quiz.msgKind="ok";
      }
      drawQuizFrame();startQuizIdleLoop();
    }else{
      quiz.misses++;
      const n=quiz.idx+1;
      const msgs={
        start:`Đặt viết gần chấm xanh số ${n}`,
        dir:`Nét ${n} kéo ngược chiều — xem lại hướng mũi tên`,
        short:`Nét ${n} hơi ngắn — kéo hết theo bóng chữ`,
        far:`Nét ${n} hơi lệch mẫu — bám theo bóng chữ mờ`
      };
      quiz.msg=msgs[res.why]||msgs.far;quiz.msgKind="err";
      quiz.failPts=stObj.p.slice();quiz.failUntil=performance.now()+380;
      drawQuizFrame();startQuizIdleLoop();
      if(res.why==="dir"||quiz.misses>=2){
        if(quiz.timer)clearTimeout(quiz.timer);
        quiz.timer=setTimeout(()=>{quiz.timer=0;if(animState.mode==="quiz"&&document.getElementById("card").classList.contains("open"))quizShowHint()},340);
      }
    }
  };
  cv.onpointerup=endQuiz;cv.onpointercancel=endQuiz;
}

let animGlyph={},animLayerCv=null;
function animLayer(w,h){if(!animLayerCv)animLayerCv=document.createElement("canvas");if(animLayerCv.width!==w||animLayerCv.height!==h){animLayerCv.width=w;animLayerCv.height=h}return animLayerCv}
let lastAnimT=0;
function animLoop(ts){
  if(!animState.playing||animState.mode!=="watch"||!document.getElementById("card").classList.contains("open")){animRAF=0;return}
  if(!lastAnimT)lastAnimT=ts||performance.now();
  const now=ts||performance.now(),dt=Math.min(0.05,(now-lastAnimT)/1000);lastAnimT=now;
  animState.t=(animState.t||0)+dt;
  if(animState.t>animState.dur+ANIM_HOLD)animState.t=0;
  animState.progress=animProgressAt(animState.t);
  drawAnimFrame();
  animRAF=requestAnimationFrame(animLoop);
}
function toggleAnimPlay(){
  if(!animState.ch||animState.mode!=="watch")return;
  animState.playing=!animState.playing;
  const btn=document.getElementById("animPlayBtn");
  if(btn)btn.innerHTML=animState.playing?ic("pause")+"Tạm dừng":ic("play")+"Tiếp tục";
  if(animState.playing){lastAnimT=0;animLoop()}else stopAnim();
}
function toggleAnimSpeed(){
  const p=animState.progress;animState.slow=!animState.slow;animTimeline();animState.t=animTimeOf(p);
  const btn=document.getElementById("animSpdBtn");
  if(btn)btn.textContent=animState.slow?"Tốc độ: Chậm":"Tốc độ: Vừa";
}
function toggleAnimZoom(){
  animState.big=!animState.big;
  const btn=document.getElementById("animZoomBtn");
  if(btn)btn.innerHTML=animState.big?ic("collapse")+"Thu gọn":ic("zbox")+"Phóng to";
  drawAnimFrame();
}

function openCard(focusCh,startMode){stopAnim();LEGEND=S.arrowStyle==="full"?LEGEND_FULL:LEGEND_SIMPLE;
  const l=LESSONS[cur.li],st=SOTAY[l.id]||null,items=cardItems(l);
  let animList=l.f==="AL"?[]:animableItems(items);
  const pageKey=pageItemOf(pages,cur.page);
  if(typeof focusCh!=="string"&&pageKey&&l.f!=="AL"){
    if(DUCTUS[pageKey])focusCh=pageKey;
    else{const c=[...pageKey].find(x=>animList.includes(x));if(c)focusCh=c}
  }
  if(typeof focusCh==="string"&&DUCTUS[focusCh]&&l.f!=="AL"&&!animList.includes(focusCh))animList=[focusCh,...animList.slice(0,7)];
  if(startMode==="watch"||startMode==="quiz")animState.mode=startMode;
  animState.list=animList.slice();
  let h=`<h3>${cur.li>=NREAL?l.t:"Bài "+(cur.li+1)+" · "+l.t}</h3>`;
  if(st)h+=`<div class="goal">${st[0]}</div>`;
  if(animList.length){
    h+=`<h4>Học nét chữ</h4><div class="animBox">
    <div class="animTabs">
      <button id="atWatch" class="${animState.mode==="watch"?"on":""}" onclick="setAnimMode('watch')">${ic("play")}Xem viết chậm</button>
      <button id="atQuiz" class="${animState.mode==="quiz"?"on":""}" onclick="setAnimMode('quiz')">${ic("pen")}Tự tô từng nét</button>
    </div>`;
    if(animList.length>1){
      h+=`<div class="animChips">${animList.map(ch=>`<button class="animChip" data-ch="${ch}" onclick="initAnim('${ch.replace(/'/g,"\\'")}',true)">${ch[0]==="~"?(STROKE_NAME[ch.slice(1)]||ch.slice(1)):ch}</button>`).join("")}</div>`;
    }
    h+=`<canvas id="animCv"></canvas><div id="animInfo"></div><div class="animCtrl" id="animCtrl"></div>
    <div style="display:flex;gap:8px;margin-top:10px"><button class="btn primary" style="flex:2;margin:0" onclick="leaveCard('to')"><span class="n">2</span>Tô phần này</button><button class="btn ghost" style="flex:1;margin:0" onclick="leaveCard('nho')"><span class="n">3</span>Chép</button></div></div>`;
  }
  if(items.length&&l.f!=="AL")h+=`<h4>Sơ đồ thứ tự nét</h4>${LEGEND}<canvas id="cardCv"></canvas>`;
  else if(items.length)h+=`<h4>Chữ mẫu</h4><canvas id="cardCv"></canvas><div class="prog">Phần viết nhanh dùng chữ nét đều nên không có mũi tên nhấn/thả.</div>`;
  if(st&&st[1].length)h+=`<h4>Cách viết</h4><ul>${st[1].map(t=>`<li>${t}</li>`).join("")}</ul>`;
  if(st&&st[2].length)h+=`<h4>Lỗi hay gặp</h4><ul>${st[2].map(t=>`<li>${t}</li>`).join("")}</ul>`;
  h+=`<button class="btn primary" onclick="leaveCard('to')"><span class="n">2</span>Tô</button>
  <button class="btn ghost" onclick="leaveCard('nho')"><span class="n">3</span>Chép</button>
  <button class="btn ghost" onclick="openNhapMon()">${ic("book")}Nhập môn · lý thuyết chung</button>`;
  document.getElementById("cardBox").innerHTML=h;openSheet("card");
  const cv=document.getElementById("cardCv");if(cv)drawCard(cv,items,l.f);
  if(animList.length){
    bindQuizCanvas();
    const firstCh=typeof focusCh==="string"&&DUCTUS[focusCh]?focusCh:animList[0];
    cardFrom=firstCh;
    animInitT=setTimeout(()=>{animInitT=0;if(document.getElementById("card").classList.contains("open")){initAnim(firstCh,true);
      if(firstCh!==animList[0]){const b=document.querySelector("#cardBox .animBox");b&&b.scrollIntoView({block:"nearest"})}}},60);
  }
}
function openNhapMon(){LEGEND=S.arrowStyle==="full"?LEGEND_FULL:LEGEND_SIMPLE;
  let h=`<h3>${SC.nmTitle}</h3><div class="prog">${SCRIPT==="td"?"Tóm tắt từ giáo trình viết chữ của trường Pháp xưa và các nghiên cứu hiện đại về học viết.":SCRIPT==="th"?"Theo mẫu chữ viết trong trường tiểu học (Quyết định 31/2002/QĐ-BGD&ĐT). Phần cuối dành cho ba mẹ.":"Tóm tắt nguyên tắc viết chữ in rõ ràng và các nghiên cứu hiện đại về học viết."}</div>`;
  NHAPMON.forEach((c,i)=>{h+=`<h4>${i+1}. ${c.t}</h4>`+c.p.map(p=>`<p>${p}</p>`).join("");if(c.demo)h+=LEGEND+`<canvas id="nmCv${i}"></canvas>`});
  h+=`<button class="btn primary" onclick="closeSheets()">Bắt đầu tập viết</button>`;
  document.getElementById("genBox").innerHTML=h;openSheet("gen");
  NHAPMON.forEach((c,i)=>{if(c.demo)drawCard(document.getElementById("nmCv"+i),SCRIPT==="qs"?["~o","a","g"]:c.demo)});
}

