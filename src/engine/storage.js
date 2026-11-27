/* ================== LƯU TRỮ & CÀI ĐẶT 46+ ================== */
const store={get(k,d){try{const v=localStorage.getItem(PFX+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{localStorage.setItem(PFX+k,JSON.stringify(v));return true}catch(e){toast("Bộ nhớ trình duyệt đã đầy — bạn sao lưu rồi xóa bớt bài cũ");return false}}};
const PEN_TYPES=[
  {id:"fountain",name:"Viết máy",sub:"Thanh đậm lực nhấn",ic:"fountain",defW:2.4,pr:true},
  {id:"callig",name:"Ngòi vát",sub:"Thư pháp vát góc",ic:"callig",defW:4.2,pr:true},
  {id:"gel",name:"Viết gel",sub:"Nét đều sắc gọn",ic:"gel",defW:2.0,pr:false},
  {id:"brush",name:"Viết lông",sub:"Mềm mượt · nghiêng",ic:"brush",defW:4.8,pr:true},
  {id:"pencil",name:"Viết chì",sub:"Nghiêng đổ bóng",ic:"pencil",defW:2.4,pr:true},
  {id:"marker",name:"Dạ quang",sub:"Đánh dấu trong suốt",ic:"marker",defW:10.0,pr:false}
];
const PEN_MAP=Object.fromEntries(PEN_TYPES.map(p=>[p.id,p]));
const INK_META=[
  ["k","Đen tuyền"],["nb","Xanh đen"],["b","Xanh học trò"],["p","Mực tím"],
  ["r","Đỏ son"],["bd","Đỏ rượu"],["g","Xanh rêu"],["tl","Xanh ngọc"],
  ["br","Nâu mực"],["or","Cam đất"],["y","Vàng chanh"],["pk","Hồng"]
];
const WIDTH_PRESETS=[0.8,1.2,1.8,2.4,3.2,4.5,6.5,10];
const DEFAULT_FAVS=SCRIPT==="td"?[
  {name:"Lá tre",penType:"fountain",color:"nb",width:2.6,contrast:"nib",pressure:true,nibAngle:38},
  {name:"Mực tím",penType:"fountain",color:"p",width:2.4,contrast:"med",pressure:true,nibAngle:38},
  {name:"Ngòi vát",penType:"callig",color:"br",width:4.2,contrast:"med",pressure:true,nibAngle:38},
  {name:"Chấm đỏ",penType:"gel",color:"r",width:1.8,contrast:"soft",pressure:false,nibAngle:38}
]:[
  {name:"Gel đen",penType:"gel",color:"k",width:2.2,contrast:"soft",pressure:false,nibAngle:38},
  {name:"Mực tím",penType:"gel",color:"p",width:2.2,contrast:"soft",pressure:false,nibAngle:38},
  {name:"Viết chì",penType:"pencil",color:"k",width:2.4,contrast:"med",pressure:true,nibAngle:38},
  {name:"Dạ quang",penType:"marker",color:"y",width:10,contrast:"soft",pressure:false,nibAngle:38}
];

const PENK=["penType","pressure","width","contrast","color","nibAngle","tiltOn","stab","favs","activeFav","targetFav"],gset=GS.get("settings",{});if(SCRIPT!=="td")PENK.forEach(k=>delete gset[k]);
const S=Object.assign({
  scale:1.25,trace:"dark",penOnly:true,theme:"sepia",lowLat:true,
  rowArrows:false,arrowStyle:"simple",measure:true,predict:true,hover:true,
  xBand:true,fingerSwipe:false,eraseMode:"part",eraserR:16,
  penType:SCRIPT==="td"?"fountain":"gel",nibAngle:38,tiltOn:true,stab:0.32,sens:"vua",pFull:.38,
  sideBtn:"eraser",favBar:true,activeFav:0,targetFav:0,gridStyle:"french",leftHand:false,sound:false,split:true,autoAdv:true,
  favs:DEFAULT_FAVS.map(f=>Object.assign({},f))
},SC.pen,gset,store.get("pen",{}));
if(!Array.isArray(S.favs)||S.favs.length!==4)S.favs=DEFAULT_FAVS.map(f=>Object.assign({},f));
const FAV_RENAME={"Bi nước đen":"Gel đen","Bút chì":"Viết chì","Bút máy":"Viết máy","Bút lông":"Viết lông","Bút bi nước":"Viết gel"};
for(const f of S.favs)if(f&&FAV_RENAME[f.name])f.name=FAV_RENAME[f.name];
if(S.accent!=="black")S.accent="blue";
if(!PEN_MAP[S.penType])S.penType=SCRIPT==="td"?"fountain":"gel";
// Nâng cấp mặc định nhẹ cho người dùng bản cũ chưa chọn màu giấy
if(!GS.get("v31Init",false)){
  if(gset.theme==="auto"||!gset.theme)S.theme="sepia";
  if(!gset.scale||gset.scale===1)S.scale=1.25;
  if(!gset.trace)S.trace="dark";
  saveS();GS.set("v31Init",true);
}
function saveS(){const g=GS.get("settings",{}),p={};for(const k in S){if(PENK.includes(k)){p[k]=S[k];if(SCRIPT!=="td")continue}g[k]=S[k]}GS.set("settings",g);store.set("pen",p)}

const THEMES={
 sepia:{
   paper:"#F7F2E7",xBand:"rgba(24,78,158,.065)",slant:"#E2D8C5",asc:"#C3B49B",xh:"#8C7C66",base:"#463B2F",desc:"#C3B49B",
   model:"#1A1612",hint:"#52473B",cmp:"rgba(201,28,23,.52)",
   trace:{normal:"#8B7F6E",dark:"#63584A"},
   ink:{k:"#1A1612",nb:"#14284B",b:"#1B4DB8",p:"#5B2C86",r:"#C41E19",bd:"#7A1B2E",g:"#1E5B37",tl:"#0F6C72",br:"#5C3820",or:"#C65A11",y:"#F5CE1B",pk:"#C83E74"}
 },
 light:{
   paper:"#FFFFFF",xBand:"rgba(26,86,176,.055)",slant:"#E2E2E2",asc:"#BEBEBE",xh:"#8C8C8C",base:"#333333",desc:"#BEBEBE",
   model:"#111111",hint:"#4A4A4A",cmp:"rgba(201,28,23,.5)",
   trace:{normal:"#8C8C8C",dark:"#606060"},
   ink:{k:"#161616",nb:"#12264A",b:"#1A4EC2",p:"#5E2D8F",r:"#C81E1A",bd:"#7D192E",g:"#1B5E36",tl:"#0D6F75",br:"#603B22",or:"#CC5C10",y:"#F8D318",pk:"#CC3D76"}
 },
 dark:{
   paper:"#1B1E23",xBand:"rgba(130,180,255,.075)",slant:"#2E343D",asc:"#464E59",xh:"#687280",base:"#B8C0CC",desc:"#464E59",
   model:"#F2EFE9",hint:"#B5BAC2",cmp:"rgba(255,120,112,.56)",
   trace:{normal:"#757E8B",dark:"#9AA4B2"},
   ink:{k:"#F2EFE9",nb:"#8EB5F0",b:"#6EA8FF",p:"#C792FF",r:"#FF7870",bd:"#E5738A",g:"#6AD991",tl:"#5FD6DD",br:"#D9A378",or:"#FF9F5A",y:"#FFE45E",pk:"#FF85B8"}
 },
 eink:{
   paper:"#FFFFFF",xBand:null,slant:"#D0D0D0",asc:"#999999",xh:"#666666",base:"#000000",desc:"#999999",
   model:"#000000",hint:"#222222",cmp:"rgba(0,0,0,.45)",
   trace:{normal:"#888888",dark:"#555555"},
   ink:{k:"#000000",nb:"#000000",b:"#111111",p:"#222222",r:"#333333",bd:"#222222",g:"#222222",tl:"#222222",br:"#333333",or:"#444444",y:"#BBBBBB",pk:"#444444"}
 }
};
const mq=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
function themeName(){
  if(S.theme==="auto")return(mq&&mq.matches?"dark":"sepia");
  return THEMES[S.theme]?S.theme:"sepia";
}
let T=THEMES[themeName()];
function inkColor(c){if(c&&c[0]==="#")return c;return T.ink[c]||T.ink.k}
let done=new Set(store.get("done",[]));
let cur=Object.assign({li:0,page:0,mode:"to"},store.get("last",{}));
if(!(cur.li>=0&&cur.li<LESSONS.length))cur={li:0,page:0,mode:"to"};
let comparing=false,focusOn=false;

