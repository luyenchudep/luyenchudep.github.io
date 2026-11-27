/* ================== KIỂU CHỮ ================== */
const GS={get(k,d){try{const v=localStorage.getItem("td1:"+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{localStorage.setItem("td1:"+k,JSON.stringify(v));return true}catch(e){return false}}};
/* Ba kiểu chữ: td (Thanh đậm), qs (Nét đều), th (Sao Mai Tập Viết, chữ tiểu học). Mỗi kiểu lưu bài và tiến độ riêng theo tiền tố PFX. */
const KIEU_CHU=["td","qs","th"];
const SCRIPT=(v=>KIEU_CHU.includes(v)?v:"td")(GS.get("script","td")),SC=SCRIPTS[SCRIPT],PFX=SCRIPT+"1:";
/* [mã, tên trên nút, mô tả hiện khi đưa chuột vào nút và dưới nút khi đang chọn] */
const DS_KIEU_CHU=[["td","Thanh đậm"],["qs","Nét đều 10°"],["th","Sao Mai","Sao Mai Tập Viết · chữ tiểu học theo mẫu của Bộ Giáo dục"]];
const COURSE=SCRIPT==="th"&&!TH_DU_BAI?SC.COURSE.map(p=>({...p,lessons:p.lessons.filter(l=>!/^th-(g|v|nh)\d/.test(l.id))})).filter(p=>p.lessons.length):SC.COURSE,STROKES=SC.STROKES,DUCTUS=SC.DUCTUS,SOTAY=SC.SOTAY,NHAPMON=SC.NHAPMON,WORDS=SC.WORDS;
function setScript(v){if(v===SCRIPT)return;GS.set("script",v);location.reload()}
function drawGuide(ctx,ch,x,b,xh,dark){(S.arrowStyle==="full"?drawArrows:drawSimple)(ctx,ch,x,b,xh,dark)}
const LESSONS=[];COURSE.forEach(p=>p.lessons.forEach(l=>{l.part=p.part;LESSONS.push(l)}));
const NREAL=LESSONS.length,REVIEW_I=NREAL,LUYEN_I=NREAL+1;
const Z_MAC_DINH=SCRIPT==="th"?"thuong":"L";
const REVIEW={id:"review",t:"Bài ôn",part:"Ôn tập",z:Z_MAC_DINH,note:"Không có chữ mẫu · đọc tên chữ ở cuối dòng, viết theo trí nhớ rồi chạm So sánh.",rows:[]};
LESSONS.push(REVIEW);
const LUYEN={id:"luyen",t:"Luyện thêm",part:"Ôn tập",z:Z_MAC_DINH,note:"Những chữ bạn tự chấm “Luyện thêm”. Hết trang cuối, chạm Sau › để thêm một vòng.",rows:[]};
LESSONS.push(LUYEN);
const STROKE_NAME={up:"nét lên mảnh",down:"nét xuống đậm",updown:"lên mảnh – xuống đậm",under:"móc dưới",over:"móc trên",compound:"móc hai đầu",oval:"vòng bầu dục",c:"nét cong",asc:"khuyết trên",desc:"khuyết dưới",
  tall:"nét sổ dài",short:"nét sổ ngắn",flat:"nét ngang",slash:"nét xiên trái",back:"nét xiên phải",v:"nét xiên chữ v",o:"vòng tròn",rc:"nét cong phải",u:"nét móc dưới",n:"nét móc trên",hook:"nét móc đuôi"};
if(SCRIPT==="qs")STROKE_NAME.c="nét cong trái";
if(SCRIPT==="th")for(const k in STROKES)STROKE_NAME[k]=STROKES[k].ten.toLowerCase();

