# Kiến trúc và kế hoạch phát triển ứng dụng Tập viết S Pen

Bản tài liệu 0.4 · Cập nhật 26/11/2026 · Áp dụng cho mã nguồn từ bản 0.10.3

Tài liệu này mô tả ứng dụng được tổ chức thế nào, dữ liệu nằm ở đâu, và các bản sắp tới sẽ làm gì. Ai muốn góp ý hay góp mã thì đọc tài liệu này trước.

## Mục lục

1. Mục tiêu
2. Các quyết định đã chốt
3. Hiện trạng bản 0.10.3
4. Kiến trúc bốn lớp
5. Dữ liệu
6. Hai cách dùng: tải vở làm sẵn và tự tạo vở
7. Tổ chức mã nguồn
8. Lộ trình
9. Quy ước chung
10. Danh sách kiểm tra chất lượng vở PDF

---

## 1. Mục tiêu

Ứng dụng phục vụ bốn nhu cầu, cùng dùng một bộ máy vẽ chữ:

| Nhu cầu | Cách đáp ứng |
|---|---|
| Luyện viết trực tiếp bằng bút cảm ứng | Màn hình tập viết (S Pen, bút của máy tính bảng) |
| Luyện viết trên máy đọc sách và máy tính bảng | Vở PDF đúng khổ màn hình (reMarkable, Boox, Kindle Scribe, iPad, Samsung Notes) |
| Luyện viết trên giấy | Vở PDF khổ A4, A5, in được bằng máy in đen trắng |
| Ghi chép hằng ngày | Trang ghi chép: dòng kẻ, kẻ chấm, kiểu Cornell |

Nguyên tắc nền: **một bộ máy vẽ, nhiều đầu ra.** Màn hình và vở PDF dùng chung một đoạn mã vẽ, nên hai bên không bao giờ lệch nhau.

## 2. Các quyết định đã chốt

| Quyết định |
|---|
| Có hai cách dùng: tải vở PDF làm sẵn ở mục Releases, hoặc tự chỉnh rồi tạo vở ngay trong ứng dụng |
| Bộ vở làm sẵn gồm 5 khổ: A4, A5, Samsung Notes, máy đọc sách tỷ lệ 3:4, máy đọc sách tỷ lệ 9:16 |
| Người dùng tự gõ được nội dung để tập (từ bản 0.11) |
| Người dùng dùng được phông chữ của mình (tệp .ttf, .otf). Tệp chỉ nằm trên máy người dùng, không gửi đi đâu |
| Giữ bộ xuất PDF dạng vectơ đang có, nâng cấp chứ không viết lại |
| Mã nguồn chia nhiều tệp cho dễ sửa, khi phát hành thì gộp lại thành một tệp HTML chạy được không cần mạng |
| Cỡ chữ tính theo milimét thật trên mọi khổ. Ba nút cỡ L, M, S giữ lại để chọn nhanh, mỗi nút ứng với một cỡ tính bằng mm |
| Mỗi kiểu chữ (thanh đậm, nét đều, tiểu học) có giáo trình riêng |
| Giáo trình tiểu học theo mẫu chữ viết trong trường tiểu học (Quyết định 31/2002/QĐ-BGD&ĐT), kiểu chữ đứng, nét đều. Chữ mẫu dựng từ đường tâm nét để tô được theo nét đứt |
| Dấu thanh đặt theo kiểu cũ: hòa, khỏe, thủy. Dùng viết tắt chuẩn (VD, SL), không dùng kiểu nhắn tin (ko, đc, vs) |
| Nét đi ngược lại trên nét cũ (như h, n, m: kéo sổ xuống rồi rê ngược lên uốn móc) được tính là nét riêng, có số riêng. Nét chỉ đổi hướng mà không đi lại trên nét cũ (như v) vẫn là một nét |
| Dấu râu của ơ, ư viết từ trên xuống |

## 3. Hiện trạng bản 0.10.3

| Thành phần | Tên trong mã | Tình trạng |
|---|---|---|
| Giáo trình hai kiểu chữ | `SCRIPTS` (`td` = thanh đậm, `qs` = nét đều) | Đã có, dạng dữ liệu |
| Đường đi của nét từng chữ | `DUCTUS` trong `SCRIPTS` | Đã soát và sửa số nét, thứ tự nét ở bản 0.10.2 |
| Số đo phông chữ | `FONTS` (Pinyon Script, Allura, Quicksand) | Đã có |
| Phông nhúng vào PDF | `PDFF` | Đã có, nhưng làm sẵn từ trước, chưa nạp được phông mới lúc đang chạy |
| Bộ xuất PDF vectơ | `assembleVectorPdf`, `PdfDoc` | Đã có: nhúng phông, tìm được chữ, mục lục chạm được |
| Khổ trang | `PDF_PRESETS`: rm2, rmpp, a4, a5 | Thiếu Samsung Notes và máy đọc sách tỷ lệ 9:16; số đo đang tính bằng pt |
| Tùy chọn xuất vở | `pdfOpt` | Đã có, nhưng chưa lưu được vào đường link |
| Bài tự do | bài `free`, nội dung `custom` | Đã có ở mức cơ bản |
| Hàm xuất vở | `generateWorkbookPdf()` | Chạy được, nhưng phải tạm đổi nhiều biến chung của ứng dụng rồi khôi phục. Đây là điểm yếu chính cần sửa ở bản 0.11 |
| Bút viết chậm | `revealGlyphLayer`, `revealOwnerMap` | Viết lại ở bản 0.10.2: tô theo vùng, luôn đủ 100% chữ |

## 4. Kiến trúc bốn lớp

```
LỚP 4 – GIAO DIỆN
  [Tập viết]          [Tạo vở PDF]          [Trang ghi chép]
        │                   │                       │
LỚP 3 – BỘ VẼ (cùng một cách vẽ trên canvas)
  Vẽ lên màn hình        │        Ghi lại thành PDF vectơ
        │                   │
LỚP 2 – BỘ MÁY DÀN TRANG
  exportPdf(cfg) → dòng kẻ, chữ mẫu, chữ mờ, chấm đặt bút, mũi tên, số trang
        │
LỚP 1 – DỮ LIỆU
  SCRIPTS (giáo trình, nét chữ, sổ tay) │ FONTS, PDFF │ PRESETS (mm) │ cfg (cấu hình vở)
```

Thay đổi chính ở bản 0.11: **lớp 2 nhận một gói cấu hình `cfg` duy nhất**, thay vì đọc các biến chung của ứng dụng. Nhờ vậy:

- Màn Tạo vở dựng `cfg` từ các nút chọn rồi gọi `exportPdf(cfg)`.
- Đường link chứa `cfg`, nên mở link ra là có đúng cấu hình.
- GitHub gọi `exportPdf(cfg)` với từng cấu hình chuẩn để tạo sẵn bộ vở.

## 5. Dữ liệu

### 5.1. Giáo trình

```
SCRIPTS[kiểu] = {
  name, font, XH: {L, M, S},        // chiều cao thân chữ theo 3 cỡ
  COURSE: [ { part, lessons: [ { id, t, z, note, rows, up, dn } ] } ],
  STROKES,  // hình các nét cơ bản
  DUCTUS,   // đường đi của nét từng chữ, dùng cho bút viết chậm và mũi tên
  SOTAY,    // sổ tay từng bài: [ý chính, [cách làm], [lỗi hay gặp]]
  NHAPMON,  // phần lý thuyết nhập môn
  WORDS     // từ ví dụ cho từng chữ cái
}
```

Kiểu dòng trong `rows`: `stroke` (nét), `pair` (cặp chữ, câu), `rep` (lặp chữ), `blank` (dòng trống).

Hiện có hai kiểu: `td` (Thanh đậm) và `qs` (Nét đều). Kiểu thứ ba `th` (Tiểu học) đang dựng, xem mục 5.1.1.

### 5.1.1. Giáo trình tiểu học (`th`)

Khác hai kiểu kia ở chỗ chữ mẫu không lấy từ phông mà vẽ từ **đường tâm nét**, nhờ vậy cho nét đứt để tô đúng kiểu vở tiểu học. Phông Playwrite VN chỉ dùng cho chữ người dùng tự gõ.

```
SCRIPTS.th = {
  name: "Tiểu học", font: "PW",     // PW = Playwrite VN, chỉ dùng cho chữ tự gõ
  CO: { thuong: 2, nho: 1 },        // số ô li ứng với 1 đơn vị chữ: cỡ Thường (cỡ vừa) và cỡ Nhỏ
  STROKES,  // nét cơ bản, cùng dạng với hai kiểu kia: { w, d: [["M",x,y], ["L",x,y], ["C",x1,y1,x2,y2,x,y]] }
  CHU,      // chữ mẫu vẽ từ đường tâm nét (dưới đây)
  DUCTUS,   // không ghi tay: dựng tự động từ CHU (lấy mẫu điểm trên đường cong), để dùng chung phần mũi tên và Xem viết chậm
  COURSE, SOTAY, NHAPMON, WORDS     // như hai kiểu kia, làm sau
}

CHU[chữ] = {
  rong,              // bề rộng chữ (đơn vị chữ)
  vao, ra,           // điểm nối với chữ đứng trước và chữ đứng sau [x, y]
  cach: [            // một hay nhiều cách viết; cách đầu tiên là mặc định
    { ten: "Cách 1",
      net: [ { loai: "congkin", d: [...], lien?: 1, dau?: 1 }, … ] }
  ]
}
```

- Tọa độ tính theo **đơn vị chữ**: 1 đơn vị = chiều cao chữ o. x qua phải, y lên trên, y = 0 là đường chân. Chữ đứng, không nghiêng.
- `loai` là tên nét cơ bản trong `STROKES` mà nét này thuộc về (VD `congkin`, `mocnguoc`), dùng để tô màu và giải thích "chữ a gồm nét cong kín và nét móc ngược".
- `lien: 1`: nét này viết tiếp từ nét trước, không nhấc viết. Theo quy ước ở mục 2, nét đi ngược lại trên nét cũ vẫn là nét riêng, có số riêng.
- `dau: 1`: dấu phụ (chấm của i, dấu mũ, dấu râu…).
- Điểm đặt viết là điểm đầu của nét đầu tiên; điểm dừng viết là điểm cuối của nét cuối cùng. Không ghi riêng.
- Chiều cao theo mẫu: b g h k l y = 2,5; t = 1,5; r s = 1,25; d đ p q = 2; còn lại = 1; chữ số = 2; dấu thanh nằm trong ô vuông cạnh 0,5.

Trong lúc chưa tách mã (trước bản 0.11), dữ liệu này nằm ở `thunghiem/tieuhoc-net.js` và xem thử bằng `thunghiem/tieuhoc-xem.html`. Khi tách mã, chuyển thành `src/data/scripts-th.js`.

Mỗi nét trong `DUCTUS` có dạng `{ r: [đoạn 1, đoạn 2, …], s: phía đặt mũi tên, mark?: 1 nếu là dấu phụ }`. Mỗi đoạn là danh sách điểm `[x, y]`, tính theo chiều cao thân chữ (x sang phải, y lên trên, y = 0 là đường chân). Các đoạn trong cùng một nét được viết liền, không nhấc bút.

### 5.2. Khổ trang (thay `PDF_PRESETS` ở bản 0.11)

Mọi số đo tính bằng **mm**. Bộ máy tự đổi sang pt (1 mm = 2,8346 pt).

| Mã | Tên | Khổ (mm) | Mục lục chạm được | Có trong bộ vở làm sẵn |
|---|---|---|---|---|
| a4 | Giấy A4 | 210 × 297 | Có | ✔ |
| a5 | Sổ tay A5 | 148 × 210 | Có | ✔ |
| sn | Samsung Notes | 70 × 140 | **Không** (Samsung Notes không mở được liên kết khi đang viết) | ✔ |
| rm2 | reMarkable 2, Boox 10,3″ | 157 × 209 | Có | ✔ (đại diện tỷ lệ 3:4) |
| rmpp | reMarkable Paper Pro | 179,7 × 239,6 | Có | |
| rmppm | reMarkable Paper Pro Move | 91,8 × 163,2 | Có | ✔ (đại diện tỷ lệ 9:16) |
| tunhap | Tự nhập | rộng × cao | Tùy chọn | |

Các hãng máy đọc sách không công bố khổ trang mẫu, nên số đo ở đây là do bên thứ ba đo. Mỗi khổ sẽ kèm một **trang kiểm tra** (thước 50 mm và 5 mức xám) để người dùng đo lại trên máy thật.

### 5.3. Gói cấu hình vở `cfg` (bản 0.11)

```
cfg = {
  v: 1,                         // phiên bản cấu trúc cfg
  script: "td" | "qs" | "th",   // kiểu chữ
  font: "PS" | "AL" | "QS" | "PW" | "user:<tên>",
  scope: "bai" | "phan" | "tatca" | "tugo" | "ghichep",
  lessons: ["n1", "n2"],        // khi chọn bài hoặc phần
  text: "…",                    // khi tự gõ nội dung
  mode: "to" | "nho",           // tô mờ dần / chép theo mẫu
  grid: "french" | "oly4" | "dong" | "cham" | "tron",
  z: "L" | "M" | "S",           // hoặc xhMm: 4.0 (cỡ tính theo mm)
  gray: 0..1,                   // độ đậm chữ mờ
  arrows: true | false,
  preset: "a4" | … | "tunhap", wMm, hMm,
  barSide: "left" | "right",
  links: true | false,
  a5x2: true | false            // in 2 trang A5 trên 1 tờ A4
}
```

**Đường link:** `…/index.html#cfg=<JSON nén, mã base64url>`. Phần nằm sau dấu `#` không được trình duyệt gửi lên máy chủ, nên nội dung người dùng tự gõ không lọt ra ngoài.

### 5.4. Phông chữ của người dùng (bản 0.12)

| Mục | Cách làm |
|---|---|
| Nạp phông | Người dùng chọn tệp .ttf hoặc .otf; tệp lưu trong bộ nhớ trình duyệt, không gửi đi đâu |
| Đọc phông | Cần thêm một thư viện đọc phông để lấy số đo chữ và dựng dữ liệu nhúng vào PDF |
| Kiểm tra đủ dấu | Trước khi dùng, kiểm tra phông có đủ 134 chữ cái tiếng Việt có dấu; thiếu chữ nào thì báo rõ |
| Mũi tên hướng nét | **Tắt**, vì đường đi của nét được làm riêng cho hình chữ của từng phông mẫu |
| Bộ vở làm sẵn | Không dùng phông của người dùng |

## 6. Hai cách dùng: tải vở làm sẵn và tự tạo vở

**Tải vở làm sẵn.** Bộ vở PDF đăng ở mục Releases, tên tệp theo mẫu `TapViet_<KieuChu>_<Kho>_v<phiên bản>.pdf`:

- 2 kiểu chữ × 5 khổ = 10 vở tập viết
- Trang ghi chép (dòng kẻ, kẻ chấm) cho cả 5 khổ
- Trang kiểm tra cho cả 5 khổ

Trang cuối mỗi vở có đường link (kèm mã QR) **Mở cấu hình này trong ứng dụng**, để ai muốn chỉnh thêm thì chuyển sang tự tạo vở.

**Tự tạo vở.** Màn Tạo vở cho chọn mọi mục trong `cfg`, có nút sao chép đường link để chia sẻ cấu hình.

**Cách tạo bộ vở làm sẵn:**

1. Danh sách cấu hình chuẩn nằm trong tệp `release/bo-chuan.json`.
2. GitHub Actions mở ứng dụng bằng Chrome chạy ngầm, gọi `exportPdf(cfg)` cho từng cấu hình rồi lưu tệp.
3. Đăng toàn bộ tệp lên Releases cùng số phiên bản.

Điều kiện: `exportPdf(cfg)` phải chạy được khi không mở giao diện.

## 7. Tổ chức mã nguồn (từ bản 0.11)

```
src/
  data/scripts-td.js, scripts-qs.js, scripts-th.js   // giáo trình
  data/fonts.js, pdff-*.js            // số đo phông, phông nhúng
  data/presets.js                     // khổ trang (mm)
  engine/layout.js                    // lớp 2: dàn trang
  engine/pdf-writer.js                // ghi lệnh vẽ thành PDF
  ui/practice.js, ui/export.js, ui/notes.js
  app.html                            // khung giao diện
tools/build.js                        // gộp tất cả thành một tệp
index.html                            // tệp phát hành, chạy được không cần mạng
release/bo-chuan.json                 // danh sách cấu hình bộ vở làm sẵn
docs/KIEN_TRUC.md                     // tài liệu này
```

Người dùng vẫn nhận **một tệp HTML** như hiện nay.

## 8. Lộ trình

| Bản | Nội dung | Tiêu chí đạt |
|---|---|---|
| **0.11** | Tách mã thành nhiều tệp, có công cụ gộp | Tệp gộp chạy y như bản 0.10.3 |
| | `exportPdf(cfg)` không phụ thuộc biến chung | Xuất được PDF khi không mở giao diện |
| | Khổ trang tính theo mm, thêm Samsung Notes và tỷ lệ 9:16 | Thước 50 mm trong vở A4 in ra đo đúng ±0,5 mm |
| | Lưu và đọc cấu hình qua đường link | Mở link ra đúng cấu hình |
| | Màn Tạo vở mới, có ô tự gõ nội dung | Mọi mục của `cfg` đều chọn được |
| **0.12** | Ghép giáo trình Tiểu học vào app, chọn ngang hàng Thanh đậm và Nét đều | Tô theo nét đứt, xuất vở 4 ô li đúng mm |
| | Phông chữ của người dùng | Phông đủ dấu xuất PDF đúng; phông thiếu dấu được báo |
| | Trang kiểm tra; kiểu dòng kẻ trơn, kẻ chấm | Đạt danh sách kiểm tra ở mục 10 |
| | In 2 trang A5 trên 1 tờ A4 | Cắt đôi ra đúng khổ A5 |
| | Vẽ thêm khuyết trên cho l, h, k ở chữ thanh đậm | Chữ mẫu đúng kiểu viết thanh đậm truyền thống |
| **0.13** | Màn Trang ghi chép (dòng kẻ, kẻ chấm, Cornell) | Đạt mục 10 trên cả 5 khổ |
| | Mời người dùng thử trên reMarkable, Boox, iPad | Thu được số đo thật và độ xám phù hợp |
| **1.0** | GitHub tự tạo bộ vở làm sẵn, trang cuối có link và mã QR | Releases có đủ tệp, đúng tên |
| | Hướng dẫn dùng cho từng loại máy | |

## 9. Quy ước chung

1. **Không tự ý đổi cấu trúc dữ liệu** ở mục 5. Muốn đổi thì cập nhật tài liệu này trước.
2. **Chữ tiếng Việt:** có dấu đầy đủ; dùng từ thuần Việt, dễ hiểu; dấu thanh kiểu cũ (hòa, khỏe, thủy); viết tắt chuẩn.
3. **Số phiên bản** ghi ở `APP_VER`, `VERSION`, `README.md`, `CHANGELOG.md` và Releases; các chỗ này phải khớp nhau.
4. **Mỗi bản phát hành** đều ghi vào `CHANGELOG.md` bằng lời dễ hiểu với người dùng, không dùng thuật ngữ lập trình.
5. **Trước khi phát hành**, chạy lại các kiểm tra tự động: bút viết chậm tô đủ chữ, xuất vở PDF, mở ứng dụng không phát sinh lỗi.

## 10. Danh sách kiểm tra chất lượng vở PDF

| # | Hạng mục | Cách kiểm | Đạt khi |
|---|---|---|---|
| 1 | Khổ trang | Xem thuộc tính PDF | Đúng mm như bảng ở mục 5.2 |
| 2 | Kích thước thật | In A4 ở tỷ lệ 100%, đo thước 50 mm | 50 ± 0,5 mm |
| 3 | Dấu tiếng Việt | Xem các chữ ữ, ỷ, ặ, ộ, ờ ở mọi cỡ | Không mất dấu, dấu không chạm dòng kẻ phía trên |
| 4 | Chữ nối thanh đậm | So với màn hình ứng dụng | Giống nhau |
| 5 | Độ xám | Xem trang kiểm tra trên máy đọc sách | Thấy rõ ít nhất 4 trong 5 mức xám |
| 6 | Vùng thanh công cụ | Mở trên reMarkable, Boox | Thanh công cụ không che dòng viết |
| 7 | Mục lục | Chạm vào tên bài | Tới đúng trang (trừ khổ Samsung Notes) |
| 8 | Dung lượng | Xem kích thước tệp | Trọn bộ một kiểu chữ dưới 10 MB |
| 9 | Tên tệp | Xem tên | Đúng mẫu, có số phiên bản |
