/* ================== VẼ NỀN (DỊU MẮT & DẢI THÂN CHỮ) ================== */
function guides(ctx,b,m,x0,x1){
  const gx0=x0!=null?x0:(layout?Math.max(12,layout.safeSide-6):16);
  const gx1=x1!=null?x1:(W-(layout?Math.max(12,layout.safeSide-6):16));
  if(S.xBand&&T.xBand){ctx.fillStyle=T.xBand;ctx.fillRect(gx0,b-m.xh,gx1-gx0,m.xh)}
  if(S.gridStyle==="oly4"||SCRIPT==="th"){
    /* Hệ 4 ô ly chuẩn vở tiểu học Việt Nam (1 ly = xh / 2) */
    const ly=m.xh/2,topY=b-Math.max(m.asc,ly*5),botY=b+Math.max(m.desc,ly*3);
    ctx.strokeStyle=T.slant;ctx.lineWidth=0.85;ctx.setLineDash([]);
    ctx.beginPath();
    for(let x=gx0;x<=gx1;x+=ly){ctx.moveTo(x,topY);ctx.lineTo(x,botY)}
    for(let k=-3;k<=5;k++){if(k===0||k===2)continue;const y=b-k*ly;if(y>=topY-1&&y<=botY+1){ctx.moveTo(gx0,y);ctx.lineTo(gx1,y)}}
    ctx.stroke();
    ctx.strokeStyle=T.asc;ctx.lineWidth=1.05;ctx.beginPath();
    for(let x=gx0;x<=gx1;x+=ly*4){ctx.moveTo(x,topY);ctx.lineTo(x,botY)}
    ctx.stroke();
    ctx.strokeStyle=T.slant;ctx.lineWidth=0.8;ctx.setLineDash([3,5]);ctx.beginPath();
    for(let x=gx0+ly*2;x+m.asc*m.tan<gx1;x+=ly*4){ctx.moveTo(x-m.desc*m.tan,b+m.desc);ctx.lineTo(x+m.asc*m.tan,b-m.asc)}
    ctx.stroke();ctx.setLineDash([]);
  }else{
    ctx.lineWidth=1;ctx.strokeStyle=T.slant;ctx.setLineDash([]);
    const step=Math.max(32,m.xh*1.7);
    ctx.beginPath();
    for(let x=gx0+(layout?layout.padL-gx0:14);x+m.asc*m.tan<gx1;x+=step){ctx.moveTo(x-m.desc*m.tan,b+m.desc);ctx.lineTo(x+m.asc*m.tan,b-m.asc)}
    ctx.stroke();
  }
  ctx.strokeStyle=T.asc;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(gx0,b-m.asc);ctx.lineTo(gx1,b-m.asc);ctx.stroke();
  ctx.strokeStyle=T.xh;ctx.lineWidth=1.15;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(gx0,b-m.xh);ctx.lineTo(gx1,b-m.xh);ctx.stroke();
  ctx.setLineDash([]);ctx.strokeStyle=T.base;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(gx0,b);ctx.lineTo(gx1,b);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle=T.desc;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(gx0,b+m.desc);ctx.lineTo(gx1,b+m.desc);ctx.stroke();
  ctx.setLineDash([]);
}
function text(ctx,s,x,b,fs,color,fam){if(laPhongTH(fam))return veChuoiTH(ctx,s,x,b,fs,color,color===traceColor());const F=FONTS[fam||SC.font];ctx.font=fnt(fs,fam);ctx.fillStyle=color;ctx.textBaseline="alphabetic";
  if(F.skew){const tn=Math.tan(F.slant*Math.PI/180);ctx.save();ctx.transform(1,0,-tn,1,tn*b,0);ctx.fillText(s,x,b);ctx.restore()}else ctx.fillText(s,x,b)}
function hint(ctx,s,x,b,m){const sz=Math.max(14,m.xh*.62);ctx.font=`600 ${sz}px 'QS',sans-serif`;ctx.fillStyle=T.hint;ctx.textBaseline="alphabetic";
  const t=s.length>36?s.slice(0,35)+"…":s;ctx.fillText(t,x,b-m.asc*.98+sz)}
/* mũi tên trên cả một chuỗi chữ: mỗi chữ đặt theo vị trí đo được */
function arrowsOnText(ctx,s,x,b,fs,xh,fam){
  if(fam==="AL")return;if(laPhongTH(fam))return muiTenChuoiTH(ctx,s,x,b,xh);ctx.font=fnt(fs,fam);const chars=[...s];let pre="";
  for(const ch of chars){const x0=x+ctx.measureText(pre).width;if(DUCTUS[ch])drawGuide(ctx,ch,x0,b,xh,themeName()==="dark");pre+=ch}}
/* nét cơ bản thanh đậm — bề rộng theo hướng viết xuống */
function samplePath(d){
  const pts=[];let c=null;
  for(const g of d){
    if(g[0]==="M"){c=[g[1],g[2]];pts.push(c)}
    else if(g[0]==="L"){for(let i=1;i<=10;i++){const t=i/10;pts.push([c[0]+(g[1]-c[0])*t,c[1]+(g[2]-c[1])*t])}c=[g[1],g[2]]}
    else{const[,x1,y1,x2,y2,x,y]=g;for(let i=1;i<=36;i++){const t=i/36,u=1-t;
      pts.push([u*u*u*c[0]+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x,u*u*u*c[1]+3*u*u*t*y1+3*u*t*t*y2+t*t*t*y])}c=[x,y]}
  }return pts;
}
function drawBasicQS(ctx,kind,x,b,xh,color,tan){
  const F=FONTS.QS,asc=F.asc/F.x*xh,desc=F.desc/F.x*xh,r=xh*.45;
  ctx.save();ctx.transform(1,0,-tan,1,tan*b,0);ctx.strokeStyle=color;ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=Math.max(2.2,xh*.14);ctx.beginPath();
  switch(kind){
   case"tall":ctx.moveTo(x,b-asc);ctx.lineTo(x,b);break;
   case"short":ctx.moveTo(x,b-xh);ctx.lineTo(x,b);break;
   case"flat":ctx.moveTo(x-xh*.3,b-xh*.5);ctx.lineTo(x+xh*.5,b-xh*.5);break;
   case"slash":ctx.moveTo(x+xh*.4,b-xh);ctx.lineTo(x-xh*.2,b);break;
   case"back":ctx.moveTo(x-xh*.2,b-xh);ctx.lineTo(x+xh*.4,b);break;
   case"v":ctx.moveTo(x-xh*.35,b-xh);ctx.lineTo(x,b);ctx.lineTo(x+xh*.35,b-xh);break;
   case"o":ctx.arc(x+xh/2,b-xh/2,xh/2,0,Math.PI*2);break;
   case"c":ctx.arc(x+xh/2,b-xh/2,xh/2,-Math.PI/4,Math.PI/4,true);break;
   case"rc":ctx.arc(x+xh/2,b-xh/2,xh/2,-3*Math.PI/4,3*Math.PI/4,false);break;
   case"u":ctx.moveTo(x,b-xh);ctx.lineTo(x,b-r);ctx.arc(x+r,b-r,r,Math.PI,0,true);ctx.lineTo(x+2*r,b-xh);break;
   case"n":ctx.moveTo(x,b);ctx.lineTo(x,b-xh+r);ctx.arc(x+r,b-xh+r,r,Math.PI,0,false);ctx.lineTo(x+2*r,b);break;
   case"hook":{const cx=x+xh*.5,rr=xh*.3;ctx.moveTo(cx,b-xh);ctx.lineTo(cx,b+desc-rr);ctx.arc(cx-rr,b+desc-rr,rr,0,Math.PI*.9,false);break}
  }
  ctx.stroke();ctx.restore()}
function drawBasic(ctx,kind,x0,b,xh,color,tan){
  if(SCRIPT==="qs")return drawBasicQS(ctx,kind,x0,b,xh,color,tan);
  if(SCRIPT==="th")return veNetCoBanTH(ctx,kind,x0,b,xh,color,color===traceColor());
  if(!STROKES[kind])return;
  const pts=samplePath(STROKES[kind].d),n=pts.length,thick=.24*xh,thin=Math.max(.05*xh,1.1);
  let ws=pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],c=pts[Math.min(n-1,i+1)];const dx=c[0]-a[0],dy=c[1]-a[1];
    const L=Math.hypot(dx,dy)||1;const s=Math.max(0,-dy/L);return thin+(thick-thin)*Math.pow(s,1.4)});
  ws=ws.map((_,i)=>{const a=ws.slice(Math.max(0,i-3),i+4);return a.reduce((p,q)=>p+q,0)/a.length});
  const P=pts.map(([x,y])=>[x0+(x+y*tan)*xh,b-y*xh]);
  ctx.fillStyle=color;ctx.beginPath();
  for(let i=0;i<n-1;i++){
    const[ax,ay]=P[i],[bx,by]=P[i+1];const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy);if(L<1e-6)continue;
    const nx=-dy/L,ny=dx/L,ex=dx/L*.3,ey=dy/L*.3,wa=ws[i]/2,wb=ws[i+1]/2;
    let q=[[ax-ex+nx*wa,ay-ey+ny*wa],[bx+ex+nx*wb,by+ey+ny*wb],[bx+ex-nx*wb,by+ey-ny*wb],[ax-ex-nx*wa,ay-ey-ny*wa]];
    let ar=0;for(let k=0;k<4;k++)ar+=q[k][0]*q[(k+1)%4][1]-q[(k+1)%4][0]*q[k][1];if(ar<0)q.reverse();
    ctx.moveTo(q[0][0],q[0][1]);for(let k=1;k<4;k++)ctx.lineTo(q[k][0],q[k][1]);ctx.closePath();
  }
  ctx.fill("nonzero");
  for(const i of [0,n-1]){ctx.beginPath();ctx.arc(P[i][0],P[i][1],ws[i]/2,0,7);ctx.fill()}
}
/* Chấm xanh đặt bút to, có viền sáng dễ thấy cho mắt 46+ */
function startDot(ctx,s,x,b,m,dark){
  const ch=s[0]==="~"?s:[...s][0],d=m.fam==="AL"?null:DUCTUS[ch];
  const r=Math.max(4.5,.14*m.xh),green=themeName()==="eink"?"#000000":dark?"#38D371":"#15803D";
  if(d&&d[0]&&d[0].r[0]){
    const p=d[0].r[0][0],cx=x+p[0]*m.xh,cy=b-p[1]*m.xh;
    ctx.fillStyle=T.paper;ctx.beginPath();ctx.arc(cx,cy,r+1.8,0,7);ctx.fill();
    ctx.fillStyle=green;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();
  }else{ctx.fillStyle=green;ctx.fillRect(x,b-m.xh-1,3,m.xh*.28)}
}
function tagText(ctx,s,b,m){
  const sz=Math.max(13,Math.min(22,Math.round(m.xh*.42)));
  const rx=W-(layout.padR!=null?layout.padR:layout.safeSide)+4;
  ctx.font=`600 ${sz}px 'QS',sans-serif`;ctx.fillStyle=T.hint;ctx.textAlign="right";ctx.textBaseline="alphabetic";
  ctx.fillText(s,rx,b-m.asc+sz+1);ctx.textAlign="left";
}
function repCopies(ctx,row,b,m,fn){
  const w=mw(row.s,m.fs,m.fam),stp=w+repGap(m.fs),lim=W-layout.padR;let n=0;
  for(let x=layout.padL;x+w<=lim||n<1;x+=stp,n++)fn(x,n)
}
function drawRow(ctx,row,b,m,mode){
  const {padL,padR}=layout,fam=m.fam,dark=themeName()==="dark";
  if(row.tag&&mode==="to")tagText(ctx,row.tag,b,m);
  if(mode==="cmp"){const src=row.src;if(!src)return;
    const skipFirst=row.k==="hint"&&!row.hide;
    if(src.k==="rep")repCopies(ctx,src,b,m,(x,n)=>{if(!skipFirst||n>0)text(ctx,src.s,x,b,m.fs,T.cmp,fam)});
    else if(src.k==="model"){if(!skipFirst)text(ctx,src.s,padL,b,m.fs,T.cmp,fam)}
    else if(src.k==="stroke"){const sw=STROKES[src.s].w*m.xh,stp=sw+Math.max(m.xh*.9,14);let n=0;
      for(let x=padL+m.xh*.4;x+sw+2.2*m.xh*m.tan<W-padR||n<1;x+=stp,n++){if(!skipFirst||n>0)drawBasic(ctx,src.s,x,b,m.xh,T.cmp,m.tan)}}
    return}
  if(row.k==="blank"||row.k==="nblank")return;
  if(row.k==="hint"&&row.hide){
    /* Bài ôn: không hiện chữ mẫu, chỉ ghi tên chữ cần viết ở cuối dòng */
    tagText(ctx,"viết: "+row.s,b,m);
    return}
  if(row.k==="hint"){
    /* Cách 2: Hiển thị chữ/nét gợi ý đầu dòng bằng đúng font chuẩn (Pinyon / Quicksand nghiêng 10° / AL) */
    const src=row.src;
    if(src&&src.k==="stroke"){
      drawBasic(ctx,src.s,padL+m.xh*.4,b,m.xh,T.model,m.tan);
      tagText(ctx,row.s,b,m);
    }else if(src&&src.k==="model"){
      text(ctx,row.s,padL,b,m.fs,T.model,fam);
      tagText(ctx,"mẫu",b,m);
    }else{
      text(ctx,row.s,padL,b,m.fs,T.model,fam);
      tagText(ctx,"mẫu · tự viết",b,m);
    }
    return}
  /* Tăng ngưỡng độ mờ tối thiểu cho mắt 46+ không bị chìm chữ */
  const alpha=row.lv===2?.56:row.lv===3?.36:1,tc=traceColor();
  if(row.k==="model"){text(ctx,row.s,padL,b,m.fs,T.model,fam);if(S.rowArrows)arrowsOnText(ctx,row.s,padL,b,m.fs,m.xh,fam)}
  else if(row.k==="trace"){ctx.globalAlpha=alpha;text(ctx,row.s,padL,b,m.fs,tc,fam);ctx.globalAlpha=1}
  else if(row.k==="rep"){
    repCopies(ctx,row,b,m,(x,n)=>{const mod=row.model&&!n;ctx.globalAlpha=mod?1:alpha;text(ctx,row.s,x,b,m.fs,mod?T.model:tc,fam);ctx.globalAlpha=1;
      if(mod&&S.rowArrows)arrowsOnText(ctx,row.s,x,b,m.fs,m.xh,fam)})}
  else if(row.k==="dots")repCopies(ctx,row,b,m,x=>startDot(ctx,row.s,x,b,m,dark));
  else if(row.k==="stroke"||row.k==="sdots"){
    const sw=STROKES[row.s].w*m.xh,stp=sw+Math.max(m.xh*.9,14);let n=0;
    for(let x=padL+m.xh*.4;x+sw+2.2*m.xh*m.tan<W-padR||n<1;x+=stp,n++){
      if(row.k==="sdots"){startDot(ctx,"~"+row.s,x,b,m,dark);continue}
      const mod=row.model&&!n;ctx.globalAlpha=mod?1:alpha;drawBasic(ctx,row.s,x,b,m.xh,mod?T.model:tc,m.tan);ctx.globalAlpha=1;
      if(mod&&S.rowArrows)drawGuide(ctx,"~"+row.s,x,b,m.xh,dark)}
  }
}
function drawBgTo(ctx){
  ctx.fillStyle=T.paper;ctx.fillRect(0,0,W,H);
  const {m,padT,unit,up,padL}=layout;const rows=pages[cur.page],l=LESSONS[cur.li];
  rows.forEach((row,i)=>{const b=padT+i*unit+up*m.fs;guides(ctx,b,m);drawRow(ctx,row,b,m,cur.mode)});
  if(l.id==="luyen"&&!WEAK.length){
    ctx.font="600 16px 'QS',sans-serif";ctx.fillStyle=T.hint;
    const msg="Chưa có chữ nào cần luyện thêm. Ở chế độ ③ Chép hoặc Bài ôn, chạm So sánh rồi chấm “Luyện thêm”.";
    const lines=wrap(msg,W-padL*2,16,"QS");
    lines.forEach((ln,idx)=>ctx.fillText(ln,padL,padT+up*m.fs+idx*24));
  }
  if(l.cornell){const xL=W*.3,yS=padT+Math.floor(rows.length*.72)*unit;
    ctx.fillStyle=T.paper;ctx.globalAlpha=.55;ctx.fillRect(0,yS,W,H-yS);ctx.globalAlpha=1;
    ctx.strokeStyle=T.base;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(xL,0);ctx.lineTo(xL,yS);ctx.moveTo(0,yS);ctx.lineTo(W,yS);ctx.stroke();
    ctx.font="600 14px 'QS'";ctx.fillStyle=T.hint;ctx.fillText("Câu hỏi",14,padT-8);ctx.fillText("Ghi chép",xL+10,padT-8);ctx.fillText("Tóm tắt",14,yS+18)}
}
function drawBg(){bctx.setTransform(DPR,0,0,DPR,0,0);drawBgTo(bctx)}
function drawCompare(ctx){
  const {m,padT,unit,up}=layout;
  pages[cur.page].forEach((row,i)=>drawRow(ctx,row,padT+i*unit+up*m.fs,m,"cmp"));}

