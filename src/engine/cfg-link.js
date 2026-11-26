/* ================== CẤU HÌNH VỞ TRONG ĐƯỜNG LINK ==================
   Dạng link: …/index.html#cfg=<mã>. Phần sau dấu # không được trình duyệt gửi lên máy chủ.
   Mã = chữ "z" + JSON nén (deflate-raw) viết theo base64url; trình duyệt không có CompressionStream
   thì dùng chữ "j" + JSON không nén. Cấu trúc cfg: docs/KIEN_TRUC.md mục 5.3. */
const LINK_CFG_TOI_DA = 8000;   // số ký tự tối đa của mã, chặn link quá dài hoặc bị sửa bậy

function b64urlTuByte(u8) {
  let s = ""; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function byteTuB64url(s) {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  const u8 = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i);
  return u8;
}
async function quaLuong(u8, luong) {
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(luong)).arrayBuffer());
}

async function maHoaCfg(cfg) {
  const json = new TextEncoder().encode(JSON.stringify(cfg));
  if (typeof CompressionStream === "function") return "z" + b64urlTuByte(await quaLuong(json, new CompressionStream("deflate-raw")));
  return "j" + b64urlTuByte(json);
}

async function giaiMaCfg(ma) {
  if (typeof ma !== "string" || ma.length < 2 || ma.length > LINK_CFG_TOI_DA || !/^[zj][A-Za-z0-9_-]+$/.test(ma))
    throw new Error("Đường link cấu hình không hợp lệ");
  if (ma[0] === "z" && typeof DecompressionStream !== "function") throw new Error("Trình duyệt này chưa mở được link nén, hãy cập nhật trình duyệt");
  let cfg;
  try {
    let u8 = byteTuB64url(ma.slice(1));
    if (ma[0] === "z") u8 = await quaLuong(u8, new DecompressionStream("deflate-raw"));
    cfg = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(u8));
  } catch (e) { throw new Error("Đường link cấu hình bị hỏng hoặc chép thiếu"); }
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) throw new Error("Đường link cấu hình không hợp lệ");
  return cfg;
}

async function duongLinkCfg(cfg) {
  return location.origin + location.pathname + "#cfg=" + await maHoaCfg(cfg);
}

/* Lúc mở app: link có #cfg= thì đổi kiểu chữ nếu cần (tải lại trang, giữ link),
   mở đúng bài rồi mở màn Xuất PDF đã điền sẵn tùy chọn. */
async function apDungCfgTuLink() {
  const m = location.hash.match(/^#cfg=([A-Za-z0-9_-]+)$/);
  if (!m) return;
  const boLink = () => window.history.replaceState(   // phải ghi window.: app có biến history riêng cho Hoàn tác
    null, "", location.pathname + location.search);
  let cfg;
  try { cfg = await giaiMaCfg(m[1]); }
  catch (e) { boLink(); toast(e.message); return; }
  if (cfg.script && cfg.script !== SCRIPT) {
    if (cfg.script === "td" || cfg.script === "qs") { GS.set("script", cfg.script); location.reload(); return; }
    boLink(); toast(`Bản này chưa có kiểu chữ "${cfg.script}"`); return;
  }
  boLink();
  let c;
  try { c = chuanHoaPdfCfg(cfg); }
  catch (e) { toast("Không mở được cấu hình: " + e.message); return; }
  const id = c.lessons[0], i = id ? LESSONS.findIndex(l => l.id === id) : -1;
  if ((c.scope === "bai" || c.scope === "phan") && i >= 0 && i !== cur.li) openLesson(i);
  Object.assign(pdfOpt, {
    preset: c.preset, wMm: c.wMm, hMm: c.hMm, mode: c.mode, grid: c.grid, arrows: c.arrows, barSide: c.barSide,
    scope: { bai: "cur", phan: "part", tatca: "all", luyenthem: "weak", tudo: "free" }[c.scope],
  });
  openPdfModal();
  toast("Đã mở cấu hình vở từ đường link");
}

/* Nút "Chép đường link cấu hình" trong màn Xuất PDF */
async function chepLinkCfg() {
  let link;
  try { link = await duongLinkCfg(pdfCfgTuManHinh()); }
  catch (e) { toast("Không tạo được đường link: " + e.message); return; }
  try { await navigator.clipboard.writeText(link); toast("Đã chép đường link cấu hình vở"); }
  catch (e) {
    const o = document.getElementById("pdfProg");
    if (o) { o.style.display = "block"; o.textContent = ""; const inp = document.createElement("input"); inp.value = link; inp.readOnly = true; inp.style.width = "100%"; o.appendChild(inp); inp.select(); }
    toast("Chưa chép tự động được, hãy chép đường link bên dưới");
  }
}
