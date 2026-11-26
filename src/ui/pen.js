/* ================== BÚT S PEN PRO, BỘ NHỚ BÚT YÊU THÍCH, TẨY & KIỂM TRA S PEN ================== */
function updatePenBadge(){
  const info=PEN_MAP[S.penType]||PEN_TYPES[0];
  const icEl=document.getElementById("penIco"),dot=document.getElementById("penDot"),lbl=document.getElementById("penLbl");
  if(icEl)icEl.innerHTML=ic(info.ic);
  if(dot)dot.style.background=inkColor(S.color);
  if(lbl)lbl.textContent=info.name;
  renderFavDock();
}
function renderFavDock(){
  const dock=document.getElementById("favDock");if(!dock)return;
  dock.classList.toggle("on",!!S.favBar);
  if(!S.favBar)return;
  dock.innerHTML=S.favs.map((f,idx)=>{
    const p=PEN_MAP[f.penType]||PEN_TYPES[0];
    const on=tool==="pen"&&S.activeFav===idx;
    return `<button class="fdot ${on?"on":""}" onclick="useFav(${idx})" aria-label="Viết yêu thích ${f.name}">${ic(p.ic)}<em style="background:${inkColor(f.color)}"></em></button>`;
  }).join("");
}
function useFav(idx,keepOpen){
  const f=S.favs[idx];if(!f)return;
  S.penType=f.penType;S.color=f.color;S.width=f.width;S.contrast=f.contrast||"med";
  S.pressure=!!f.pressure;S.nibAngle=f.nibAngle||38;S.activeFav=idx;S.targetFav=idx;
  saveS();setTool("pen");updatePenBadge();
  const p=PEN_MAP[S.penType]||PEN_TYPES[0];
  if(keepOpen)penTap(true);
  else toast(`${f.name} · cỡ ${S.width}`);
}
function cycleFavPen(){
  const base=(typeof S.activeFav==="number"&&S.activeFav>=0)?S.activeFav:(S.targetFav||0);
  useFav((base+1)%S.favs.length,false);
}
function saveToFav(idx){
  const p=PEN_MAP[S.penType]||PEN_TYPES[0];
  S.favs[idx]={name:p.name,penType:S.penType,color:S.color,width:S.width,contrast:S.contrast,pressure:S.pressure,nibAngle:S.nibAngle};
  S.activeFav=idx;S.targetFav=idx;saveS();updatePenBadge();penTap(true);
  toast(`Đã lưu vào ô viết yêu thích số ${idx+1}`);
}
function selectPenType(tp){
  const info=PEN_MAP[tp];if(!info)return;
  S.penType=tp;S.pressure=info.pr;S.width=info.defW;S.activeFav=-1;
  if(tp==="marker"&&(S.color==="k"||S.color==="nb"||S.color==="br"))S.color="y";
  else if(tp!=="marker"&&S.color==="y")S.color=SCRIPT==="td"?"nb":"k";
  saveS();updatePenBadge();penTap(true);
}
function setPen(k,v,reopen=true){
  S[k]=v;if(k!=="favBar"&&k!=="sideBtn"&&k!=="tiltOn"&&k!=="stab")S.activeFav=-1;
  saveS();updatePenBadge();
  if(k==="favBar"&&layout)show();
  if(reopen)penTap(true);
}
function setPenWidth(val){
  S.width=Math.round(Math.min(16,Math.max(0.6,val))*10)/10;S.activeFav=-1;saveS();
  const inp=document.getElementById("wRange"),wv=document.getElementById("wv");
  if(inp)inp.value=S.width;if(wv)wv.textContent=S.width;
  document.querySelectorAll(".wpill").forEach(b=>b.classList.toggle("on",Math.abs(+b.dataset.w-S.width)<0.05));
  demo();
}
function stepWidth(d){setPenWidth(S.width+d)}
function setSens(v){if(v!=="tu"){S.sens=v;S.pFull=SENS[v]||.38}saveS();penTap(true)}
function nibPreset(){S.penType="fountain";S.pressure=true;S.contrast="nib";S.width=2.6;S.activeFav=-1;saveS();updatePenBadge();penTap(true);toast("Đã chọn ngòi lá tre (thanh đậm rõ nhất)")}

function penTap(forceOpen=false){
  if(tool!=="pen"&&!forceOpen){setTool("pen");return}
  clearArm=false;
  const info=PEN_MAP[S.penType]||PEN_TYPES[0];
  const isCustomCol=S.color&&S.color[0]==="#";
  const showPressure=S.penType==="fountain"||S.penType==="gel"||S.penType==="callig";
  const showContrast=S.penType==="fountain"&&S.pressure;
  const showAngle=S.penType==="callig";
  const showTilt=S.penType==="pencil"||S.penType==="brush"||S.penType==="callig";
  const showSens=(S.pressure&&S.penType!=="marker")||S.penType==="pencil"||S.penType==="brush";

  document.getElementById("penBox").innerHTML=`<h3>${ic(info.ic)} ${info.name}</h3>
  <div class="ph" style="margin-top:4px">Viết yêu thích · chạm để đổi</div>
  <div class="favRow">${S.favs.map((f,idx)=>{
    const fp=PEN_MAP[f.penType]||PEN_TYPES[0];
    return `<button class="fslot ${S.activeFav===idx?"on":""}" onclick="useFav(${idx},true)"><span>${ic(fp.ic)} ${f.name}</span><span style="font-size:11.5px;color:var(--muted)">cỡ ${f.width}</span><span class="fbar" style="background:${inkColor(f.color)}"></span></button>`;
  }).join("")}</div>
  <div class="saveFavBar">
    <span>Lưu viết đang chỉnh vào ô:</span>
    ${[0,1,2,3].map(i=>`<button class="${(S.targetFav||0)===i?"on":""}" onclick="saveToFav(${i})">${i+1}</button>`).join("")}
    ${SCRIPT==="td"?`<button style="margin-left:auto" onclick="nibPreset()">${ic("fountain")} Ngòi lá tre</button>`:""}
  </div>

  <div class="ph">1. Loại viết và ngòi</div>
  <div class="penGrid">${PEN_TYPES.map(p=>`<button class="pcard ${S.penType===p.id?"on":""}" onclick="selectPenType('${p.id}')"><span class="pic">${ic(p.ic)}</span><span class="pnm">${p.name}</span><span class="psb">${p.sub}</span></button>`).join("")}</div>

  <div class="ph">2. Màu mực (12 màu + tự chọn)</div>
  <div class="swGrid">${INK_META.map(([c,nm])=>`<span class="sw ${S.color===c?"on":""}" title="${nm}" style="background:${T.ink[c]}" onclick="setPen('color','${c}')"></span>`).join("")}</div>
  <div class="row" style="padding:8px 0"><span>Chọn màu khác</span><label class="swPick" style="${isCustomCol?`background:${S.color};border-style:solid`:""}" title="Chọn màu bất kỳ"><span style="font-size:16px;display:flex">${isCustomCol?ic("check"):ic("plus")}</span><input type="color" value="${isCustomCol?S.color:inkColor(S.color)}" onchange="setPen('color',this.value)"></label></div>

  <div class="ph">3. Cỡ nét (${S.width})</div>
  <div class="wPills">${WIDTH_PRESETS.map(w=>`<button class="wpill ${Math.abs(S.width-w)<0.05?"on":""}" data-w="${w}" onclick="setPenWidth(${w})"><span style="height:${Math.max(2,Math.min(11,w*1.15))}px"></span>${w}</button>`).join("")}</div>
  <div class="row"><span>Chỉnh chi tiết cỡ nét</span><div class="stepper"><button onclick="stepWidth(-0.2)">−</button><input id="wRange" type="range" min="0.6" max="16" step="0.2" value="${S.width}" oninput="setPenWidth(+this.value)"><button onclick="stepWidth(0.2)">+</button><b id="wv">${S.width}</b></div></div>

  <div class="ph">4. Cảm biến và tính năng S Pen</div>
  ${showPressure?`<div class="row"><span>Lực nhấn 4096 mức</span><div class="seg"><button class="${S.pressure?"on":""}" onclick="setPen('pressure',true)">Thanh đậm</button><button class="${!S.pressure?"on":""}" onclick="setPen('pressure',false)">Nét đều</button></div></div>`:""}
  ${showSens?`<div class="row"><span>Độ nhạy lực nhấn</span><div class="seg">${[["nhe","Nhẹ tay"],["vua","Vừa"],["manh","Mạnh tay"]].concat(S.sens==="tu"?[["tu","Theo tay tôi"]]:[]).map(([v,t])=>`<button class="${(S.sens||"vua")===v?"on":""}" onclick="setSens('${v}')">${t}</button>`).join("")}</div></div>
  <button class="btn ghost" onclick="openPenTest(true)">Đo lực tay của tôi</button>`:""}
  ${showContrast?`<div class="row"><span>Độ chênh thanh – đậm</span><div class="seg">${[["soft","Nhẹ"],["med","Vừa"],["strong","Mạnh"],["nib","Lá tre"]].map(([v,t])=>`<button class="${S.contrast===v?"on":""}" onclick="setPen('contrast','${v}')">${t}</button>`).join("")}</div></div>`:""}
  ${showAngle?`<div class="row"><span>Góc vát ngòi thư pháp</span><div class="seg">${[30,38,45,-38].map(a=>`<button class="${(S.nibAngle||38)===a?"on":""}" onclick="setPen('nibAngle',${a})">${a}°</button>`).join("")}</div></div>`:""}
  ${showTilt?`<div class="row"><span>Cảm biến nghiêng viết</span><div class="seg"><button class="${S.tiltOn?"on":""}" onclick="setPen('tiltOn',true)">Bật</button><button class="${!S.tiltOn?"on":""}" onclick="setPen('tiltOn',false)">Tắt</button></div></div>`:""}
  <div class="row"><span>Làm mịn nét (chống run tay)</span><div class="seg">${[[0,"Tắt"],[0.32,"Vừa"],[0.58,"Mạnh"]].map(([v,t])=>`<button class="${Math.abs((S.stab||0)-v)<0.05?"on":""}" onclick="setPen('stab',${v})">${t}</button>`).join("")}</div></div>
  <div class="row"><span>Nút trên thân S Pen</span><div class="seg">${[["eraser","Gôm"],["undo","Hoàn tác"],["fav","Đổi viết"]].map(([v,t])=>`<button class="${(S.sideBtn||"eraser")===v?"on":""}" onclick="setPen('sideBtn','${v}')">${t}</button>`).join("")}</div></div>
  <div class="row"><span>Thanh viết yêu thích trên trang</span><div class="seg"><button class="${S.favBar?"on":""}" onclick="setPen('favBar',true)">Hiện</button><button class="${!S.favBar?"on":""}" onclick="setPen('favBar',false)">Ẩn</button></div></div>

  <div class="prog" style="margin-top:10px">Viết thử bằng S Pen (thử nhấn nhẹ/mạnh hoặc nghiêng viết):</div>
  <canvas id="demo"></canvas>
  <button class="btn ghost" onclick="demoS=[];demo()">Xóa ô viết thử</button>
  <button class="btn danger" onclick="confirmClearBtn(this)">Xóa toàn bộ nét trên trang này</button>
  <button class="btn primary" onclick="closeSheets()">Xong</button>`;
  openSheet("pen",forceOpen);demoInit();
}
function stepEraser(d){S.eraserR=Math.min(36,Math.max(8,Math.round((S.eraserR||16)+d)));saveS();const inp=document.getElementById("eRange"),ev=document.getElementById("ev");if(inp)inp.value=S.eraserR;if(ev)ev.textContent=S.eraserR+"px"}
function setEraserMode(m){S.eraseMode=m;saveS();eraserTap(true)}
function eraserTap(forceOpen=false){
  if(tool!=="eraser"&&!forceOpen){setTool("eraser");return}
  clearArm=false;
  document.getElementById("eraserBox").innerHTML=`<h3>Gôm và xóa trang</h3>
  <div class="row"><span>Kiểu xóa</span><div class="seg"><button class="${S.eraseMode==="part"?"on":""}" onclick="setEraserMode('part')">Xóa từng đoạn</button><button class="${S.eraseMode==="stroke"?"on":""}" onclick="setEraserMode('stroke')">Xóa cả nét</button></div></div>
  <div class="prog" style="margin-top:6px"><b>Xóa từng đoạn</b> chỉ xóa đúng chỗ chạm gôm, không làm mất nguyên từ viết liền.</div>
  <div class="row"><span>Cỡ đầu gôm</span><div class="stepper"><button onclick="stepEraser(-4)">−</button><input id="eRange" type="range" min="8" max="36" step="2" value="${S.eraserR||16}" oninput="S.eraserR=+this.value;saveS();document.getElementById('ev').textContent=this.value+'px'"><button onclick="stepEraser(4)">+</button><b id="ev">${S.eraserR||16}px</b></div></div>
  <button class="btn danger" onclick="confirmClearBtn(this)">Xóa toàn bộ nét trên trang này</button>
  <button class="btn primary" onclick="closeSheets()">Xong</button>`;
  openSheet("eraserSheet",forceOpen);
}
let demoS=[];
function demoInit(){const c=document.getElementById("demo");if(!c)return;const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,3);
  c.width=r.width*d;c.height=r.height*d;let s=null;
  const pt=ev=>{const br=c.getBoundingClientRect();return [ev.clientX-br.left,ev.clientY-br.top,rawP(ev),tiltMagOf(ev)]};
  c.onpointerdown=e=>{if(s&&e.pointerId!==s.pid)return;e.preventDefault();try{c.setPointerCapture(e.pointerId)}catch(_){}
    const q=pt(e);q[2]=Math.min(q[2],(S.pFull||.38)*.45);
    s={tp:S.penType,c:S.color,w:S.width,pr:S.pressure,ct:S.contrast,na:S.nibAngle,tl:S.tiltOn,pf:S.pFull||.38,p:[q],pid:e.pointerId};
    demoS.push(s);demo()};
  c.onpointermove=e=>{if(!s||e.pointerId!==s.pid)return;
    let evs=e.getCoalescedEvents?e.getCoalescedEvents():[];if(!evs.length)evs=[e];
    const stb=S.stab||0;
    for(const ev of evs){const raw=pt(ev),p=s.p[s.p.length-1];
      const nx=stb>0?(p[0]*stb+raw[0]*(1-stb)):raw[0],ny=stb>0?(p[1]*stb+raw[1]*(1-stb)):raw[1];
      s.p.push([nx,ny,p[2]*.38+raw[2]*.62,(p[3]||0)*.65+raw[3]*.35])}
    demo()};
  c.onpointerup=c.onpointercancel=e=>{if(s&&e&&e.pointerId!==s.pid)return;s=null;if(demoS.length>14)demoS.shift()};
  demo()}
function demo(){const c=document.getElementById("demo");if(!c)return;const x=c.getContext("2d"),d=c.width/c.clientWidth;
  x.setTransform(1,0,0,1,0,0);x.fillStyle=T.paper;x.fillRect(0,0,c.width,c.height);x.setTransform(d,0,0,d,0,0);
  for(const s of demoS){s.tp=S.penType;s.w=S.width;s.pr=S.pressure;s.ct=S.contrast;s.c=S.color;s.na=S.nibAngle;s.tl=S.tiltOn;s.pf=S.pFull||.38;drawStroke(x,s)}}
function openPenTest(calib){
  const R={type:"—",pNow:0,pmin:1,pmax:0,ps:[],tilt:false,tx:0,ty:0,tm:0,hover:false,btn:false,hz:0,
    pred:typeof PointerEvent!=="undefined"&&"getPredictedEvents" in PointerEvent.prototype,
    coal:typeof PointerEvent!=="undefined"&&"getCoalescedEvents" in PointerEvent.prototype};
  const box=document.getElementById("genBox");
  box.innerHTML=calib?`<h3>Đo lực tay của tôi</h3><div class="prog">Viết vài chữ thanh đậm bằng lực tay <b>bình thường, thoải mái</b> như khi viết trên giấy. Đừng cố nhấn mạnh. Viết xong bấm <b>Dùng lực tay này</b>.</div>`:`<h3>Kiểm tra cảm biến S Pen</h3><div class="prog">Rê viết gần mặt kính, viết nhấn mạnh/nhẹ, nghiêng thân viết và thử bấm nút trên thân S Pen.</div>`;
  box.innerHTML+=`
  <canvas id="ptest"></canvas>
  <div style="font-size:13.5px;color:var(--muted)">Lực nhấn hiện tại: <b id="pLbl">0%</b></div><div class="meter"><div id="pBar" style="width:0%"></div></div>
  <div style="font-size:13.5px;color:var(--muted)">Độ nghiêng viết: <b id="tLbl">0°</b></div><div class="meter"><div id="tBar" style="width:0%"></div></div>
  <div class="kv" id="pres"></div>${calib?`<button class="btn primary" id="calOk" onclick="applyCalib()">Dùng lực tay này</button><button class="btn ghost" onclick="closeSheets()">Hủy</button>`:`<button class="btn primary" onclick="closeSheets()">Đóng</button>`}`;
  openSheet("gen");calR=R;
  const c=document.getElementById("ptest"),d=Math.min(devicePixelRatio||1,3),r=c.getBoundingClientRect();c.width=r.width*d;c.height=r.height*d;
  const x=c.getContext("2d");x.setTransform(d,0,0,d,0,0);let last=null,evTimes=[];
  const out=()=>{const yes=v=>v?"<span style='color:var(--ok);font-weight:700'>Có</span>":"Chưa thấy";
    const pb=document.getElementById("pBar"),pl=document.getElementById("pLbl"),tb=document.getElementById("tBar"),tl=document.getElementById("tLbl");
    if(pb)pb.style.width=Math.round(R.pNow*100)+"%";if(pl)pl.textContent=Math.round(R.pNow*100)+"%";
    if(tb)tb.style.width=Math.round(R.tm*100)+"%";if(tl)tl.textContent=`${Math.round(Math.hypot(R.tx,R.ty))}° (X:${R.tx}°, Y:${R.ty}°)`;
    document.getElementById("pres").innerHTML=`<b>Thiết bị chạm</b>${({pen:"S Pen",touch:"Ngón tay",mouse:"Chuột"})[R.type]||R.type||"—"}<br><b>Lực nhấn</b>${R.pmax>0?`Có (${R.pmin.toFixed(2)} – ${R.pmax.toFixed(2)})`:"Chưa thấy"}<br><b>Lực viết thường</b>${R.ps.length>40?Math.round(pctl(R.ps,.9)*100)+"%":"—"} <span style="color:var(--muted)">(mức đang dùng ${Math.round((S.pFull||.38)*100)}%)</span><br><b>Cảm biến nghiêng</b>${yes(R.tilt)}<br><b>Rê viết không chạm</b>${yes(R.hover)}<br><b>Nút trên thân viết</b>${yes(R.btn)}<br><b>Tần số lấy mẫu</b>${R.hz?R.hz+" Hz":"—"}<br><b>Dự đoán nét</b>${yes(R.pred&&R.coal)}`};
  const h=e=>{
    R.type=e.pointerType;R.tx=Math.round(e.tiltX||0);R.ty=Math.round(e.tiltY||0);R.tm=tiltMagOf(e);
    if(R.tx||R.ty||(e.altitudeAngle&&e.altitudeAngle<1.5))R.tilt=true;
    if(e.buttons){
      const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];
      const now=performance.now();for(let k=0;k<evs.length;k++)evTimes.push(now);
      evTimes=evTimes.filter(t=>now-t<500);if(evTimes.length>4)R.hz=Math.round(evTimes.length*2);
      R.pNow=e.pressure||0;
      for(const ev of evs){if(ev.pressure>0){R.pmin=Math.min(R.pmin,ev.pressure);R.pmax=Math.max(R.pmax,ev.pressure);if(ev.pressure>=.06&&R.ps.length<20000)R.ps.push(ev.pressure)}}
      if(e.buttons&2||e.buttons&32)R.btn=true;
      const p=[e.offsetX,e.offsetY];
      if(last){x.strokeStyle=inkColor(S.color);x.lineCap="round";x.lineWidth=1+R.pNow*6*(1+R.tm);x.beginPath();x.moveTo(last[0],last[1]);x.lineTo(p[0],p[1]);x.stroke()}
      last=p;
    }else{last=null;R.pNow=0;if(e.pointerType==="pen"&&e.type==="pointermove")R.hover=true}
    out()};
  const up=()=>{last=null;R.pNow=0;out()};
  c.onpointerdown=e=>{e.preventDefault();try{c.setPointerCapture(e.pointerId)}catch(_){}h(e)};c.onpointermove=h;c.onpointerup=c.onpointercancel=up;out()}
let calR=null;
function pctl(a,q){const b=a.slice().sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.floor(q*b.length))]}
function applyCalib(){
  if(!calR||calR.ps.length<40){toast("Viết thêm vài chữ nữa để đo cho chính xác");return}
  S.pFull=Math.round(Math.min(.85,Math.max(.2,pctl(calR.ps,.9)*.95))*100)/100;S.sens="tu";saveS();closeSheets();
  toast(`Đã canh lực theo tay bạn: nhấn ${Math.round(S.pFull*100)}% là ra nét đậm đủ`);
}
function setTool(t){
  tool=t;
  document.getElementById("bPen").classList.toggle("on",t==="pen");
  document.getElementById("bEraser").classList.toggle("on",t==="eraser");
  renderFavDock();
  if(t==="eraser")toast("Đã chọn Gôm · chạm Gôm lần nữa để chỉnh cỡ hoặc xóa trang");
}

