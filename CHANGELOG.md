# Những thay đổi qua từng bản

## Bản 0.12.0 (27/11/2026): thêm kiểu chữ Tiểu học, lưới 4 ô li và nối chữ theo mẫu

Bản này bổ sung kiểu chữ thứ ba là **Tiểu học** — chữ viết thường đứng, nét đều theo mẫu chữ dạy ở trường tiểu học — đứng ngang hàng với **Thanh đậm** và **Nét đều 10°** ngay ở mục đổi kiểu chữ. Từ bản này, mọi người dùng đều mở được trực tiếp mà không cần đường link thử nghiệm.

### Giáo trình Tiểu học 32 bài, 9 phần

- Đủ **29 chữ thường**, **10 chữ số**, **5 dấu thanh** và **14 nét cơ bản**, chia làm 9 phần theo đúng trình tự học: Làm quen (1 bài), Nét cơ bản (5 bài), Chữ số (3 bài), Chữ thường (12 bài), Dấu thanh (2 bài), Ghép tiếng (3 bài), Từ ngữ (2 bài), Chuyển sang cỡ Nhỏ (3 bài) và Bài tự do (1 bài).
- Kèm phần **Nhập môn** (tư thế ngồi, cách cầm viết ba ngón tay, cách nhìn lưới 4 ô li, gợi ý đồng hành cho ba mẹ) và **Sổ tay** hướng dẫn điểm đặt viết, chiều đưa viết và lỗi hay gặp cho từng bài.
- **Bài ôn** của kiểu Tiểu học chỉ dùng chữ tiếng Việt.

### Lưới 4 ô li, cỡ Thường, cỡ Nhỏ và tập viết PDF đúng 2 mm mỗi ô li

- **Lưới 4 ô li riêng** cho Tiểu học: các dòng nối liền nhau như vở thật, đường chân luôn là đường kẻ đậm.
- Hỗ trợ cả **cỡ Thường** (thân chữ 2 ô li) và **cỡ Nhỏ** (thân chữ 1 ô li). Ô li của hai cỡ bằng nhau, chữ cỡ Nhỏ bằng nửa cỡ Thường để bé chuyển cỡ dễ dàng.
- Chữ mẫu vẽ trực tiếp từ đường tâm nét: dòng mẫu là nét liền, dòng **Tô** là nét đứt mờ dần đúng kiểu vở tiểu học.
- **Tập viết PDF** của Tiểu học là nét vectơ sắc nét (cả nét liền lẫn nét đứt), giữ đúng **1 ô li = 2 mm** ở mọi khổ giấy (A4, A5, Samsung Notes…).

### Nối chữ trong tiếng, Xem viết chậm và tiện ích dùng chung

- **Nối chữ trong một tiếng** theo mẫu chữ tiểu học: nối liền mạch từ điểm dừng của chữ trước qua chữ sau (VD: *in, mi, tu, đi, nhà, chim, mẹ*); nối gọn sau chữ *b, v* (*bi, bé, vịt, vẽ*); hoặc **lia viết** hở nhẹ khi gặp chữ bắt đầu bằng nét cong kín hay dừng trong lòng chữ (*ba, ca, on, su, ra*). Viết xong thân chữ cả tiếng mới đặt dấu phụ và dấu thanh; giữa hai tiếng chừa khoảng rộng bằng một chữ *o*.
- **Xem viết chậm**, **Tự tô từng nét**, **mũi tên thứ tự nét**, chấm đặt viết và sơ đồ thứ tự nét trong bảng Xem đều hoạt động với kiểu Tiểu học. **Hộp viết phóng to** tự chỉnh mức phóng để luôn chứa trọn chữ cao 5 ô li và đuôi chữ xuống 3 ô li.
- **Đường link cấu hình** mở đúng kiểu Tiểu học khi chia sẻ tập viết.
- **Tiến độ, nhật ký luyện chữ và file sao lưu** được lưu riêng cho từng kiểu chữ, không lẫn giữa Thanh đậm, Nét đều 10° và Tiểu học.
- Hai kiểu **Thanh đậm** và **Nét đều 10°** giữ nguyên không đổi; tập viết PDF của hai kiểu này ra giống hệt bản 0.11.0.

### Chưa có ở bản này

- Chưa có **chữ hoa** và các chữ **f, j, w, z**. Khi gõ hoặc dán gặp những chữ này, ứng dụng báo rõ và bỏ qua (chữ hoa Tiểu học dự kiến có ở bản 0.13).
- **Xem viết chậm** và **mũi tên thứ tự nét** hiện còn chạy theo từng chữ, chưa nối liền cả tiếng.

### Dành cho người góp mã

- Dữ liệu giáo trình và đường tâm nét của kiểu Tiểu học nằm ở `src/data/scripts-th.js`; bộ vẽ chữ mẫu, ghép dấu thanh và nối chữ nằm ở `src/engine/th-render.js`.
- Thêm bộ phép thử tự động `node tools/kiem-tieuhoc.js` (10 phép kiểm dữ liệu, bộ vẽ và nối chữ), chạy tự động trên GitHub Actions.

## Bản 0.11.0 (26/11/2026): tạo tập viết PDF linh hoạt hơn, chia sẻ cấu hình qua đường link

### Màn Tạo tập viết PDF mới và thêm khổ giấy

- Màn "Xuất tập viết PDF" được làm lại thành **Tạo tập viết PDF** (thẻ trong Danh mục cũng đổi tên theo). Mọi lựa chọn nay nằm gọn trên một màn, dễ xem và chỉnh hơn.
- Chọn nội dung tập viết theo 7 cách: Bài này, **Chọn bài** (mới: đánh dấu nhiều bài từ danh sách chia theo phần), Cả phần, **Cả giáo trình** (mới: gom cả bộ bài vào một file có mục lục; VD chữ thanh đậm ra 173 trang), Luyện thêm, Bài tự do, và **Tự gõ** (mới: gõ hoặc dán tối đa 2.000 ký tự, mỗi dòng thành một dòng tập, không ghi đè lên Bài tự do).
- Thêm ba khổ giấy mới: **Samsung Notes** (70×140 mm, mở file bằng Samsung Notes để viết bằng S Pen; trang mục lục vẫn có nhưng không chạm để chuyển trang được, vì Samsung Notes không mở liên kết khi đang viết), **reMarkable Paper Pro Move** (91,8×163,2 mm), và **Tự nhập** kích thước rộng × cao từ 40 tới 500 mm.
- Khổ giấy reMarkable 2 và reMarkable Paper Pro nay khớp đúng kích thước màn hình tính bằng mm (trước lệch vài phần mười mm). Với trang khổ nhỏ, ứng dụng tự thu nhỏ chữ tiêu đề và lề cho vừa.

### Chia sẻ cấu hình tập viết qua đường link

- Nút mới **Chép đường link cấu hình này** tạo một đường link mang theo toàn bộ lựa chọn của bạn: khổ giấy, bài tập, Tô hay Chép, dòng kẻ, mũi tên, lề, kể cả danh sách bài đã chọn hay nội dung **Tự gõ**.
- Người nhận chỉ cần mở đường link là có sẵn đúng bài, đúng lựa chọn (ứng dụng tự đổi sang chữ thanh đậm hay nét đều nếu cần), chỉ việc bấm tạo file là xong.
- Toàn bộ cấu hình nằm ngay trong đường link, không gửi lên máy chủ nào. Nếu máy không cho chép tự động, đường link sẽ hiện trong một ô để bạn tự chép.
- Khi đường link bị hỏng hoặc chép thiếu, ứng dụng báo rõ để bạn biết và vẫn mở bình thường.

### Dành cho người góp mã

- Mã nguồn được chia thành nhiều file nhỏ trong thư mục `src/`, kèm công cụ gộp lại thành một file `index.html` như cũ (xem mục "Sửa mã nguồn" trong `README.md`). Ứng dụng vẫn chạy y như trước; tập viết PDF từ các lựa chọn cũ ra giống hệt bản 0.10.4.

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
