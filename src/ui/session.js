/* ================== BUỔI TẬP 15 PHÚT ================== */
let sess=store.get("session",null);
/* Bảo mật: buổi tập lưu trong máy có thể bị sửa; sai cấu trúc thì bỏ */
if(sess&&(typeof sess!=="object"||!Number.isInteger(sess.i)||sess.i<0||sess.i>9||!Array.isArray(sess.steps)||!Number.isFinite(sess.start)))sess=null;
function sessStart(){
  const real=LESSONS.slice(0,NREAL).filter(l=>l.id!=="free"&&l.rows&&l.rows.some(r=>r[0]!=="blank"));
  const rnd=seeded(today()+"s"),warm=real.filter(l=>l.part.startsWith("Phần 1 "));
  const next=real.find(l=>!done.has(l.id))||real[0];
  const doneL=real.filter(l=>done.has(l.id)&&l!==next&&!l.cornell);
  const steps=[{li:LESSONS.indexOf(warm[Math.floor(rnd()*warm.length)]),mode:"to",label:"Khởi động 2 phút"},
    {li:LESSONS.indexOf(next),mode:"to",label:"Bài mới"},
    {li:REVIEW_I,mode:"nho",label:"Bài ôn"}];
  sess={steps,i:0,start:Date.now()};store.set("session",sess);closeSheets();
  openLesson(steps[0].li,steps[0].mode);
}
function sessNext(){if(!sess)return;sess.i++;
  if(sess.i>=sess.steps.length){const mins=Math.round((Date.now()-sess.start)/60000);sessEnd();toast(`Xong buổi tập rồi · ${mins} phút. Mai tập tiếp nha!`);
    const lg=store.get("sessions",[]);lg.push({d:today(),m:mins});store.set("sessions",lg.slice(-200));return}
  store.set("session",sess);const s=sess.steps[sess.i];openLesson(s.li,s.mode)}
function sessEnd(){sess=null;store.set("session",null);sessUpdate()}
function sessUpdate(){const el=document.getElementById("session");
  if(sess&&(!sess.steps||!sess.steps[sess.i]||Date.now()-sess.start>6*3600e3)){sessEnd();return}
  if(!sess){el.classList.remove("on");return}
  const s=sess.steps[sess.i],mins=Math.floor((Date.now()-sess.start)/60000);
  document.getElementById("sessTxt").innerHTML=`<b>Buổi tập ${sess.i+1}/3</b> · ${escHtml(s&&s.label||"")} · ${mins}/15 phút`;el.classList.add("on")}
setInterval(sessUpdate,30000);

/* ================== VỞ KHÔNG XÉ (nhật ký) ================== */
let idb=null;
function openIDB(){return new Promise(res=>{try{const r=indexedDB.open("tapviet-td",2);
  r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains("j"))db.createObjectStore("j");if(!db.objectStoreNames.contains("ink"))db.createObjectStore("ink")};
  r.onsuccess=()=>{idb=r.result;res(idb)};r.onerror=()=>res(null)}catch(e){res(null)}})}
function renderFullExport(){
  const c=document.createElement("canvas");c.width=W*DPR;c.height=H*DPR;
  const x=c.getContext("2d");x.drawImage(bg,0,0);x.setTransform(DPR,0,0,DPR,0,0);
  for(const s of strokes)drawStroke(x,s);
  if(comparing)drawCompare(x);
  return c;
}
async function journalSnap(snap){
  if(!strokes.length)return;if(!idb)await openIDB();if(!idb)return;
  const li=snap?snap.li:cur.li,pg=snap?snap.page:cur.page,md=snap?snap.mode:cur.mode,k=snap?snap.k:key();
  if(li!==cur.li||pg!==cur.page||md!==cur.mode)return;
  const l=LESSONS[li],w=360,h=Math.max(120,Math.round(H/Math.max(1,W)*w)),c=document.createElement("canvas");c.width=w;c.height=h;
  const full=renderFullExport();
  c.getContext("2d").drawImage(full,0,0,w,h);
  const rec={d:today(),t:(SCRIPT==="td"?"":SC.name+" · ")+(li>=NREAL?l.t:`Bài ${li+1} · ${l.t}`),p:pg+1,m:md,img:c.toDataURL("image/jpeg",.62)};
  try{idb.transaction("j","readwrite").objectStore("j").put(rec,`${rec.d}|${SCRIPT}|${k}`)}catch(e){}
}
async function openJournal(){
  if(!idb)await openIDB();const box=document.getElementById("genBox");
  if(!idb){box.innerHTML=`<h3>Nhật ký luyện chữ</h3><p>Trình duyệt này không cho lưu nhật ký.</p><button class="btn" data-action="dongBang">Đóng</button>`;openSheet("gen");return}
  const all=[];await new Promise(res=>{const r=idb.transaction("j").objectStore("j").openCursor();
    r.onsuccess=()=>{const c=r.result;if(c){all.push(c.value);c.continue()}else res()};r.onerror=res});
  const days=[...new Set(all.filter(laBanGhiNhatKy).map(r=>r.d))].sort().reverse();
  let h=`<h3>Nhật ký luyện chữ</h3><div class="prog">Mỗi ngày tập tự lưu thành một trang. Trang cũ không bị ghi đè — xem lại để thấy mình tiến bộ.</div>`;
  if(!days.length)h+=`<p>Chưa có trang nào. Cứ viết vài nét là nhật ký tự lưu.</p>`;
  for(const d of days){const [y,mo,da]=d.split("-");h+=`<div class="ph">${da}/${mo}/${y}</div><div class="jl">`;
    for(const r of all.filter(r=>r.d===d&&laBanGhiNhatKy(r)))h+=`<figure><img src="${r.img}" alt="" loading="lazy" decoding="async"><figcaption>${escHtml(r.t)}${r.p?" · trang "+(r.p|0):""}${r.m==="nho"?" · Chép":""}</figcaption></figure>`;h+=`</div>`}
  h+=`<button class="btn" data-action="dongBang">Đóng</button>`;box.innerHTML=h;openSheet("gen")}

/* Bảo mật: bản ghi nhật ký có thể đến từ file sao lưu; chỉ nhận ngày đúng dạng và hình nhúng (data:image) */
const laNgay=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d);
const laHinhNhung=s=>typeof s==="string"&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s);
function laBanGhiNhatKy(r){return r&&typeof r==="object"&&laNgay(r.d)&&laHinhNhung(r.img)&&typeof r.t==="string"}

/* ================== KIỂM TRA TRÊN GIẤY (mỗi 2 tuần) ================== */
const PAPER_TXT="Trăm năm trong cõi người ta, chữ tài chữ mệnh khéo là ghét nhau.";
function paperDue(){const l0=store.get("paperLast",null),last=laNgay(l0)?l0:null;if(!last)return done.size>=2;return(new Date(today())-new Date(last))/864e5>=14}
async function papers(){if(!idb)await openIDB();if(!idb)return[];const all=[];
  await new Promise(res=>{const r=idb.transaction("j").objectStore("j").openCursor();r.onsuccess=()=>{const c=r.result;if(c){if(c.value&&c.value.m==="paper"&&c.value.s===SCRIPT&&laBanGhiNhatKy(c.value))all.push(c.value);c.continue()}else res()};r.onerror=res});
  return all.sort((a,b)=>a.d<b.d?1:-1)}
async function openPaper(){const box=document.getElementById("genBox"),list=await papers(),l0=store.get("paperLast",null),last=laNgay(l0)?l0:null;
  let h=`<h3>Kiểm tra trên giấy</h3><div class="prog">Cứ 2 tuần một lần, bạn viết câu dưới đây <b>bằng viết thật lên giấy</b> theo kiểu chữ ${SC.name.toLowerCase()}, rồi chụp hình lưu lại.</div>
  <div class="goal">${PAPER_TXT}</div>
  <div class="prog">${last?`Lần gần nhất: ${last.split("-").reverse().join("/")}`:"Chưa có lần kiểm tra nào."}${paperDue()?` · <span class="due">đã tới hạn</span>`:""}</div>
  <button class="btn primary" data-action="chupHinhGiay">Chụp hình trang giấy</button><div class="papers" style="margin-top:14px">`;
  for(const r of list)h+=`<figure><img src="${r.img}" alt="" loading="lazy" decoding="async"><figcaption>${r.d.split("-").reverse().join("/")}</figcaption></figure>`;
  h+=`</div><button class="btn ghost" data-action="dongBang">Đóng</button>`;box.innerHTML=h;openSheet("gen")}
/* Hành động chụp hình trang giấy kiểm tra */
HANH_DONG.chupHinhGiay=()=>document.getElementById("paperFile").click();
function savePaper(inp){const f=inp.files[0];inp.value="";if(!f)return;const img=new Image(),u=URL.createObjectURL(f);
  img.onload=async()=>{const w=Math.min(1100,img.width),h=Math.round(img.height*w/img.width),c=document.createElement("canvas");c.width=w;c.height=h;
    c.getContext("2d").drawImage(img,0,0,w,h);URL.revokeObjectURL(u);if(!idb)await openIDB();
    if(!idb){toast("Trình duyệt này không cho lưu hình");return}
    const rec={d:today(),t:`Kiểm tra trên giấy · ${SC.name}`,p:0,m:"paper",s:SCRIPT,img:c.toDataURL("image/jpeg",.72)};
    try{const tx=idb.transaction("j","readwrite");tx.objectStore("j").put(rec,`${rec.d}|paper|${SCRIPT}`);
      await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=tx.onabort=()=>rej(tx.error)});
      store.set("paperLast",today());toast("Đã lưu hình kiểm tra");openPaper()}
    catch(e){toast("Không lưu được hình — bộ nhớ trình duyệt có thể đã đầy")}};
  img.onerror=()=>{URL.revokeObjectURL(u);toast("Không đọc được hình")};img.src=u}

/* ================== SAO LƯU ================== */
async function idbDumpStore(name){
  if(!idb)await openIDB();if(!idb||!idb.objectStoreNames.contains(name))return {};
  const out={};
  await new Promise(res=>{try{const r=idb.transaction(name).objectStore(name).openCursor();
    r.onsuccess=()=>{const c=r.result;if(c){out[c.key]=c.value;c.continue()}else res()};r.onerror=res}catch(_){res()}});
  return out;
}
async function backup(){
  flushSave();toast("Đang gom dữ liệu sao lưu đầy đủ…");
  const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(KIEU_CHU.some(s=>k.startsWith(s+"1:")))o[k]=localStorage.getItem(k)}
  const jData=await idbDumpStore("j"),inkData=await idbDumpStore("ink");
  const blob=new Blob([JSON.stringify({app:"tap-viet",v:4,date:today(),data:o,idb:{j:jData,ink:inkData}})],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`tap-viet-saoluu-${today()}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast("Đã sao lưu trọn bộ (bài viết, nhật ký và hình chụp giấy)")}
/* Bảo mật: file sao lưu có thể bị sửa hoặc là file giả. Chỉ nhận khóa của app (td1:, qs1:, th1:), giá trị là chuỗi,
   bản ghi nhật ký đúng dạng; kiểm hết rồi mới ghi; giới hạn dung lượng để không treo máy. */
const SAO_LUU_TOI_DA=80*1024*1024;
const laKhoaApp=k=>typeof k==="string"&&k.length<=160&&/^(td|qs|th)1:[A-Za-z0-9_:.|-]+$/.test(k);
const laKhoaIdb=k=>typeof k==="string"&&k.length<=200&&!/^(__proto__|constructor|prototype)$/.test(k);
function kiemSaoLuu(j){
  if(!j||typeof j!=="object"||Array.isArray(j)||(j.app!=="tap-viet"&&j.app!=="tap-viet-thanh-dam"))throw 0;
  const data={},idbOk={j:{},ink:{}};
  if(j.data&&typeof j.data==="object"&&!Array.isArray(j.data))
    for(const[k,v]of Object.entries(j.data)){if(laKhoaApp(k)&&typeof v==="string"&&v.length<=20e6)data[k]=v}
  if(j.idb&&typeof j.idb==="object"){
    if(j.idb.j&&typeof j.idb.j==="object")for(const[k,v]of Object.entries(j.idb.j).slice(0,5000)){if(laKhoaIdb(k)&&laBanGhiNhatKy(v))idbOk.j[k]=v}
    if(j.idb.ink&&typeof j.idb.ink==="object")for(const[k,v]of Object.entries(j.idb.ink).slice(0,5000)){if(laKhoaIdb(k)&&v&&typeof v==="object")idbOk.ink[k]=v}
  }
  return {data,idb:idbOk};
}
function restoreBackup(inp){const f=inp.files[0];if(!f)return;
  if(f.size>SAO_LUU_TOI_DA){inp.value="";toast("File sao lưu lớn quá (trên 80 MB), không nạp");return}
  const r=new FileReader();
  r.onload=async()=>{try{const j=kiemSaoLuu(JSON.parse(r.result,(k,v)=>k==="__proto__"||k==="constructor"||k==="prototype"?undefined:v));
    restoring=true;clearTimeout(saveT);clearTimeout(jT);inkDirty=false;journalDirty=false;
    for(const[k,v]of Object.entries(j.data))localStorage.setItem(k,v);
    if(j.idb){
      if(!idb)await openIDB();
      if(idb){
        for(const sn of ["j","ink"]){
          if(j.idb[sn]&&idb.objectStoreNames.contains(sn)){
            const tx=idb.transaction(sn,"readwrite"),st=tx.objectStore(sn);
            for(const[k,v]of Object.entries(j.idb[sn]))st.put(v,k);
            await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=tx.onabort=()=>rej(tx.error||new Error("IDB"))});
          }
        }
      }
    }
    toast("Đã khôi phục đầy đủ — đang tải lại");setTimeout(()=>location.reload(),700)}
    catch(e){restoring=false;toast(e===0?"File này không phải file sao lưu hợp lệ":"Không khôi phục được — bộ nhớ trình duyệt có thể đã đầy")}};r.readAsText(f);inp.value=""}

