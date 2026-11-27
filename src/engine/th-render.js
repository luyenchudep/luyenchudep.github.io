/* ================== VẼ CHỮ MẪU TIỂU HỌC TỪ ĐƯỜNG TÂM NÉT ==================
   Kiểu Tiểu học không dùng phông: chữ mẫu vẽ từ đường tâm nét trong SC.CHU (docs/KIEN_TRUC.md mục 5.1.1).
   Chữ có dấu thanh được ghép lúc vẽ: chữ gốc + một nét dấu trong SC.STROKES (dausac, dauhuyen, dauhoi, daunga, daunang).
   Bộ vẽ chỉ chạy khi SCRIPT === "th"; hai kiểu kia không đổi gì.

   Các chỗ nối vào app: text(), mw(), arrowsOnText(), drawBasic() trong draw.js và layout.js gọi các hàm ở đây
   khi phông là "TH". DUCTUS (mũi tên, chấm đặt viết, So sánh) được dựng từ CHU lúc khởi động. */

/* Phông giả "TH": đơn vị chữ = cỡ chữ (x = 1); phần trên đường chân 2,5 đơn vị, phần dưới 1,5 */
FONTS.TH = { x: 1, asc: 2.5, desc: 1.5, slant: 0, fam: "TH", wt: 500 };   // trùng đường kẻ 5 ô li trên, 3 ô li dưới (cỡ Thường)
const TH_LA = () => SCRIPT === "th";
const laPhongTH = fam => (fam || SC.font) === "TH";

const TH_KHOANG_CHU = 0.3;   // khoảng giữa hai chữ trong một tiếng (đơn vị chữ); khi có nối chữ sẽ thay bằng nét nối
const TH_KHOANG_TIENG = 0.8; // khoảng giữa hai tiếng: rộng bằng một chữ o
const TH_DY_NANG = -0.5;   // dời ô dấu nặng xuống nửa đơn vị: chấm nằm khoảng 0,25 dưới đường chân
const TH_DAU = { "́": "dausac", "̀": "dauhuyen", "̉": "dauhoi", "̃": "daunga", "̣": "daunang" };
/* Vị trí ngang của âm chính để đặt dấu thanh (đơn vị chữ, tính từ mép trái chữ) */
const TH_TAM_DAU = { a: .4, "ă": .4, "â": .4, e: .38, "ê": .36, i: .28, o: .4, "ô": .4, "ơ": .4, u: .57, "ư": .57, y: .57 };

/* Dời một đường (danh sách lệnh M/L/C) đi (dx, dy) */
function thDoi(d, dx, dy) {
  return d.map(g => g[0] === "C" ? ["C", g[1] + dx, g[2] + dy, g[3] + dx, g[4] + dy, g[5] + dx, g[6] + dy] : [g[0], g[1] + dx, g[2] + dy]);
}
function thDinh(nets) { let t = 0; for (const n of nets) for (const g of n.d) for (let i = 2; i < g.length; i += 2) t = Math.max(t, g[i]); return t; }

/* Hình một chữ (đã ghép dấu thanh), tính theo đơn vị chữ, mép trái chữ ở x = 0. Không có hình thì trả null. */
const _thHinh = new Map();
function hinhChuTH(ch) {
  if (_thHinh.has(ch)) return _thHinh.get(ch);
  let kq = null;
  const tach = ch.normalize("NFD");
  let dau = null, goc = "", soDau = 0;
  for (const c of tach) { if (TH_DAU[c]) { dau = TH_DAU[c]; soDau++; } else goc += c; }
  goc = goc.normalize("NFC");
  /* Dấu thanh chỉ đặt trên nguyên âm, mỗi chữ một dấu */
  const mau = soDau > 1 || (dau && !/^[aăâeêioôơuưy]$/.test(goc)) ? null : SC.CHU && SC.CHU[goc];
  if (mau) {
    let nets = mau.cach[0].net.map(n => ({ d: n.d, dau: !!n.dau, lien: !!n.lien, loai: n.loai }));
    if (dau) {
      if (goc === "i" && dau !== "daunang") nets = nets.filter(n => n.loai !== "cham");   // ì, í, ỉ, ĩ: dấu thanh thay cho chấm; ị vẫn giữ chấm
      const nd = SC.STROKES[dau], tam = TH_TAM_DAU[goc] ?? mau.rong / 2;
      const dy = dau === "daunang" ? TH_DY_NANG : thDinh(nets) + 0.1;
      nets = nets.concat([{ d: thDoi(nd.d, tam - 0.25, dy), dau: true, lien: false, loai: dau }]);
    }
    kq = { rong: mau.rong, nets };
  }
  _thHinh.set(ch, kq);
  return kq;
}

/* Dàn một chuỗi: vị trí mép trái từng chữ (đơn vị chữ) và tổng bề rộng. Chữ chưa có hình được ghi vào TH_THIEU. */
const TH_THIEU = new Set();
const TH_DAU_CAU = ".,;:!?-–()\"'…";   // dấu câu: vẽ bằng phông giao diện, không có đường tâm nét
const TH_RONG_DAU_CAU = 0.35;
let _thBaoThieu = 0;
function baoThieuTH(ch) {
  if (TH_THIEU.has(ch)) return;
  TH_THIEU.add(ch);
  /* Báo một lần sau khi vẽ xong (không báo lúc đang xuất PDF chạy ngầm) */
  if (typeof toast === "function" && typeof document !== "undefined") {
    clearTimeout(_thBaoThieu);
    _thBaoThieu = setTimeout(() => toast(`Kiểu Tiểu học chưa có hình cho: ${[...TH_THIEU].join(" ")} (chữ hoa sẽ có ở bản sau). Các chữ này được bỏ qua.`), 400);
  }
}
function danChuoiTH(s) {
  const o = []; let x = 0, truoc = null;
  for (const ch of String(s ?? "").normalize("NFC")) {
    if (ch === "\r") continue;
    if (ch === " " || ch === "\u00A0" || ch === "\t" || ch === "\n") { x += TH_KHOANG_TIENG; truoc = null; continue; }
    if (TH_DAU_CAU.includes(ch)) { o.push({ ch, x, h: null, dauCau: true }); x += TH_RONG_DAU_CAU; truoc = null; continue; }
    const h = hinhChuTH(ch);
    if (!h) { baoThieuTH(ch); truoc = null; continue; }
    if (truoc) x += TH_KHOANG_CHU;
    o.push({ ch, x, h }); x += h.rong; truoc = h;
  }
  return { chu: o, rong: x };
}
function doRongTH(s) { return danChuoiTH(s).rong; }

/* Vẽ một đường tâm nét lên ctx: gốc chữ ở (x0, b), mỗi đơn vị chữ = xh điểm ảnh, y hướng lên */
function veDuongTH(ctx, d, x0, b, xh) {
  ctx.beginPath();
  for (const g of d) {
    if (g[0] === "M") ctx.moveTo(x0 + g[1] * xh, b - g[2] * xh);
    else if (g[0] === "L") ctx.lineTo(x0 + g[1] * xh, b - g[2] * xh);
    else ctx.bezierCurveTo(x0 + g[1] * xh, b - g[2] * xh, x0 + g[3] * xh, b - g[4] * xh, x0 + g[5] * xh, b - g[6] * xh);
  }
  ctx.stroke();
}
const thNgan = d => d.length === 2 && d[1][0] === "L" && Math.hypot(d[1][1] - d[0][1], d[1][2] - d[0][2]) < .06;   // chấm (VD chấm chữ i)
/* Kiểu vẽ: nét liền cho chữ mẫu; nét đứt cho dòng Tô */
function datNetTH(ctx, xh, color, dut) {
  ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.lineWidth = dut ? Math.max(1.6, xh * .07) : Math.max(2, xh * .085);
  ctx.setLineDash(dut ? [Math.max(3, xh * .16), Math.max(3, xh * .12)] : []);
}
function veChuoiTH(ctx, s, x, b, xh, color, dut) {
  ctx.save(); datNetTH(ctx, xh, color, dut);
  for (const c of danChuoiTH(s).chu) if (c.dauCau) {
    ctx.save(); ctx.setLineDash([]); ctx.fillStyle = color; ctx.font = `600 ${xh * .9}px 'QS',sans-serif`; ctx.textBaseline = "alphabetic"; ctx.fillText(c.ch, x + c.x * xh, b); ctx.restore();
  } else for (const n of c.h.nets) {
    if (dut && thNgan(n.d)) { ctx.setLineDash([]); veDuongTH(ctx, n.d, x + c.x * xh, b, xh); ctx.setLineDash([Math.max(3, xh * .16), Math.max(3, xh * .12)]); }
    else veDuongTH(ctx, n.d, x + c.x * xh, b, xh);
  }
  ctx.restore();
}
/* Nét cơ bản; riêng dấu thanh khi tập riêng thì đặt ở chỗ dấu nằm trên chữ (cao hơn thân chữ), dấu nặng dưới đường chân */
function duongNetCoBanTH(kind) {
  const st = SC.STROKES[kind]; if (!st) return null;
  return st.dau ? thDoi(st.d, 0, kind === "daunang" ? TH_DY_NANG : 1.1) : st.d;
}
function veNetCoBanTH(ctx, kind, x, b, xh, color, dut) {
  const d = duongNetCoBanTH(kind); if (!d) return;
  ctx.save(); datNetTH(ctx, xh, color, dut); veDuongTH(ctx, d, x, b, xh); ctx.restore();
}
function muiTenChuoiTH(ctx, s, x, b, xh) {
  for (const c of danChuoiTH(s).chu) if (!c.dauCau && DUCTUS[c.ch]) drawGuide(ctx, c.ch, x + c.x * xh, b, xh, themeName() === "dark");
}

/* ================== LƯỚI 4 Ô LI CỦA TIỂU HỌC ==================
   1 ô li = thân chữ / CO (cỡ Thường: CO = 2, nửa thân chữ; cỡ Nhỏ: CO = 1, bằng thân chữ). Nhờ vậy ô li của hai cỡ
   bằng nhau, chữ cỡ Nhỏ bằng nửa chữ cỡ Thường, giống vở thật.
   Mỗi dòng tập chiếm: cỡ Thường 8 ô li (5 trên đường chân, 3 dưới), cỡ Nhỏ 4 ô li (2,5 trên, 1,5 dưới), các dòng nối liền nhau.
   Đường kẻ ngang đậm cách nhau 4 ô li (một dòng vở), đường chân chữ luôn là đường đậm. */
const TH_O_LI_MM = 2;   // 1 ô li in ra = 2 mm
function thCo(z) { return (SC.CO && SC.CO[z]) || 2; }
function thDongOLi(co) { return co === 1 ? { tren: 2.5, cao: 4 } : { tren: 5, cao: 8 }; }
/* Khoảng cách hai dòng tập và vị trí đường chân trong dòng, tính theo thân chữ (đơn vị chữ) */
function thBuocDong(co) { const d = thDongOLi(co); return { unit: d.cao / co, up: d.tren / co }; }
function guidesTH(ctx, b, m, gx0, gx1) {
  const co = m.co || 2, ly = m.xh / co, d = thDongOLi(co);
  const top = b - d.tren * ly, bot = top + d.cao * ly;
  if (S.xBand && T.xBand) { ctx.fillStyle = T.xBand; ctx.fillRect(gx0, b - m.xh, gx1 - gx0, m.xh); }
  ctx.save(); ctx.setLineDash([]);
  ctx.strokeStyle = T.slant; ctx.lineWidth = 0.85; ctx.beginPath();
  for (let x = gx0; x <= gx1 + .01; x += ly) { ctx.moveTo(x, top); ctx.lineTo(x, bot); }
  for (let k = Math.ceil(-(d.cao - d.tren)); k <= Math.floor(d.tren); k++) { if (k % 4 === 0) continue; const y = b - k * ly; ctx.moveTo(gx0, y); ctx.lineTo(gx1, y); }
  ctx.stroke();
  ctx.strokeStyle = T.asc; ctx.lineWidth = 1.05; ctx.beginPath();
  for (let x = gx0; x <= gx1 + .01; x += ly * 4) { ctx.moveTo(x, top); ctx.lineTo(x, bot); }
  ctx.stroke();
  ctx.strokeStyle = T.base; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let k = Math.ceil(-(d.cao - d.tren)); k <= Math.floor(d.tren); k++) { if (k % 4 !== 0) continue; const y = b - k * ly; ctx.moveTo(gx0, y); ctx.lineTo(gx1, y); }
  ctx.stroke(); ctx.restore();
}
/* Số đo chữ cho tập viết PDF: thân chữ tính từ mm thật (1 ô li = 2 mm), không theo cỡ màn hình */
function sizeForTHPdf(l, pxMoiMm) {
  const co = thCo(l.z), xh = TH_O_LI_MM * co * pxMoiMm, F = FONTS.TH;
  return { xh, fs: xh, asc: xh * F.asc, desc: xh * F.desc, tan: 0, fam: "TH", F, co };
}

/* DUCTUS cho Tiểu học: mỗi nét một lượt, lấy điểm cách đều dọc đường tâm nét (samplePath ở draw.js) */
function thLayDiem(d) {
  const p = samplePath(d), o = [p[0]]; let acc = 0;
  for (let i = 1; i < p.length; i++) { acc += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc >= .12 || i === p.length - 1) { o.push(p[i]); acc = 0; } }
  return o.map(([a, c]) => [Math.round(a * 1000) / 1000, Math.round(c * 1000) / 1000]);
}
function dungDuctusTH() {
  if (!TH_LA()) return;
  const them = (ch, nets) => { DUCTUS[ch] = nets.map(n => ({ r: [thLayDiem(n.d)], s: -1, ...(n.dau ? { mark: 1 } : {}) })); };
  const goc = Object.keys(SC.CHU);
  for (const c of goc) {
    them(c, hinhChuTH(c).nets);
    if (/^[aăâeêioôơuưy]$/.test(c)) for (const dau of Object.keys(TH_DAU)) { const ch = (c + dau).normalize("NFC"); const h = hinhChuTH(ch); if (h) them(ch, h.nets); }
  }
  for (const k of Object.keys(SC.STROKES)) DUCTUS["~" + k] = [{ r: [thLayDiem(duongNetCoBanTH(k))], s: -1 }];
}
dungDuctusTH();
