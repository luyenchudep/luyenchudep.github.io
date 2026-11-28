/* ================== BẢNG CHỌN & CÀI ĐẶT ================== */
let animRAF=0,animInitT=0;
function stopAnim(){if(typeof animState!=="undefined")animState.playing=false;if(animRAF){cancelAnimationFrame(animRAF);animRAF=0}if(animInitT){clearTimeout(animInitT);animInitT=0}if(typeof quiz!=="undefined"){if(quiz.timer){clearTimeout(quiz.timer);quiz.timer=0}quiz.live=null;quiz.hint=null}}
var pdfBusyFlag=false;
function closeSheets(){if(pdfBusyFlag){toast("Đang tạo PDF — chờ xong rồi đóng");return}
  const cardEl=document.getElementById("card"),fromCard=cardEl&&cardEl.classList.contains("open");
  const jumpKey=fromCard?cardTarget():null;
  stopAnim();clearArm=false;closePop();document.querySelectorAll(".sheet").forEach(s=>s.classList.remove("open"));
  if(jumpKey)jumpToItem(jumpKey);}
function openSheet(id,keepScroll=false){
  const el=document.getElementById(id),box=el.querySelector(".box");
  const wasOpen=el.classList.contains("open"),prevTop=wasOpen?box.scrollTop:0;
  if(!wasOpen)closeSheets();
  el.classList.add("open");
  box.scrollTop=(keepScroll&&wasOpen)?prevTop:0;
}
function seg(label,key,opts){return `<div class="row"><span>${label}</span><div class="seg">${opts.map(([v,t])=>`<button class="${S[key]===v?"on":""}" data-action="datCaiDat" data-khoa="${escHtml(key)}" data-gt="${escHtml(typeof v==="boolean"?(v?"1":"0"):v)}"${typeof v==="boolean"?' data-loai="bool"':typeof v==="number"?' data-loai="so"':""}>${t}</button>`).join("")}</div></div>`}
/* Hành động cho các nút chọn cài đặt */
HANH_DONG.datCaiDat=el=>{const l=el.dataset.loai,g=el.dataset.gt;setS(el.dataset.khoa,l==="bool"?g==="1":l==="so"?+g:g)};
function ckIcon(id){return done.has(id)?`<span class="ck d">${ic("done")}</span>`:`<span class="ck o"><svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg></span>`}
let menuOpenGrp;
function grp(id,icon,title,body){return `<details class="grp" ${menuOpenGrp.has(id)?"open":""} data-mo="moNhomCaiDat" data-id="${escHtml(id)}"><summary>${ic(icon)}${title}</summary>${body}</details>`}
/* Hành động đóng mở nhóm cài đặt */
HANH_DONG.moNhomCaiDat=el=>{el.open?menuOpenGrp.add(el.dataset.id):menuOpenGrp.delete(el.dataset.id)};
let menuTab="bai",partOpen=null,sidePartOpen=null;menuOpenGrp=new Set(["hien"]);
function curPartName(){if(cur.li<NREAL)return LESSONS[cur.li].part;const p=COURSE.find(p=>p.lessons.some(x=>!done.has(x.id)));return(p||COURSE[0]).part}
function partBlock(p,openSet,setName,liStyle){
  const n=p.lessons.length,k=p.lessons.filter(l=>done.has(l.id)).length,isCur=cur.li<NREAL&&LESSONS[cur.li].part===p.part;
  let h=`<details class="part ${isCur?"cur":""}" data-p="${escHtml(p.part)}" data-tap="${escHtml(setName)}" ${openSet.has(p.part)?"open":""} data-mo="moPhanBai"><summary><span class="pn">${p.part}</span><span class="pc ${k===n?"full":""}">${k}/${n}</span></summary>`;
  for(const l of p.lessons){const idx=LESSONS.indexOf(l);
    h+=`<div class="li ${idx===cur.li?"cur":""}" data-action="moBai" data-i="${idx}">${ckIcon(l.id)}<span>${idx+1}. ${l.t}</span>${liStyle?"":`<span class="sz">${({L:"cỡ lớn",M:"cỡ vừa",S:"cỡ nhỏ",thuong:"cỡ thường",nho:"cỡ nhỏ"}[l.z]||"")}</span><button type="button" class="liPdf" data-action="pdfBai" data-id="${escHtml(l.id)}" aria-label="Xuất PDF bài này" title="Xuất PDF bài này">${ic("download")}</button>`}</div>`}
  return h+`</details>`}
/* Hành động đóng mở phần bài, mở bài và xuất PDF bài trong mục lục */
HANH_DONG.moPhanBai=el=>{const s=el.dataset.tap==="sidePartOpen"?sidePartOpen:partOpen;if(s)s[el.open?"add":"delete"](el.dataset.p)};
HANH_DONG.moBai=el=>openLesson(+el.dataset.i);
function setMenuTab(t){menuTab=t;openMenu(true);const b=document.getElementById("menuBox");if(b)b.scrollTop=0}
function openMenu(keepScroll=false){
  closePop();
  if(!keepScroll){menuTab="bai";partOpen=new Set([curPartName()])}
  if(!partOpen)partOpen=new Set([curPartName()]);
  const real=LESSONS.slice(0,NREAL),n=real.filter(l=>l.id!=="free").length,k=[...done].filter(id=>real.some(l=>l.id===id&&id!=="free")).length;
  const due=dueItems().length,toolAlert=due>0||paperDue();
  let h=`<div class="mHead"><h3>${menuTab==="cai"?"Hồ sơ":"Giáo trình"}</h3><div class="seg">${DS_KIEU_CHU.map(([v,t,m])=>`<button class="${SCRIPT===v?"on":""}" title="${m||t}" data-action="chonKieuChu" data-kieu="${escHtml(v)}">${t}</button>`).join("")}</div></div>`;
  /* Chuyển giữa Giáo trình và Hồ sơ bằng thanh 4 khu (bản 0.14) */
  if(menuTab!=="cai"){
    const tile=(icon,title,sub,act,badge)=>`<button class="tile" data-action="${escHtml(act)}">${ic(icon)}<b>${title}</b><small>${sub}</small>${badge?`<span class="badge">${badge}</span>`:""}</button>`;
    h+=`<div class="tiles">`+
      tile("review","Bài ôn","viết theo trí nhớ","moBaiOn",due?due+" chữ":"")+
      tile("target","Luyện thêm",WEAK.length?WEAK.length+" mục cần luyện":"chữ chấm chưa đạt","moLuyenThem","")+
      tile("edit","Bài tự do","tự soạn nội dung","moTuDo","")+
      tile("sign","Tên và chữ ký","luyện tên riêng","moTenRieng","")+
      tile("book","Nhập môn","lý thuyết rèn chữ","moNhapMon","")+
    `</div>`;
    h+=`<div class="prog" style="margin-bottom:4px">${SC.name} · đã tập ${k}/${n} bài</div><div class="bar"><div style="width:${Math.round(k/n*100)}%"></div></div>`;
    h+=`<button class="hero" data-action="batDauBuoi"><span class="hIc">${ic("play")}</span><span><b>${sess?"Bắt đầu lại buổi tập":"Buổi tập hôm nay"}</b><small>15 phút · khởi động, bài mới, bài ôn</small></span></button>`;
    for(const p of COURSE)h+=partBlock(p,partOpen,"partOpen",false);
  }else if(false){
    const tile=(icon,title,sub,act,badge)=>`<button class="tile" data-action="${escHtml(act)}">${ic(icon)}<b>${title}</b><small>${sub}</small>${badge?`<span class="badge">${badge}</span>`:""}</button>`;
    h+=`<div class="tiles">`+
      tile("review","Bài ôn","viết theo trí nhớ","moBaiOn",due?due+" chữ":"")+
      tile("target","Luyện thêm",WEAK.length?WEAK.length+" mục cần luyện":"chữ chấm chưa đạt","moLuyenThem","")+
      tile("camera","Kiểm tra trên giấy","2 tuần một lần","moKiemTraGiay",paperDue()?"tới hạn":"")+
      tile("book","Nhập môn","lý thuyết rèn chữ","moNhapMon","")+
      tile("sign","Tên và chữ ký","luyện tên riêng","moTenRieng","")+
      tile("edit","Bài tự do","tự soạn nội dung","moTuDo","")+
      tile("journal","Nhật ký luyện chữ","mỗi ngày một trang","moNhatKy","")+
      tile("download","Tạo tập viết PDF","A4, A5, máy đọc sách, tự gõ","moTaoPdf","")+
    `</div>`;
  }else{
    const tile2=(icon,title,sub,act,badge)=>`<button class="tile" data-action="${escHtml(act)}">${ic(icon)}<b>${title}</b><small>${sub}</small>${badge?`<span class="badge">${badge}</span>`:""}</button>`;
    h+=`<div class="prog" style="margin-bottom:4px">${escHtml(SC.name)} · đã tập ${k}/${n} bài</div><div class="bar"><div style="width:${Math.round(k/n*100)}%"></div></div>`;
    h+=`<div class="tiles">`+tile2("journal","Nhật ký luyện chữ","mỗi ngày một trang","moNhatKy","")+tile2("camera","Kiểm tra trên giấy","2 tuần một lần","moKiemTraGiay",paperDue()?"tới hạn":"")+`</div>`;
    h+=grp("hien","sliders","Hiển thị",
      `<div class="row"><span>Màu giấy</span><div class="seg">${[["sepia","Ấm"],["light","Sáng"],["dark","Tối"],["eink","Trắng đen"]].map(([v,t])=>`<button class="${S.theme===v?"on":""}" data-action="chonMauGiay" data-mau="${escHtml(v)}">${t}</button>`).join("")}</div></div>`+
      seg("Màu nhấn","accent",[["blue","Xanh mực"],["black","Đen"]])+
      `<div class="row"><span>Cỡ dòng kẻ</span><div class="stepRow" style="min-width:190px"><button data-action="doiCoDong" data-d="-1" aria-label="Thu nhỏ cỡ dòng">${ic("minus")}</button><b>${Math.round(S.scale*100)}%</b><button data-action="doiCoDong" data-d="1" aria-label="Phóng to cỡ dòng">${ic("plus")}</button></div></div>`+
      (SCRIPT==="th"?"":seg("Kiểu dòng kẻ","gridStyle",[["french","Lưới xiên Pháp"],["oly4","4 ô li Việt Nam"]]))+
      seg("Tô dải màu thân chữ","xBand",[[true,"Bật"],[false,"Tắt"]])+
      seg("Độ đậm chữ tô","trace",[["normal","Vừa"],["dark","Đậm"]])+
      seg("Kiểu mũi tên","arrowStyle",[["simple","Đơn giản"],["full","Chi tiết"]])+
      seg("Mũi tên trên dòng tập","rowArrows",[[true,"Bật"],[false,"Tắt"]])+
      seg("Đo độ nghiêng","measure",[[true,"Bật"],[false,"Tắt"]]));
    h+=grp("but","pen","S Pen và thao tác",
      `<div class="row"><span>Thanh viết yêu thích trên trang</span><div class="seg"><button class="${S.favBar?"on":""}" data-action="batThanhVietYeuThich" data-bat="1">Hiện</button><button class="${!S.favBar?"on":""}" data-action="batThanhVietYeuThich" data-bat="0">Ẩn</button></div></div>`+
      `<div class="prog" style="margin:4px 0 6px">Không cần hiện: nhấn giữ nút Viết ở thanh dưới là chọn nhanh được 4 viết yêu thích.</div>`+
      `<div class="row"><span>Nút trên thân S Pen</span><div class="seg">${[["eraser","Gôm"],["undo","Hoàn tác"],["fav","Đổi viết"]].map(([v,t])=>`<button class="${(S.sideBtn||"eraser")===v?"on":""}" data-action="chonNutThanPen" data-gt="${escHtml(v)}">${t}</button>`).join("")}</div></div>`+
      seg("Chỉ nhận S Pen","penOnly",[[true,"Bật"],[false,"Tắt"]])+
      `<div class="row"><span>Phóng to trang giấy</span><div class="seg"><button class="${view.z<=1.01?"on":""}" data-action="mucPhongTrang" data-z="1">100%</button><button class="${view.z>1.01&&view.z<1.75?"on":""}" data-action="mucPhongTrang" data-z="1.5">150%</button><button class="${view.z>=1.75?"on":""}" data-action="mucPhongTrang" data-z="2">200%</button></div></div>`+
      seg("Vuốt ngón tay lật trang","fingerSwipe",[[true,"Bật"],[false,"Tắt"]])+
      `<div class="prog" style="margin:4px 0 6px">Nên tắt vuốt ngón tay để khi tựa tay viết không bị nhảy trang.</div>`+
      seg("Dự đoán nét (giảm độ trễ)","predict",[[true,"Bật"],[false,"Tắt"]])+
      seg("Hiện chấm khi rê viết","hover",[[true,"Bật"],[false,"Tắt"]])+
      seg("Hộp viết tự trượt khi tới mép","autoAdv",[[true,"Bật"],[false,"Tắt"]])+
      seg("Âm thanh giấy khi viết","sound",[[true,"Bật"],[false,"Tắt"]])+
      seg("Chế độ tay trái","leftHand",[[true,"Bật"],[false,"Tắt"]])+
      `<div class="row"><span>Nét bám sát đầu viết</span><div class="seg"><button class="${S.lowLat?"on":""}" data-action="batDoTreThap" data-bat="1">Bật</button><button class="${!S.lowLat?"on":""}" data-action="batDoTreThap" data-bat="0">Tắt</button></div></div>
      <div class="prog" style="margin:4px 0 8px">Nếu vùng viết bị đen hoặc chớp nháy, bạn tắt mục này.</div>
      <button class="btn ghost" data-action="kiemTraSPen">${ic("pulse")}Kiểm tra S Pen</button><div style="height:12px"></div>`);
    h+=grp("du","data","Dữ liệu",
      `<button class="btn ghost" data-action="saoLuuFile">${ic("download")}Sao lưu bài viết ra file</button>
      <button class="btn ghost" data-action="chonFileKhoiPhuc">${ic("upload")}Khôi phục từ file sao lưu</button>
      ${window.self===window.top?`<button class="btn ghost" data-action="luuHinhPng">${ic("image")}Lưu trang này thành hình (PNG)</button>`:""}<div style="height:12px"></div>`);
    h+=`<p class="ver" style="text-align:center;color:var(--muted);font-size:13px;margin:16px 0 4px">${VERSION}</p>`;
  }
  h+=`<button class="btn" data-action="dongBang">Về trang viết</button>`;
  document.getElementById("menuBox").innerHTML=h;openSheet("menu",keepScroll);
  if(!keepScroll&&menuTab==="bai")setTimeout(()=>{const c=document.querySelector("#menuBox .li.cur");if(c){const b=document.getElementById("menuBox"),r=c.getBoundingClientRect(),br=b.getBoundingClientRect();if(r.bottom>br.bottom-20)c.scrollIntoView({block:"center"})}},30);
}
/* Hành động cho các nút trong bảng Giáo trình và Hồ sơ */
HANH_DONG.chonKieuChu=el=>setScript(el.dataset.kieu);
HANH_DONG.moBaiOn=()=>openLesson(REVIEW_I,"nho");
HANH_DONG.moLuyenThem=()=>openLesson(LUYEN_I,"to");
HANH_DONG.moTuDo=()=>openCustom();
HANH_DONG.moTenRieng=()=>openNameLab();
HANH_DONG.moNhapMon=()=>openNhapMon();
HANH_DONG.moKiemTraGiay=()=>openPaper();
HANH_DONG.moNhatKy=()=>openJournal();
HANH_DONG.moTaoPdf=()=>openPdfModal();
HANH_DONG.batDauBuoi=()=>sessStart();
HANH_DONG.chonMauGiay=el=>{setTheme(el.dataset.mau);openMenu(true)};
HANH_DONG.doiCoDong=el=>{stepScale(+el.dataset.d);openMenu(true)};
HANH_DONG.batThanhVietYeuThich=el=>{setPen("favBar",el.dataset.bat==="1",false);openMenu(true)};
HANH_DONG.chonNutThanPen=el=>{setPen("sideBtn",el.dataset.gt,false);openMenu(true)};
HANH_DONG.mucPhongTrang=el=>{closeSheets();setZoomLevel(+el.dataset.z)};
HANH_DONG.batDoTreThap=el=>setLowLat(el.dataset.bat==="1");
HANH_DONG.kiemTraSPen=()=>openPenTest();
HANH_DONG.saoLuuFile=()=>backup();
HANH_DONG.chonFileKhoiPhuc=()=>document.getElementById("restoreFile").click();
HANH_DONG.luuHinhPng=()=>savePng();
function setS(k,v){S[k]=v;saveS();if(k==="leftHand"||k==="accent")applyTheme();if(["scale","trace","rowArrows","measure","arrowStyle","xBand","gridStyle"].includes(k))show();openMenu(true)}
function openCustom(){closeSheets();document.getElementById("customText").value=store.get("custom","");
  const pb=document.getElementById("customPrevBtn");if(pb)pb.style.display=store.get("customPrev","").trim()?"block":"none";
  document.getElementById("custom").classList.add("open")}
function restoreCustomPrev(){document.getElementById("customText").value=store.get("customPrev","");toast("Đã lấy lại nội dung trước — chạm “Lưu và tập” để dùng")}
function saveCustom(){store.set("custom",document.getElementById("customText").value);closeSheets();const i=LESSONS.findIndex(l=>l.id==="free");if(i>=0)openLesson(i)}

