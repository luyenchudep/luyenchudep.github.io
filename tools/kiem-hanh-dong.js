#!/usr/bin/env node
/*
  Kiểm cách gắn sự kiện trong src/ (để chính sách bảo mật nội dung CSP không chặn nút nào).

  Cách dùng (ở thư mục gốc của repo):  node tools/kiem-hanh-dong.js

  Báo lỗi (thoát với mã 1) khi:
    - còn thuộc tính on…="…" trong HTML hay chuỗi HTML (CSP sẽ chặn, nút bấm không chạy);
    - có data-action, data-doi, data-nhap, data-mo, data-nhan gọi một tên chưa có HANH_DONG.tên = … ;
    - còn đường link javascript: .
  Chỉ in cảnh báo khi tên hành động được ghép lúc chạy (VD data-action="${x}"): cần soát bằng mắt.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src');
const file = [];
(function duyet(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) duyet(f);
    else if (/\.(js|html)$/.test(e.name)) file.push(f);
  }
})(SRC);

const loi = [], canhBao = [];
const coDinh = new Set(), daDung = new Map();
const THUOC_TINH = /\s(on[a-z]+)\s*=\s*["'\\`$]/g;           // onclick="…", onclick=\"…\", onclick=${…}
const GOI = /data-(action|doi|nhap|mo|nhan)\s*=\s*\\?["']([^"'\\]*)\\?["']/g;
const GOI_JS = /dataset\.(action|doi|nhap|mo|nhan)\s*=\s*["']([^"']+)["']/g;
const DINH_NGHIA = /HANH_DONG(?:\.([A-Za-z_$][\w$]*)|\[\s*["']([^"']+)["']\s*\])\s*=/g;

for (const f of file) {
  const ten = path.relative(SRC, f).split(path.sep).join('/');
  // Bỏ chú thích /* … */ để không bắt nhầm chữ trong lời giải thích
  const t = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  const dong = i => t.slice(0, i).split('\n').length;
  for (const m of t.matchAll(THUOC_TINH)) loi.push(`${ten}:${dong(m.index)}: còn thuộc tính ${m[1]}=`);
  for (const m of t.matchAll(/javascript:/gi)) loi.push(`${ten}:${dong(m.index)}: còn link javascript:`);
  for (const m of t.matchAll(DINH_NGHIA)) {
    const tenHd = m[1] || m[2];
    if (coDinh.has(tenHd)) loi.push(`${ten}:${dong(m.index)}: HANH_DONG.${tenHd} được gán hai lần (cái sau đè cái trước)`);
    coDinh.add(tenHd);
  }
  for (const re of [GOI, GOI_JS]) for (const m of t.matchAll(re)) {
    const tenHd = m[2];
    if (tenHd.includes('${')) { canhBao.push(`${ten}:${dong(m.index)}: tên hành động ghép lúc chạy: ${tenHd}`); continue; }
    if (!daDung.has(tenHd)) daDung.set(tenHd, `${ten}:${dong(m.index)}`);
  }
}
for (const [tenHd, cho] of daDung) if (!coDinh.has(tenHd)) loi.push(`${cho}: chưa có HANH_DONG.${tenHd}`);

for (const c of canhBao) console.log('Cảnh báo: ' + c);
if (loi.length) {
  for (const l of loi) console.error('Lỗi: ' + l);
  console.error(`\n${loi.length} lỗi về cách gắn sự kiện.`);
  process.exit(1);
}
console.log(`Gắn sự kiện ổn: ${daDung.size} tên hành động, không còn thuộc tính on…=.`);
