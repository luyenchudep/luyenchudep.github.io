/* ================== ĐO NÉT VIẾT (công thức hình học, không dùng AI) ================== */
let lastMetrics=null;
function resamplePts(pts,N=24){
  if(!pts||pts.length<2)return [];
  const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
  const tot=cum[cum.length-1]||1,out=[];
  for(let k=0;k<N;k++){
    const d=(k/(N-1))*tot;let j=1;while(j<cum.length-1&&cum[j]<d)j++;
    const seg=cum[j]-cum[j-1]||1,t=(d-cum[j-1])/seg;
    out.push([pts[j-1][0]+(pts[j][0]-pts[j-1][0])*t,pts[j-1][1]+(pts[j][1]-pts[j-1][1])*t]);
  }
  return out;
}
/* So hình chữ bằng khoảng cách hai chiều giữa hai tập điểm (không phụ thuộc thứ tự hay chiều nét) */
const SHAPE_K=180;
function shapeSet(list,N=48){
  const L=list.filter(p=>p&&p.length).map(p=>{let l=0;for(let i=1;i<p.length;i++)l+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return [p,l]});
  const tot=L.reduce((a,x)=>a+x[1],0);if(!L.length)return null;
  let pts=[];for(const [p,l] of L){if(p.length===1||l<1e-6){pts.push(p[0]);continue}pts=pts.concat(resamplePts(p,Math.max(2,Math.round(N*l/(tot||1)))))}
  if(pts.length<4)return null;
  const cx=pts.reduce((a,q)=>a+q[0],0)/pts.length,cy=pts.reduce((a,q)=>a+q[1],0)/pts.length;
  const sc=Math.sqrt(pts.reduce((a,q)=>a+(q[0]-cx)**2+(q[1]-cy)**2,0)/pts.length)||1;
  return pts.map(q=>[(q[0]-cx)/sc,(q[1]-cy)/sc]);
}
function chamfer(A,B){
  const one=(P,Q)=>{let t=0;for(const p of P){let mn=1e9;for(const q of Q){const d=(p[0]-q[0])**2+(p[1]-q[1])**2;if(d<mn)mn=d}t+=Math.sqrt(mn)}return t/P.length};
  return (one(A,B)+one(B,A))/2;
}
function scoreGeometry(){
  if(!layout||!pages[cur.page])return null;
  const {m,padT,unit,up,padL}=layout,rows=pages[cur.page];
  let matched=0,scoreSum=0,baseErrSum=0,baseCnt=0;
  const validStrokes=strokes.filter(s=>strokeType(s)!=="marker"&&s.p.length>=3);
  if(!validStrokes.length)return null;
  rows.forEach((row,ri)=>{
    const b=padT+ri*unit+up*m.fs;
    const rs=validStrokes.filter(s=>{
      const ys=s.p.map(q=>q[1]),midY=(Math.min(...ys)+Math.max(...ys))/2;
      return Math.abs(midY-(SCRIPT==="th"?b-thTamDong(up,unit,m.fs):b-m.xh*0.5))<unit*0.48;
    });
    if(!rs.length)return;
    for(const s of rs){
      const maxY=Math.max(...s.p.map(q=>q[1]));
      if(maxY>b-m.xh*0.35&&maxY<b+m.desc*0.45){baseErrSum+=Math.abs(maxY-b)/m.xh;baseCnt++}
    }
    const sym=row.k==="stroke"||row.k==="sdots"?"~"+row.s:(row.src&&row.src.k==="stroke"?"~"+row.src.s:(row.s&&[...row.s].length===1?row.s:(row.src&&row.src.s&&[...row.src.s].length===1?row.src.s:null)));
    if(!sym||!DUCTUS[sym])return;
    const refSet=shapeSet(DUCTUS[sym].flatMap(st=>st.r.map(r=>aCatmull(r,8))));
    if(!refSet)return;
    /* gom nét thành từng chữ theo vùng ngang (chỉ để tách chữ, không dùng thứ tự nét khi so) */
    const sorted=rs.slice().sort((a,b)=>Math.min(...a.p.map(q=>q[0]))-Math.min(...b.p.map(q=>q[0])));
    const clusters=[];
    for(const s of sorted){
      const xMin=Math.min(...s.p.map(q=>q[0])),xMax=Math.max(...s.p.map(q=>q[0]));
      const last=clusters[clusters.length-1];
      if(last&&xMin<=last.xMax+m.xh*0.45){last.list.push(s.p);last.xMax=Math.max(last.xMax,xMax)}
      else clusters.push({list:[s.p],xMin,xMax});
    }
    for(const cl of clusters){
      if(cl.list.reduce((a,p)=>a+p.length,0)<5)continue;
      const uSet=shapeSet(cl.list.map(p=>p.map(q=>[(q[0]-padL)/m.xh,(b-q[1])/m.xh])));
      if(!uSet)continue;
      const s0=Math.max(30,Math.min(100,Math.round(100-Math.max(0,chamfer(uSet,refSet)-.04)*SHAPE_K)));
      scoreSum+=s0;matched++;
    }
  });
  return {
    shapeScore:matched?Math.round(scoreSum/matched):null,
    matchedCount:matched,
    baseDrift:baseCnt?Math.round((baseErrSum/baseCnt)*100):null
  };
}
function measure(){
  const el=document.getElementById("meas"),l=LESSONS[cur.li];
  if(!S.measure||!layout||l.f==="AL"){el.classList.remove("on");lastMetrics=null;return}
  const xh=layout.m.xh,target=90-fontOf(l).slant;
  let dW=0,dN=0,uW=0,uN=0,pSum=0,pCnt=0,jerkSum=0,jerkCnt=0;
  const angles=[];
  for(const s of strokes){
    if(strokeType(s)==="marker")continue;
    const p=s.p;let run=[];
    for(let i=0;i<p.length;i++){pSum+=(p[i][2]||.5)/(s.pf||.72);pCnt++}
    for(let i=2;i<p.length;i++){
      const d1x=p[i-1][0]-p[i-2][0],d1y=p[i-1][1]-p[i-2][1],d2x=p[i][0]-p[i-1][0],d2y=p[i][1]-p[i-1][1];
      const l1=Math.hypot(d1x,d1y),l2=Math.hypot(d2x,d2y);
      if(l1>0.8&&l2>0.8){const cos=Math.max(-1,Math.min(1,(d1x*d2x+d1y*d2y)/(l1*l2)));jerkSum+=(1-cos);jerkCnt++}
    }
    const flush=()=>{if(run.length>2){const a=run[0],b=run[run.length-1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(L>xh*.55&&b[1]>a[1]){const ang=Math.atan2(b[1]-a[1],a[0]-b[0])*180/Math.PI;if(ang>20&&ang<160)angles.push([ang,L])}}run=[]};
    for(let i=1;i<p.length;i++){const down=p[i][1]-p[i-1][1]>0.2;
      if(s.pr){const w=segW(s,(p[i][2]+p[i-1][2])/2,((p[i][3]||0)+(p[i-1][3]||0))/2);if(down){dW+=w;dN++}else if(p[i][1]-p[i-1][1]<-0.2){uW+=w;uN++}}
      if(down){if(!run.length)run.push(p[i-1]);run.push(p[i])}else flush()}
    flush();
  }
  const wSum=angles.reduce((a,x)=>a+x[1],0);
  if(wSum<xh*1.8){el.classList.remove("on");lastMetrics=null;return}
  const mean=angles.reduce((a,x)=>a+x[0]*x[1],0)/wSum;
  const variance=angles.reduce((a,x)=>a+x[1]*(x[0]-mean)**2,0)/wSum;
  const sd=Math.sqrt(variance);
  const ang=Math.round(mean),ratio=uN&&dN?(dW/dN)/(uW/uN):0,diff=ang-target;
  const avgP=pCnt?pSum/pCnt:0.5;
  const fluency=jerkCnt?Math.max(40,Math.min(100,Math.round(100-(jerkSum/jerkCnt)*180))):85;
  const geo=scoreGeometry();
  const slantScore=Math.max(20,Math.min(100,Math.round(100-Math.abs(diff)*3.2-sd*2.6)));
  const totalScore=geo&&geo.shapeScore?Math.round(geo.shapeScore*0.45+slantScore*0.35+fluency*0.2):Math.round(slantScore*0.65+fluency*0.35);
  lastMetrics={ang,target:Math.round(target),diff,sd:Math.round(sd*10)/10,ratio,avgP,fluency,geo,slantScore,totalScore};
  const sdTxt=`±${lastMetrics.sd}°`;
  el.innerHTML=`${ic("chart")}<b>${totalScore}đ</b> · Nghiêng ${ang}° (${sdTxt})${Math.abs(diff)<=5&&sd<=6?" ✓":diff>5?(SCRIPT==="th"?" · ngả trái":" · đứng"):diff<-5?(SCRIPT==="th"?" · ngả phải":" · ngả"):" · chưa đều"}`+(ratio?` · ${ratio.toFixed(1).replace(".",",")}×`:"");
  el.classList.add("on");
}
function openScoreReport(){
  if(!lastMetrics){toast("Bạn viết vài chữ trước để ứng dụng phân tích nha");return}
  const m=lastMetrics,box=document.getElementById("genBox");
  const tips=[];
  if(Math.abs(m.diff)>5&&SCRIPT==="th")tips.push(m.diff>0?`Nét đang ngả qua trái (${m.ang}° so với ${m.target}°): giữ thân chữ thẳng đứng theo đường kẻ dọc.`:`Nét đang ngả qua phải (${m.ang}° so với ${m.target}°): giữ thân chữ thẳng đứng theo đường kẻ dọc.`);
  else if(Math.abs(m.diff)>5)tips.push(m.diff>0?`Độ nghiêng trung bình đang đứng hơn mẫu (${m.ang}° so với ${m.target}°) — thử xoay nhẹ máy qua trái.`:`Nét đang nghiêng nhiều hơn mẫu (${m.ang}° so với ${m.target}°).`);
  if(m.sd>6.5)tips.push(`Góc nghiêng các nét chênh nhau ±${m.sd}° (nên trong khoảng 5°): có nét đứng, có nét nghiêng. Bạn để mắt canh theo các đường xiên mờ.`);
  if(m.avgP>1)tips.push(`Bạn đang nhấn mạnh hơn mức cần để ra nét đậm (${Math.round(m.avgP*100)}% mức vừa tay). Nhấn nhẹ lại cho đỡ mỏi tay và đỡ mòn ngòi viết.`);
  if(m.fluency<72)tips.push(`Nét viết hơi khựng (${m.fluency}/100) — bạn đưa tay đều hơn thay vì “vẽ” chậm từng đoạn ngắn.`);
  if(m.geo&&m.geo.baseDrift!=null&&m.geo.baseDrift>18)tips.push(`Chân chữ lệch đường chân trung bình ${m.geo.baseDrift}% thân chữ — chú ý chạm đúng đường chân đậm.`);
  if(!tips.length)tips.push("Nhịp tay rất đều, góc nghiêng chuẩn và lực nhấn vừa tay. Cứ giữ nhịp này nha!");
  box.innerHTML=`<h3>${ic("chart")} Phân tích nét viết và dáng chữ</h3>
  <div class="scoreGrid">
    <div class="scCard"><b>${m.totalScore}/100</b><span>Tổng điểm trang</span></div>
    <div class="scCard"><b>${m.ang}° <small style="font-size:14px">±${m.sd}°</small></b><span>Độ nghiêng (mẫu ${m.target}°)</span></div>
    <div class="scCard"><b>${m.geo&&m.geo.shapeScore?m.geo.shapeScore+"/100":"—"}</b><span>Khớp đường nét mẫu</span></div>
    <div class="scCard"><b>${m.fluency}/100</b><span>Độ mượt nét viết</span></div>
  </div>
  <div class="kv">
    <b>Độ đều góc nghiêng</b>${m.sd<=5?"Rất đều ✓":m.sd<=8?"Khá đều":"Chưa đều (cần bám đường xiên)"}<br>
    <b>Tỉ lệ đậm / mảnh</b>${m.ratio?m.ratio.toFixed(2).replace(".",",")+"×":"(Chế độ nét đều)"}<br>
    <b>Lực nhấn trung bình</b>${Math.round(m.avgP*100)}% mức vừa tay ${m.avgP>1?"(Hơi gồng tay)":"(Thả lỏng tốt ✓)"}<br>
    <b>Bám đường chân</b>${m.geo&&m.geo.baseDrift!=null?`Lệch ${m.geo.baseDrift}% thân chữ`:"Chưa đủ dữ liệu"}
  </div>
  <h4>Gợi ý điều chỉnh tay viết</h4><ul>${tips.map(t=>`<li>${t}</li>`).join("")}</ul>
  <button class="btn primary" onclick="closeSheets()">Tiếp tục tập</button>`;
  openSheet("gen");
}

