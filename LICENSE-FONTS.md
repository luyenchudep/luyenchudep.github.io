# Giấy phép của các phông chữ

Tệp `index.html` có nhúng sẵn ba phông chữ. Phông nào cũng đã được cắt bớt, chỉ giữ những chữ ứng dụng cần dùng. Cả ba đều phát hành theo giấy phép **SIL Open Font License 1.1**, gọi tắt là OFL. Toàn văn giấy phép nằm trong thư mục [`licenses/`](licenses/).

Giấy phép MIT của mã nguồn **không** áp dụng cho các phông chữ này.

| Phông chữ | Dùng cho | Dòng bản quyền ghi trong phông | Giấy phép |
|---|---|---|---|
| Pinyon Script | Chữ thanh đậm (đã vẽ thêm khuyết trên cho l, h, k) | Copyright 2022 The PinyonScript Project Authors (https://github.com/SorkinType/Pinyon) | [`licenses/OFL-pinyonscript.txt`](licenses/OFL-pinyonscript.txt) |
| Allura | Chữ viết nhanh | Copyright 2010 The Allura Project Authors (https://github.com/googlefonts/allura) | [`licenses/OFL-allura.txt`](licenses/OFL-allura.txt) |
| Quicksand, nay mang tên **TV Sans** | Chữ nét đều và giao diện | Copyright 2019 The Quicksand Project Authors (https://github.com/andrew-paglinawan/QuicksandFamily.git), with Reserved Font Name "Quicksand" | [`licenses/OFL-quicksand.txt`](licenses/OFL-quicksand.txt) |

## Vì sao Quicksand phải đổi tên

Quicksand có một tên dành riêng (Reserved Font Name), chính là chữ "Quicksand". Điều 3 của OFL quy định: phông đã bị sửa thì không được dùng tên dành riêng đó. Cắt bớt chữ cũng tính là sửa, nên:

- Phông Quicksand trong ứng dụng đã được đổi tên thành **TV Sans**.
- Dòng bản quyền gốc vẫn giữ nguyên.
- TV Sans vẫn phát hành theo OFL 1.1 như bản gốc.

Pinyon Script và Allura không có tên dành riêng, nên vẫn giữ tên cũ.

## Pinyon Script đã được sửa

- Từ bản 0.15, ba chữ l, h, k được vẽ thêm nét khuyết trên, lấy theo khuyết của chữ b trong chính phông này; mọi chữ khác, bề ngang và khoảng cách chữ đều giữ nguyên.
- Phông vẫn giữ tên Pinyon Script vì Điều 3 của OFL chỉ cấm dùng tên dành riêng, còn Pinyon Script không có tên dành riêng.
- Bản đã sửa vẫn phát hành theo OFL 1.1 và giữ nguyên dòng bản quyền gốc.
- Bản gốc trước khi sửa lưu ở [`tools/font/goc/`](tools/font/goc/), công cụ sửa là [`tools/font/khuyet-pinyon.js`](tools/font/khuyet-pinyon.js), ai muốn kiểm hoặc làm lại đều được.

## Phông chữ trong vở PDF

Từ bản 0.10.0, vở PDF xuất từ ứng dụng có nhúng kèm các phông trên (Quicksand vẫn mang tên TV Sans), để chữ trong vở giống hệt chữ trong ứng dụng. OFL cho phép nhúng phông vào tài liệu, nên vở bạn xuất ra cứ thoải mái in, chia sẻ, kể cả đem bán.
