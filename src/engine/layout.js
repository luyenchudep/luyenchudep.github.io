/* ================== HÌNH HỌC CHỮ ================== */
const XH=SC.XH;
const bg=document.getElementById("bg"),ink=document.getElementById("ink"),fx=document.getElementById("fx");
let bctx=bg.getContext("2d"),fctx=fx.getContext("2d");
let ictx;try{ictx=ink.getContext("2d",S.lowLat?{alpha:false,desynchronized:true}:{alpha:false})}catch(e){ictx=null}
if(!ictx)ictx=ink.getContext("2d");
let W=0,H=0,DPR=1,pages=[],layout=null;
function fontOf(l){return FONTS[l.f||SC.font]}
function sizeFor(l){const F=fontOf(l),xh=(XH[l.z]||XH[Z_MAC_DINH]||Object.values(XH)[0])*S.scale,fs=xh/F.x;
  return {xh,fs,asc:fs*F.asc,desc:fs*F.desc,tan:Math.tan(F.slant*Math.PI/180),fam:F.fam,F,co:SCRIPT==="th"?thCo(l.z):undefined,hoa:SCRIPT==="th"?thCoHoa(l):undefined}}
function traceColor(){return T.trace[S.trace]||T.trace.dark}
function fnt(fs,fam){const F=FONTS[fam||SC.font];return `${F.wt} ${fs}px '${F.fam}'`}
function mw(t,fs,fam){if(laPhongTH(fam))return doRongTH(t)*fs;bctx.font=fnt(fs,fam);return bctx.measureText(t).width}

function wrap(text,maxW,fs,fam){
  if(mw(text,fs,fam)<=maxW)return [text];
  const words=text.split(" ");let best=null;
  for(let k=1;k<words.length;k++){const a=words.slice(0,k).join(" "),b=words.slice(k).join(" ");
    const m=Math.max(mw(a,fs,fam),mw(b,fs,fam));if(m<=maxW&&(!best||m<best.m))best={m,l:[a,b]}}
  if(best)return best.l;
  let lines=[],line="";
  for(const w of words){const t=line?line+" "+w:w;if(mw(t,fs,fam)<=maxW||!line)line=t;else{lines.push(line);line=w}}
  if(line)lines.push(line);return lines;
}
/* bài ôn: chữ lấy ngẫu nhiên (cố định trong ngày) từ các bài đã tập */
function today(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function seeded(seed){let s=0;for(const c of seed)s=(s*31+c.charCodeAt(0))>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
/* lịch ôn cách quãng: mỗi chữ có bậc 0..4 → ôn lại sau 1, 3, 7, 14, 30 ngày */
const GAP=[1,3,7,14,30];
let SR=store.get("sr",{}),WEAK=store.get("weak",[]);   /* Bảo mật: dữ liệu lưu có thể bị sửa; ép đúng kiểu */
if(!SR||typeof SR!=="object"||Array.isArray(SR))SR={};
WEAK=Array.isArray(WEAK)?WEAK.filter(w=>typeof w==="string"&&w.length<=24).slice(0,40):[];
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function itemsOf(l){const out=[];for(const r of l.rows||[]){if(r[0]==="rep")out.push(r[1]);else if(r[0]==="stroke")out.push("~"+r[1])}return out}
function schedule(l){if(l.f)return;for(const it of itemsOf(l))if(!SR[it])SR[it]={lv:0,due:addDays(1)};store.set("sr",SR)}
function dueItems(){const td=today();return Object.entries(SR).filter(([,v])=>v&&v.due&&v.due<=td).sort((a,b)=>a[1].due<b[1].due?-1:a[1].due>b[1].due?1:0).map(([k])=>k)}
function itemRow(it){return it[0]==="~"?["stroke",it.slice(1)]:["rep",it]}
let frozenReview=null,frozenLuyen=null;
function buildReview(force=false){
  if(frozenReview&&!force){REVIEW.rows=frozenReview;return}
  let arr=dueItems().slice(0,8);
  if(arr.length<4){const pool=new Set();
    for(const l of LESSONS.slice(0,NREAL)){if(!done.has(l.id)||!l.rows||l.f)continue;for(const r of l.rows)if(r[0]==="rep"&&[...r[1]].length===1)pool.add(r[1])}
    let more=[...pool].filter(c=>!arr.includes(c));if(!more.length&&!arr.length)more=[..."aoeiu"];
    const rnd=seeded(today());more.sort(()=>rnd()-.5);arr=arr.concat(more.slice(0,8-arr.length))}
  const interleave=SCRIPT==="td"?[["pair","a d g q  a d g q"],["pair","n m u v  l b h k"]]:SCRIPT==="th"?[["pair","o a d q g"],["pair","i t u n m p"]]:[["pair","o c e a d q g p b"],["pair","i l t f j  n m u v"]];
  const bangChu=SCRIPT==="th"?[["pair","a ă â b c d đ e ê g h i k l m"],["pair","n o ô ơ p q r s t u ư v x y"]]:[["pair","abcdefghijklm"],["pair","nopqrstuvwxyz"]];
  REVIEW.rows=arr.map(itemRow).concat(interleave,bangChu);
  frozenReview=REVIEW.rows.slice();
}
let luyenRounds=1;
function buildLuyen(force=false){
  if(!frozenLuyen||force)frozenLuyen=WEAK.slice(0,8);
  const w=frozenLuyen;const rows=[];for(let i=0;i<luyenRounds;i++)rows.push(...w.map(itemRow));LUYEN.rows=rows;
}
function lessonRows(l){
  if(l.id==="free"){const t=store.get("custom","");return t.trim()?t.split("\n").filter(s=>s.trim()).map(s=>["pair",s.trim()]):[["blank",12]]}
  if(l.id==="review")buildReview(false);
  if(l.id==="luyen")buildLuyen(false);
  return l.rows;
}
function repGap(fs){return SCRIPT==="th"?fs*TH_KHOANG_TIENG:Math.max(fs*.25,16)}   /* Tiểu học: giữa hai lần lặp cách bằng một chữ o, như giữa hai tiếng */
/* Thang luyện: Tô = tô rõ → tô mờ → chỉ còn chấm đặt bút → chữ trong từ; Nhớ = tên chữ + dòng trống */
function groupsFor(r,m,avail,mode){
  const G=[],fit=s=>2*mw(s,m.fs,m.fam)+repGap(m.fs)<=avail,one=typeof r[1]==="string"&&[...r[1]].length===1;
  if(r[0]==="blank"){for(let i=0;i<r[1];i++)G.push([{k:"blank"}]);return G}
  if(mode==="nho"){
    if(r[0]==="stroke"){G.push([{k:"hint",s:STROKE_NAME[r[1]]||r[1],src:{k:"stroke",s:r[1]},item:"~"+r[1]},{k:"nblank",src:{k:"stroke",s:r[1]}}]);return G}
    if(r[0]==="rep"&&fit(r[1])){const src={k:"rep",s:r[1]};
      G.push([{k:"hint",s:r[1],src,item:r[1]},{k:"nblank",src}].concat(one?[{k:"nblank",src}]:[]));
      if(one)for(const w of WORDS[r[1]]||[])G.push([{k:"hint",s:w,src:{k:"rep",s:w}}]);return G}
    for(const ln of wrap(r[1],avail,m.fs,m.fam))G.push([{k:"hint",s:ln,src:{k:"model",s:ln},item:r[0]==="rep"?r[1]:null},{k:"nblank",src:{k:"model",s:ln}}]);return G}
  if(r[0]==="stroke"){G.push([{k:"stroke",s:r[1],model:1,lv:1,tag:"tô rõ"},{k:"stroke",s:r[1],lv:1}]);
    G.push([{k:"stroke",s:r[1],lv:2,tag:"tô mờ"},{k:"sdots",s:r[1],tag:"gợi ý"}]);return G}
  if(r[0]==="rep"&&fit(r[1])){
    G.push([{k:"rep",s:r[1],model:1,lv:1,tag:"tô rõ"},{k:"rep",s:r[1],lv:1}]);
    G.push([{k:"rep",s:r[1],lv:2,tag:"tô mờ"},{k:"rep",s:r[1],lv:3}]);
    G.push([{k:"dots",s:r[1],tag:"gợi ý"}].concat(one?[{k:"dots",s:r[1]}]:[{k:"blank"}]));
    if(one)for(const w of WORDS[r[1]]||[])G.push([{k:"rep",s:w,model:1,lv:1,tag:"trong từ"},{k:"blank"}]);return G}
  const g=[];for(const ln of wrap(r[1],avail,m.fs,m.fam))g.push({k:"model",s:ln},{k:"trace",s:ln},{k:"trace",s:ln,lv:2});g.push({k:"blank"});G.push(g);return G
}
/* Phân trang thuần: không đổi biến toàn cục. Mỗi dòng nội dung có mã rid cố định (dòng gốc.nhóm.dòng),
   nên nét viết được neo theo dòng chứ không theo số trang — đổi cỡ, bật hộp phóng to hay chế độ tập trung không làm "mất" nét. */
function computePages(l,mode,scale,Hh,ppOverride,v3){
  const so=S.scale;S.scale=scale;const m=sizeFor(l);S.scale=so;const F=m.F;
  let padL,padR,padT,padB,unit,safeSide;
  let up=Math.max(l.up||F.asc+.25,F.asc+.05);const dn=Math.max(l.dn||F.desc+.1,F.desc+.03);
  if(v3){safeSide=14;padL=14+(l.f?0:m.xh*.35);padR=10;padT=8;padB=4;unit=(up+dn)*m.fs+m.xh*(SCRIPT!=="td"?.6:.35)}
  else{safeSide=W<520?24:18;padL=safeSide+(l.f?0:m.xh*.35);padR=safeSide;padT=Hh<420?50:56;padB=Hh<420?8:20;unit=(up+dn)*m.fs+m.xh*(SCRIPT!=="td"?.68:.44)}
  if(SCRIPT==="th"){const bd=thBuocDong(m.co,m.hoa);unit=bd.unit*m.fs;up=bd.up}   /* Tiểu học: các dòng 4 ô li nối liền nhau */
  const perPage=ppOverride||Math.max(1,Math.floor((Hh-padT-padB)/unit));
  const avail=Math.max(80,W-padL-padR-6);
  const lay={m,padL,padR,padT,unit,perPage,up,safeSide};
  const groups=[];
  const hideM=l.id==="review";
  lessonRows(l).forEach((r,i)=>groupsFor(r,m,avail,mode).forEach((g,j)=>{g.forEach((row,k)=>{row.rid=i+"."+j+"."+k;if(hideM&&row.k==="hint")row.hide=1});groups.push(g)}));
  const pgs=[];let pg=[];
  for(const g of groups){
    if(g.length>perPage){if(pg.length){pgs.push(pg);pg=[]}for(let i=0;i<g.length;i+=perPage)pgs.push(g.slice(i,i+perPage));continue}
    if(pg.length+g.length>perPage&&pg.length){pgs.push(pg);pg=[]}
    pg.push(...g);
  }
  if(pg.length)pgs.push(pg);
  if(!pgs.length)pgs.push([]);
  for(const pgx of pgs){let lr="top";for(const r of pgx)if(r.rid)lr=r.rid;let n=0;while(pgx.length<perPage)pgx.push({k:"blank",rid:"pad:"+lr+":"+(++n)})}
  return {lay,pages:pgs};
}
function buildPages(){
  const r=computePages(LESSONS[cur.li],cur.mode,S.scale,H,0,false);
  layout=r.lay;pages=r.pages;
  cur.page=Math.max(0,Math.min(pages.length-1,cur.page|0));
}

