#!/usr/bin/env node
/*
  Kiểm tra dữ liệu giáo trình Tiểu học (src/data/scripts-th.js) và bộ vẽ đường tâm nét (src/engine/th-render.js).

  Cách chạy (từ thư mục gốc của repo):
    node tools/kiem-tieuhoc.js

  Công cụ đọc các file nguồn, chạy trong một ngữ cảnh vm tách biệt và thực hiện 12 phép kiểm:
    1. Cấu trúc nét vẽ và tham số lệnh M/L/C trong SC.CHU.
    2. Tính hợp lệ của mã loại nét (loai) trong SC.CHU.
    3. Hình chữ và vị trí dấu thanh qua hinhChuTH (29 chữ thường, 10 chữ số, 60 chữ có dấu thanh).
    4. Không có ký tự thiếu trong SC.COURSE (dòng rep, pair, kể cả bài đang ẩn) và SC.WORDS.
    5. Bảng hướng dẫn nét viết DUCTUS sau khi chạy dungDuctusTH().
    6. Hàm đo độ rộng doRongTH.
    7. Mã nét trong các dòng stroke của SC.COURSE.
    8. Phủ đủ 29 chữ thường trong dòng rep của đúng một bài có mã bắt đầu th-c.
    9. Nối chữ qua danChuoiTH cho toàn bộ chuỗi rep, pair trong SC.COURSE và các từ trong SC.WORDS.
   10. Kiểu nối chữ (nối liền hoặc lia viết) của các cặp mẫu.
   11. Chữ hoa Tiểu học (29 chữ hoa trong SC.CHU, chiều cao thân chữ, 60 chữ hoa có dấu thanh và dàn chuỗi mẫu).
   12. Các bài chữ hoa trong SC.COURSE và SC.SOTAY (8 nét cơ bản ở th-h0, phủ đủ và đúng thứ tự 29 chữ hoa A → Y, cỡ chữ, sổ tay, dàn chuỗi và phần Tự do ở cuối).

  Mỗi phép kiểm in một dòng "ĐẠT ..." hoặc "HỎNG ..." kèm chi tiết; thoát với mã 1 nếu có phép hỏng.
*/
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GOC = path.resolve(__dirname, '..');
const FILE_DATA = path.join(GOC, 'src', 'data', 'scripts-th.js');
const FILE_RENDER = path.join(GOC, 'src', 'engine', 'th-render.js');
const FILE_DRAW = path.join(GOC, 'src', 'engine', 'draw.js');

const docFile = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

// Tách riêng phần khai báo hàm `function samplePath(...) { ... }` từ src/engine/draw.js
function tachHamSamplePath(ma) {
  const m = /^function samplePath\b/m.exec(ma);
  if (!m) throw new Error('Không tìm thấy hàm samplePath trong src/engine/draw.js');
  const batDau = m.index;
  const mo = ma.indexOf('{', batDau);
  if (mo === -1) throw new Error('Cú pháp hàm samplePath không hợp lệ trong src/engine/draw.js');

  let sau = 0;
  let chuoi = null;
  let thoat = false;
  for (let i = mo; i < ma.length; i++) {
    const c = ma[i];
    if (chuoi) {
      if (thoat) { thoat = false; continue; }
      if (c === '\\') { thoat = true; continue; }
      if (c === chuoi) chuoi = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { chuoi = c; continue; }
    if (c === '/' && ma[i + 1] === '/') {
      const xuong = ma.indexOf('\n', i + 2);
      if (xuong === -1) break;
      i = xuong;
      continue;
    }
    if (c === '/' && ma[i + 1] === '*') {
      const dong = ma.indexOf('*/', i + 2);
      if (dong === -1) break;
      i = dong + 1;
      continue;
    }
    if (c === '{') sau++;
    else if (c === '}') {
      sau--;
      if (sau === 0) return ma.slice(batDau, i + 1);
    }
  }
  throw new Error('Không tìm thấy dấu đóng ngoặc của hàm samplePath trong src/engine/draw.js');
}

function napMoiTruong() {
  const maData = docFile(FILE_DATA);
  const maRender = docFile(FILE_RENDER);
  const maSamplePath = tachHamSamplePath(docFile(FILE_DRAW));

  const ctx = vm.createContext({
    SCRIPTS: {},
    FONTS: {},
    SCRIPT: 'th',
    DUCTUS: {},
    SC: null,
    drawGuide() {},
    themeName() {},
    traceColor() {},
  });

  vm.runInContext(maSamplePath, ctx, { filename: 'src/engine/draw.js#samplePath' });
  vm.runInContext(maData, ctx, { filename: 'src/data/scripts-th.js' });

  if (!ctx.SCRIPTS.th) {
    throw new Error('Không thấy SCRIPTS.th sau khi chạy src/data/scripts-th.js');
  }
  ctx.SC = ctx.SCRIPTS.th;
  if (!ctx.SC.DUCTUS || typeof ctx.SC.DUCTUS !== 'object') {
    ctx.SC.DUCTUS = ctx.DUCTUS;
  } else {
    ctx.DUCTUS = ctx.SC.DUCTUS;
  }

  vm.runInContext(maRender, ctx, { filename: 'src/engine/th-render.js' });

  const TH_THIEU = vm.runInContext('TH_THIEU', ctx);
  const TH_KHOANG_CHU = vm.runInContext('TH_KHOANG_CHU', ctx);
  const TH_NOI_SAT = vm.runInContext('TH_NOI_SAT', ctx);
  const TH_DAU_CAU = vm.runInContext('TH_DAU_CAU', ctx);
  return { ctx, TH_THIEU, TH_KHOANG_CHU, TH_NOI_SAT, TH_DAU_CAU };
}

const CHU_THUONG_29 = [
  'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g',
  'h', 'i', 'k', 'l', 'm', 'n', 'o', 'ô', 'ơ', 'p',
  'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y',
].map(c => c.normalize('NFC'));

const CHU_SO_10 = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const NGUYEN_AM_12 = ['a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y']
  .map(c => c.normalize('NFC'));

const DAU_THANH_5 = [
  { ten: 'sắc', kyTu: '\u0301', loai: 'dausac', tren: true },
  { ten: 'huyền', kyTu: '\u0300', loai: 'dauhuyen', tren: true },
  { ten: 'hỏi', kyTu: '\u0309', loai: 'dauhoi', tren: true },
  { ten: 'ngã', kyTu: '\u0303', loai: 'daunga', tren: true },
  { ten: 'nặng', kyTu: '\u0323', loai: 'daunang', tren: false },
];

const CHU_CO_DAU_60 = [];
for (const na of NGUYEN_AM_12) {
  for (const d of DAU_THANH_5) {
    CHU_CO_DAU_60.push({
      ch: (na + d.kyTu).normalize('NFC'),
      goc: na,
      dau: d,
    });
  }
}

const TAP_CHU_MUC_3 = [
  ...CHU_THUONG_29,
  ...CHU_SO_10,
  ...CHU_CO_DAU_60.map(x => x.ch),
];

const CHU_HOA_29 = [...'AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY'].map(c => c.normalize('NFC'));

const NGUYEN_AM_HOA_12 = [...'AĂÂEÊIOÔƠUƯY'].map(c => c.normalize('NFC'));

const CHU_HOA_CO_DAU_60 = [];
for (const na of NGUYEN_AM_HOA_12) {
  for (const d of DAU_THANH_5) {
    CHU_HOA_CO_DAU_60.push({
      ch: (na + d.kyTu).normalize('NFC'),
      goc: na,
      dau: d,
    });
  }
}

const LOAI_DAU_THANH = new Set(DAU_THANH_5.map(d => d.loai));

const CHUOI_HOA_MAU = ['Ánh', 'Ân', 'An', 'Bà', 'Hà', 'Cà Mau', 'Hà Nội', 'Ẩn'];

const SO_THAM_SO = { M: 2, L: 2, C: 6 };
const LOAI_PHU = new Set(['cham', 'mu', 'trang', 'rau']);

function tomTatLoi(ds, gioiHan = 10) {
  if (ds.length <= gioiHan) return ds.join('; ');
  return `${ds.slice(0, gioiHan).join('; ')} … (còn ${ds.length - gioiHan} lỗi khác)`;
}

function main() {
  const { ctx, TH_THIEU, TH_KHOANG_CHU, TH_NOI_SAT, TH_DAU_CAU } = napMoiTruong();
  const SC = ctx.SC;

  let soDat = 0;
  let soHong = 0;

  function kiem(so, ten, fn) {
    try {
      const kq = fn();
      if (kq && kq.dat) {
        soDat++;
        console.log(`ĐẠT ${so}. ${ten} — ${kq.chiTiet}`);
      } else {
        soHong++;
        console.log(`HỎNG ${so}. ${ten} — ${kq ? kq.chiTiet : 'không rõ nguyên nhân'}`);
      }
    } catch (e) {
      soHong++;
      console.log(`HỎNG ${so}. ${ten} — lỗi thực thi: ${e.message}`);
    }
  }

  function khoangY(d) {
    const pts = ctx.samplePath(d);
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }
    return { minY, maxY };
  }

  // Phép kiểm 1: cấu trúc nét và lệnh vẽ trong SC.CHU
  kiem(1, 'Cấu trúc nét vẽ trong SC.CHU', () => {
    const chuMap = SC.CHU;
    if (!chuMap || typeof chuMap !== 'object' || Object.keys(chuMap).length === 0) {
      return { dat: false, chiTiet: 'SC.CHU rỗng hoặc không hợp lệ' };
    }
    const loi = [];
    let tongNet = 0;
    let tongLenh = 0;
    const dsChu = Object.keys(chuMap);
    for (const ch of dsChu) {
      const muc = chuMap[ch];
      const nets = muc && Array.isArray(muc.cach) && muc.cach[0] && muc.cach[0].net;
      if (!Array.isArray(nets) || nets.length === 0) {
        loi.push(`"${ch}": cach[0].net rỗng hoặc thiếu`);
        continue;
      }
      for (let ni = 0; ni < nets.length; ni++) {
        const n = nets[ni];
        tongNet++;
        if (!n || !Array.isArray(n.d) || n.d.length === 0) {
          loi.push(`"${ch}" nét ${ni}: thiếu danh sách lệnh d`);
          continue;
        }
        for (let gi = 0; gi < n.d.length; gi++) {
          const g = n.d[gi];
          tongLenh++;
          if (!Array.isArray(g) || g.length === 0) {
            loi.push(`"${ch}" nét ${ni} lệnh ${gi}: không phải mảng lệnh`);
            continue;
          }
          const lenh = g[0];
          const can = SO_THAM_SO[lenh];
          if (!can) {
            loi.push(`"${ch}" nét ${ni} lệnh ${gi}: lệnh lạ "${lenh}"`);
            continue;
          }
          if (g.length !== can + 1) {
            loi.push(`"${ch}" nét ${ni} lệnh ${gi} (${lenh}): cần ${can} tham số, có ${g.length - 1}`);
            continue;
          }
          for (let pi = 1; pi < g.length; pi++) {
            if (typeof g[pi] !== 'number' || !Number.isFinite(g[pi])) {
              loi.push(`"${ch}" nét ${ni} lệnh ${gi} (${lenh}) tham số ${pi}: không phải số hữu hạn (${g[pi]})`);
            }
          }
        }
      }
    }
    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi) };
    return { dat: true, chiTiet: `${dsChu.length} chữ, ${tongNet} nét, ${tongLenh} lệnh đều hợp lệ` };
  });

  // Phép kiểm 2: mọi loai trong net có trong SC.STROKES hoặc nhóm dấu phụ
  kiem(2, 'Mã loại nét trong SC.CHU', () => {
    const strokes = SC.STROKES || {};
    const loi = [];
    let tongNet = 0;
    for (const [ch, muc] of Object.entries(SC.CHU || {})) {
      const cachList = Array.isArray(muc && muc.cach) ? muc.cach : [];
      for (let ci = 0; ci < cachList.length; ci++) {
        const nets = Array.isArray(cachList[ci] && cachList[ci].net) ? cachList[ci].net : [];
        for (let ni = 0; ni < nets.length; ni++) {
          tongNet++;
          const loai = nets[ni] && nets[ni].loai;
          if (typeof loai !== 'string' || (!Object.prototype.hasOwnProperty.call(strokes, loai) && !LOAI_PHU.has(loai))) {
            loi.push(`"${ch}" cách ${ci} nét ${ni}: loai="${loai}" không có trong SC.STROKES hay nhóm dấu phụ`);
          }
        }
      }
    }
    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi) };
    return { dat: true, chiTiet: `toàn bộ ${tongNet} nét đều có loại hợp lệ` };
  });

  // Phép kiểm 3: hinhChuTH cho 29 chữ thường, 10 chữ số, 60 chữ có dấu thanh và vị trí dấu
  kiem(3, 'Hình chữ và vị trí dấu thanh qua hinhChuTH', () => {
    const loi = [];
    for (const ch of [...CHU_THUONG_29, ...CHU_SO_10]) {
      const h = ctx.hinhChuTH(ch);
      if (!h || !Array.isArray(h.nets) || h.nets.length === 0) {
        loi.push(`"${ch}": hinhChuTH trả về rỗng/null`);
      }
    }
    for (const { ch, goc, dau } of CHU_CO_DAU_60) {
      const h = ctx.hinhChuTH(ch);
      if (!h || !Array.isArray(h.nets) || h.nets.length === 0) {
        loi.push(`"${ch}": hinhChuTH trả về rỗng/null`);
        continue;
      }
      const nets = h.nets;
      const netCuoi = nets[nets.length - 1];
      if (netCuoi.dau !== true) {
        loi.push(`"${ch}": nét cuối không có dau === true`);
      }
      const { minY: minYDau, maxY: maxYDau } = khoangY(netCuoi.d);
      if (dau.tren) {
        let maxYKhac = -Infinity;
        for (let i = 0; i < nets.length - 1; i++) {
          const { maxY } = khoangY(nets[i].d);
          if (maxY > maxYKhac) maxYKhac = maxY;
        }
        if (!(minYDau > maxYKhac)) {
          loi.push(`"${ch}": dấu ${dau.ten} (minY=${minYDau.toFixed(3)}) không cao hơn hẳn các nét khác (maxY=${maxYKhac.toFixed(3)})`);
        }
      } else if (!(maxYDau < 0)) {
        loi.push(`"${ch}": dấu nặng không nằm hoàn toàn dưới đường chân (maxY=${maxYDau.toFixed(3)})`);
      }
      // Dấu thanh nằm trên (ì, í, ỉ, ĩ) thay cho chấm chữ i; dấu nặng nằm dưới chân nên ị vẫn giữ chấm
      if (goc === 'i' && dau.tren && nets.some(n => n.loai === 'cham')) {
        loi.push(`"${ch}": chữ i có dấu thanh ở trên nhưng vẫn còn nét cham`);
      }
      if (goc === 'i' && !dau.tren && !nets.some(n => n.loai === 'cham')) {
        loi.push(`"${ch}": chữ ị mất chấm trên đầu`);
      }
    }
    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi) };
    return {
      dat: true,
      chiTiet: `đủ ${TAP_CHU_MUC_3.length} chữ (29 chữ thường, 10 chữ số, 60 chữ có dấu thanh) và vị trí dấu đúng`,
    };
  });

  // Phép kiểm 4: danChuoiTH không đưa ký tự nào vào TH_THIEU khi dàn COURSE và WORDS
  kiem(4, 'Không thiếu ký tự trong SC.COURSE và SC.WORDS', () => {
    TH_THIEU.clear();
    let soChuoi = 0;
    for (const phan of SC.COURSE || []) {
      for (const bai of phan.lessons || []) {
        for (const dong of bai.rows || []) {
          if (Array.isArray(dong) && (dong[0] === 'rep' || dong[0] === 'pair') && typeof dong[1] === 'string') {
            ctx.danChuoiTH(dong[1]);
            soChuoi++;
          }
        }
      }
    }
    for (const dsTu of Object.values(SC.WORDS || {})) {
      if (!Array.isArray(dsTu)) continue;
      for (const tu of dsTu) {
        if (typeof tu === 'string') {
          ctx.danChuoiTH(tu);
          soChuoi++;
        }
      }
    }
    const thieu = Array.from(TH_THIEU);
    if (thieu.length > 0) {
      return {
        dat: false,
        chiTiet: `thiếu ${thieu.length} ký tự: ${thieu.map(c => `"${c}"`).join(', ')}`,
      };
    }
    return { dat: true, chiTiet: `đã dàn ${soChuoi} chuỗi trong COURSE và WORDS, không có ký tự nào thiếu` };
  });

  // Phép kiểm 5: DUCTUS đủ chữ ở mục 3 và nét cơ bản "~mã nét", mỗi lượt >= 2 điểm
  kiem(5, 'Bảng DUCTUS sau khi chạy dungDuctusTH()', () => {
    for (const k of Object.keys(ctx.DUCTUS)) delete ctx.DUCTUS[k];
    ctx.dungDuctusTH();

    const maNetCoBan = Object.keys(SC.STROKES || {}).map(k => '~' + k);
    const canCo = [...TAP_CHU_MUC_3, ...maNetCoBan];
    const loi = [];
    let tongLuot = 0;

    for (const khoa of canCo) {
      const dsLuot = ctx.DUCTUS[khoa];
      if (!Array.isArray(dsLuot) || dsLuot.length === 0) {
        loi.push(`"${khoa}": không có trong DUCTUS hoặc rỗng`);
        continue;
      }
      for (let li = 0; li < dsLuot.length; li++) {
        const luot = dsLuot[li];
        tongLuot++;
        if (!luot || !Array.isArray(luot.r) || luot.r.length === 0) {
          loi.push(`"${khoa}" lượt ${li}: thiếu mảng r`);
          continue;
        }
        for (let ri = 0; ri < luot.r.length; ri++) {
          const diem = luot.r[ri];
          if (!Array.isArray(diem) || diem.length < 2) {
            loi.push(`"${khoa}" lượt ${li}: có ít hơn 2 điểm (${Array.isArray(diem) ? diem.length : 'không hợp lệ'})`);
          }
        }
      }
    }
    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi) };
    return {
      dat: true,
      chiTiet: `đủ ${TAP_CHU_MUC_3.length} chữ và ${maNetCoBan.length} nét cơ bản (${tongLuot} lượt, mỗi lượt từ 2 điểm trở lên)`,
    };
  });

  // Phép kiểm 6: doRongTH
  kiem(6, 'Hàm đo độ rộng doRongTH', () => {
    const loi = [];
    for (const ch of TAP_CHU_MUC_3) {
      const w = ctx.doRongTH(ch);
      if (typeof w !== 'number' || !Number.isFinite(w) || !(w > 0)) {
        loi.push(`doRongTH("${ch}") = ${w} (phải > 0)`);
      }
    }
    const wA = ctx.doRongTH('a');
    const wAA = ctx.doRongTH('a a');
    if (!(wAA > 2 * wA)) {
      loi.push(`doRongTH("a a") = ${wAA} không lớn hơn 2 * doRongTH("a") = ${2 * wA}`);
    }
    const wRong = ctx.doRongTH('');
    if (wRong !== 0) {
      loi.push(`doRongTH("") = ${wRong} (phải bằng 0)`);
    }
    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi) };
    return {
      dat: true,
      chiTiet: `${TAP_CHU_MUC_3.length} chữ đều > 0; doRongTH("a a")=${wAA.toFixed(2)} > 2×${wA.toFixed(2)}; chuỗi rỗng = 0`,
    };
  });

  // Phép kiểm 7: mã nét trong dòng stroke của COURSE có trong SC.STROKES
  kiem(7, 'Mã nét trong các dòng stroke của SC.COURSE', () => {
    const strokes = SC.STROKES || {};
    const loi = [];
    let tongDong = 0;
    for (const phan of SC.COURSE || []) {
      for (const bai of phan.lessons || []) {
        for (const dong of bai.rows || []) {
          if (Array.isArray(dong) && dong[0] === 'stroke') {
            tongDong++;
            const ma = dong[1];
            if (typeof ma !== 'string' || !Object.prototype.hasOwnProperty.call(strokes, ma)) {
              loi.push(`bài "${bai.id}": mã nét "${ma}" không có trong SC.STROKES`);
            }
          }
        }
      }
    }
    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi) };
    return { dat: true, chiTiet: `toàn bộ ${tongDong} dòng stroke đều khớp với SC.STROKES` };
  });

  // Phép kiểm 8: mỗi chữ trong 29 chữ thường xuất hiện trong dòng rep của đúng 1 bài th-c*
  kiem(8, 'Phủ đủ 29 chữ thường trong dòng rep của các bài th-c*', () => {
    const xuatHien = new Map(CHU_THUONG_29.map(ch => [ch, new Set()]));
    let soBai = 0;

    for (const phan of SC.COURSE || []) {
      for (const bai of phan.lessons || []) {
        if (typeof bai.id !== 'string' || !bai.id.startsWith('th-c')) continue;
        soBai++;
        for (const dong of bai.rows || []) {
          if (Array.isArray(dong) && dong[0] === 'rep' && typeof dong[1] === 'string') {
            for (const ch of dong[1].normalize('NFC')) {
              if (ch === ' ') continue;
              if (xuatHien.has(ch)) xuatHien.get(ch).add(bai.id);
            }
          }
        }
      }
    }

    const loi = [];
    for (const ch of CHU_THUONG_29) {
      const dsBai = Array.from(xuatHien.get(ch));
      if (dsBai.length === 0) {
        loi.push(`"${ch}": không xuất hiện trong bài th-c* nào`);
      } else if (dsBai.length > 1) {
        loi.push(`"${ch}": xuất hiện ở ${dsBai.length} bài (${dsBai.join(', ')})`);
      }
    }
    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi) };
    return { dat: true, chiTiet: `đủ 29 chữ thường, mỗi chữ nằm trong đúng 1 bài (tổng ${soBai} bài th-c*)` };
  });

  // Phép kiểm 9: nối chữ qua danChuoiTH cho toàn bộ chuỗi rep, pair trong COURSE và từ trong WORDS
  kiem(9, 'Nối chữ qua danChuoiTH trong SC.COURSE và SC.WORDS', () => {
    const dsChuoi = [];
    for (const phan of SC.COURSE || []) {
      for (const bai of phan.lessons || []) {
        for (const dong of bai.rows || []) {
          if (Array.isArray(dong) && (dong[0] === 'rep' || dong[0] === 'pair') && typeof dong[1] === 'string') {
            dsChuoi.push({ nguon: `bài "${bai.id}"`, chuoi: dong[1] });
          }
        }
      }
    }
    for (const [khoa, dsTu] of Object.entries(SC.WORDS || {})) {
      if (!Array.isArray(dsTu)) continue;
      for (const tu of dsTu) {
        if (typeof tu === 'string') {
          dsChuoi.push({ nguon: `WORDS["${khoa}"]`, chuoi: tu });
        }
      }
    }

    const loi = [];
    let tongNetNoi = 0;
    let tongCapTrongTieng = 0;

    for (const { nguon, chuoi } of dsChuoi) {
      const kq = ctx.danChuoiTH(chuoi);
      if (!kq || !Array.isArray(kq.chu) || !Array.isArray(kq.noi) || typeof kq.rong !== 'number' || !Number.isFinite(kq.rong)) {
        loi.push(`${nguon} ("${chuoi}"): kết quả danChuoiTH không hợp lệ`);
        continue;
      }

      // Xác định các cặp chỉ số liền nhau trong cùng một tiếng (không xen dấu cách, dấu câu hay chữ thiếu)
      const capTrongTieng = [];
      let idxChu = 0;
      let truocTrongTieng = false;
      for (const ch of chuoi.normalize('NFC')) {
        if (ch === '\r') continue;
        if (ch === ' ' || ch === '\u00A0' || ch === '\t' || ch === '\n') {
          truocTrongTieng = false;
          continue;
        }
        if (TH_DAU_CAU.includes(ch)) {
          idxChu++;
          truocTrongTieng = false;
          continue;
        }
        const h = ctx.hinhChuTH(ch);
        if (!h) {
          truocTrongTieng = false;
          continue;
        }
        if (truocTrongTieng) capTrongTieng.push(idxChu - 1);
        idxChu++;
        truocTrongTieng = true;
      }

      // Kiểm không chồng chữ trong cùng một tiếng
      for (const i of capTrongTieng) {
        tongCapTrongTieng++;
        const c1 = kq.chu[i];
        const c2 = kq.chu[i + 1];
        if (!c1 || !c2 || !c1.h || !c2.h) continue;
        const A = ctx.thDauCuoi(c1.h);
        const B = ctx.thDauCuoi(c2.h);
        const diemDung = c1.x + A.dung[0];
        const diemDat = c2.x + B.dat[0];
        if (diemDat < diemDung - 0.001) {
          loi.push(`${nguon} ("${chuoi}"), cặp "${c1.ch}${c2.ch}": điểm đặt chữ sau (${diemDat.toFixed(4)}) lùi quá điểm dừng chữ trước (${diemDung.toFixed(4)})`);
        }
      }

      // Kiểm mọi nét nối trong noi[].d: số hữu hạn và đúng điểm dừng chữ trước → điểm đặt chữ liền sau
      const daKhop = new Set();
      for (let ni = 0; ni < kq.noi.length; ni++) {
        tongNetNoi++;
        const n = kq.noi[ni];
        if (!n || !Array.isArray(n.d) || n.d.length < 2) {
          loi.push(`${nguon} ("${chuoi}") nét nối ${ni}: danh sách lệnh d rỗng hoặc thiếu`);
          continue;
        }
        let hopLeSo = true;
        for (let gi = 0; gi < n.d.length; gi++) {
          const g = n.d[gi];
          const can = Array.isArray(g) && SO_THAM_SO[g[0]];
          if (!can || g.length !== can + 1) {
            loi.push(`${nguon} ("${chuoi}") nét nối ${ni} lệnh ${gi}: cú pháp lệnh không hợp lệ`);
            hopLeSo = false;
            continue;
          }
          for (let pi = 1; pi < g.length; pi++) {
            if (typeof g[pi] !== 'number' || !Number.isFinite(g[pi])) {
              loi.push(`${nguon} ("${chuoi}") nét nối ${ni} lệnh ${gi} tham số ${pi}: không phải số hữu hạn (${g[pi]})`);
              hopLeSo = false;
            }
          }
        }
        if (!hopLeSo) continue;
        if (n.d[0][0] !== 'M') {
          loi.push(`${nguon} ("${chuoi}") nét nối ${ni}: lệnh đầu không phải M`);
          continue;
        }
        const sx = n.d[0][1];
        const sy = n.d[0][2];
        const gl = n.d[n.d.length - 1];
        const ex = gl[gl.length - 2];
        const ey = gl[gl.length - 1];

        let timThay = false;
        for (const i of capTrongTieng) {
          if (daKhop.has(i)) continue;
          const c1 = kq.chu[i];
          const c2 = kq.chu[i + 1];
          if (!c1 || !c2 || !c1.h || !c2.h) continue;
          const A = ctx.thDauCuoi(c1.h);
          const B = ctx.thDauCuoi(c2.h);
          const pAx = c1.x + A.dung[0];
          const pAy = A.dung[1];
          const pBx = c2.x + B.dat[0];
          const pBy = B.dat[1];
          if (Math.hypot(sx - pAx, sy - pAy) < 0.001 && Math.hypot(ex - pBx, ey - pBy) < 0.001) {
            daKhop.add(i);
            timThay = true;
            break;
          }
        }
        if (!timThay) {
          loi.push(`${nguon} ("${chuoi}") nét nối ${ni}: điểm đầu (${sx.toFixed(3)}, ${sy.toFixed(3)}) → cuối (${ex.toFixed(3)}, ${ey.toFixed(3)}) không khớp cặp chữ liền kề nào`);
        }
      }

      // Kiểm rong bằng mép phải chữ cuối (khi chuỗi không kết thúc bằng dấu cách hay dấu câu)
      const norm = chuoi.normalize('NFC').replace(/\r/g, '');
      const dsKyTu = [...norm];
      const kyTuCuoi = dsKyTu[dsKyTu.length - 1];
      const ketThucDacBiet = !kyTuCuoi || kyTuCuoi === ' ' || kyTuCuoi === '\u00A0' || kyTuCuoi === '\t' || kyTuCuoi === '\n' || TH_DAU_CAU.includes(kyTuCuoi);
      if (!ketThucDacBiet && kq.chu.length > 0) {
        const chuCuoi = kq.chu[kq.chu.length - 1];
        if (!chuCuoi.dauCau && chuCuoi.h) {
          const mepPhai = chuCuoi.x + chuCuoi.h.rong;
          if (Math.abs(kq.rong - mepPhai) >= 0.001) {
            loi.push(`${nguon} ("${chuoi}"): rong=${kq.rong.toFixed(4)} khác mép phải chữ cuối (${mepPhai.toFixed(4)})`);
          }
        }
      }
    }

    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi) };
    return {
      dat: true,
      chiTiet: `đã kiểm ${dsChuoi.length} chuỗi (${tongCapTrongTieng} cặp trong tiếng, ${tongNetNoi} nét nối): tọa độ hữu hạn, khớp đầu cuối, không chồng chữ và đúng độ rộng`,
    };
  });

  // Phép kiểm 10: kiểu nối chữ (nối liền hoặc lia viết) của các cặp mẫu
  kiem(10, 'Kiểu nối chữ của các cặp mẫu', () => {
    const CAP_NOI_LIEN = ['in', 'im', 'mi', 'tu', 'ti', 'nh', 've', 'em'];
    const CAP_LIA_VIET = ['ba', 'ca', 'on', 'su', 'ra'];
    const loi = [];

    for (const cap of CAP_NOI_LIEN) {
      const kq = ctx.danChuoiTH(cap);
      if (!kq || !Array.isArray(kq.chu) || kq.chu.length !== 2) {
        loi.push(`"${cap}": cần có 2 chữ, nhận ${kq && Array.isArray(kq.chu) ? kq.chu.length : 'không hợp lệ'}`);
        continue;
      }
      const [c1, c2] = kq.chu;
      if (!ctx.thNoiDuoc(c1, c2)) {
        loi.push(`"${cap}": phải nối liền nhưng thNoiDuoc trả về false`);
        continue;
      }
      const A = ctx.thDauCuoi(c1.h);
      const B = ctx.thDauCuoi(c2.h);
      const dy = Math.abs(B.dat[1] - A.dung[1]);
      const pAx = c1.x + A.dung[0];
      const pBx = c2.x + B.dat[0];
      if (dy < TH_NOI_SAT) {
        if (kq.noi.length !== 0 || Math.abs(pBx - pAx) >= 0.001) {
          loi.push(`"${cap}": phải nối sát trực tiếp (noi.length=${kq.noi.length}, lệch ngang=${Math.abs(pBx - pAx).toFixed(4)})`);
        }
      } else if (kq.noi.length !== 1) {
        loi.push(`"${cap}": phải có đúng 1 nét nối nhưng có ${kq.noi.length}`);
      } else if (pBx < pAx - 0.001) {
        loi.push(`"${cap}": điểm đặt chữ sau (${pBx.toFixed(4)}) lùi quá điểm dừng chữ trước (${pAx.toFixed(4)})`);
      }
    }

    for (const cap of CAP_LIA_VIET) {
      const kq = ctx.danChuoiTH(cap);
      if (!kq || !Array.isArray(kq.chu) || kq.chu.length !== 2) {
        loi.push(`"${cap}": cần có 2 chữ, nhận ${kq && Array.isArray(kq.chu) ? kq.chu.length : 'không hợp lệ'}`);
        continue;
      }
      const [c1, c2] = kq.chu;
      if (ctx.thNoiDuoc(c1, c2)) {
        loi.push(`"${cap}": phải lia viết nhưng thNoiDuoc trả về true`);
        continue;
      }
      if (kq.noi.length !== 0) {
        loi.push(`"${cap}": phải lia viết nhưng lại có ${kq.noi.length} nét nối`);
      }
      const ho = c2.x - (c1.x + c1.h.rong);
      if (Math.abs(ho - TH_KHOANG_CHU) >= 0.001) {
        loi.push(`"${cap}": khoảng hở = ${ho.toFixed(4)}, phải đúng TH_KHOANG_CHU (${TH_KHOANG_CHU})`);
      }
    }

    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi, 20) };
    return {
      dat: true,
      chiTiet: `${CAP_NOI_LIEN.length} cặp nối liền (${CAP_NOI_LIEN.join(', ')}) và ${CAP_LIA_VIET.length} cặp lia viết (${CAP_LIA_VIET.join(', ')}) đều đúng quy tắc`,
    };
  });

  // Phép kiểm 11: chữ hoa (29 chữ hoa trong SC.CHU, chiều cao thân chữ, 60 chữ hoa có dấu thanh và dàn chuỗi mẫu)
  kiem(11, 'Chữ hoa Tiểu học', () => {
    const chuMap = SC.CHU || {};
    const loi = [];

    // 1. Có đủ 29 chữ hoa trong SC.CHU, mọi tọa độ hữu hạn, nét lien nối đúng điểm cuối nét trước (sai lệch < 0,01)
    //    và thân chữ (bỏ nét dau) có đỉnh 2,4–2,6; đáy -0,05–0,05 (riêng G, Y: -1,6–-1,4)
    for (const ch of CHU_HOA_29) {
      if (!Object.prototype.hasOwnProperty.call(chuMap, ch)) {
        loi.push(`"${ch}": thiếu trong SC.CHU`);
        continue;
      }
      const muc = chuMap[ch];
      const nets = muc && Array.isArray(muc.cach) && muc.cach[0] && muc.cach[0].net;
      if (!Array.isArray(nets) || nets.length === 0) {
        loi.push(`"${ch}": cach[0].net rỗng hoặc thiếu`);
        continue;
      }
      if (typeof muc.rong !== 'number' || !Number.isFinite(muc.rong) || !(muc.rong > 0)) {
        loi.push(`"${ch}": rong không hợp lệ (${muc.rong})`);
      }

      let tatCaHuuHan = true;
      for (let ni = 0; ni < nets.length; ni++) {
        const n = nets[ni];
        if (!n || !Array.isArray(n.d) || n.d.length === 0) {
          loi.push(`"${ch}" nét ${ni}: thiếu danh sách lệnh d`);
          tatCaHuuHan = false;
          continue;
        }
        let netHuuHan = true;
        for (let gi = 0; gi < n.d.length; gi++) {
          const g = n.d[gi];
          const can = Array.isArray(g) && SO_THAM_SO[g[0]];
          if (!can || g.length !== can + 1) {
            loi.push(`"${ch}" nét ${ni} lệnh ${gi}: cú pháp lệnh không hợp lệ`);
            netHuuHan = false;
            tatCaHuuHan = false;
            continue;
          }
          for (let pi = 1; pi < g.length; pi++) {
            if (typeof g[pi] !== 'number' || !Number.isFinite(g[pi])) {
              loi.push(`"${ch}" nét ${ni} lệnh ${gi} tham số ${pi}: không phải số hữu hạn (${g[pi]})`);
              netHuuHan = false;
              tatCaHuuHan = false;
            }
          }
        }
        if (n.lien) {
          if (ni === 0) {
            loi.push(`"${ch}" nét 0: có lien nhưng không có nét trước`);
          } else if (netHuuHan) {
            const truoc = nets[ni - 1];
            const dTruoc = truoc && Array.isArray(truoc.d) ? truoc.d : null;
            if (!dTruoc || dTruoc.length === 0 || n.d[0][0] !== 'M') {
              loi.push(`"${ch}" nét ${ni}: nét lien không bắt đầu bằng lệnh M hoặc nét trước rỗng`);
            } else {
              const gCuoi = dTruoc[dTruoc.length - 1];
              const px = Array.isArray(gCuoi) ? gCuoi[gCuoi.length - 2] : NaN;
              const py = Array.isArray(gCuoi) ? gCuoi[gCuoi.length - 1] : NaN;
              const sx = n.d[0][1];
              const sy = n.d[0][2];
              if (!Number.isFinite(px) || !Number.isFinite(py)) {
                loi.push(`"${ch}" nét ${ni}: điểm cuối nét trước không hữu hạn`);
              } else {
                const lech = Math.hypot(sx - px, sy - py);
                if (!(lech < 0.01)) {
                  loi.push(`"${ch}" nét ${ni}: điểm đầu nét lien (${sx.toFixed(3)}, ${sy.toFixed(3)}) lệch điểm cuối nét trước (${px.toFixed(3)}, ${py.toFixed(3)}) là ${lech.toFixed(4)} (>= 0,01)`);
                }
              }
            }
          }
        }
      }

      if (tatCaHuuHan) {
        const netsThan = nets.filter(n => !n.dau);
        if (netsThan.length === 0) {
          loi.push(`"${ch}": không có nét thân chữ nào (mọi nét đều gắn dau)`);
        } else {
          let minY = Infinity;
          let maxY = -Infinity;
          for (const n of netsThan) {
            const ky = khoangY(n.d);
            if (ky.minY < minY) minY = ky.minY;
            if (ky.maxY > maxY) maxY = ky.maxY;
          }
          if (!(maxY >= 2.4 && maxY <= 2.6)) {
            loi.push(`"${ch}": đỉnh thân chữ = ${maxY.toFixed(3)} (phải trong khoảng 2,4–2,6)`);
          }
          const coKhuyetDuoi = ch === 'G' || ch === 'Y';
          const dayMin = coKhuyetDuoi ? -1.6 : -0.05;
          const dayMax = coKhuyetDuoi ? -1.4 : 0.05;
          if (!(minY >= dayMin && minY <= dayMax)) {
            loi.push(`"${ch}": đáy thân chữ = ${minY.toFixed(3)} (phải trong khoảng ${dayMin}–${dayMax})`);
          }
        }
      }
    }

    // 2. hinhChuTH ghép được 5 dấu thanh cho 12 nguyên âm hoa AĂÂEÊIOÔƠUƯY (60 chữ)
    for (const { ch, goc, dau } of CHU_HOA_CO_DAU_60) {
      const h = ctx.hinhChuTH(ch);
      if (!h || !Array.isArray(h.nets) || h.nets.length === 0) {
        loi.push(`"${ch}": hinhChuTH trả về rỗng/null`);
        continue;
      }
      const nets = h.nets;
      const netDauThanh = nets.filter(n => n && LOAI_DAU_THANH.has(n.loai));
      if (netDauThanh.length !== 1) {
        loi.push(`"${ch}": cần có đúng 1 nét dấu thanh, nhưng có ${netDauThanh.length}`);
        continue;
      }
      const netDau = netDauThanh[0];
      if (netDau.dau !== true || netDau.loai !== dau.loai) {
        loi.push(`"${ch}": nét dấu thanh không khớp (loai="${netDau.loai}", dau=${netDau.dau})`);
        continue;
      }
      const { minY: minYDau, maxY: maxYDau } = khoangY(netDau.d);
      if (!Number.isFinite(minYDau) || !Number.isFinite(maxYDau)) {
        loi.push(`"${ch}": tọa độ nét dấu ${dau.ten} không hữu hạn`);
        continue;
      }
      if (dau.tren) {
        let maxYChuGoc = -Infinity;
        for (const n of nets) {
          if (n === netDau) continue;
          const { maxY } = khoangY(n.d);
          if (maxY > maxYChuGoc) maxYChuGoc = maxY;
        }
        if (!(minYDau > maxYChuGoc)) {
          loi.push(`"${ch}": dấu ${dau.ten} (minY=${minYDau.toFixed(3)}) không nằm hẳn trên đỉnh chữ gốc (maxY=${maxYChuGoc.toFixed(3)})`);
        }
      } else if (goc !== 'G' && goc !== 'Y') {
        if (!(maxYDau < 0)) {
          loi.push(`"${ch}": dấu nặng không nằm dưới đường chân (maxY=${maxYDau.toFixed(3)})`);
        }
      }
    }

    // 3. danChuoiTH cho các chuỗi mẫu có chữ hoa: tọa độ hữu hạn, không chồng chữ (cùng điều kiện như phép kiểm 9)
    TH_THIEU.clear();
    let tongCap = 0;
    let tongNetNoi = 0;
    for (const chuoi of CHUOI_HOA_MAU) {
      const kq = ctx.danChuoiTH(chuoi);
      if (!kq || !Array.isArray(kq.chu) || !Array.isArray(kq.noi) || typeof kq.rong !== 'number' || !Number.isFinite(kq.rong)) {
        loi.push(`chuỗi "${chuoi}": kết quả danChuoiTH không hợp lệ`);
        continue;
      }

      for (const c of kq.chu) {
        if (typeof c.x !== 'number' || !Number.isFinite(c.x)) {
          loi.push(`chuỗi "${chuoi}", chữ "${c.ch}": tọa độ x không hữu hạn (${c.x})`);
        }
        if (c.h && Array.isArray(c.h.nets)) {
          for (let ni = 0; ni < c.h.nets.length; ni++) {
            const n = c.h.nets[ni];
            if (!n || !Array.isArray(n.d)) continue;
            for (let gi = 0; gi < n.d.length; gi++) {
              const g = n.d[gi];
              if (!Array.isArray(g)) continue;
              for (let pi = 1; pi < g.length; pi++) {
                if (typeof g[pi] !== 'number' || !Number.isFinite(g[pi])) {
                  loi.push(`chuỗi "${chuoi}", chữ "${c.ch}" nét ${ni} lệnh ${gi}: tọa độ không hữu hạn (${g[pi]})`);
                }
              }
            }
          }
        }
      }

      // Xác định các cặp chỉ số liền nhau trong cùng một tiếng (không xen dấu cách, dấu câu hay chữ thiếu)
      const capTrongTieng = [];
      let idxChu = 0;
      let truocTrongTieng = false;
      for (const ch of chuoi.normalize('NFC')) {
        if (ch === '\r') continue;
        if (ch === ' ' || ch === '\u00A0' || ch === '\t' || ch === '\n') {
          truocTrongTieng = false;
          continue;
        }
        if (TH_DAU_CAU.includes(ch)) {
          idxChu++;
          truocTrongTieng = false;
          continue;
        }
        const h = ctx.hinhChuTH(ch);
        if (!h) {
          loi.push(`chuỗi "${chuoi}": thiếu hình cho ký tự "${ch}"`);
          truocTrongTieng = false;
          continue;
        }
        if (truocTrongTieng) capTrongTieng.push(idxChu - 1);
        idxChu++;
        truocTrongTieng = true;
      }

      // Kiểm không chồng chữ trong cùng một tiếng
      for (const i of capTrongTieng) {
        tongCap++;
        const c1 = kq.chu[i];
        const c2 = kq.chu[i + 1];
        if (!c1 || !c2 || !c1.h || !c2.h) continue;
        const A = ctx.thDauCuoi(c1.h);
        const B = ctx.thDauCuoi(c2.h);
        const diemDung = c1.x + A.dung[0];
        const diemDat = c2.x + B.dat[0];
        if (diemDat < diemDung - 0.001) {
          loi.push(`chuỗi "${chuoi}", cặp "${c1.ch}${c2.ch}": điểm đặt chữ sau (${diemDat.toFixed(4)}) lùi quá điểm dừng chữ trước (${diemDung.toFixed(4)})`);
        }
      }

      // Kiểm mọi nét nối trong noi[].d: số hữu hạn và đúng điểm dừng chữ trước → điểm đặt chữ liền sau
      const daKhop = new Set();
      for (let ni = 0; ni < kq.noi.length; ni++) {
        tongNetNoi++;
        const n = kq.noi[ni];
        if (!n || !Array.isArray(n.d) || n.d.length < 2) {
          loi.push(`chuỗi "${chuoi}" nét nối ${ni}: danh sách lệnh d rỗng hoặc thiếu`);
          continue;
        }
        let hopLeSo = true;
        for (let gi = 0; gi < n.d.length; gi++) {
          const g = n.d[gi];
          const can = Array.isArray(g) && SO_THAM_SO[g[0]];
          if (!can || g.length !== can + 1) {
            loi.push(`chuỗi "${chuoi}" nét nối ${ni} lệnh ${gi}: cú pháp lệnh không hợp lệ`);
            hopLeSo = false;
            continue;
          }
          for (let pi = 1; pi < g.length; pi++) {
            if (typeof g[pi] !== 'number' || !Number.isFinite(g[pi])) {
              loi.push(`chuỗi "${chuoi}" nét nối ${ni} lệnh ${gi} tham số ${pi}: không phải số hữu hạn (${g[pi]})`);
              hopLeSo = false;
            }
          }
        }
        if (!hopLeSo) continue;
        if (n.d[0][0] !== 'M') {
          loi.push(`chuỗi "${chuoi}" nét nối ${ni}: lệnh đầu không phải M`);
          continue;
        }
        const sx = n.d[0][1];
        const sy = n.d[0][2];
        const gl = n.d[n.d.length - 1];
        const ex = gl[gl.length - 2];
        const ey = gl[gl.length - 1];

        let timThay = false;
        for (const i of capTrongTieng) {
          if (daKhop.has(i)) continue;
          const c1 = kq.chu[i];
          const c2 = kq.chu[i + 1];
          if (!c1 || !c2 || !c1.h || !c2.h) continue;
          const A = ctx.thDauCuoi(c1.h);
          const B = ctx.thDauCuoi(c2.h);
          const pAx = c1.x + A.dung[0];
          const pAy = A.dung[1];
          const pBx = c2.x + B.dat[0];
          const pBy = B.dat[1];
          if (Math.hypot(sx - pAx, sy - pAy) < 0.001 && Math.hypot(ex - pBx, ey - pBy) < 0.001) {
            daKhop.add(i);
            timThay = true;
            break;
          }
        }
        if (!timThay) {
          loi.push(`chuỗi "${chuoi}" nét nối ${ni}: điểm đầu (${sx.toFixed(3)}, ${sy.toFixed(3)}) → cuối (${ex.toFixed(3)}, ${ey.toFixed(3)}) không khớp cặp chữ liền kề nào`);
        }
      }

      // Kiểm rong bằng mép phải chữ cuối
      if (kq.chu.length > 0) {
        const chuCuoi = kq.chu[kq.chu.length - 1];
        if (!chuCuoi.dauCau && chuCuoi.h) {
          const mepPhai = chuCuoi.x + chuCuoi.h.rong;
          if (Math.abs(kq.rong - mepPhai) >= 0.001) {
            loi.push(`chuỗi "${chuoi}": rong=${kq.rong.toFixed(4)} khác mép phải chữ cuối (${mepPhai.toFixed(4)})`);
          }
        }
      }
    }

    if (TH_THIEU.size > 0) {
      loi.push(`danChuoiTH báo thiếu ký tự: ${Array.from(TH_THIEU).map(c => `"${c}"`).join(', ')}`);
    }

    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi, 30) };
    return {
      dat: true,
      chiTiet: `đủ ${CHU_HOA_29.length} chữ hoa (đỉnh/đáy và nét lien đúng), ${CHU_HOA_CO_DAU_60.length} chữ hoa có dấu thanh và ${CHUOI_HOA_MAU.length} chuỗi mẫu (${tongCap} cặp trong tiếng, ${tongNetNoi} nét nối)`,
    };
  });

  // Phép kiểm 12: các bài chữ hoa trong SC.COURSE và SC.SOTAY
  kiem(12, 'Các bài chữ hoa trong SC.COURSE và SC.SOTAY', () => {
    const NET_CO_BAN_HOA_8 = [
      'luonngang', 'luondoc', 'congtren', 'congduoi',
      'mocnguoctrai', 'mocnguoclen', 'mocxuoiphai', 'mochaidauhoa',
    ];
    const TAP_NET_HOA_8 = new Set(NET_CO_BAN_HOA_8);
    const TAP_CHU_HOA_29 = new Set(CHU_HOA_29);
    const VI_TRI_CHU_HOA = new Map(CHU_HOA_29.map((ch, idx) => [ch, idx]));

    const course = Array.isArray(SC.COURSE) ? SC.COURSE : [];
    const dsBaiH0 = [];
    const dsBaiHoa = [];
    const dsBaiHoaSo = [];
    let soBaiHoaThuong = 0;
    let soBaiHoaNho = 0;

    for (const phan of course) {
      for (const bai of (phan && Array.isArray(phan.lessons) ? phan.lessons : [])) {
        if (!bai || typeof bai.id !== 'string') continue;
        if (bai.id === 'th-h0') dsBaiH0.push(bai);
        if (bai.id.startsWith('th-h')) {
          dsBaiHoa.push(bai);
          if (bai.id.startsWith('th-hnh')) soBaiHoaNho++;
          else soBaiHoaThuong++;
        }
        if (/^th-h\d+$/.test(bai.id)) dsBaiHoaSo.push(bai);
      }
    }

    if (dsBaiH0.length === 0 && dsBaiHoa.length === 0) {
      return {
        dat: false,
        chiTiet: 'chưa có bài "th-h0" trong SC.COURSE (các bài chữ hoa chưa có trong giáo trình)',
      };
    }

    const loi = [];
    const strokes = SC.STROKES && typeof SC.STROKES === 'object' ? SC.STROKES : {};

    // 1. Bài th-h0: đúng 8 dòng stroke, đủ 8 mã nét cơ bản chữ hoa và mỗi mã có trong SC.STROKES
    if (dsBaiH0.length === 0) {
      loi.push('chưa có bài "th-h0" trong SC.COURSE');
    } else {
      if (dsBaiH0.length > 1) {
        loi.push(`có ${dsBaiH0.length} bài mang mã "th-h0" trong SC.COURSE (chỉ được có đúng 1 bài)`);
      }
      const baiH0 = dsBaiH0[0];
      const dongStroke = (Array.isArray(baiH0.rows) ? baiH0.rows : [])
        .filter(d => Array.isArray(d) && d[0] === 'stroke');
      if (dongStroke.length !== NET_CO_BAN_HOA_8.length) {
        loi.push(`bài "th-h0": cần có đúng ${NET_CO_BAN_HOA_8.length} dòng stroke, hiện có ${dongStroke.length}`);
      }
      const maNetH0 = dongStroke.map(d => d[1]);
      const tapMaNetH0 = new Set(maNetH0);
      const thieuNet = NET_CO_BAN_HOA_8.filter(m => !tapMaNetH0.has(m));
      if (thieuNet.length > 0) {
        loi.push(`bài "th-h0": thiếu mã nét cơ bản chữ hoa (${thieuNet.join(', ')})`);
      }
      const netLa = maNetH0.filter(m => !TAP_NET_HOA_8.has(m));
      if (netLa.length > 0) {
        loi.push(`bài "th-h0": có mã nét không thuộc 8 nét cơ bản chữ hoa (${netLa.map(m => `"${m}"`).join(', ')})`);
      }
      for (const ma of NET_CO_BAN_HOA_8) {
        if (!Object.prototype.hasOwnProperty.call(strokes, ma)) {
          loi.push(`SC.STROKES: thiếu mã nét cơ bản chữ hoa "${ma}"`);
        }
      }
      for (const ma of maNetH0) {
        if (typeof ma !== 'string' || (!TAP_NET_HOA_8.has(ma) && !Object.prototype.hasOwnProperty.call(strokes, ma))) {
          loi.push(`bài "th-h0": mã nét "${ma}" không có trong SC.STROKES`);
        }
      }
    }

    // 2. Phủ đủ 29 chữ hoa trong dòng rep của đúng 1 bài th-h<số> và đúng thứ tự A → Y
    const xuatHienHoa = new Map(CHU_HOA_29.map(ch => [ch, new Set()]));
    const thuTuXuatHien = [];
    const daThayHoa = new Set();

    for (const bai of dsBaiHoaSo) {
      for (const dong of bai.rows || []) {
        if (Array.isArray(dong) && dong[0] === 'rep' && typeof dong[1] === 'string') {
          for (const ch of dong[1].normalize('NFC')) {
            if (ch === ' ') continue;
            if (TAP_CHU_HOA_29.has(ch)) {
              xuatHienHoa.get(ch).add(bai.id);
              if (!daThayHoa.has(ch)) {
                daThayHoa.add(ch);
                thuTuXuatHien.push({ ch, baiId: bai.id });
              }
            }
          }
        }
      }
    }

    let du29 = true;
    for (const ch of CHU_HOA_29) {
      const dsBai = Array.from(xuatHienHoa.get(ch));
      if (dsBai.length === 0) {
        du29 = false;
        loi.push(`chữ hoa "${ch}": không xuất hiện trong dòng rep của bài th-h<số> nào`);
      } else if (dsBai.length > 1) {
        loi.push(`chữ hoa "${ch}": xuất hiện trong dòng rep ở ${dsBai.length} bài (${dsBai.join(', ')})`);
      }
    }

    if (du29) {
      for (let i = 0; i < CHU_HOA_29.length; i++) {
        if (thuTuXuatHien[i].ch !== CHU_HOA_29[i]) {
          loi.push(
            `thứ tự chữ hoa sai tại vị trí ${i + 1}: gặp "${thuTuXuatHien[i].ch}" (bài "${thuTuXuatHien[i].baiId}") thay vì "${CHU_HOA_29[i]}"`
          );
          break;
        }
      }
    } else {
      let idxTruoc = -1;
      let mucTruoc = null;
      for (const muc of thuTuXuatHien) {
        const idx = VI_TRI_CHU_HOA.get(muc.ch);
        if (idx < idxTruoc) {
          loi.push(
            `thứ tự chữ hoa bị đảo: "${muc.ch}" (bài "${muc.baiId}") đứng sau "${mucTruoc.ch}" (bài "${mucTruoc.baiId}")`
          );
          break;
        }
        idxTruoc = idx;
        mucTruoc = muc;
      }
    }

    // 3. Cỡ chữ (th-hnh…: "nho", các bài th-h… khác: "thuong") và sổ tay trong SC.SOTAY
    const sotay = SC.SOTAY && typeof SC.SOTAY === 'object' ? SC.SOTAY : null;
    for (const bai of dsBaiHoa) {
      const coMongDoi = bai.id.startsWith('th-hnh') ? 'nho' : 'thuong';
      if (bai.z !== coMongDoi) {
        loi.push(`bài "${bai.id}": cỡ chữ z="${bai.z}" (phải là "${coMongDoi}")`);
      }
      const mucSoTay = sotay && Object.prototype.hasOwnProperty.call(sotay, bai.id) ? sotay[bai.id] : undefined;
      if (!mucSoTay) {
        loi.push(`bài "${bai.id}": thiếu sổ tay trong SC.SOTAY`);
      } else if (
        !Array.isArray(mucSoTay) ||
        mucSoTay.length !== 3 ||
        typeof mucSoTay[0] !== 'string' ||
        mucSoTay[0].trim().length === 0 ||
        !Array.isArray(mucSoTay[1]) ||
        mucSoTay[1].length === 0 ||
        !mucSoTay[1].every(s => typeof s === 'string' && s.trim().length > 0) ||
        !Array.isArray(mucSoTay[2]) ||
        mucSoTay[2].length === 0 ||
        !mucSoTay[2].every(s => typeof s === 'string' && s.trim().length > 0)
      ) {
        loi.push(`bài "${bai.id}": sổ tay trong SC.SOTAY không đúng khuôn [chuỗi, mảng, mảng]`);
      }
    }

    // 4. Mọi chuỗi rep, pair trong các bài chữ hoa dàn sạch qua danChuoiTH và không chứa f, j, w, z
    let soChuoiHoa = 0;
    for (const bai of dsBaiHoa) {
      for (const dong of bai.rows || []) {
        if (!Array.isArray(dong) || (dong[0] !== 'rep' && dong[0] !== 'pair')) continue;
        if (typeof dong[1] !== 'string') {
          loi.push(`bài "${bai.id}": dòng ${dong[0]} không có chuỗi hợp lệ`);
          continue;
        }
        const chuoi = dong[1];
        soChuoiHoa++;
        const kyTuCam = chuoi.match(/[fjwz]/gi);
        if (kyTuCam) {
          const dsCam = Array.from(new Set(kyTuCam));
          loi.push(`bài "${bai.id}" ("${chuoi}"): chứa ký tự không dùng (${dsCam.map(c => `"${c}"`).join(', ')})`);
        }
        TH_THIEU.clear();
        const kq = ctx.danChuoiTH(chuoi);
        if (!kq || !Array.isArray(kq.chu) || !Array.isArray(kq.noi) || typeof kq.rong !== 'number' || !Number.isFinite(kq.rong)) {
          loi.push(`bài "${bai.id}" ("${chuoi}"): kết quả danChuoiTH không hợp lệ`);
        }
        if (TH_THIEU.size > 0) {
          loi.push(`bài "${bai.id}" ("${chuoi}"): thiếu ký tự khi dàn (${Array.from(TH_THIEU).map(c => `"${c}"`).join(', ')})`);
        }
      }
    }

    // 5. Phần cuối cùng của SC.COURSE vẫn chứa bài free
    if (course.length === 0) {
      loi.push('SC.COURSE rỗng hoặc không hợp lệ');
    } else {
      const phanCuoi = course[course.length - 1];
      const coFree = phanCuoi && Array.isArray(phanCuoi.lessons) && phanCuoi.lessons.some(b => b && b.id === 'free');
      if (!coFree) {
        loi.push(`phần cuối cùng của SC.COURSE ("${phanCuoi && phanCuoi.part}") không chứa bài "free"`);
      }
    }

    if (loi.length) return { dat: false, chiTiet: tomTatLoi(loi, 30) };
    return {
      dat: true,
      chiTiet: `bài th-h0 đủ 8 nét cơ bản, ${dsBaiHoaSo.length} bài th-h<số> phủ đủ 29 chữ hoa đúng thứ tự A → Y, ${dsBaiHoa.length} bài (${soBaiHoaThuong} cỡ Thường, ${soBaiHoaNho} cỡ Nhỏ) đúng cỡ và đủ sổ tay, ${soChuoiHoa} chuỗi rep/pair dàn sạch không chứa f/j/w/z, phần cuối chứa bài free`,
    };
  });

  const tong = soDat + soHong;
  console.log(`\nTổng kết: ${soDat}/${tong} phép kiểm đạt${soHong ? `, ${soHong} phép kiểm hỏng` : ''}.`);
  if (soHong > 0) process.exit(1);
}

try {
  main();
} catch (e) {
  console.error('Lỗi khởi tạo phép kiểm Tiểu học: ' + e.message);
  process.exit(1);
}
