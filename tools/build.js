#!/usr/bin/env node
/*
  Gộp mã nguồn trong src/ thành một file index.html chạy được không cần mạng.

  Cách dùng (chạy ở thư mục gốc của repo):
    node tools/build.js           gộp và ghi đè index.html
    node tools/build.js --check   chỉ kiểm: index.html có đúng là bản gộp từ src/ không (sai thì thoát với mã 1)

  Khuôn gộp là src/app.html. Mỗi dòng có dạng
    <!-- @include đường/dẫn -->
  được thay bằng nguyên nội dung file src/đường/dẫn. Không dùng thư viện ngoài.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const GOC = path.resolve(__dirname, '..');
const SRC = path.join(GOC, 'src');
const RA = path.join(GOC, 'index.html');
const MAU = /^<!-- @include (\S+) -->$/;

// Đọc file, đổi xuống dòng kiểu Windows (CRLF) về LF để kết quả giống nhau trên mọi máy
const doc = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

function gop() {
  const dong = doc(path.join(SRC, 'app.html')).split('\n');
  if (dong[dong.length - 1] === '') dong.pop();
  const daDung = new Set();
  let ra = '';
  for (const d of dong) {
    const m = d.match(MAU);
    if (!m) { ra += d + '\n'; continue; }
    const f = path.join(SRC, m[1]);
    if (!f.startsWith(SRC + path.sep)) throw new Error(`Đường dẫn ra ngoài src/: ${m[1]}`);
    if (!fs.existsSync(f)) throw new Error(`Không thấy file: src/${m[1]}`);
    if (daDung.has(m[1])) throw new Error(`File bị gộp hai lần: src/${m[1]}`);
    daDung.add(m[1]);
    let noi = doc(f);
    if (!noi.endsWith('\n')) noi += '\n';
    ra += noi;
  }
  // Báo file trong src/ chưa được gộp (thường là quên thêm dòng @include)
  const conLai = [];
  (function duyet(thuMuc) {
    for (const e of fs.readdirSync(thuMuc, { withFileTypes: true })) {
      const f = path.join(thuMuc, e.name);
      if (e.isDirectory()) duyet(f);
      else if (/\.(js|css)$/.test(e.name)) {
        const tuongDoi = path.relative(SRC, f).split(path.sep).join('/');
        if (!daDung.has(tuongDoi)) conLai.push(tuongDoi);
      }
    }
  })(SRC);
  if (conLai.length) throw new Error('Có file trong src/ chưa được gộp: ' + conLai.join(', '));
  return ganCsp(ra);
}

/* Chính sách bảo mật nội dung (CSP): chỉ cho chạy đúng khối <script> của app, nhận ra bằng mã băm SHA-256.
   Mã chèn vào trang (VD qua link hay file sao lưu bị sửa) không chạy được, kể cả thuộc tính on…=.
   Style vẫn cho phép viết trực tiếp vì app dùng nhiều style="…" có giá trị tính lúc chạy; CSS không chạy được mã. */
function ganCsp(ra) {
  const CHO = '<!-- @csp -->\n';
  if (ra.split(CHO).length !== 2) throw new Error('Khuôn src/app.html phải có đúng một dòng <!-- @csp --> trong <head>');
  const khoi = [...ra.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (khoi.length !== 1 || ra.split('<script').length !== 2) throw new Error('App phải có đúng một khối <script> (để tính mã băm CSP)');
  const bam = require('crypto').createHash('sha256').update(khoi[0][1], 'utf8').digest('base64');
  const csp = [
    "default-src 'none'",
    `script-src 'sha256-${bam}'`,
    "style-src 'unsafe-inline'",
    'font-src data:',
    'img-src data: blob:',
    'manifest-src data:',
    "connect-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-src 'none'",
    "worker-src 'none'",
  ].join('; ');
  return ra.replace(CHO, `<meta http-equiv="Content-Security-Policy" content="${csp}">\n`);
}

try {
  const ra = gop();
  if (process.argv.includes('--check')) {
    const hienTai = fs.existsSync(RA) ? doc(RA) : '';
    if (hienTai !== ra) {
      console.error('index.html KHÁC bản gộp từ src/. Hãy sửa trong src/ rồi chạy: node tools/build.js');
      process.exit(1);
    }
    console.log('index.html khớp với src/.');
  } else {
    fs.writeFileSync(RA, ra);
    console.log(`Đã gộp index.html (${(Buffer.byteLength(ra) / 1024).toFixed(0)} KB).`);
  }
} catch (e) {
  console.error('Lỗi khi gộp: ' + e.message);
  process.exit(1);
}
