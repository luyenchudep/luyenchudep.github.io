/*
  Vẽ thêm nét khuyết trên cho chữ l, h, k của phông Pinyon Script (chữ thanh đậm), cho đúng kiểu viết thanh đậm truyền thống.

  Cách chạy (từ thư mục gốc của repo):
    npm install --prefix tools/font
    node tools/font/khuyet-pinyon.js

  Đầu vào: bản gốc trong tools/font/goc/ (không sửa):
    PinyonScript-manhinh.woff2  phông hiển thị trên màn hình (401 chữ, có bảng căn khoảng GPOS)
    PinyonScript-pdf.ttf        phông nhúng vào file PDF (341 chữ)
  Đầu ra: thay phông PS trong src/style/fonts.css (dạng WOFF) và src/data/pdff.js (TrueType nén zlib).

  Cách vẽ khuyết: lấy phần khuyết trên của chính chữ b trong Pinyon (nét lên thanh, nét xuống đậm), bỏ phần thân thẳng
  của l, h, k từ đường Y0 trở lên, rồi ghép phần khuyết vào cho thân chữ nối liền (thư viện Clipper). Bề ngang chữ,
  khoảng cách giữa các chữ và mọi chữ khác giữ nguyên. Chạy lại bao nhiêu lần cũng ra cùng kết quả vì luôn đi từ bản gốc.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const opentype = require('opentype.js');
const ClipperLib = require('clipper-lib');

const GOC = path.resolve(__dirname, '..', '..');
const THU_MUC_GOC = path.join(__dirname, 'goc');
const Y0 = 700;        // đường cắt (đơn vị phông, 2048/em): thân chữ từ đây trở lên được thay bằng phần khuyết của b
const DEM = 30;        // nới dải thân chữ cần bỏ mỗi bên
const S = 4;           // nhân tọa độ cho Clipper (Clipper làm việc trên số nguyên)
const CHU = ['l', 'h', 'k'];

/* ================== ĐỌC WOFF2 (chỉ phần cần: bảng thường và bảng glyf đã biến đổi) ================== */
const TEN_BANG = ['cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill'];
function docWoff2(w) {
  if (w.toString('latin1', 0, 4) !== 'wOF2') throw new Error('Không phải WOFF2');
  const n = w.readUInt16BE(12); let o = 48; const ds = [];
  const base128 = () => { let v = 0; for (let k = 0; k < 5; k++) { const b = w[o++]; v = v * 128 + (b & 127); if (!(b & 128)) return v; } throw new Error('UIntBase128 hỏng'); };
  for (let i = 0; i < n; i++) {
    const fl = w[o++]; let tag;
    if ((fl & 63) === 63) { tag = w.toString('latin1', o, o + 4); o += 4; } else tag = TEN_BANG[fl & 63];
    const tv = (fl >> 6) & 3, goc = base128(); let dai = goc, bienDoi = false;
    if ((tag === 'glyf' || tag === 'loca') ? tv === 0 : tv !== 0) { dai = base128(); bienDoi = true; }
    if (bienDoi && tag === 'hmtx') throw new Error('Chưa hỗ trợ hmtx biến đổi');
    ds.push({ tag, goc, dai, bienDoi });
  }
  const nen = w.readUInt32BE(20), du = zlib.brotliDecompressSync(w.slice(o, o + nen));
  let p = 0; const bang = {};
  for (const e of ds) { bang[e.tag] = du.slice(p, p + e.dai); p += e.dai; }
  const glyf = ds.find(e => e.tag === 'glyf');
  if (glyf && glyf.bienDoi) { const { glyf: g, loca, indexFormat } = dungGlyf(bang.glyf); bang.glyf = g; bang.loca = loca; bang.head = Buffer.from(bang.head); bang.head.writeInt16BE(indexFormat, 50); }
  return bang;
}
/* Dựng lại bảng glyf từ dạng biến đổi của WOFF2 (đặc tả WOFF2 mục 5) */
function dungGlyf(b) {
  let o = 0; const u16 = () => { const v = b.readUInt16BE(o); o += 2; return v; }, u32 = () => { const v = b.readUInt32BE(o); o += 4; return v; };
  u16(); const optionFlags = u16(), numGlyphs = u16(), indexFormat = u16();
  const kt = []; for (let i = 0; i < 7; i++) kt.push(u32());
  const luong = []; for (const k of kt) { luong.push({ b: b.slice(o, o + k), o: 0 }); o += k; }
  const [sContour, sPoints, sFlag, sGlyph, sComp, sBbox, sInstr] = luong;
  if (optionFlags & 1) throw new Error('Chưa hỗ trợ overlapSimpleBitmap');
  const r16 = s => { const v = s.b.readInt16BE(s.o); s.o += 2; return v; }, ru16 = s => { const v = s.b.readUInt16BE(s.o); s.o += 2; return v; }, r8 = s => s.b[s.o++];
  const r255 = s => { const c = r8(s); if (c === 253) return ru16(s); if (c === 255) return r8(s) + 253; if (c === 254) return r8(s) + 506; return c; };
  const bboxBits = sBbox.b.slice(0, ((numGlyphs + 31) >> 5) << 2); sBbox.o = bboxBits.length;
  const coBbox = i => (bboxBits[i >> 3] >> (7 - (i & 7))) & 1;
  const glyphs = [];
  for (let i = 0; i < numGlyphs; i++) {
    const nc = r16(sContour);
    if (nc === 0) { glyphs.push(Buffer.alloc(0)); continue; }
    if (nc === -1) {   /* chữ ghép */
      const bb = [r16(sBbox), r16(sBbox), r16(sBbox), r16(sBbox)];
      const dau = sComp.o; let flags, coLenh = false;
      do {
        flags = ru16(sComp); ru16(sComp); sComp.o += (flags & 1) ? 4 : 2;
        if (flags & 8) sComp.o += 2; else if (flags & 0x40) sComp.o += 4; else if (flags & 0x80) sComp.o += 8;
        if (flags & 0x100) coLenh = true;
      } while (flags & 0x20);
      const phan = sComp.b.slice(dau, sComp.o); let lenh = Buffer.alloc(0), lenhDai = Buffer.alloc(0);
      if (coLenh) { const n = r255(sGlyph); lenh = sInstr.b.slice(sInstr.o, sInstr.o + n); sInstr.o += n; lenhDai = Buffer.alloc(2); lenhDai.writeUInt16BE(n); }
      const h = Buffer.alloc(10); h.writeInt16BE(-1, 0); bb.forEach((v, k) => h.writeInt16BE(v, 2 + 2 * k));
      glyphs.push(Buffer.concat([h, phan, lenhDai, lenh])); continue;
    }
    const soDiem = []; for (let c = 0; c < nc; c++) soDiem.push(r255(sPoints));
    const tong = soDiem.reduce((a, v) => a + v, 0), diem = []; let x = 0, y = 0;
    for (let k = 0; k < tong; k++) {
      const fl = r8(sFlag), f = fl & 127, tren = !(fl & 128); let dx, dy;
      const dau = (ff, v) => (ff & 1) ? v : -v, gb = sGlyph.b; let i0 = sGlyph.o;
      if (f < 10) { dx = 0; dy = dau(f, ((f & 14) << 7) + gb[i0]); sGlyph.o += 1; }
      else if (f < 20) { dx = dau(f, (((f - 10) & 14) << 7) + gb[i0]); dy = 0; sGlyph.o += 1; }
      else if (f < 84) { const b0 = f - 20, b1 = gb[i0]; dx = dau(f, 1 + (b0 & 0x30) + (b1 >> 4)); dy = dau(f >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f)); sGlyph.o += 1; }
      else if (f < 120) { const b0 = f - 84; dx = dau(f, 1 + (Math.floor(b0 / 12) << 8) + gb[i0]); dy = dau(f >> 1, 1 + (((b0 % 12) >> 2) << 8) + gb[i0 + 1]); sGlyph.o += 2; }
      else if (f < 124) { const b2 = gb[i0 + 1]; dx = dau(f, (gb[i0] << 4) + (b2 >> 4)); dy = dau(f >> 1, ((b2 & 0x0f) << 8) + gb[i0 + 2]); sGlyph.o += 3; }
      else { dx = dau(f, (gb[i0] << 8) + gb[i0 + 1]); dy = dau(f >> 1, (gb[i0 + 2] << 8) + gb[i0 + 3]); sGlyph.o += 4; }
      x += dx; y += dy; diem.push({ x, y, tren });
    }
    const nLenh = r255(sGlyph), lenh = sInstr.b.slice(sInstr.o, sInstr.o + nLenh); sInstr.o += nLenh;
    const bb = coBbox(i) ? [r16(sBbox), r16(sBbox), r16(sBbox), r16(sBbox)] : null;
    const vien = []; let k0 = 0; for (const n of soDiem) { vien.push(diem.slice(k0, k0 + n)); k0 += n; }
    glyphs.push(maHoaChuDon(vien, lenh, bb));
  }
  return { ...ghepGlyf(glyphs, indexFormat), indexFormat };
}

/* ================== GHI BẢNG glyf, loca VÀ CẢ FILE PHÔNG ================== */
/* Mã hóa một chữ đơn (simple glyph). vien: mảng đường viền, mỗi đường là mảng {x, y, tren} (tren = điểm nằm trên đường cong) */
function maHoaChuDon(vien, lenh = Buffer.alloc(0), bb = null) {
  const ds = vien.flat();
  if (!bb) { bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const p of ds) { bb[0] = Math.min(bb[0], p.x); bb[1] = Math.min(bb[1], p.y); bb[2] = Math.max(bb[2], p.x); bb[3] = Math.max(bb[3], p.y); } }
  const dau = Buffer.alloc(10 + 2 * vien.length + 2);
  dau.writeInt16BE(vien.length, 0); bb.forEach((v, k) => dau.writeInt16BE(v, 2 + 2 * k));
  let cuoi = -1; vien.forEach((v, k) => { cuoi += v.length; dau.writeUInt16BE(cuoi, 10 + 2 * k); });
  dau.writeUInt16BE(lenh.length, 10 + 2 * vien.length);
  const co = [], xs = [], ys = []; let px = 0, py = 0;
  for (const p of ds) {
    let f = p.tren ? 1 : 0; const dx = p.x - px, dy = p.y - py; px = p.x; py = p.y;
    if (dx === 0) f |= 0x10; else if (Math.abs(dx) < 256) { f |= 0x02 | (dx > 0 ? 0x10 : 0); xs.push(Math.abs(dx)); } else { const t = Buffer.alloc(2); t.writeInt16BE(dx); xs.push(t[0], t[1]); }
    if (dy === 0) f |= 0x20; else if (Math.abs(dy) < 256) { f |= 0x04 | (dy > 0 ? 0x20 : 0); ys.push(Math.abs(dy)); } else { const t = Buffer.alloc(2); t.writeInt16BE(dy); ys.push(t[0], t[1]); }
    co.push(f);
  }
  return Buffer.concat([dau, lenh, Buffer.from(co), Buffer.from(xs), Buffer.from(ys)]);
}
function ghepGlyf(glyphs, indexFormat) {
  const phan = [], loca = []; let o = 0;
  for (const g of glyphs) { loca.push(o); let d = g; if (d.length % 4) d = Buffer.concat([d, Buffer.alloc(4 - d.length % 4)]); phan.push(d); o += d.length; }
  loca.push(o);
  const lb = Buffer.alloc(loca.length * (indexFormat ? 4 : 2));
  loca.forEach((v, i) => indexFormat ? lb.writeUInt32BE(v, 4 * i) : lb.writeUInt16BE(v / 2, 2 * i));
  if (!indexFormat && o / 2 > 0xffff) throw new Error('Bảng glyf quá lớn cho loca dạng ngắn');
  return { glyf: Buffer.concat(phan), loca: lb };
}
function docSfnt(f) { const n = f.readUInt16BE(4), bang = {}; for (let i = 0; i < n; i++) { const q = 12 + 16 * i; bang[f.toString('latin1', q, q + 4)] = f.slice(f.readUInt32BE(q + 8), f.readUInt32BE(q + 8) + f.readUInt32BE(q + 12)); } return bang; }
const tongKiem = b => { let s = 0; const d = b.length % 4 ? Buffer.concat([b, Buffer.alloc(4 - b.length % 4)]) : b; for (let i = 0; i < d.length; i += 4) s = (s + d.readUInt32BE(i)) >>> 0; return s; };
function ghiSfnt(bang) {
  const tags = Object.keys(bang).sort(), n = tags.length;
  let es = 1, sh = 0; while (es * 2 <= n) { es *= 2; sh++; }
  const dau = Buffer.alloc(12 + 16 * n); dau.writeUInt32BE(0x00010000, 0); dau.writeUInt16BE(n, 4); dau.writeUInt16BE(es * 16, 6); dau.writeUInt16BE(sh, 8); dau.writeUInt16BE(n * 16 - es * 16, 10);
  const head = Buffer.from(bang.head); head.writeUInt32BE(0, 8); bang.head = head;
  let o = dau.length; const phan = [];
  tags.forEach((t, i) => { const d = bang[t], q = 12 + 16 * i; dau.write(t, q, 'latin1'); dau.writeUInt32BE(tongKiem(d), q + 4); dau.writeUInt32BE(o, q + 8); dau.writeUInt32BE(d.length, q + 12);
    const dd = d.length % 4 ? Buffer.concat([d, Buffer.alloc(4 - d.length % 4)]) : d; phan.push(dd); o += dd.length; });
  const ra = Buffer.concat([dau, ...phan]);
  const vt = 12 + 16 * tags.indexOf('head'), oHead = dau.readUInt32BE(vt + 8);
  ra.writeUInt32BE((0xB1B0AFBA - tongKiem(ra)) >>> 0, oHead + 8);
  return ra;
}
/* WOFF (bản 1): mỗi bảng nén zlib riêng; trình duyệt nào cũng đọc được */
function ghiWoff(sfnt) {
  const bang = docSfnt(sfnt), tags = Object.keys(bang).sort(), n = tags.length;
  const dau = Buffer.alloc(44 + 20 * n); let o = dau.length; const phan = [];
  tags.forEach((t, i) => { const g = bang[t], z = zlib.deflateSync(g, { level: 9 }), d = z.length < g.length ? z : g, q = 44 + 20 * i;
    dau.write(t, q, 'latin1'); dau.writeUInt32BE(o, q + 4); dau.writeUInt32BE(d.length, q + 8); dau.writeUInt32BE(g.length, q + 12); dau.writeUInt32BE(tongKiem(g), q + 16);
    const dd = d.length % 4 ? Buffer.concat([d, Buffer.alloc(4 - d.length % 4)]) : d; phan.push(dd); o += dd.length; });
  dau.write('wOFF', 0, 'latin1'); dau.writeUInt32BE(0x00010000, 4); dau.writeUInt32BE(o, 8); dau.writeUInt16BE(n, 12); dau.writeUInt32BE(sfnt.length, 16); dau.writeUInt16BE(1, 20);
  return Buffer.concat([dau, ...phan]);
}

/* ================== VẼ KHUYẾT ================== */
function daGiac(g) {
  const ra = []; let cur = [], px = 0, py = 0;
  const day = (x, y) => cur.push({ X: Math.round(x * S), Y: Math.round(y * S) });
  for (const c of g.path.commands) {
    if (c.type === 'M') { if (cur.length) ra.push(cur); cur = []; day(c.x, c.y); }
    else if (c.type === 'L') day(c.x, c.y);
    else if (c.type === 'Q') { for (let i = 1; i <= 8; i++) { const t = i / 8, a = (1 - t) ** 2, b = 2 * (1 - t) * t, d = t * t; day(a * px + b * c.x1 + d * c.x, a * py + b * c.y1 + d * c.y); } }
    else if (c.type === 'C') { for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; day(u ** 3 * px + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t ** 3 * c.x, u ** 3 * py + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t ** 3 * c.y); } }
    else if (c.type === 'Z') { if (cur.length) ra.push(cur); cur = []; }
    if (c.x != null) { px = c.x; py = c.y; }
  }
  if (cur.length) ra.push(cur);
  return ra;
}
function phep(a, b, loai) { const c = new ClipperLib.Clipper(); c.AddPaths(a, ClipperLib.PolyType.ptSubject, true); c.AddPaths(b, ClipperLib.PolyType.ptClip, true); const o = new ClipperLib.Paths(); c.Execute(loai, o, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero); return o; }
const CT = ClipperLib.ClipType;
function khoang(ps, y) { const xs = []; for (const p of ps) for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; if ((a.Y > y * S) !== (b.Y > y * S)) xs.push((a.X + (y * S - a.Y) * (b.X - a.X) / (b.Y - a.Y)) / S); } xs.sort((a, b) => a - b); const r = []; for (let i = 0; i + 1 < xs.length; i += 2) r.push([xs[i], xs[i + 1]]); return r; }
const nuaPhang = (y0, y1) => [[{ X: -1e6, Y: y0 * S }, { X: 1e6, Y: y0 * S }, { X: 1e6, Y: y1 * S }, { X: -1e6, Y: y1 * S }]];

/* Trả về các đường viền mới của chữ ch: thân thẳng từ Y0 trở lên được thay bằng phần khuyết của b */
function chuCoKhuyet(font, ch) {
  const B = daGiac(font.charToGlyph('b')), U = phep(B, nuaPhang(Y0, 4000), CT.ctIntersection);
  const [b0] = khoang(B, Y0), tamB = (b0[0] + b0[1]) / 2;
  const P = daGiac(font.charToGlyph(ch)), [s0] = khoang(P, Y0), [s1] = khoang(P, 1500);
  const dx = (s0[0] + s0[1]) / 2 - tamB, k = (s1[0] - s0[0]) / (1500 - Y0);
  const L = y => s0[0] - DEM + (y - Y0) * k, R = y => s0[1] + DEM + (y - Y0) * k;
  const dai = [[{ X: L(Y0), Y: Y0 }, { X: R(Y0), Y: Y0 }, { X: R(2000), Y: 2000 }, { X: L(2000), Y: 2000 }].map(q => ({ X: Math.round(q.X * S), Y: Math.round(q.Y * S) }))];
  const duoi = phep(P, dai, CT.ctDifference), Ud = U.map(p => p.map(q => ({ X: q.X + Math.round(dx * S), Y: q.Y })));
  let ra = phep(duoi, Ud, CT.ctUnion);
  ra = ClipperLib.Clipper.CleanPolygons(ra, 0.6 * S);
  /* TrueType: đường viền ngoài đi chiều kim đồng hồ (trục y hướng lên). Clipper trả về đường ngoài có diện tích dương. */
  return ra.map(p => { const q = p.map(v => ({ x: Math.round(v.X / S), y: Math.round(v.Y / S), tren: true })); return q.reverse(); })
           .map(q => q.filter((v, i) => i === 0 || v.x !== q[i - 1].x || v.y !== q[i - 1].y));
}

/* Thay chữ l, h, k trong một phông (dạng bảng) và cập nhật maxp, head */
function suaPhong(bang) {
  const sf = ghiSfnt({ ...bang }), font = opentype.parse(sf.buffer.slice(sf.byteOffset, sf.byteOffset + sf.length));
  const head = Buffer.from(bang.head), maxp = Buffer.from(bang.maxp), fmt = head.readInt16BE(50), n = maxp.readUInt16BE(4);
  const loca = []; for (let i = 0; i <= n; i++) loca.push(fmt ? bang.loca.readUInt32BE(4 * i) : bang.loca.readUInt16BE(2 * i) * 2);
  const glyphs = []; for (let i = 0; i < n; i++) glyphs.push(bang.glyf.slice(loca[i], loca[i + 1]));
  let maxPts = maxp.readUInt16BE(6), maxCt = maxp.readUInt16BE(8);
  for (const ch of CHU) {
    const g = font.charToGlyph(ch), vien = chuCoKhuyet(font, ch);
    glyphs[g.index] = maHoaChuDon(vien);
    maxPts = Math.max(maxPts, vien.flat().length); maxCt = Math.max(maxCt, vien.length);
    console.log(`  ${ch} (chữ số ${g.index}): ${vien.length} đường viền, ${vien.flat().length} điểm`);
  }
  maxp.writeUInt16BE(maxPts, 6); maxp.writeUInt16BE(maxCt, 8);
  const { glyf, loca: lb } = ghepGlyf(glyphs, fmt);
  return { ...bang, glyf, loca: lb, maxp, head };
}

/* ================== CHẠY ================== */
function thayChuoi(f, mau, moi) { const t = fs.readFileSync(f, 'utf8'); if (!mau.test(t)) throw new Error('Không thấy chỗ cần thay trong ' + f); fs.writeFileSync(f, t.replace(mau, moi)); }

console.log('Phông màn hình (WOFF2 → WOFF):');
const manHinh = ghiWoff(ghiSfnt(suaPhong(docWoff2(fs.readFileSync(path.join(THU_MUC_GOC, 'PinyonScript-manhinh.woff2'))))));
thayChuoi(path.join(GOC, 'src/style/fonts.css'), /(font-family:'PS';[^}]*?src:url\()data:font\/woff2?;base64,[A-Za-z0-9+/=]+\) format\('woff2?'\)/,
  `$1data:font/woff;base64,${manHinh.toString('base64')}) format('woff')`);
console.log(`  → src/style/fonts.css (${(manHinh.length / 1024).toFixed(1)} KB)`);

console.log('Phông PDF (TrueType):');
const pdf = ghiSfnt(suaPhong(docSfnt(fs.readFileSync(path.join(THU_MUC_GOC, 'PinyonScript-pdf.ttf')))));
const z = zlib.deflateSync(pdf, { level: 9 }).toString('base64');
const fPdf = path.join(GOC, 'src/data/pdff.js'); let t = fs.readFileSync(fPdf, 'utf8');
const iPS = t.indexOf('"PS": {'), iAL = t.indexOf('"AL": {', iPS); if (iPS < 0 || iAL < 0) throw new Error('Không thấy phông PS trong pdff.js');
let ps = t.slice(iPS, iAL);
ps = ps.replace(/"len": \d+/, `"len": ${pdf.length}`).replace(/"z": "[A-Za-z0-9+/=]+"/, `"z": "${z}"`);
fs.writeFileSync(fPdf, t.slice(0, iPS) + ps + t.slice(iAL));
console.log(`  → src/data/pdff.js (${(pdf.length / 1024).toFixed(1)} KB chưa nén)`);
