/* Mũi tên đỏ chỉ hướng viết — cùng thuật toán với vở PDF (arrows_pdf.py) */
const ARROW={red:"#c91c17",redDark:"#ff7870",off:.27};
function aCatmull(p,n=14){
  if(p.length<3){const[a,b]=[p[0],p[p.length-1]];return Array.from({length:n+1},(_,t)=>[a[0]+(b[0]-a[0])*t/n,a[1]+(b[1]-a[1])*t/n])}
  const P=[p[0],...p,p[p.length-1]],o=[];
  for(let i=1;i<P.length-2;i++){const[p0,p1,p2,p3]=[P[i-1],P[i],P[i+1],P[i+2]];
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;
      o.push([0,1].map(j=>.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3)))}}
  o.push(p[p.length-1]);return o}
function aOffset(p,s){return p.map((q,i)=>{const a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)];
  const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return[q[0]-s*dy/L*ARROW.off,q[1]+s*dx/L*ARROW.off]})}
function aTrim(p,st,en){
  const cut=(p,d)=>{let acc=0;for(let i=1;i<p.length;i++){const sg=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(sg<1e-9)continue;
    if(acc+sg>=d){const t=(d-acc)/sg;return[[p[i-1][0]+(p[i][0]-p[i-1][0])*t,p[i-1][1]+(p[i][1]-p[i-1][1])*t],...p.slice(i)]}acc+=sg}return p.slice(-1)};
  let q=st?cut(p,st):p;if(en)q=cut(q.slice().reverse(),en).reverse();return q}
function arrowRuns(ch){return(DUCTUS[ch]||[]).map((st,k)=>[k+1,st.r.map((run,j)=>{
  const side=Array.isArray(st.s)?st.s[j]:st.s;return aTrim(aOffset(aCatmull(run),side),j?.06:.22,.06)})])}
function drawArrows(ctx,ch,x0,b,xh,dark){
  if(!DUCTUS[ch])return;const col=themeName()==="eink"?"#000000":dark?ARROW.redDark:ARROW.red;
  const T=p=>[x0+p[0]*xh,b-p[1]*xh],lw=Math.max(1.4,.055*xh);
  ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=lw;ctx.lineCap="round";ctx.lineJoin="round";
  const all=arrowRuns(ch);
  for(const[,runs]of all)for(const pts of runs){
    let groups=[],cur=[pts[0]],mode=null;
    for(let i=1;i<pts.length;i++){const down=pts[i][1]<pts[i-1][1]-1e-4;if(mode===null)mode=down;
      if(down!==mode&&cur.length>1){groups.push([mode,cur]);cur=[cur[cur.length-1]];mode=down}cur.push(pts[i])}
    groups.push([mode,cur]);
    for(const[down,g]of groups){ctx.setLineDash(down?[]:[lw*2.2,lw*2.2]);ctx.beginPath();const s=T(g[0]);ctx.moveTo(s[0],s[1]);
      for(const q of g.slice(1)){const t=T(q);ctx.lineTo(t[0],t[1])}ctx.stroke()}
    ctx.setLineDash([]);
    const A=T(pts.length>2?pts[pts.length-3]:pts[0]),B=T(pts[pts.length-1]);const L=Math.hypot(B[0]-A[0],B[1]-A[1])||1;
    const ux=(B[0]-A[0])/L,uy=(B[1]-A[1])/L,h=Math.max(6,.22*xh),w=h*.55;
    ctx.beginPath();ctx.moveTo(B[0]+ux*h*.35,B[1]+uy*h*.35);ctx.lineTo(B[0]-ux*h*.65-uy*w,B[1]-uy*h*.65+ux*w);
    ctx.lineTo(B[0]-ux*h*.65+uy*w,B[1]-uy*h*.65-ux*w);ctx.closePath();ctx.fill()}
  const r=Math.max(7,.19*xh),placed=[];
  for(const[num,runs]of all){const r0=runs[0],p0=T(r0[0]),p1=T(r0[Math.min(3,r0.length-1)]);
    const dx=p1[0]-p0[0],dy=p1[1]-p0[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;let cx=p0[0]-ux*r*1.25,cy=p0[1]-uy*r*1.25;
    for(let it=0;it<30;it++){const q=placed.find(q=>Math.hypot(cx-q[0],cy-q[1])<r*2.15);if(!q)break;
      let vx=cx-q[0],vy=cy-q[1],d=Math.hypot(vx,vy);if(d<1e-3){vx=-uy;vy=ux;d=1}cx+=vx/d*r*.5;cy+=vy/d*r*.5}
    placed.push([cx,cy]);ctx.fillStyle=col;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();
    ctx.fillStyle="#fff";ctx.font=`700 ${r*1.38}px 'QS',sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(num,cx,cy+r*.05)}
  ctx.restore()}
/* Cách 1 · tối giản: chấm xanh đặt bút + mũi tên ngắn + chấm đỏ dừng bút */
function aLen(p){let s=0;for(let i=1;i<p.length;i++)s+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return s}
function aHead(p,maxl){const o=[p[0]];let acc=0;for(let i=1;i<p.length;i++){const d=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);if(d<1e-9)continue;
  if(acc+d>=maxl){const t=(maxl-acc)/d;o.push([p[i-1][0]+(p[i][0]-p[i-1][0])*t,p[i-1][1]+(p[i][1]-p[i-1][1])*t]);return o}acc+=d;o.push(p[i])}return o}
function simpleMarks(ch){return(DUCTUS[ch]||[]).map((st,k)=>{const arrows=[];
  st.r.forEach((run,j)=>{const side=Array.isArray(st.s)?st.s[j]:st.s,cl=aCatmull(run),L=aLen(cl);if(L<.12)return;
    let a0=j?.04:.26;if(L<a0+.15)a0=0;const seg=aHead(aTrim(aOffset(cl,side),a0,0),Math.min(.55,Math.max(.18,L*.6)));if(seg.length>1)arrows.push(seg)});
  const all=st.r.flatMap(r=>aCatmull(r));return[k+1,all[0],arrows,aLen(all)>.45&&!st.mark?all[all.length-1]:null]})}
function drawSimple(ctx,ch,x0,b,xh,dark){
  if(!DUCTUS[ch])return;const eink=themeName()==="eink",paper=(THEMES[themeName()]||THEMES.sepia).paper;
  const red=eink?"#000000":dark?ARROW.redDark:ARROW.red,green=eink?"#000000":dark?"#38D371":"#15803D";
  const T=p=>[x0+p[0]*xh,b-p[1]*xh],lw=Math.max(1.5,.058*xh),marks=simpleMarks(ch);
  ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
  for(const[,,arrows,end]of marks){ctx.strokeStyle=red;ctx.fillStyle=red;ctx.lineWidth=lw;
    for(const seg of arrows){ctx.beginPath();let s=T(seg[0]);ctx.moveTo(s[0],s[1]);for(const q of seg.slice(1)){const t=T(q);ctx.lineTo(t[0],t[1])}ctx.stroke();
      const A=T(seg[Math.max(0,seg.length-3)]),B=T(seg[seg.length-1]),L=Math.hypot(B[0]-A[0],B[1]-A[1])||1,ux=(B[0]-A[0])/L,uy=(B[1]-A[1])/L,h=Math.max(6,.21*xh),w=h*.56;
      ctx.beginPath();ctx.moveTo(B[0]+ux*h*.35,B[1]+uy*h*.35);ctx.lineTo(B[0]-ux*h*.65-uy*w,B[1]-uy*h*.65+ux*w);ctx.lineTo(B[0]-ux*h*.65+uy*w,B[1]-uy*h*.65-ux*w);ctx.closePath();ctx.fill()}
    if(end){const e=T(end);ctx.beginPath();ctx.arc(e[0],e[1],Math.max(2.6,.085*xh),0,7);ctx.fill()}}
  const r=Math.max(6.8,.18*xh),placed=[];
  for(const[num,start]of marks){let[cx,cy]=T(start);
    for(let it=0;it<30;it++){const q=placed.find(q=>Math.hypot(cx-q[0],cy-q[1])<r*2.1);if(!q)break;let vx=cx-q[0],vy=cy-q[1],d=Math.hypot(vx,vy);if(d<1e-3){vx=-1;vy=-1;d=1.41}cx+=vx/d*r*.5;cy+=vy/d*r*.5}
    placed.push([cx,cy]);ctx.fillStyle=paper;ctx.beginPath();ctx.arc(cx,cy,r*1.2,0,7);ctx.fill();
    ctx.fillStyle=green;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();
    ctx.fillStyle="#fff";ctx.font=`700 ${r*1.38}px 'QS',sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(num,cx,cy+r*.05)}
  ctx.restore()}

