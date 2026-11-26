/* ================== PDF VECTƠ: đường kẻ, chữ mẫu, mũi tên đều là nét thật, có nhúng phông ================== */
let _pdfFonts=null;
function pdfFonts(){
  if(_pdfFonts)return _pdfFonts;
  const out={};
  for(const k in PDFF){const d=PDFF[k],cmap=new Map(),lig=new Map();
    for(const p of d.cm.split(",")){const i=p.indexOf(":");cmap.set(parseInt(p.slice(0,i),16),parseInt(p.slice(i+1),16))}
    for(const g in d.lg)lig.set(+g,d.lg[g]);
    out[k]=Object.assign({},d,{cmap,lig,adv:d.aw.split(",").map(v=>parseInt(v,16))});}
  return _pdfFonts=out;
}
const pdfN=v=>{const r=Math.round(v*100)/100;return Object.is(r,-0)?"0":String(r)};
const pdfN1=v=>{const r=Math.round(v*10)/10;return Object.is(r,-0)?"0":String(r)};
const pdfN4=v=>{const r=Math.round(v*10000)/10000;return Object.is(r,-0)?"0":String(r)};
const pdfN3=v=>String(Math.round(v*1000)/1000);
let _pdfColCtx=null;const _pdfColCache=new Map();
function pdfColor(c){
  if(typeof c!=="string")return[0,0,0,1];
  let r=_pdfColCache.get(c);if(r)return r;
  if(!_pdfColCtx)_pdfColCtx=document.createElement("canvas").getContext("2d");
  const x=_pdfColCtx;x.fillStyle="#000";x.fillStyle=c;const v=String(x.fillStyle);
  if(v[0]==="#")r=[parseInt(v.slice(1,3),16)/255,parseInt(v.slice(3,5),16)/255,parseInt(v.slice(5,7),16)/255,1];
  else{const m=v.match(/[\d.]+/g)||[0,0,0];r=[m[0]/255,m[1]/255,m[2]/255,m[3]!=null?+m[3]:1]}
  _pdfColCache.set(c,r);return r;
}
class PdfDoc{
  constructor(){this.fonts=new Map();this.gs=new Map();this.st=new Map()}
  font(fam){let f=this.fonts.get(fam);if(!f){f={name:"F"+(this.fonts.size+1),fam,used:new Map()};this.fonts.set(fam,f)}return f}
  gsName(op,a){const k=op+a.toFixed(3);let g=this.gs.get(k);if(!g){g={name:"G"+(this.gs.size+1),op,a:+a.toFixed(3)};this.gs.set(k,g)}return g.name}
  /* Ký tự không có trong phông nhúng (ví dụ mũi tên ↑ →): vẽ bằng trình duyệt ở độ phân giải cao rồi nhúng dạng mặt nạ 1 bit */
  stencil(font,ch){
    const key=font+"|"+ch;if(this.st.has(key))return this.st.get(key);
    const c=document.createElement("canvas"),x=c.getContext("2d");x.font=font;const mt=x.measureText(ch);
    const top=Math.ceil(mt.actualBoundingBoxAscent||0)+1,bot=Math.ceil(mt.actualBoundingBoxDescent||0)+1,
          lft=Math.ceil(mt.actualBoundingBoxLeft||0)+1,rgt=Math.ceil(mt.actualBoundingBoxRight||0)+1,w=lft+rgt,h=top+bot;
    if(!(w>2&&h>2)){this.st.set(key,null);return null}
    const K=6;c.width=Math.ceil(w*K);c.height=Math.ceil(h*K);
    x.setTransform(K,0,0,K,0,0);x.font=font;x.fillStyle="#000";x.textBaseline="alphabetic";x.textAlign="left";x.fillText(ch,lft,top);
    const d=x.getImageData(0,0,c.width,c.height).data,pw=c.width,ph=c.height,rw=Math.ceil(pw/8),bits=new Uint8Array(rw*ph).fill(255);
    for(let y=0;y<ph;y++)for(let i=0;i<pw;i++)if(d[(y*pw+i)*4+3]>=110)bits[y*rw+(i>>3)]&=~(0x80>>(i&7));
    const o={name:"S"+(this.st.size+1),pw,ph,bits,w,h,ox:-lft,top};this.st.set(key,o);return o;
  }
}
const PDFCTX_KEYS=["fillStyle","strokeStyle","lineWidth","lineCap","lineJoin","miterLimit","globalAlpha","font","textAlign","textBaseline","globalCompositeOperation","lineDashOffset"];
/* Bút vẽ giả lập canvas 2D: mọi lệnh vẽ được ghi thành lệnh PDF (tọa độ theo điểm ảnh của trang) */
class PdfCtx{
  constructor(doc,mctx){
    this.doc=doc;this.mctx=mctx;this.out=[];this.stk=[];this.p=[];this.cp=null;this.sp=null;this.m=[1,0,0,1,0,0];this.dash=[];
    this.fillStyle="#000";this.strokeStyle="#000";this.lineWidth=1;this.lineCap="butt";this.lineJoin="miter";this.miterLimit=10;
    this.globalAlpha=1;this.font="10px sans-serif";this.textAlign="start";this.textBaseline="alphabetic";this.globalCompositeOperation="source-over";this.lineDashOffset=0;
  }
  save(){const o={m:this.m.slice(),dash:this.dash.slice()};for(const k of PDFCTX_KEYS)o[k]=this[k];this.stk.push(o)}
  restore(){const o=this.stk.pop();if(!o)return;this.m=o.m;this.dash=o.dash;for(const k of PDFCTX_KEYS)this[k]=o[k]}
  setTransform(a,b,c,d,e,f){if(a&&typeof a==="object")({a,b,c,d,e,f}=a);this.m=[a,b,c,d,e,f]}
  resetTransform(){this.m=[1,0,0,1,0,0]}
  getTransform(){const[a,b,c,d,e,f]=this.m;return new DOMMatrix([a,b,c,d,e,f])}
  transform(a,b,c,d,e,f){const[A,B,C,D,E,F]=this.m;this.m=[A*a+C*b,B*a+D*b,A*c+C*d,B*c+D*d,A*e+C*f+E,B*e+D*f+F]}
  translate(x,y){this.transform(1,0,0,1,x,y)}
  scale(x,y){this.transform(x,0,0,y,0,0)}
  rotate(t){const c=Math.cos(t),s=Math.sin(t);this.transform(c,s,-s,c,0,0)}
  _T(x,y){const m=this.m;return[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]}
  _sc(){const m=this.m;return Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]))||1}
  beginPath(){this.p=[];this.cp=null;this.sp=null}
  moveTo(x,y){const q=this._T(x,y);this.p.push(["m",q]);this.cp=this.sp=q}
  lineTo(x,y){if(!this.cp)return this.moveTo(x,y);const q=this._T(x,y);this.p.push(["l",q]);this.cp=q}
  bezierCurveTo(a,b,c,d,x,y){if(!this.cp)this.moveTo(a,b);const q=this._T(x,y);this.p.push(["c",this._T(a,b),this._T(c,d),q]);this.cp=q}
  quadraticCurveTo(a,b,x,y){if(!this.cp)this.moveTo(a,b);const p0=this.cp,p1=this._T(a,b),q=this._T(x,y);
    this.p.push(["c",[p0[0]+2/3*(p1[0]-p0[0]),p0[1]+2/3*(p1[1]-p0[1])],[q[0]+2/3*(p1[0]-q[0]),q[1]+2/3*(p1[1]-q[1])],q]);this.cp=q}
  closePath(){if(this.cp){this.p.push(["h"]);this.cp=this.sp}}
  rect(x,y,w,h){this.moveTo(x,y);this.lineTo(x+w,y);this.lineTo(x+w,y+h);this.lineTo(x,y+h);this.closePath();this.moveTo(x,y)}
  arc(cx,cy,r,a0,a1,ccw){
    const TAU=Math.PI*2;let sw;
    if(!ccw){sw=a1-a0;if(sw>=TAU)sw=TAU;else{sw%=TAU;if(sw<0)sw+=TAU}}
    else{sw=a0-a1;if(sw>=TAU)sw=TAU;else{sw%=TAU;if(sw<0)sw+=TAU}sw=-sw}
    const sx=cx+r*Math.cos(a0),sy=cy+r*Math.sin(a0);
    if(this.cp)this.lineTo(sx,sy);else this.moveTo(sx,sy);
    if(!sw||!r)return;
    const n=Math.ceil(Math.abs(sw)/(Math.PI/2)-1e-9),da=sw/n,k=4/3*Math.tan(da/4);
    let a=a0;
    for(let i=0;i<n;i++){const b=a+da,c0=Math.cos(a),s0=Math.sin(a),c1=Math.cos(b),s1=Math.sin(b);
      this.bezierCurveTo(cx+r*(c0-k*s0),cy+r*(s0+k*c0),cx+r*(c1+k*s1),cy+r*(s1-k*c1),cx+r*c1,cy+r*s1);a=b}
  }
  ellipse(cx,cy,rx,ry,rot,a0,a1,ccw){this.save();this.translate(cx,cy);this.rotate(rot||0);this.scale(rx,ry);this.arc(0,0,1,a0,a1,ccw);this.restore()}
  _pathStr(){
    const o=[],P=this.p;
    for(let i=0;i<P.length;i++){const t=P[i];
      if(t[0]==="m"){if(i+1>=P.length||P[i+1][0]==="m")continue;o.push(pdfN1(t[1][0])+" "+pdfN1(t[1][1])+" m")}
      else if(t[0]==="l")o.push(pdfN1(t[1][0])+" "+pdfN1(t[1][1])+" l");
      else if(t[0]==="c")o.push([t[1][0],t[1][1],t[2][0],t[2][1],t[3][0],t[3][1]].map(pdfN1).join(" ")+" c");
      else o.push("h");}
    return o.join(" ");
  }
  _col(style,op){const[r,g,b,a0]=pdfColor(style),a=a0*this.globalAlpha;
    let s=`${pdfN3(r)} ${pdfN3(g)} ${pdfN3(b)} ${op==="ca"?"rg":"RG"}`;if(a<.999)s+=` /${this.doc.gsName(op,a)} gs`;return s}
  fill(a,b){const rule=typeof a==="string"?a:b;const ps=this._pathStr();if(!ps)return;
    this.out.push(`q ${this._col(this.fillStyle,"ca")} ${ps} ${rule==="evenodd"?"f*":"f"} Q`)}
  stroke(){const ps=this._pathStr();if(!ps)return;const sc=this._sc();
    const cap={butt:0,round:1,square:2}[this.lineCap]||0,join={miter:0,round:1,bevel:2}[this.lineJoin]||0;
    const dash=this.dash.length?`[${this.dash.map(v=>pdfN(v*sc)).join(" ")}] ${pdfN(this.lineDashOffset*sc)} d `:"";
    this.out.push(`q ${this._col(this.strokeStyle,"CA")} ${pdfN(this.lineWidth*sc)} w ${cap} J ${join} j ${pdfN(this.miterLimit)} M ${dash}${ps} S Q`)}
  _keepPath(fn){const sv=[this.p,this.cp,this.sp];this.beginPath();fn();[this.p,this.cp,this.sp]=sv}
  fillRect(x,y,w,h){this._keepPath(()=>{this.rect(x,y,w,h);this.fill()})}
  strokeRect(x,y,w,h){this._keepPath(()=>{this.rect(x,y,w,h);this.stroke()})}
  clearRect(x,y,w,h){const f=this.fillStyle,a=this.globalAlpha;this.fillStyle="#FFFFFF";this.globalAlpha=1;this.fillRect(x,y,w,h);this.fillStyle=f;this.globalAlpha=a}
  setLineDash(a){a=(a||[]).filter(v=>isFinite(v)&&v>=0);this.dash=a.length%2?a.concat(a):a}
  getLineDash(){return this.dash.slice()}
  measureText(s){this.mctx.font=this.font;return this.mctx.measureText(s)}
  drawImage(){}
  fillText(s,x,y){
    s=String(s).normalize("NFC");if(!s)return;
    const mc=this.mctx;mc.font=this.font;mc.textAlign="left";mc.textBaseline="alphabetic";
    const fm=/^\s*(?:(\d+)\s+)?([\d.]+)px\s+['"]?([^'",]+)/.exec(this.font)||[];
    const wt=+(fm[1]||400),fs=+fm[2]||10,fam=(fm[3]||"").trim(),FD=pdfFonts()[fam];
    const total=mc.measureText(s).width,al=this.textAlign;
    const x0=al==="right"||al==="end"?x-total:al==="center"?x-total/2:x;
    let yb=y;
    if(this.textBaseline!=="alphabetic"){const a=mc.measureText("H").actualBoundingBoxAscent;mc.textBaseline=this.textBaseline;
      const b=mc.measureText("H").actualBoundingBoxAscent;mc.textBaseline="alphabetic";yb=y+a-b}
    /* Tách cụm ký tự, gộp chữ ghép (fi, fl, ff) như trình duyệt; vị trí từng chữ đo bằng phần đuôi chuỗi để giữ đúng khoảng kerning */
    const cps=[...s],idx=[];let off=0;for(const c of cps){idx.push(off);off+=c.length}
    const pos=i=>i===0?0:total-mc.measureText(s.slice(idx[i])).width;
    const gl=[];
    for(let i=0;i<cps.length;){const g=FD?FD.cmap.get(cps[i].codePointAt(0)):undefined;
      if(g===undefined){gl.push({g:null,ch:cps[i],i});i++;continue}
      let gg=g,took=1;const L=FD.lig.get(g);
      if(L)for(const lg of L){let ok=true;for(let k=1;k<lg.length;k++){const c2=cps[i+k];if(!c2||FD.cmap.get(c2.codePointAt(0))!==lg[k]){ok=false;break}}
        if(ok){gg=lg[0];took=lg.length;break}}
      gl.push({g:gg,ch:cps.slice(i,i+took).join(""),i});i+=took}
    const m=this.m,fo=FD?this.doc.font(fam):null;
    let o=`q ${m.map(pdfN4).join(" ")} cm ${this._col(this.fillStyle,"ca")}`;
    if(FD&&wt>=600){/* trình duyệt tự làm đậm (phông chỉ có một độ đậm): mô phỏng bằng viền cùng màu */
      const r=fs<=9?1/24:fs>=36?1/32:1/24+(1/32-1/24)*(fs-9)/27;
      o+=` ${this._col(this.fillStyle,"CA")} ${pdfN4(fs*r)} w 1 j 2 Tr`}
    let run=null;
    const flush=()=>{if(run){o+=` BT /${fo.name} ${pdfN(fs)} Tf 1 0 0 -1 ${pdfN(x0+run.x)} ${pdfN(yb)} Tm [${run.a.join("")}] TJ ET`;run=null}};
    for(const G of gl){const px=pos(G.i);
      if(G.g===null){flush();const st=this.doc.stencil(this.font,G.ch);
        if(st)o+=` q ${pdfN(st.w)} 0 0 ${pdfN(-st.h)} ${pdfN(x0+px+st.ox)} ${pdfN(yb-st.top+st.h)} cm /${st.name} Do Q`;continue}
      fo.used.set(G.g,G.ch);
      if(!run)run={x:px,a:[],pen:px};
      else{const d=px-run.pen;if(Math.abs(d)>.004)run.a.push(pdfN(-d*1000/fs))}
      run.a.push("<"+G.g.toString(16).padStart(4,"0")+">");
      run.pen=px+FD.adv[G.g]*fs/FD.upem}
    flush();
    this.out.push(o+" Q");
  }
}
async function pdfDeflate(u8){
  try{if(typeof CompressionStream==="undefined")return null;
    const st=new Blob([u8]).stream().pipeThrough(new CompressionStream("deflate"));
    return new Uint8Array(await new Response(st).arrayBuffer())}catch(e){return null}
}
function pdfUtf16Hex(s){let h="";for(let i=0;i<s.length;i++)h+=s.charCodeAt(i).toString(16).padStart(4,"0").toUpperCase();return h}
function pdfB64(b64){const bin=atob(b64),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return a}
/* Đóng gói PDF 1.4: phông TrueType nhúng (Type0/Identity-H, có bảng ToUnicode để chọn và tìm được chữ), độ trong suốt, liên kết mục lục */
async function assembleVectorPdf(doc,pages,ptW,ptH,W,H,title){
  const te=new TextEncoder(),chunks=[],offsets=[];let byteLen=0,nextId=1;
  const push=u=>{chunks.push(u);byteLen+=u.length};
  const pushStr=s=>push(te.encode(s));
  const alloc=()=>nextId++;
  const obj=(id,body)=>{offsets[id]=byteLen;pushStr(`${id} 0 obj\n${body}\nendobj\n`)};
  const stream=async(id,dict,u8,compress=true)=>{
    let data=u8,filt="";if(compress){const z=await pdfDeflate(u8);if(z&&z.length<u8.length){data=z;filt=" /Filter /FlateDecode"}}
    offsets[id]=byteLen;pushStr(`${id} 0 obj\n<< ${dict}${filt} /Length ${data.length} >>\nstream\n`);push(data);pushStr(`\nendstream\nendobj\n`)};
  push(new Uint8Array([37,80,68,70,45,49,46,52,10,37,226,227,207,211,10]));
  const catId=alloc(),pagesId=alloc(),resId=alloc(),infoId=alloc();
  const pageIds=pages.map(()=>alloc());
  const FS=pdfFonts();
  /* Phông chữ */
  const fontRefs=[];let tagN=0;
  for(const f of doc.fonts.values()){
    const FD=FS[f.fam],t0=alloc(),cid=alloc(),fd=alloc(),ff=alloc(),tu=alloc();
    const tag="TVSPA"+String.fromCharCode(65+tagN++)+"+"+FD.ps,u=FD.upem,sc=v=>Math.round(v*1000/u);
    const gids=[...f.used.keys()].sort((a,b)=>a-b);
    const wArr=gids.map(g=>`${g} [${sc(FD.adv[g])}]`).join(" ");
    const zz=pdfB64(FD.z);
    offsets[ff]=byteLen;pushStr(`${ff} 0 obj\n<< /Length ${zz.length} /Length1 ${FD.len} /Filter /FlateDecode >>\nstream\n`);push(zz);pushStr(`\nendstream\nendobj\n`);
    obj(fd,`<< /Type /FontDescriptor /FontName /${tag} /Flags 4 /FontBBox [${FD.bb.map(sc).join(" ")}] /ItalicAngle ${FD.ia} /Ascent ${sc(FD.asc)} /Descent ${sc(FD.desc)} /CapHeight ${sc(FD.cap)} /StemV 80 /FontFile2 ${ff} 0 R >>`);
    obj(cid,`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${tag} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${fd} 0 R /CIDToGIDMap /Identity /DW 1000 /W [${wArr}] >>`);
    let cm="/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n";
    for(let i=0;i<gids.length;i+=100){const part=gids.slice(i,i+100);
      cm+=`${part.length} beginbfchar\n`+part.map(g=>`<${g.toString(16).padStart(4,"0")}> <${pdfUtf16Hex(f.used.get(g))}>`).join("\n")+"\nendbfchar\n"}
    cm+="endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
    await stream(tu,"",te.encode(cm));
    obj(t0,`<< /Type /Font /Subtype /Type0 /BaseFont /${tag} /Encoding /Identity-H /DescendantFonts [${cid} 0 R] /ToUnicode ${tu} 0 R >>`);
    fontRefs.push(`/${f.name} ${t0} 0 R`);
  }
  /* Ký tự dự phòng dạng mặt nạ */
  const xRefs=[];
  for(const st of doc.st.values()){if(!st)continue;const id=alloc();
    await stream(id,`/Type /XObject /Subtype /Image /Width ${st.pw} /Height ${st.ph} /ImageMask true /BitsPerComponent 1`,st.bits);
    xRefs.push(`/${st.name} ${id} 0 R`)}
  const gsRefs=[...doc.gs.values()].map(g=>`/${g.name} << /Type /ExtGState /${g.op} ${g.a} >>`);
  obj(resId,`<< /ProcSet [/PDF /Text /ImageB] /Font << ${fontRefs.join(" ")} >> /ExtGState << ${gsRefs.join(" ")} >> /XObject << ${xRefs.join(" ")} >> >>`);
  /* Trang */
  const sx=ptW/W,sy=ptH/H;
  for(let i=0;i<pages.length;i++){const pg=pages[i],cId=alloc(),ann=[];
    for(const lk of (pg.links||[])){const aid=alloc();
      obj(aid,`<< /Type /Annot /Subtype /Link /Rect [${lk.rect.map(v=>v.toFixed(1)).join(" ")}] /Border [0 0 0] /Dest [${pageIds[lk.targetPage]} 0 R /Fit] >>`);ann.push(`${aid} 0 R`)}
    await stream(cId,"",te.encode(`q ${pdfN4(sx)} 0 0 ${pdfN4(-sy)} 0 ${pdfN4(ptH)} cm\n${pg.content}\nQ`));
    obj(pageIds[i],`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${ptW.toFixed(2)} ${ptH.toFixed(2)}] /Resources ${resId} 0 R /Contents ${cId} 0 R${ann.length?` /Annots [${ann.join(" ")}]`:""} >>`);
  }
  obj(pagesId,`<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map(id=>id+" 0 R").join(" ")}] >>`);
  obj(catId,`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  obj(infoId,`<< /Title <FEFF${pdfUtf16Hex(title||"Tập viết")}> /Creator <FEFF${pdfUtf16Hex("Tập viết S Pen "+APP_VER)}> /Producer (Tap viet S Pen ${APP_VER}) >>`);
  const xref=byteLen,n=nextId;
  let x=`xref\n0 ${n}\n0000000000 65535 f \n`;for(let i=1;i<n;i++)x+=String(offsets[i]||0).padStart(10,"0")+" 00000 n \n";
  pushStr(x+`trailer\n<< /Size ${n} /Root ${catId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks,{type:"application/pdf"});
}

/* Nút "Tạo và tải file PDF": dựng cfg từ màn Xuất PDF (pdfOpt) và bài đang mở, gọi exportPdf(cfg) rồi tải file về */
function pdfCfgTuManHinh(){
  const l=LESSONS[cur.li];
  const scope={cur:"bai",part:"phan",weak:"luyenthem",free:"tudo"}[pdfOpt.scope];
  return {v:1,script:SCRIPT,scope,lessons:[l.id],mode:pdfOpt.mode,grid:pdfOpt.grid||S.gridStyle||"french",arrows:pdfOpt.arrows,preset:pdfOpt.preset,barSide:pdfOpt.barSide};
}
async function generateWorkbookPdf(){
  if(pdfOpt.busy)return;
  pdfOpt.busy=true;flushSave();let doneOk=false;
  document.querySelectorAll("#genBox button").forEach(b=>b.disabled=true);
  const btn=document.getElementById("pdfGoBtn"),prog=document.getElementById("pdfProg");
  if(btn)btn.disabled=true;
  if(prog){prog.style.display="block";prog.textContent="Đang sắp xếp trang…"}
  try{
    const r=await exportPdf(pdfCfgTuManHinh(),{onProgress:s=>{if(prog)prog.textContent=s}});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(r.blob);
    a.download=`Vo-luyen-chu-${SCRIPT}-${pdfOpt.preset}-${pdfOpt.scope}-${today()}.pdf`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),6000);
    toast(`Đã xuất xong tập viết PDF (${r.soTrang} trang) chuẩn ${PDF_PRESETS[pdfOpt.preset].name}!`);
    doneOk=true;
  }catch(err){
    console.error(err);
    toast("Có lỗi khi xuất PDF: "+(err&&err.message?err.message:err));
  }finally{
    pdfOpt.busy=false;
    document.querySelectorAll("#genBox button").forEach(b=>b.disabled=false);
    if(btn)btn.disabled=false;
    if(doneOk)closeSheets();
  }
}
function savePng(){const a=document.createElement("a");a.download=`tap-viet-${SCRIPT}-${LESSONS[cur.li].id}-trang${cur.page+1}.png`;a.href=renderFullExport().toDataURL("image/png");a.click()}
function applyTheme(){
  const tn=themeName();
  T=THEMES[tn];
  document.body.classList.remove("light","dark","eink");
  if(tn==="light"||tn==="dark"||tn==="eink")document.body.classList.add(tn);
  document.body.classList.toggle("lefthand",!!S.leftHand);
  document.body.classList.toggle("accK",S.accent==="black"&&tn!=="eink");
  updatePenBadge();
  const mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.content=T.paper;
}
function setTheme(v){S.theme=v;saveS();applyTheme();if(layout)show()}

function setLowLat(v){S.lowLat=v;saveS();location.reload()}
if(mq&&mq.addEventListener)mq.addEventListener("change",()=>{if(S.theme==="auto")setTheme("auto")});
let tT=0;function toast(m){const t=document.getElementById("toast");t.textContent=m;placeToast(t);t.style.opacity=1;clearTimeout(tT);tT=setTimeout(()=>t.style.opacity=0,2200)}


