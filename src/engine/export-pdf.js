/* ================== exportPdf(cfg): XUẤT VỞ PDF TỪ MỘT GÓI CẤU HÌNH ==================
   Nhận một gói cấu hình cfg (docs/KIEN_TRUC.md mục 5.3), trả về file PDF. Không đọc bài đang mở,
   không đọc pdfOpt, không đụng giao diện: màn Xuất PDF, đường link cấu hình và GitHub Actions
   đều gọi chung hàm này.

   Còn một giới hạn: cfg.script phải trùng kiểu chữ app đang mở (SCRIPT), vì dữ liệu kiểu chữ
   được nạp một lần lúc khởi động. Muốn xuất kiểu khác thì đặt kiểu đó rồi tải lại trang.

   Dùng thử trong console:
     const r = await exportPdf({ script: SCRIPT, scope: "bai", lessons: ["n1"], preset: "a4" });
     r.blob, r.soTrang, r.tieuDe
*/
const TU_GO_TOI_DA = 2000;   // số ký tự tối đa của nội dung tự gõ (để đường link không quá dài)
const PDF_CFG_MAC_DINH = { v: 1, scope: "bai", lessons: [], mode: "to", grid: "french", arrows: true, preset: "rm2", barSide: "left" };

/* Kiểm và điền giá trị mặc định. Sai thì báo lỗi bằng lời dễ hiểu. */
function chuanHoaPdfCfg(cfg) {
  const c = Object.assign({}, PDF_CFG_MAC_DINH, cfg || {});
  if (c.v !== 1) throw new Error(`Không đọc được cấu hình phiên bản ${c.v}`);
  if (!c.script) c.script = SCRIPT;
  if (c.script !== SCRIPT) throw new Error(`Cấu hình dùng kiểu chữ "${c.script}" nhưng app đang mở kiểu "${SCRIPT}". Hãy đổi kiểu chữ rồi xuất lại.`);
  if (c.preset === "tunhap") khoTuNhap(c.wMm, c.hMm);   // báo lỗi nếu khổ tự nhập sai
  else if (!PDF_PRESETS[c.preset]) throw new Error(`Chưa có khổ giấy "${c.preset}"`);
  if (!["to", "nho"].includes(c.mode)) throw new Error(`Cách tập không hợp lệ: "${c.mode}"`);
  if (!["french", "oly4"].includes(c.grid)) throw new Error(`Kiểu dòng kẻ không hợp lệ: "${c.grid}"`);
  if (!["left", "right"].includes(c.barSide)) throw new Error(`Lề thanh công cụ không hợp lệ: "${c.barSide}"`);
  if (!["bai", "phan", "tatca", "luyenthem", "tudo", "tugo"].includes(c.scope))
    throw new Error(`Chưa hỗ trợ phạm vi "${c.scope}" (có: bai, phan, tatca, luyenthem, tudo, tugo)`);
  if (c.scope === "tugo") {
    c.text = typeof c.text === "string" ? c.text : "";
    if (!c.text.trim()) throw new Error("Chưa gõ nội dung để tập");
    if (c.text.length > TU_GO_TOI_DA) throw new Error(`Nội dung tự gõ dài quá ${TU_GO_TOI_DA} ký tự`);
  }
  c.arrows = c.arrows !== false;
  if (c.script === "th") c.grid = "oly4";   // Tiểu học luôn dùng lưới 4 ô li
  return c;
}

/* Chọn danh sách bài theo cfg. Phạm vi "luyenthem" dựng lại bài Luyện thêm / Bài ôn nên đổi vài biến
   chung; hàm gọi phải lưu và khôi phục các biến đó (exportPdf đã làm). */
function chonBaiPdf(c) {
  const timBai = id => {
    const l = LESSONS.find(x => x.id === id);
    if (!l) throw new Error(`Không có bài "${id}" trong giáo trình ${SC.name}`);
    return l;
  };
  if (c.scope === "bai") {
    if (!c.lessons.length) throw new Error("Chưa chọn bài nào");
    return c.lessons.map(timBai);
  }
  if (c.scope === "phan") {
    if (!c.lessons.length) throw new Error("Chưa chọn phần nào");
    const tenPhan = timBai(c.lessons[0]).part, p = COURSE.find(x => x.part === tenPhan);
    return p ? p.lessons.slice() : [timBai(c.lessons[0])];
  }
  if (c.scope === "tatca") return LESSONS.slice(0, NREAL);
  if (c.scope === "luyenthem") {
    if (WEAK.length) { luyenRounds = 1; buildLuyen(true); return [LUYEN]; }
    buildReview(true); return [REVIEW];
  }
  if (c.scope === "tugo") {
    /* Bài tạm từ nội dung tự gõ: mỗi dòng một dòng tập, dùng cỡ chữ và khoảng dòng của Bài tự do */
    const mau = LESSONS.find(l => l.id === "free") || {};
    const rows = c.text.split("\n").map(s => s.trim()).filter(Boolean).map(s => ["pair", s]);
    return [{ id: "tugo", t: "Nội dung tự gõ", part: "Tự gõ", z: mau.z || (SCRIPT === "th" ? "thuong" : "M"), up: mau.up, dn: mau.dn, note: "", rows }];
  }
  return [LESSONS.find(l => l.id === "free") || LESSONS[0]];   // "tudo"
}

async function exportPdf(cfg, tuyChon = {}) {
  const c = chuanHoaPdfCfg(cfg);
  const baoTienDo = typeof tuyChon.onProgress === "function" ? tuyChon.onProgress : () => {};
  pdfBusyFlag = true; exporting = true;

  /* Bộ vẽ còn đọc một số biến chung (khổ trang, giao diện, cài đặt). Tạm gán theo cfg rồi khôi phục nguyên vẹn. */
  const saveLR = luyenRounds, saveFL = frozenLuyen, saveFR = frozenReview, saveLRows = LUYEN.rows, saveRRows = REVIEW.rows;
  const saveTheme = S.theme, saveW = W, saveH = H, saveLayout = layout, saveT = T, saveSGrid = S.gridStyle, saveSArrows = S.rowArrows, saveSXBand = S.xBand, saveScale = S.scale, saveSTrace = S.trace;
  try {
    const pr = c.preset === "tunhap" ? khoTuNhap(c.wMm, c.hMm) : PDF_PRESETS[c.preset];
    /* Trang nhỏ hơn A5 (dưới 1240 điểm ảnh ngang): thu nhỏ chữ tiêu đề và lề theo tỷ lệ; các khổ cũ giữ nguyên (k = 1) */
    const k = Math.min(1, pr.pxW / 1240), px = v => v * k;
    const targetLessons = chonBaiPdf(c);

    const mctx = document.createElement("canvas").getContext("2d"), doc = new PdfDoc(); let ctx = null;
    const pdfTheme = pr.mono ? THEMES.eink : THEMES.light;

    /* Tạm gán thông số trang in */
    W = pr.pxW; H = pr.pxH; T = pdfTheme; S.theme = pr.mono ? "eink" : "light";
    S.gridStyle = c.grid; S.rowArrows = c.arrows; S.xBand = !pr.mono; S.trace = "dark";
    S.scale = pr.pxW >= 1500 ? 2.15 : 1.85;

    const padL = c.barSide === "left" ? pr.bar : px(68);
    const padR = c.barSide === "right" ? pr.bar : px(68);
    const padT = px(138), padB = px(86);

    /* Tạo trước danh sách trang cho từng bài học */
    const lessonJobs = [];
    let totalContentPages = 0;
    for (const l of targetLessons) {
      /* Tiểu học: thân chữ tính theo mm thật (1 ô li = 2 mm), các dòng 4 ô li nối liền nhau */
      const m = SCRIPT === "th" ? sizeForTHPdf(l, pr.pxW / pr.wMm) : sizeFor(l), F = m.F;
      let up = Math.max(l.up || F.asc + .25, F.asc + .05), dn = Math.max(l.dn || F.desc + .1, F.desc + .03);
      let unit = (up + dn) * m.fs + m.xh * (SCRIPT !== "td" ? .72 : .48);
      if (SCRIPT === "th") { const bd = thBuocDong(m.co); unit = bd.unit * m.fs; up = bd.up; }
      const perPage = Math.max(1, Math.floor((H - padT - padB) / unit));
      const avail = Math.max(200, W - padL - padR - 12);
      const rLayout = { m, padL, padR, padT, unit, perPage, up, safeSide: Math.min(padL, padR) };
      layout = rLayout;
      const lMode = l.id === "review" ? "nho" : c.mode;
      const groups = []; for (const r of lessonRows(l)) groups.push(...groupsFor(r, m, avail, lMode));
      if (l.id === "review") groups.forEach(g => g.forEach(row => { if (row.k === "hint") row.hide = 1 }));
      const lPages = []; let pg = [];
      for (const g of groups) {
        if (g.length > perPage) { if (pg.length) { lPages.push(pg); pg = [] } for (let k = 0; k < g.length; k += perPage) lPages.push(g.slice(k, k + perPage)); continue }
        if (pg.length + g.length > perPage && pg.length) { lPages.push(pg); pg = [] }
        pg.push(...g);
      }
      if (pg.length) lPages.push(pg);
      if (!lPages.length) lPages.push([]);
      for (const pgx of lPages) while (pgx.length < perPage) pgx.push({ k: "blank" });
      lessonJobs.push({ lesson: l, layout: rLayout, pages: lPages, startPageIdx: 0 });
      totalContentPages += lPages.length;
    }

    const needToc = lessonJobs.length > 1;
    const tocOffset = needToc ? 1 : 0;
    let runningIdx = tocOffset;
    for (const job of lessonJobs) { job.startPageIdx = runningIdx; runningIdx += job.pages.length }

    /* Tên nhóm bài ở trang mục lục và tên file: tên phần nếu mọi bài cùng một phần */
    const cungPhan = lessonJobs.every(j => j.lesson.part === lessonJobs[0].lesson.part);
    const tenNhom = c.scope === "tatca" ? "Cả giáo trình" : cungPhan ? lessonJobs[0].lesson.part : "Các bài đã chọn";

    const pdfPages = [];
    /* Trang 1: Mục lục có link bấm nhảy trang (cho reMarkable & Tablet) */
    if (needToc) {
      baoTienDo("Đang vẽ trang mục lục…");
      await new Promise(r => setTimeout(r, 10));
      ctx = new PdfCtx(doc, mctx);
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#000000"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
      ctx.font = `700 ${px(46)}px 'QS',sans-serif`;
      ctx.fillText(`TẬP VIẾT · ${SC.name.toUpperCase()}`, padL, px(130));
      ctx.font = `500 ${px(28)}px 'QS',sans-serif`; ctx.fillStyle = "#444444";
      ctx.fillText(`${tenNhom}  ·  ${pr.name}${pr.links ? "  ·  Chạm vào bài để chuyển tới trang đó" : ""}`, padL, px(176));
      ctx.strokeStyle = "#000000"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(padL, px(202)); ctx.lineTo(W - padR, px(202)); ctx.stroke();

      const links = [];
      const rowH = Math.min(px(82), Math.floor((H - px(300)) / Math.max(1, lessonJobs.length)));
      lessonJobs.forEach((job, idx) => {
        const yTop = px(230) + idx * rowH, yBase = yTop + rowH * 0.66;
        ctx.fillStyle = idx % 2 === 0 ? "#F7F7F7" : "#FFFFFF";
        ctx.fillRect(padL, yTop, W - padL - padR, rowH - 8);
        ctx.strokeStyle = "#CCCCCC"; ctx.lineWidth = 1.5; ctx.strokeRect(padL, yTop, W - padL - padR, rowH - 8);
        ctx.fillStyle = "#000000"; ctx.font = `700 ${px(28)}px 'QS',sans-serif`; ctx.textAlign = "left";
        ctx.fillText(`${idx + 1}. ${job.lesson.t}`, padL + px(24), yBase);
        ctx.fillStyle = "#444444"; ctx.font = `600 ${px(24)}px 'QS',sans-serif`; ctx.textAlign = "right";
        ctx.fillText(`Trang ${job.startPageIdx + 1}${pr.links ? "  →" : ""}`, W - padR - px(24), yBase);
        /* Chuyển tọa độ sang PDF (gốc dưới trái) cho Annotation Link */
        const x1 = (padL / W) * pr.ptW, x2 = ((W - padR) / W) * pr.ptW;
        const y2 = pr.ptH - (yTop / H) * pr.ptH, y1 = pr.ptH - ((yTop + rowH - 8) / H) * pr.ptH;
        if (pr.links) links.push({ rect: [x1, y1, x2, y2], targetPage: job.startPageIdx });
      });
      ctx.textAlign = "center"; ctx.fillStyle = "#666666"; ctx.font = `500 ${px(22)}px 'QS',sans-serif`;
      ctx.fillText(`Làm bằng ứng dụng Tập viết S Pen, bản ${APP_VER} · ${today()}`, W / 2, H - px(42));
      ctx.textAlign = "left";
      pdfPages.push({ content: ctx.out.join("\n"), links });
    }

    let donePages = 0;
    for (const job of lessonJobs) {
      layout = job.layout;
      const { m, unit, up } = layout;
      for (let pi = 0; pi < job.pages.length; pi++) {
        donePages++;
        baoTienDo(`Đang vẽ trang ${donePages}/${totalContentPages} (${job.lesson.t})…`);
        await new Promise(r => setTimeout(r, 8));
        ctx = new PdfCtx(doc, mctx);
        ctx.fillStyle = T.paper; ctx.fillRect(0, 0, W, H);
        /* Tiêu đề trang vở */
        ctx.fillStyle = "#000000"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
        ctx.font = `700 ${px(32)}px 'QS',sans-serif`;
        const liIdx = LESSONS.indexOf(job.lesson);
        const hTitle = liIdx >= 0 && liIdx < NREAL ? `Bài ${liIdx + 1} · ${job.lesson.t}` : job.lesson.t;
        ctx.fillText(hTitle, padL, px(66));
        ctx.font = `500 ${px(22)}px 'QS',sans-serif`; ctx.fillStyle = "#444444";
        ctx.fillText(`${SC.name} · ${job.lesson.id === "review" ? "Bài ôn" : c.mode === "to" ? "Tô" : "Chép"} · ${c.grid === "oly4" ? "4 ô li Việt Nam" : "Lưới xiên Pháp"}`, padL, px(100));
        ctx.textAlign = "right";
        ctx.fillText(`Trang ${donePages + tocOffset}/${totalContentPages + tocOffset}${needToc && pr.links ? "  ·  ↑ Mục lục" : ""}`, W - padR, px(66));
        ctx.textAlign = "left";
        ctx.strokeStyle = "#CCCCCC"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(padL, px(116)); ctx.lineTo(W - padR, px(116)); ctx.stroke();

        /* Vẽ dòng kẻ + chữ mẫu / tô / dấu chấm */
        const rows = job.pages[pi];
        rows.forEach((row, ri) => {
          const b = padT + ri * unit + up * m.fs;
          guides(ctx, b, m, padL - 10, W - padR + 10);
          drawRow(ctx, row, b, m, job.lesson.id === "review" ? "nho" : c.mode);
        });
        if (job.lesson.cornell) { /* khung 3 ô: câu hỏi | ghi chép, tóm tắt ở dưới */
          const xL = padL + (W - padL - padR) * .28, yT = padT - 6, yS = padT + Math.floor(rows.length * .72) * unit, yB = padT + rows.length * unit;
          ctx.strokeStyle = "#555555"; ctx.lineWidth = 2.4; ctx.beginPath();
          ctx.moveTo(xL, yT); ctx.lineTo(xL, yS); ctx.moveTo(padL - 10, yS); ctx.lineTo(W - padR + 10, yS); ctx.stroke();
          ctx.fillStyle = "#666666"; ctx.font = "600 20px 'QS',sans-serif"; ctx.textAlign = "left";
          ctx.fillText("Câu hỏi", padL, yT - 6); ctx.fillText("Ghi chép", xL + 12, yT - 6); ctx.fillText("Tóm tắt", padL, yS + 26);
          ctx.strokeStyle = "#BBBBBB"; ctx.lineWidth = 1.5; ctx.strokeRect(padL - 10, yT, W - padL - padR + 20, yB - yT);
        }
        /* Ghi chú chân trang */
        if (job.lesson.note) {
          ctx.fillStyle = "#555555"; ctx.font = `500 ${px(20)}px 'QS',sans-serif`; ctx.textAlign = "left";
          ctx.fillText("Gợi ý: " + job.lesson.note, padL, H - px(36));
        }
        /* Nút bấm góc trên phải để quay về Trang 1 Mục lục trên reMarkable */
        const backLinks = needToc && pr.links ? [{ rect: [((W - padR - 220) / W) * pr.ptW, pr.ptH - (95 / H) * pr.ptH, ((W - padR) / W) * pr.ptW, pr.ptH - (25 / H) * pr.ptH], targetPage: 0 }] : [];
        pdfPages.push({ content: ctx.out.join("\n"), links: backLinks });
      }
    }

    baoTienDo("Đang tạo file PDF…");
    await new Promise(r => setTimeout(r, 10));
    const tieuDe = `Tập viết · ${SC.name} · ${lessonJobs.length > 1 ? tenNhom : lessonJobs[0].lesson.t}`;
    const blob = await assembleVectorPdf(doc, pdfPages, pr.ptW, pr.ptH, W, H, tieuDe);
    return { blob, soTrang: pdfPages.length, tieuDe, cfg: c };
  } finally {
    S.theme = saveTheme; W = saveW; H = saveH; layout = saveLayout; T = saveT; S.gridStyle = saveSGrid; S.rowArrows = saveSArrows; S.xBand = saveSXBand; S.scale = saveScale; S.trace = saveSTrace;
    luyenRounds = saveLR; frozenLuyen = saveFL; frozenReview = saveFR; LUYEN.rows = saveLRows; REVIEW.rows = saveRRows;
    pdfBusyFlag = false; exporting = false;
    pendingResize = false; resize();
  }
}
