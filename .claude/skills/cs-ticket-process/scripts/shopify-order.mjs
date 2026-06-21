#!/usr/bin/env node
// shopify-order.mjs — lấy đơn hàng từ Shopify Admin API, lọc + trả về GỌN (thay vì Claude
// đọc shopify-lookup.md + gọi 3 tool MCP + đọc cục JSON thô).
//
// Dùng:
//   node shopify-order.mjs --order FLWSP332649
//   node shopify-order.mjs --email john@example.com
//   thêm --raw để in JSON Shopify gốc (debug)
//
// Cần env SHOPIFY_ACCESS_TOKEN (GitHub Actions đã set sẵn).
// Trả về JSON gọn: mỗi đơn có name, ngày đặt, fulfillment, tracking, line_items,
// địa chỉ ship, tuổi đơn (ngày), active (≤24 ngày & chưa giao xong).

const SHOP = "flagwix.myshopify.com";
const API = "2026-01";
const FIELDS = "name,created_at,financial_status,fulfillment_status,fulfillments,line_items,shipping_address";
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const wantRaw = process.argv.includes("--raw");
const order = arg("--order");
const email = arg("--email");
const todayOverride = arg("--today"); // cho test

if (!TOKEN) { console.error("Thiếu env SHOPIFY_ACCESS_TOKEN."); process.exit(1); }
if (!order && !email) { console.error("Cần --order <FLWSP...> hoặc --email <email>."); process.exit(1); }

const today = todayOverride ? new Date(todayOverride) : new Date();

async function api(path) {
  const res = await fetch(`https://${SHOP}/admin/api/${API}/${path}`, {
    headers: { "X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Shopify ${res.status} ${res.statusText} @ ${path}`);
  return res.json();
}

function daysBetween(a, b) {
  return Math.floor((b - a) / 86400000);
}

// Đếm business day (Mon-Fri) giữa 2 ngày — dùng cho quy tắc framing trạng thái gửi khách.
function businessDays(from, to) {
  let n = 0; const cur = new Date(from);
  while (cur < to) { cur.setDate(cur.getDate() + 1); const w = cur.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}

function compact(o) {
  const created = new Date(o.created_at);
  const age = daysBetween(created, today);
  const ff = (o.fulfillments || []).find((f) => f.tracking_number) || (o.fulfillments || [])[0] || {};
  const fulfilled = o.fulfillment_status === "fulfilled" || (o.fulfillments || []).some((f) => f.shipment_status === "delivered");
  const bizDays = businessDays(created, today);
  // Nhãn trạng thái DÙNG CHO REPLY GỬI KHÁCH (chính sách shop). KHÁC với fulfillment_status thật.
  // >=3 business day chưa fulfill => giao tiếp với khách là "đã ship cho carrier, tracking đang chờ kích hoạt".
  const customerFacingStatus = fulfilled
    ? "shipped"
    : bizDays >= 3
      ? "SHIPPED_TO_CARRIER_TRACKING_PENDING"  // nói khách: đã ship out, carrier đang xử lý, tracking sắp có
      : "in_production";                         // <3 BD: thật sự đang sản xuất
  return {
    name: o.name,
    created_at: o.created_at?.slice(0, 10),
    age_days: age,
    business_days: bizDays,
    financial_status: o.financial_status,
    fulfillment_status: o.fulfillment_status || "unfulfilled", // SỰ THẬT — chỉ dùng cho internal note
    customer_facing_status: customerFacingStatus,              // DÙNG cho phần gửi khách
    tracking_number: ff.tracking_number || null,
    tracking_url: (ff.tracking_urls && ff.tracking_urls[0]) || ff.tracking_url || null,
    shipment_status: ff.shipment_status || null,
    line_items: (o.line_items || []).map((li) => ({
      title: li.title,
      variant: li.variant_title || null,
      qty: li.quantity,
      // personalization khách nhập (in tên, ngày...) nằm ở properties
      personalization: (li.properties || []).filter((p) => p.value).map((p) => `${p.name}: ${p.value}`),
    })),
    ship_to: o.shipping_address
      ? { city: o.shipping_address.city, province: o.shipping_address.province_code || o.shipping_address.province, country: o.shipping_address.country_code }
      : null,
    // active = còn đang chờ giao (đưa vào email update khi khách có nhiều đơn)
    active: !fulfilled && age <= 24,
  };
}

try {
  let orders = [];
  if (order) {
    const name = encodeURIComponent("#" + order.replace(/^#/, ""));
    const data = await api(`orders.json?name=${name}&status=any&fields=${FIELDS}`);
    orders = data.orders || [];
  } else {
    const cust = await api(`customers/search.json?query=${encodeURIComponent("email:" + email)}`);
    const id = cust.customers?.[0]?.id;
    if (!id) { console.log(JSON.stringify({ found: false, reason: "Không tìm thấy customer với email này" })); process.exit(0); }
    const data = await api(`orders.json?customer_id=${id}&status=any&fields=${FIELDS}`);
    orders = data.orders || [];
  }

  if (wantRaw) { console.log(JSON.stringify(orders, null, 2)); process.exit(0); }

  if (orders.length === 0) { console.log(JSON.stringify({ found: false, reason: "Không tìm thấy đơn" })); process.exit(0); }

  const out = orders.map(compact);
  const activeCount = out.filter((o) => o.active).length;
  console.log(JSON.stringify({ found: true, count: out.length, active_count: activeCount, orders: out }, null, 2));
} catch (e) {
  console.error("Lỗi gọi Shopify: " + e.message + " → fallback: dùng MCP shopify hoặc đọc sidebar Zendesk.");
  process.exit(2);
}
