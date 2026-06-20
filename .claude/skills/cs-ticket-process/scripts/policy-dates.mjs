#!/usr/bin/env node
// policy-dates.mjs — máy tính NGÀY & ĐIỀU KIỆN policy (deterministic). Thay cho việc Claude
// tự nhẩm ngày + tra số trong cs-rules/draft-rules/personas. Chỉ tính TOÁN; phần diễn giải
// chính sách + tone vẫn do skill đọc text.
//
// Dùng (mọi tham số đều optional, thiếu cái nào thì bỏ qua phần đó):
//   node policy-dates.mjs --order-date 2026-06-10 --product-type flag \
//        --received-date 2026-06-18 --last-tracking-update 2026-06-12 \
//        --carrier usps --today 2026-06-21
//
// In JSON: business-day bucket, hạn refund/sửa/claim, lost-in-transit, ETA, dịp lễ gần nhất.

// ===================== CONFIG — SỬA Ở ĐÂY KHI POLICY ĐỔI =====================
const CFG = {
  refundWindowDays: { flag: 180, "non-flag": 30 }, // flag = 6 tháng; non-flag = 30 ngày (từ ngày NHẬN)
  claimContactDays: 3,        // phải liên hệ trong 3 ngày kể từ khi nhận để mở claim
  modifyWindowHours: 12,      // chỉ sửa đơn trong 12h sau đặt
  lostInTransitDays: { usps: 14, international: 20 }, // không update tracking quá X ngày = đủ điều kiện resend/refund
  // ETA tổng (business days) từ ngày đặt — nguồn flagwix.com
  eta: { "standard-us": [8, 12], "three-day": [4, 5], international: [11, 15] },
  // Bucket xử lý đơn UNFULFILLED theo business-day (draft-rules §A)
  unfulfilledBuckets: [
    { max: 2, label: "<3 ngày: đang production, tracking sớm" },
    { max: 6, label: "3-6 ngày: khẳng định đã ship out, tracking sẽ tới" },
    { max: 10, label: "7-10 ngày: vẫn nói đã ship, thêm lý do khéo + push đơn" },
    { max: Infinity, label: ">10 ngày: ESCALATE, cs-need-approval, human check fulfillment" },
  ],
  // Lịch dịp lễ 2026 (⚠️ CẬP NHẬT khi sang năm khác). major=true → trong 10 ngày trước thì nâng P1/P2.
  holidays2026: [
    { name: "New Year", date: "2026-01-01", major: false },
    { name: "Valentine's Day", date: "2026-02-14", major: false },
    { name: "St. Patrick's Day", date: "2026-03-17", major: false },
    { name: "Easter", date: "2026-04-05", major: false },
    { name: "Mother's Day", date: "2026-05-10", major: false },
    { name: "Memorial Day", date: "2026-05-25", major: true },
    { name: "Flag Day", date: "2026-06-14", major: false },
    { name: "Father's Day", date: "2026-06-21", major: false },
    { name: "4th of July (+250th)", date: "2026-07-04", major: true },
    { name: "Labor Day", date: "2026-09-07", major: false },
    { name: "Halloween", date: "2026-10-31", major: false },
    { name: "Veterans Day", date: "2026-11-11", major: true },
    { name: "Thanksgiving", date: "2026-11-26", major: false },
    { name: "Christmas", date: "2026-12-25", major: true },
  ],
  holidayProximityDays: 10, // trong vòng 10 ngày trước dịp major → nâng priority
};
// ============================================================================

function arg(n) { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined; }
const orderDate = arg("--order-date");
const receivedDate = arg("--received-date");
const productType = arg("--product-type") || "non-flag";
const lastTracking = arg("--last-tracking-update");
const carrier = (arg("--carrier") || "usps").toLowerCase();
const shipType = arg("--ship-type") || "standard-us";
const today = new Date(arg("--today") || new Date().toISOString().slice(0, 10));

const d = (s) => (s ? new Date(s) : null);
const days = (a, b) => Math.floor((b - a) / 86400000);
const hours = (a, b) => Math.floor((b - a) / 3600000);

// Đếm business days (Mon-Fri) giữa 2 ngày
function businessDays(from, to) {
  let n = 0; const cur = new Date(from);
  while (cur < to) { cur.setDate(cur.getDate() + 1); const w = cur.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}
function addBusinessDays(from, n) {
  const cur = new Date(from); let added = 0;
  while (added < n) { cur.setDate(cur.getDate() + 1); const w = cur.getDay(); if (w !== 0 && w !== 6) added++; }
  return cur;
}
const iso = (dt) => dt.toISOString().slice(0, 10);

const out = { today: iso(today) };

// 1. Business-day bucket cho đơn unfulfilled
if (orderDate) {
  const bd = businessDays(d(orderDate), today);
  const bucket = CFG.unfulfilledBuckets.find((b) => bd <= b.max);
  out.business_days_since_order = bd;
  out.unfulfilled_bucket = bucket.label;
}

// 2. Hạn refund (từ ngày NHẬN nếu có, nếu không thì tạm tính từ ngày đặt + cảnh báo)
const refBase = receivedDate || orderDate;
if (refBase) {
  const win = CFG.refundWindowDays[productType] ?? CFG.refundWindowDays["non-flag"];
  const elapsed = days(d(refBase), today);
  out.refund_window = {
    product_type: productType,
    window_days: win,
    basis: receivedDate ? "received_date" : "order_date (CHƯA có received_date — ước tính)",
    days_elapsed: elapsed,
    days_left: win - elapsed,
    eligible: elapsed <= win,
  };
}

// 3. Cửa sổ sửa đơn (12h từ đặt)
if (orderDate) {
  const h = hours(d(orderDate), today);
  out.modify_window = { hours_since_order: h, open: h <= CFG.modifyWindowHours, limit_hours: CFG.modifyWindowHours };
}

// 4. Cửa sổ mở claim (3 ngày từ nhận)
if (receivedDate) {
  const e = days(d(receivedDate), today);
  out.claim_window = { days_since_received: e, open: e <= CFG.claimContactDays, limit_days: CFG.claimContactDays };
}

// 5. Lost in transit
if (lastTracking) {
  const e = days(d(lastTracking), today);
  const thr = CFG.lostInTransitDays[carrier] ?? CFG.lostInTransitDays.usps;
  out.lost_in_transit = { carrier, days_no_update: e, threshold: thr, eligible: e > thr };
}

// 6. ETA dự kiến (từ ngày đặt)
if (orderDate && CFG.eta[shipType]) {
  const [lo, hi] = CFG.eta[shipType];
  out.eta = { ship_type: shipType, total_bd: `${lo}-${hi}`, est_delivery_from: iso(addBusinessDays(d(orderDate), lo)), est_delivery_to: iso(addBusinessDays(d(orderDate), hi)) };
}

// 7. Dịp lễ gần nhất phía trước + có nâng priority không
const upcoming = CFG.holidays2026.map((h) => ({ ...h, days_until: days(today, d(h.date)) })).filter((h) => h.days_until >= 0).sort((a, b) => a.days_until - b.days_until)[0];
if (upcoming) {
  const bump = upcoming.major && upcoming.days_until <= CFG.holidayProximityDays;
  out.nearest_holiday = { name: upcoming.name, date: upcoming.date, days_until: upcoming.days_until, major: upcoming.major, priority_bump: bump, note: bump ? "Trong 10 ngày trước dịp lớn → nâng P1/P2, proactive tracking" : "" };
}

console.log(JSON.stringify(out, null, 2));
