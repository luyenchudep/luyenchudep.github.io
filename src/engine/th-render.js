/* ================== VẼ CHỮ MẪU TIỂU HỌC TỪ ĐƯỜNG TÂM NÉT ==================
   Kiểu Tiểu học không dùng phông: chữ mẫu vẽ từ đường tâm nét trong SC.CHU (docs/KIEN_TRUC.md mục 5.1.1).
   Chữ có dấu thanh được ghép lúc vẽ: chữ gốc + một nét dấu trong SC.STROKES (dausac, dauhuyen, dauhoi, daunga, daunang).
   Bộ vẽ chỉ chạy khi SCRIPT === "th"; hai kiểu kia không đổi gì.

   Các chỗ nối vào app: text(), mw(), arrowsOnText(), drawBasic() trong draw.js và layout.js gọi các hàm ở đây
   khi phông là "TH". DUCTUS (mũi tên, chấm đặt viết, So sánh) được dựng từ CHU lúc khởi động. */

/* Phông giả "TH": đơn vị chữ = cỡ chữ (x = 1); phần trên đường chân tới 2,6 đơn vị (chữ cao 2,5 và dấu), phần dưới 1,6 */
FONTS.TH = { x: 1, asc: 2.6, desc: 1.6, slant: 0, fam: "TH", wt: 500 };
const TH_LA = () => SCRIPT === "th";
const laPhongTH = fam => (fam || SC.font) === "TH";

const TH_KHOANG_CHU = 0.3;   // khoảng giữa hai chữ trong một tiếng (đơn vị chữ); khi có nối chữ sẽ thay bằng nét nối
const TH_KHOANG_TIENG = 0.8; // khoảng giữa hai tiếng: rộng bằng một chữ o
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
  let dau = null, goc = "";
  for (const c of tach) { if (TH_DAU[c]) dau = TH_DAU[c]; else goc += c; }
  goc = goc.normalize("NFC");
  const mau = SC.CHU && SC.CHU[goc];
  if (mau) {
    let nets = mau.cach[0].net.map(n => ({ d: n.d, dau: !!n.dau, lien: !!n.lien, loai: n.loai }));
    if (dau) {
      if (goc === "i") nets = nets.filter(n => n.loai !== "cham");   // ì, í, ỉ, ĩ, ị: dấu thanh thay cho chấm
      const nd = SC.STROKES[dau], tam = TH_TAM_DAU[goc] ?? mau.rong / 2;
      const dy = dau === "daunang" ? -0.65 : thDinh(nets) + 0.1;
      nets = nets.concat([{ d: thDoi(nd.d, tam - 0.25, dy), dau: true, lien: false, loai: dau }]);
    }
    kq = { rong: mau.rong, nets };
  }
  _thHinh.set(ch, kq);
  return kq;
}

/* Dàn một chuỗi: vị trí mép trái từng chữ (đơn vị chữ) và tổng bề rộng. Chữ chưa có hình được ghi vào TH_THIEU. */
const TH_THIEU = new Set();
function danChuoiTH(s) {
  const o = []; let x = 0, truoc = null;
  for (const ch of String(s).normalize("NFC")) {
    if (ch === " ") { x += TH_KHOANG_TIENG; truoc = null; continue; }
    const h = hinhChuTH(ch);
    if (!h) { TH_THIEU.add(ch); x += 0.5; truoc = null; continue; }
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
  for (const c of danChuoiTH(s).chu) for (const n of c.h.nets) {
    if (dut && thNgan(n.d)) { ctx.setLineDash([]); veDuongTH(ctx, n.d, x + c.x * xh, b, xh); ctx.setLineDash([Math.max(3, xh * .16), Math.max(3, xh * .12)]); }
    else veDuongTH(ctx, n.d, x + c.x * xh, b, xh);
  }
  ctx.restore();
}
/* Nét cơ bản; riêng dấu thanh khi tập riêng thì đặt ở chỗ dấu nằm trên chữ (cao hơn thân chữ), dấu nặng dưới đường chân */
function duongNetCoBanTH(kind) {
  const st = SC.STROKES[kind]; if (!st) return null;
  return st.dau ? thDoi(st.d, 0, kind === "daunang" ? -0.65 : 1.1) : st.d;
}
function veNetCoBanTH(ctx, kind, x, b, xh, color, dut) {
  const d = duongNetCoBanTH(kind); if (!d) return;
  ctx.save(); datNetTH(ctx, xh, color, dut); veDuongTH(ctx, d, x, b, xh); ctx.restore();
}
function muiTenChuoiTH(ctx, s, x, b, xh) {
  for (const c of danChuoiTH(s).chu) if (DUCTUS[c.ch]) drawGuide(ctx, c.ch, x + c.x * xh, b, xh, themeName() === "dark");
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
