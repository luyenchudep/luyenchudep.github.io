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
  boox103:   { ten: "BOOX 10,3\" (Go 10.3, Note Air)",      ngan: "BOOX 10,3\"",  wMm: 157.5, hMm: 210,   pxW: 1860, pxH: 2480, barPx: 142, mono: true,  links: true,  moTa: "157,5×210 mm · màn hình mực điện tử 300 PPI (Go 10.3, Note Air3 C, Note Air4 C)" },
  boox133:   { ten: "BOOX 13,3\" (Note Max, Tab X C)",      ngan: "BOOX 13,3\"",  wMm: 203.2, hMm: 270.9, pxW: 2400, pxH: 3200, barPx: 150, mono: true,  links: true,  moTa: "203,2×270,9 mm · màn hình mực điện tử lớn 13,3\" 300 PPI (Note Max, Tab X C)" },
  boox7:     { ten: "BOOX 7\" (Go 7, Go Color 7)",          ngan: "BOOX 7\"",     wMm: 107,   hMm: 142.2, pxW: 1264, pxH: 1680, barPx: 118, mono: true,  links: true,  moTa: "107×142,2 mm · máy đọc sách nhỏ gọn 7\" 300 PPI (Go 7, Go Color 7)" },
  scribe102: { ten: "Kindle Scribe 10,2\" (2022, 2024)",    ngan: "Scribe 10,2\"", wMm: 157.5, hMm: 210,  pxW: 1860, pxH: 2480, barPx: 142, mono: true,  links: true,  moTa: "157,5×210 mm · màn hình mực điện tử trắng đen 300 PPI" },
  scribe11:  { ten: "Kindle Scribe 11\" (2025, Colorsoft)", ngan: "Scribe 11\"",  wMm: 167.6, hMm: 223.5, pxW: 1980, pxH: 2640, barPx: 142, mono: true,  links: true,  moTa: "167,6×223,5 mm · Kindle Scribe 11\" 300 PPI (bản 2025 và Colorsoft)" },
  manta:     { ten: "Supernote Manta (10,7\")",             ngan: "Manta",        wMm: 162.6, hMm: 216.7, pxW: 1920, pxH: 2560, barPx: 140, mono: true,  links: true,  moTa: "162,6×216,7 mm · Supernote A5 X2 màn hình mực điện tử trắng đen 300 PPI" },
  nomad:     { ten: "Supernote Nomad (7,8\")",              ngan: "Nomad",        wMm: 118.9, hMm: 158.5, pxW: 1404, pxH: 1872, barPx: 130, mono: true,  links: true,  moTa: "118,9×158,5 mm · Supernote A6 X2 màn hình mực điện tử trắng đen 300 PPI" },
  ipad11:    { ten: "iPad 11\" (Gen 10, A16, Air, Pro)",    ngan: "iPad 11\"",    wMm: 157.8, hMm: 227.1, pxW: 1640, pxH: 2360, barPx: 104, mono: false, links: true,  moTa: "157,8×227,1 mm · iPad Gen 10/A16, Air 11\" và Pro 11\" (chuẩn 264 PPI)" },
  ipad13:    { ten: "iPad 13\" (Air 13\", Pro 12,9\"/13\")", ngan: "iPad 13\"",   wMm: 197,   hMm: 262.9, pxW: 2048, pxH: 2732, barPx: 114, mono: false, links: true,  moTa: "197×262,9 mm · iPad Air 13\", Pro 12,9\" và Pro 13\" (chuẩn 264 PPI)" },
  tab11:     { ten: "Galaxy Tab 11\" (Tab S9, S11)",        ngan: "Tab 11\"",     wMm: 147.4, hMm: 235.8, pxW: 1600, pxH: 2560, barPx: 108, mono: false, links: true,  moTa: "147,4×235,8 mm · máy tính bảng 11\" tỷ lệ 16:10 (Tab S9, S11)" },
  tab146:    { ten: "Galaxy Tab Ultra 14,6\"",              ngan: "Tab 14,6\"",   wMm: 195.9, hMm: 313.8, pxW: 1848, pxH: 2960, barPx: 104, mono: false, links: true,  moTa: "195,9×313,8 mm · màn hình lớn 14,6\" (Tab S9, S10, S11 Ultra)" },
  b5:        { ten: "Giấy B5 (JIS)",                        ngan: "B5",           wMm: 182,   hMm: 257,   pxW: 1456, pxH: 2056, barPx: 72,  mono: false, links: true,  moTa: "182×257 mm · khổ vở B5 phổ biến, in sắc nét" },
  letter:    { ten: "Giấy Letter (Mỹ)",                     ngan: "Letter",       wMm: 215.9, hMm: 279.4, pxW: 1727, pxH: 2235, barPx: 76,  mono: false, links: true,  moTa: "215,9×279,4 mm · khổ giấy chuẩn Bắc Mỹ (8,5×11 in)" },
};
