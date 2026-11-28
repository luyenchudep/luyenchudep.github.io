/* ================== VẼ TRANG GHI CHÉP VÀ TRANG KIỂM TRA CHO TẬP VIẾT PDF ==================
   Chứa hai hàm vẽ độc lập (không đọc biến chung của ứng dụng):
   - veTrangGhiChep(ctx, W, H, mm, o): vẽ trang kẻ dòng, kẻ chấm, Cornell hoặc 4 ô li trống.
   - veTrangKiemTra(ctx, W, H, mm, o): vẽ trang kiểm máy in và màn hình máy đọc sách.
   Mọi số đo trong file đều quy đổi qua tham số mm (số điểm ảnh ứng với 1 mm trên trang). */

/* Tạo chuỗi phông chữ 'QS' theo độ đậm và cỡ chữ tính bằng mm */
function tinhFontQS(dam, coMm, mm) {
  return `${dam} ${coMm * mm}px 'QS',sans-serif`;
}

/* Đổi số đo mm sang chuỗi tiếng Việt: số nguyên bỏ phần lẻ, số lẻ dùng dấu phẩy */
function tinhSoMm(so) {
  const n = Math.round(Number(so) * 100) / 100;
  return isFinite(n) ? String(n).replace(".", ",") : "";
}

/* Tách chuỗi thành nhiều dòng vừa trong bề rộng tối đa (tách theo khoảng trắng) */
function tinhDongChu(ctx, chu, rongToiDa) {
  const s = String(chu || "");
  if (!s || !(rongToiDa > 0)) return s ? [s] : [];
  if (ctx.measureText(s).width <= rongToiDa) return [s];
  const tu = s.split(" ");
  const dong = [];
  let hienTai = "";
  for (let i = 0; i < tu.length; i++) {
    const thu = hienTai ? `${hienTai} ${tu[i]}` : tu[i];
    if (hienTai && ctx.measureText(thu).width > rongToiDa) {
      dong.push(hienTai);
      hienTai = tu[i];
    } else {
      hienTai = thu;
    }
  }
  if (hienTai) dong.push(hienTai);
  return dong;
}

/* Vẽ chữ tự xuống dòng từ đường chân y; trả về đường chân của dòng cuối cùng */
function veChuXuongDong(ctx, chu, x, y, rongToiDa, buocDong) {
  const dong = tinhDongChu(ctx, chu, rongToiDa);
  if (!dong.length) return y;
  for (let i = 0; i < dong.length; i++) {
    ctx.fillText(dong[i], x, y + i * buocDong);
  }
  return y + (dong.length - 1) * buocDong;
}

/* Vẽ dòng đầu trang ghi chép: ngày tháng bên trái và số trang bên phải */
function veDauTrangGhiChep(ctx, W, mm, le, so, tong) {
  const y = le.t + 6 * mm;
  ctx.fillStyle = "#777777";
  ctx.font = tinhFontQS(500, 3.4, mm);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText("Ngày ...... / ...... / ............", le.l, y);
  if (so != null && tong != null) {
    ctx.textAlign = "right";
    ctx.fillText(`Trang ${so}/${tong}`, W - le.r, y);
    ctx.textAlign = "left";
  }
}

/* Vẽ các đường kẻ ngang song song từ x0 tới x1, bắt đầu ở yDau, không vượt yCuoi */
function veKeDong(ctx, x0, yDau, x1, yCuoi, buocPx, mm) {
  if (!(x1 > x0) || !(buocPx > 0) || yDau > yCuoi) return;
  ctx.strokeStyle = "#A8A8A8";
  ctx.lineWidth = 0.2 * mm;
  ctx.lineCap = "butt";
  ctx.beginPath();
  for (let i = 0; ; i++) {
    const y = yDau + i * buocPx;
    if (y > yCuoi) break;
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
}

/* Vẽ lưới chấm tròn đường kính 0,5 mm, canh giữa đều hai bên và trên dưới trong vùng kẻ */
function veKeCham(ctx, x0, y0, x1, y1, buocPx, mm) {
  if (!(x1 > x0) || !(y1 > y0) || !(buocPx > 0)) return;
  const r = 0.25 * mm;
  const soKhoangX = Math.floor((x1 - x0) / buocPx);
  const soKhoangY = Math.floor((y1 - y0) / buocPx);
  const sx = x0 + (x1 - x0 - soKhoangX * buocPx) / 2;
  const sy = y0 + (y1 - y0 - soKhoangY * buocPx) / 2;
  const tron = Math.PI * 2;
  ctx.fillStyle = "#888888";
  ctx.beginPath();
  for (let j = 0; j <= soKhoangY; j++) {
    const y = sy + j * buocPx;
    for (let i = 0; i <= soKhoangX; i++) {
      const x = sx + i * buocPx;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, tron);
    }
  }
  ctx.fill();
}

/* Vẽ trang ghi chép kiểu Cornell: 3 ô Câu hỏi, Ghi chép, Tóm tắt có dòng kẻ bên trong */
function veCornell(ctx, x0, y0, x1, y1, buocPx, mm) {
  if (!(x1 > x0) || !(y1 > y0)) return;
  const xC = x0 + 0.30 * (x1 - x0);
  const yS = y1 - 0.22 * (y1 - y0);
  const leTrong = 1.5 * mm;
  const cachTren = Math.max(buocPx, 8 * mm);
  const saiSo = 1e-6 * mm;

  /* Kẻ dòng bên trong cả 3 ô trước khi vẽ khung để đường khung đậm nằm trên cùng */
  veKeDong(ctx, x0 + leTrong, y0 + cachTren, xC - leTrong, yS - saiSo, buocPx, mm);
  veKeDong(ctx, xC + leTrong, y0 + cachTren, x1 - leTrong, yS - saiSo, buocPx, mm);
  veKeDong(ctx, x0 + leTrong, yS + cachTren, x1 - leTrong, y1 - saiSo, buocPx, mm);

  /* Nhãn góc trên trái từng ô */
  ctx.fillStyle = "#777777";
  ctx.font = tinhFontQS(600, 3, mm);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Câu hỏi", x0 + 2 * mm, y0 + 5 * mm);
  ctx.fillText("Ghi chép", xC + 2 * mm, y0 + 5 * mm);
  ctx.fillText("Tóm tắt", x0 + 2 * mm, yS + 5 * mm);

  /* Khung ngoài và hai đường chia ô */
  ctx.strokeStyle = "#555555";
  ctx.lineWidth = 0.35 * mm;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.moveTo(xC, y0);
  ctx.lineTo(xC, yS);
  ctx.moveTo(x0, yS);
  ctx.lineTo(x1, yS);
  ctx.stroke();
}

/* Vẽ lưới 4 ô li (1 ô li = 2 mm), phủ số nguyên ô lớn 8 mm từ góc trên trái (x0, y0) */
function veLuoiOLi(ctx, x0, y0, rong, cao, mm) {
  const li = 2 * mm;
  const oLon = 8 * mm;
  const soCotLon = Math.floor((rong + 1e-6 * mm) / oLon);
  const soHangLon = Math.floor((cao + 1e-6 * mm) / oLon);
  if (soCotLon <= 0 || soHangLon <= 0) return;

  const nCot = soCotLon * 4;
  const nHang = soHangLon * 4;
  const x1 = x0 + soCotLon * oLon;
  const y1 = y0 + soHangLon * oLon;

  ctx.lineCap = "butt";

  /* Đường li mảnh (bỏ qua vị trí trùng đường đậm mỗi 4 ô li) */
  ctx.strokeStyle = "#CFCFCF";
  ctx.lineWidth = 0.15 * mm;
  ctx.beginPath();
  for (let i = 1; i < nCot; i++) {
    if (i % 4 === 0) continue;
    const x = x0 + i * li;
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
  }
  for (let j = 1; j < nHang; j++) {
    if (j % 4 === 0) continue;
    const y = y0 + j * li;
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();

  /* Đường đậm mỗi 4 ô li (8 mm), bao gồm cả 4 cạnh ngoài của lưới */
  ctx.strokeStyle = "#8C8C8C";
  ctx.lineWidth = 0.25 * mm;
  ctx.beginPath();
  for (let i = 0; i <= soCotLon; i++) {
    const x = x0 + i * oLon;
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
  }
  for (let j = 0; j <= soHangLon; j++) {
    const y = y0 + j * oLon;
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
}

/* Vẽ thước ngang dài đúng 50 mm, vạch hướng xuống và số 0..5 cm bên dưới vạch 10 mm */
function veThuocNgang(ctx, x0, y0, mm) {
  ctx.strokeStyle = "#000000";
  ctx.lineCap = "butt";

  /* Đường thước chính */
  ctx.lineWidth = 0.3 * mm;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0 + 50 * mm, y0);
  ctx.stroke();

  /* Vạch chia từng 1 mm, 5 mm, 10 mm */
  ctx.lineWidth = 0.2 * mm;
  ctx.beginPath();
  for (let i = 0; i <= 50; i++) {
    const x = x0 + i * mm;
    const dai = (i % 10 === 0 ? 5 : i % 5 === 0 ? 3.5 : 2) * mm;
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y0 + dai);
  }
  ctx.stroke();

  /* Số cm canh giữa dưới vạch 10 mm */
  ctx.fillStyle = "#000000";
  ctx.font = tinhFontQS(500, 3, mm);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const ySo = y0 + 8.8 * mm;
  for (let cm = 0; cm <= 5; cm++) {
    ctx.fillText(String(cm), x0 + cm * 10 * mm, ySo);
  }
}

/* Vẽ thước dọc dài đúng 50 mm, vạch hướng qua trái và số 0..5 cm bên trái vạch 10 mm */
function veThuocDoc(ctx, x0, y0, mm) {
  ctx.strokeStyle = "#000000";
  ctx.lineCap = "butt";

  /* Đường thước chính */
  ctx.lineWidth = 0.3 * mm;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x0, y0 + 50 * mm);
  ctx.stroke();

  /* Vạch chia từng 1 mm, 5 mm, 10 mm hướng sang trái */
  ctx.lineWidth = 0.2 * mm;
  ctx.beginPath();
  for (let i = 0; i <= 50; i++) {
    const y = y0 + i * mm;
    const dai = (i % 10 === 0 ? 5 : i % 5 === 0 ? 3.5 : 2) * mm;
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 - dai, y);
  }
  ctx.stroke();

  /* Số cm nằm bên trái vạch 10 mm, canh giữa theo chiều dọc với vạch */
  ctx.fillStyle = "#000000";
  ctx.font = tinhFontQS(500, 3, mm);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  const xSo = x0 - 6.2 * mm;
  const lechGiua = 1.05 * mm;
  for (let cm = 0; cm <= 5; cm++) {
    ctx.fillText(String(cm), xSo, y0 + cm * 10 * mm + lechGiua);
  }
}

/* Vẽ một trang ghi chép (kẻ dòng, kẻ chấm, Cornell, 4 ô li trống); nền trang đã tô sẵn */
function veTrangGhiChep(ctx, W, H, mm, o) {
  if (!(mm > 0)) return;
  const tuy = o || {};
  const le = tuy.le || { l: 0, r: 0, t: 0, b: 0 };

  ctx.save();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  if (tuy.dauTrang) {
    veDauTrangGhiChep(ctx, W, mm, le, tuy.so, tuy.tong);
  }

  const x0 = le.l;
  const x1 = W - le.r;
  const y0 = tuy.dauTrang ? le.t + 10 * mm : le.t;
  const y1 = H - le.b;
  const buocMm = tuy.buoc > 0 ? tuy.buoc : (tuy.kieu === "cham" ? 5 : 8);
  const buocPx = buocMm * mm;

  if (x1 > x0 && y1 > y0) {
    if (tuy.kieu === "dong") {
      veKeDong(ctx, x0, y0 + buocPx, x1, y1 + 1e-6 * mm, buocPx, mm);
    } else if (tuy.kieu === "cham") {
      veKeCham(ctx, x0, y0, x1, y1, buocPx, mm);
    } else if (tuy.kieu === "cornell") {
      veCornell(ctx, x0, y0, x1, y1, buocPx, mm);
    } else if (tuy.kieu === "oly4") {
      veLuoiOLi(ctx, x0, y0, x1 - x0, y1 - y0, mm);
    }
  }

  ctx.restore();
}

/* Vẽ trang kiểm tra tỷ lệ in, mức xám, dấu tiếng Việt và mẫu lưới 4 ô li */
function veTrangKiemTra(ctx, W, H, mm, o) {
  if (!(mm > 0)) return;
  const tuy = o || {};
  const le = tuy.le || { l: 0, r: 0, t: 0, b: 0 };
  const x0 = le.l;
  const x1 = W - le.r;
  const rong = x1 - x0;

  ctx.save();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  /* 1. Tiêu đề và thông số khổ trang */
  const yTieuDe = le.t + 8 * mm;
  ctx.fillStyle = "#000000";
  ctx.font = tinhFontQS(700, 6, mm);
  ctx.fillText("Trang kiểm tra", x0, yTieuDe);

  ctx.fillStyle = "#444444";
  ctx.font = tinhFontQS(500, 3.4, mm);
  const tenKho = tuy.tenKho || "";
  const dongKho = `${tenKho} · ${tinhSoMm(tuy.wMm)} × ${tinhSoMm(tuy.hMm)} mm`;
  const yCuoiKho = veChuXuongDong(ctx, dongKho, x0, yTieuDe + 5.5 * mm, rong, 4.8 * mm);

  /* 2 & 3. Thước ngang 50 mm và thước dọc 50 mm sát lề phải */
  const yThuoc = yCuoiKho + 12 * mm;
  const xDoc = x1 - 10 * mm;
  const xTruocDoc = xDoc - 11 * mm;
  veThuocNgang(ctx, x0, yThuoc, mm);
  veThuocDoc(ctx, xDoc, yThuoc, mm);

  ctx.fillStyle = "#000000";
  ctx.font = tinhFontQS(500, 3.4, mm);
  ctx.textAlign = "left";
  const xChuThuoc = x0 + 56 * mm;
  const chuThuoc = "Thước này phải dài đúng 50 mm.";
  let yCuoiChuThuoc = yThuoc + 8.8 * mm;
  if (xTruocDoc - xChuThuoc >= 22 * mm) {
    yCuoiChuThuoc = veChuXuongDong(ctx, chuThuoc, xChuThuoc, yThuoc + 3.2 * mm, xTruocDoc - xChuThuoc, 4.8 * mm);
  } else {
    yCuoiChuThuoc = veChuXuongDong(ctx, chuThuoc, x0, yThuoc + 14 * mm, Math.max(20 * mm, xTruocDoc - x0), 4.8 * mm);
  }

  ctx.fillStyle = "#444444";
  ctx.font = tinhFontQS(500, 3, mm);
  const yGhiChuThuoc = Math.max(yThuoc + 14.5 * mm, yCuoiChuThuoc + 5.5 * mm);
  const ghiChuThuoc = 'In ở tỷ lệ 100% (kích thước thật), không chọn "Vừa trang". Lệch quá 0,5 mm là máy in hoặc trình xem đã co giãn trang.';
  const yCuoiThuoc = veChuXuongDong(ctx, ghiChuThuoc, x0, yGhiChuThuoc, Math.max(20 * mm, xTruocDoc - x0), 4.4 * mm);

  /* 4. Mức xám: 5 ô vuông 14 × 14 mm cách nhau 4 mm */
  const rongXam = (5 * 14 + 4 * 4) * mm;
  let yXam = yCuoiThuoc + 14 * mm;
  if (x0 + rongXam > xTruocDoc && yXam < yThuoc + 58 * mm) {
    yXam = yThuoc + 58 * mm;
  }
  ctx.fillStyle = "#000000";
  ctx.font = tinhFontQS(600, 3.4, mm);
  ctx.textAlign = "left";
  ctx.fillText("Mức xám", x0, yXam);

  const mauXam = ["#E6E6E6", "#BFBFBF", "#999999", "#666666", "#333333"];
  const nhanXam = ["10%", "25%", "40%", "60%", "80%"];
  const yO = yXam + 3 * mm;
  const canhO = 14 * mm;
  const buocO = 18 * mm;
  ctx.lineWidth = 0.2 * mm;
  ctx.lineCap = "butt";
  ctx.strokeStyle = "#000000";
  ctx.font = tinhFontQS(500, 3, mm);
  ctx.textAlign = "center";
  for (let i = 0; i < mauXam.length; i++) {
    const ox = x0 + i * buocO;
    ctx.fillStyle = mauXam[i];
    ctx.fillRect(ox, yO, canhO, canhO);
    ctx.strokeRect(ox, yO, canhO, canhO);
    ctx.fillStyle = "#000000";
    ctx.fillText(nhanXam[i], ox + canhO / 2, yO + canhO + 4.2 * mm);
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#444444";
  ctx.font = tinhFontQS(500, 3, mm);
  const yChuXam = yO + canhO + 9.2 * mm;
  const rongChuXam = yChuXam < yThuoc + 52 * mm ? Math.max(20 * mm, xTruocDoc - x0) : rong;
  const yCuoiXam = veChuXuongDong(ctx, "Máy đọc sách tốt thấy rõ cả 5 ô khác nhau.", x0, yChuXam, rongChuXam, 4.4 * mm);

  /* 5. Dấu tiếng Việt ở ba cỡ 4 mm, 6 mm, 8 mm */
  const yDau = yCuoiXam + 12 * mm;
  ctx.fillStyle = "#000000";
  ctx.font = tinhFontQS(600, 3.4, mm);
  ctx.fillText("Dấu tiếng Việt", x0, yDau);

  const mauDau = "ữ ỷ ặ ộ ờ ẫ ẳ ỹ Ở Ữ Ặ Ẫ";
  const coDau = [4, 6, 8];
  let yDongDau = yDau;
  for (let i = 0; i < coDau.length; i++) {
    const co = coDau[i];
    const buocDong = (co + 4) * mm;
    yDongDau += buocDong;
    ctx.font = tinhFontQS(500, co, mm);
    yDongDau = veChuXuongDong(ctx, mauDau, x0, yDongDau, rong, buocDong);
  }

  /* 6. Mẫu lưới 4 ô li (rộng 64 mm, cao 16 mm) */
  const yOLi = yDongDau + 10 * mm;
  ctx.fillStyle = "#000000";
  ctx.font = tinhFontQS(600, 3.4, mm);
  ctx.fillText("4 ô li (1 ô li = 2 mm)", x0, yOLi);
  veLuoiOLi(ctx, x0, yOLi + 3 * mm, Math.min(64 * mm, rong), 16 * mm, mm);

  /* 7. Chân trang */
  ctx.fillStyle = "#777777";
  ctx.font = tinhFontQS(500, 3, mm);
  ctx.textAlign = "left";
  const dongChan = tinhDongChu(ctx, "Dùng trang này để kiểm máy in và màn hình trước khi in cả tập.", rong);
  const buocChan = 4.2 * mm;
  const yChanCuoi = H - le.b - 4 * mm;
  for (let i = 0; i < dongChan.length; i++) {
    ctx.fillText(dongChan[i], x0, yChanCuoi - (dongChan.length - 1 - i) * buocChan);
  }

  ctx.restore();
}
