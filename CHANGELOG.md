# Những thay đổi qua từng bản

## Bản 0.10.4 (26/11/2026): nhấn vừa tay là ra nét đậm, học liền mạch hơn

### Viết nhẹ tay hơn, đỡ mòn ngòi S Pen

- Trước đây muốn có nét đậm phải đè S Pen gần hết lực, khác hẳn Samsung Notes. Viết lâu dễ mỏi tay, và Samsung cũng khuyên không nên ấn mạnh vì ngòi bút có thể bị biến dạng. Nay chỉ cần nhấn vừa tay là nét đã đậm đủ, còn nét đưa lên nhẹ tay vẫn mảnh như sợi chỉ.
- Phần chỉnh viết có thêm **Độ nhạy lực nhấn**: Nhẹ tay, Vừa (mặc định) và Mạnh tay.
- Nút mới **Đo lực tay của tôi**: bạn viết vài chữ bằng lực tay thoải mái, ứng dụng tự canh để lực đó ra vừa đủ nét đậm.
- Trang đã viết từ các bản trước vẫn giữ nguyên dáng nét.
- Sửa thêm vài lỗi nhỏ về lực nhấn: điểm S Pen báo lực bằng 0 không còn thành chấm mực đậm; rê viết chậm không còn làm mất chỗ chuyển từ nét mảnh sang nét đậm; nét vẽ trước khi bút tới (để đỡ trễ) nay đúng dáng ngòi vát; ô viết thử nhận lực giống hệt trang tập; góc nghiêng viết được tính đúng hơn khi cầm viết chéo.
- Bảng phân tích nét chỉ báo "gồng tay" khi bạn nhấn mạnh hơn mức cần để ra nét đậm.

### Học liền mạch hơn

- Xem mẫu một phần rồi bấm Tô hoặc Chép, ứng dụng đưa bạn tới đúng trang của phần vừa xem. Trước đây ứng dụng vẫn để bạn ở trang cũ, phải bấm Sau nhiều lần mới tới.
- Mở Xem khi đang tập giữa bài, bảng tự chạy đúng nét hoặc chữ của trang đang tập.
- Đổi qua lại giữa Tô và Chép vẫn ở đúng phần đang tập.
- Nút **Tô phần này** và **Chép** nằm ngay dưới khung chạy chữ mẫu.
- Mở lại một bài chưa xong từ Danh mục thì vào đúng chỗ đang tập dở.

### Từ ngữ gần gũi hơn

- Cách gọi được thống nhất trong toàn ứng dụng, ví dụ các loại viết nay là viết máy, viết gel, viết lông, viết chì; công cụ xóa là **Gôm**; file xuất ra là **tập viết PDF**.
- Lời trong bài và trong các thông báo được viết lại cho tự nhiên, dễ đọc hơn.
- Tên các bước học thống nhất là **Xem, Tô, Chép, Bài ôn**; phần chạy chữ mẫu gọi là **Xem viết chậm**.
- Truyện Kiều, tục ngữ và các câu tiếng Pháp giữ nguyên.

## Bản 0.10.3 (25/11/2026): viết êm tay hơn, bút viết chậm tô đủ nét

Bản này gộp luôn hai bản 0.10.1 và 0.10.2, vốn chưa đưa lên GitHub.

### Sửa các lỗi quan trọng

- Đang viết bằng S Pen mà lòng bàn tay tì xuống màn hình thì trước đây có thể xuất hiện một vạch lạ kéo vào nét, hoặc nét bị đứt khi nhấc tay. Lỗi này xảy ra cả khi đã bật **Chỉ nhận S Pen**. Giờ ứng dụng chỉ theo đúng cây bút đang viết, ở trang tập, hộp viết phóng to lẫn ô Tự tô từng nét.
- Hộp viết phóng to trước đây chỉ dùng được một góc nhỏ của khung. Nay hộp giãn hết khung và tự chỉnh lại khi xoay máy hay chia đôi màn hình.
- Tập cùng một bài trong cùng một ngày ở cả chữ thanh đậm lẫn chữ nét đều thì trang nhật ký của bên này đè lên bên kia. Nay mỗi kiểu chữ có trang nhật ký riêng.
- Đặt bút viết ngay lúc trang vừa mở có thể làm mất nét đã viết ở các trang khác của cùng bài. Nay nét viết trong lúc đó được giữ lại và gộp vào.
- Khôi phục từ tệp sao lưu xong, bài đang mở trên máy không còn ghi đè ngược lên dữ liệu vừa khôi phục.

### Bút viết chậm và thứ tự nét

- Bút viết chậm nay tô đủ cả chữ, phần nào hiện ra đúng lúc bút đi qua. Trước đây các nét mảnh của b, f, C, G, J, N, Q, S, Y… chỉ hiện ra khi đã viết xong.
- Nét móc được tách thành nét riêng, có số riêng: h, n, m, r, u ở chữ nét đều; m, n ở chữ thanh đậm. Ví dụ chữ h nét đều nay có 2 nét: nét sổ và nét móc.
- Chữ nét đều k, K, R có thêm nét riêng ở chỗ phải nhấc bút.
- Chữ nét đều E, F: viết nét sổ trước, rồi các nét ngang từ trái sang phải.
- Chữ thanh đậm I, J: vòng phía trên viết liền một nét, trước thân chữ. Chữ N hoa viết nét lượn trước tiên.
- Dấu râu của ơ, ư, Ơ, Ư (kể cả khi có thêm dấu thanh) nay viết từ trên xuống.
- Chấm i, chấm j, gạch t, gạch f, mũ và dấu sắc của ấ nay được nhận đúng là dấu phụ, nên không còn hiện chấm dừng bút thừa.

### Bài học

- Bài 10 của chữ thanh đậm đổi tên thành **Thân cao l h k, khuyết trên b f**. Lý do: chữ mẫu viết l, h, k bằng thân thẳng, chỉ b và f mới có khuyết. Tiến độ đã tập của bài này vẫn giữ nguyên.
- Lời trong giáo trình được sửa cho tự nhiên hơn, ví dụ: "Vị trí dấu" thành **Chỗ đặt dấu**, "Địa danh" thành **Tên đất**, "Chữ giản lược nét" thành **Chữ bớt nét**, "Câu ngắn song ngữ" thành **Câu ngắn Việt – Anh**, "giao nhau" thành **cắt nhau**.
- Sổ tay của ba bài ghi chép (Chia mục và nhấn ý, Viết tắt và ngày tháng, Biên bản và việc cần làm) được viết riêng cho từng bài, không còn chép lại sổ tay của bài trước.
- "200k" trong bài Số liệu đổi thành "200.000đ".

### Các sửa lỗi khác

- Bấm **Đạt** nhiều lần liền trên cùng một trang không còn đẩy lịch ôn lên tận 14–30 ngày.
- Chạm vào ô điểm hoặc tẩy vào chỗ trống không còn làm mất nút Làm lại.
- Xuất vở PDF: trong lúc đang tạo vở, các nút tùy chọn bị khóa, nên vở không còn bị lẫn hai kiểu. Mục Luyện thêm không còn bị lặp lại nhiều vòng trong vở.
- Lưu ảnh Kiểm tra trên giấy: nếu không lưu được thì ứng dụng báo rõ, thay vì vẫn báo đã lưu.
- Xoay máy khi bút còn đang chạm màn hình: nét được chốt lại, không còn bị lệch dòng.
- Bấm Xem hai lần liền không còn làm chồng hai hoạt hình lên nhau. Xoay máy khi đang Tự tô từng nét thì ô tô được vẽ lại cho khớp.
- Khi đang Tự tô từng nét mà để yên, ứng dụng không còn vẽ lại liên tục nữa, đỡ tốn pin. Nhật ký chỉ tải ảnh khi bạn cuộn tới.
- Màu giấy Đen trắng (dùng cho máy đọc sách): mũi tên, chấm đặt bút, đầu bút, khung hộp phóng to và phần chú giải đều chuyển sang màu đen cho dễ nhìn.
- Trên màu giấy Sáng, viền quanh số thứ tự nét không còn bị màu vàng kem.
- Ở các bài viết nhanh, chấm xanh đặt bút không còn lệch khỏi chữ mẫu, và Bài ôn không còn lẫn chữ của các bài này.
- Ở trang đầu của Bài ôn và Luyện thêm, nút Trước được làm mờ đúng như các bài khác.
- Buổi tập bỏ dở từ hôm trước tự kết thúc, không còn hiện kiểu "1440/15 phút".
- Tiếng giấy không còn kêu mãi sau khi chụm hai ngón để phóng to.
- Ô thử bút ở mục Kiểm tra cảm biến S Pen không còn hiện vạch nối lạ khi kéo bút ra ngoài ô.
- Sửa chữ trong giao diện: "đường cơ sở" thành **đường chân**, "Độ mượt vận động" thành **Độ mượt nét viết**, "Tách đôi màn hình" thành **Chia đôi màn hình**, và lời nhắc kiểm tra chữ trên giấy nay chỉ đúng đường vào **☰ → Công cụ → Kiểm tra trên giấy**.

### Còn hạn chế

- Bản này mới được kiểm tra tự động trên Chrome. Rất cần người thử trên máy thật, nhất là việc tì tay khi viết trên Galaxy S23, S24 Ultra và máy tính bảng.
- Vở PDF chưa có khổ cho Samsung Notes và reMarkable Paper Pro Move. Phần này dự kiến có ở bản 0.11.

## Bản 0.10.0 (24/11/2026): vở PDF sắc nét

### Có gì mới

- Vở PDF không còn là ảnh chụp từng trang. Đường kẻ, chữ mẫu, chấm đặt bút và mũi tên giờ đều là nét vẽ thật, phông chữ được nhúng kèm trong tệp.
- In ra giấy hay phóng to trên máy, nét vẫn sắc, không còn nhòe quanh các nét mảnh.
- Tệp nhẹ hơn hẳn: một phần vở 37 trang trước đây nặng khoảng 16 MB, nay chỉ còn khoảng 0,4 MB.
- Chọn, sao chép và tìm được chữ trong vở.
- Đổi tiêu đề trang thành "Tập viết chữ đẹp tiếng Việt bằng S Pen và bút cảm ứng" và thêm phần mô tả, để dễ tìm thấy trên Google. Khi gửi đường dẫn qua Zalo hay Facebook, tin nhắn sẽ hiện kèm ảnh giới thiệu.

### Sửa lỗi

- Trước đây, nếu đang để giao diện Tối mà xuất vở, các chấm số thứ tự nét trong vở bị dính nền tối. Giờ vở luôn in màu sáng.
- Hai phần của phông Quicksand trong ứng dụng vẫn còn mang tên gốc. Nay cả hai đã đổi thành TV Sans cho đúng giấy phép phông.

## Bản 0.9.0 (24/11/2026): bản thử nghiệm đầu tiên

Lần đầu đưa ứng dụng lên GitHub.

### Có gì trong bản này

- Hai bộ bài tập: chữ thanh đậm 45 bài, chữ nét đều 37 bài. Chữ cái tiếng Việt nào cũng có hướng dẫn thứ tự nét, kể cả chữ mang hai dấu chồng lên nhau.
- Các bước tập: xem mẫu, tự tô từng nét, tô theo chữ mờ dần, chép lại, rồi ôn theo lịch sau 1, 3, 7, 14 và 30 ngày.
- Bút viết chậm chạy đều tay, phía sau có bóng chữ mờ.
- Tự tô từng nét: ứng dụng xem chỗ đặt bút, hướng kéo và đường đi của từng nét.
- 6 loại bút, lưu được 4 cây bút hay dùng, chế độ Chỉ nhận S Pen, hộp viết phóng to tự dịch sang phải, chia đôi màn hình, chế độ tay trái và 4 màu giấy.
- Xuất vở PDF cho reMarkable, giấy A4 và sổ A5. Sao lưu và khôi phục bài viết.
- Ảnh chụp màn hình trong thư mục `anh/`.

### Còn hạn chế

- Mới kiểm tra tự động trên Chrome, chưa được nhiều người thử trên máy thật.
- Cách chấm điểm hình chữ và độ nhạy khi tự tô từng nét có thể còn phải chỉnh theo góp ý.
- Ở chữ nét đều, các nét ngắn như thân chữ "i" đang bị chấm hơi khắt khe.
