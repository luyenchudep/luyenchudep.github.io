/* Khổ trang cho tập viết PDF, tính bằng mm (docs/KIEN_TRUC.md mục 5.2).
   - wMm, hMm: khổ giấy hoặc màn hình.
   - pxW, pxH: số điểm ảnh khi vẽ trang. Máy có độ phân giải công bố thì ghi đúng số đó;
     khổ giấy và khổ tự nhập tính theo PX_MOI_MM.
   - barPx: lề chừa cho thanh công cụ của máy (điểm ảnh).
   - mono: màn hình trắng đen; links: mục lục chạm được (Samsung Notes không mở được liên kết khi đang viết).
   Các hãng máy đọc sách không công bố khổ trang mẫu nên số đo ở đây do bên thứ ba đo; trang kiểm tra (sắp có) để người dùng đo lại. */
const PX_MOI_MM = 8;
const KHO_TRANG = {
  rm2:   { ten: "reMarkable 2",              ngan: "reMarkable 2", wMm: 157,   hMm: 209,   pxW: 1404, pxH: 1872, barPx: 126, mono: true,  links: true,  moTa: "157×209 mm · màn hình mực điện tử đen trắng" },
  rmpp:  { ten: "reMarkable Paper Pro",      ngan: "Paper Pro",    wMm: 179.7, hMm: 239.6, pxW: 1620, pxH: 2160, barPx: 138, mono: false, links: true,  moTa: "179,7×239,6 mm · màn hình mực điện tử màu" },
  rmppm: { ten: "reMarkable Paper Pro Move", ngan: "Pro Move",     wMm: 91.8,  hMm: 163.2, pxW: 954,  pxH: 1696, barPx: 116, mono: false, links: true,  moTa: "91,8×163,2 mm · máy nhỏ tỷ lệ 9:16" },
  a4:    { ten: "Giấy A4 (In ấn)",           ngan: "A4",           wMm: 210,   hMm: 297,   pxW: 1654, pxH: 2339, barPx: 76,  mono: false, links: true,  moTa: "210×297 mm · in sắc nét" },
  a5:    { ten: "Sổ tay A5",                 ngan: "A5",           wMm: 148,   hMm: 210,   pxW: 1240, pxH: 1754, barPx: 64,  mono: false, links: true,  moTa: "148×210 mm · gọn nhẹ" },
  sn:    { ten: "Samsung Notes",             ngan: "Samsung Notes", wMm: 70,   hMm: 140,   pxW: 560,  pxH: 1120, barPx: 34,  mono: false, links: false, moTa: "70×140 mm · mở bằng Samsung Notes để viết bằng S Pen; mục lục không chạm được" },
};
