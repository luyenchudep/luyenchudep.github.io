/* ================== HÀNH ĐỘNG CHO CÁC NÚT CỐ ĐỊNH TRONG app.html ==================
   Mỗi nút trong app.html có data-action="tên" (hoặc data-doi, data-nhan…) và hàm tương ứng ở đây.
   Cách gắn sự kiện chung: xem đầu file ui/khu.js. */

/* Đóng bảng dùng chung cho nhiều màn hình */
HANH_DONG.dongBang = () => closeSheets();
HANH_DONG.dongBangNen = (el, e) => { if (e.target === el) closeSheets(); };
HANH_DONG.dongPopNen = (el, e) => { if (e.target === el) closePop(); };

/* Thanh đầu, ghi chú và buổi tập */
HANH_DONG.moMenu = () => openMenu();
HANH_DONG.cheDo = el => setMode(el.dataset.chedo);
HANH_DONG.daTap = () => toggleDone();
HANH_DONG.hopViet = () => toggleZBox();
HANH_DONG.moAa = () => openAa();
HANH_DONG.moGhiChu = el => { el.classList.toggle("open"); setTimeout(resize, 30); };
HANH_DONG.buoiTiep = () => sessNext();
HANH_DONG.buoiKet = () => sessEnd();

/* Bảng bên, phóng to trang, chấm bài và đo nét */
HANH_DONG.tabBen = el => setSideTab(el.dataset.tab);
HANH_DONG.buocPhong = el => zoomStep(+el.dataset.d);
HANH_DONG.thuVe100 = () => resetZoom();
HANH_DONG.lamLai = () => redo();
HANH_DONG.chamBai = el => grade(el.dataset.dat === "1");
HANH_DONG.soSanh = () => toggleCompare();
HANH_DONG.moPhanTich = () => openScoreReport();

/* Hộp viết phóng to tự trượt */
HANH_DONG.hopTruot = el => zboxMove(+el.dataset.huong);
HANH_DONG.hopXuongDong = () => zboxNextLine();
HANH_DONG.hopCo = el => zboxScale(+el.dataset.d);

/* Thanh công cụ dưới */
HANH_DONG.chuyenTrang = el => go(+el.dataset.huong);
HANH_DONG.moGom = () => eraserTap();
HANH_DONG.hoanTac = () => undo();

/* Bài tự do và ô chọn file ẩn */
HANH_DONG.layLaiTuDo = () => restoreCustomPrev();
HANH_DONG.luuTuDo = () => saveCustom();
HANH_DONG.luuHinhGiay = el => savePaper(el);
HANH_DONG.khoiPhucSaoLuu = el => restoreBackup(el);

