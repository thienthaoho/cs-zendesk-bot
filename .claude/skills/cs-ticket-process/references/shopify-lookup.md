# Shopify Lookup — qua MCP `shopify` (store flagwix)

Dùng để tra **đơn hàng** (khách đã mua) và **hiểu sản phẩm** trước khi trả lời. Chỉ ĐỌC, không sửa đơn/sản phẩm trừ khi được yêu cầu rõ.

## Tra khách + đơn hàng

1. **Tìm khách theo email:**
   `get-customers` với query `email:<email_khách>` → lấy customer id, displayName, numberOfOrders.
2. **Lấy đơn của khách:**
   `get-customer-orders` (theo customer id) hoặc `get-orders` query `email:<email>` → danh sách đơn (name `#FLW...`, ngày, financial/fulfillment status).
3. **Chi tiết 1 đơn:**
   `get-order-by-id` → line items (sản phẩm + biến thể + personalization), shipping address, fulfillment status, financial status.
   > ⚠️ **MCP thường KHÔNG trả `tracking_number`.** Cần tracking → query REST theo order number:
   > `curl -s "https://flagwix.myshopify.com/admin/api/2026-01/orders.json?name=%23<ORDER>&status=any&fields=name,fulfillment_status,fulfillments,line_items,shipping_address,financial_status,created_at" -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN"` → đọc `fulfillments[].tracking_number` + `tracking_url`. Chạy được trên GitHub (token trong env). (Đã verify: FLWSP332649 → `GFUS01056223631747`.)

### Thông tin cần lấy cho từng loại ticket
| Loại ticket | Cần lấy |
|---|---|
| "Đơn của tôi đâu rồi?" / WISMO | fulfillment status, tracking number + url, inTransitAt, estimatedDeliveryAt, deliveredAt |
| Refund/Return | ngày đặt (tính hạn refund theo cs-rules), financial status, đã refund chưa, line items |
| Hàng lỗi/sai/thiếu | line items (đúng SP/biến thể khách đặt?), fulfillment, personalization text |
| Hủy đơn / đổi địa chỉ | fulfillment status (đã ship chưa → quyết định có hủy/sửa được không), shipping address hiện tại |
| Hỏi sản phẩm đã mua | line items + `get-product-by-id` để lấy mô tả/biến thể |

## Hiểu sản phẩm (khi không rõ)
- `get-products` query theo từ khóa/tiêu đề khách nhắc → tìm sản phẩm.
- `get-product-by-id` → mô tả, options/variants, ảnh, giá, có personalization không.
→ Dùng để giải thích đặc tính, hướng dẫn sử dụng, xác nhận biến thể/size, làm rõ trước khi trả lời.

## Quy ước thời gian
- Timestamp Shopify trả về dạng **UTC**. Khi nói với khách, quy đổi sang giờ địa chỉ giao hàng (vd Virginia = EDT/UTC-4). Ghi rõ ngày tháng cụ thể, không nói "X ngày trước".

## Múi giờ & đơn vị store
- Store Flagwix: USD, timezone America/Los_Angeles.

## Khi khách có nhiều đơn

**Bước 1 — Đọc email/ticket tìm hint trước:**
Order number (`#FLW...`) / tên sản phẩm / ngày đặt / mô tả hàng → nếu tìm được → dùng đơn đó, bỏ qua bước 2.

**Bước 2 — Nếu email không nêu rõ**, so tuổi từng đơn tính từ hôm nay:

| Tuổi đơn | Trạng thái thực tế | Xử lý |
|---|---|---|
| ≤ 24 ngày | Có thể vẫn trong transit | Đưa vào email update |
| 25–30 ngày (vùng xám) | Chưa chắc | Check `fulfillmentStatus` + `deliveredAt`: đã giao → skip; vẫn `in_transit` → đưa vào |
| > 30 ngày | Gần chắc đã giao | Skip nếu email không nhắc đến |

**Kết quả sau lọc:**
- Còn nhiều đơn active (≤24 ngày, chưa giao) → **update tất cả trong 1 email**, liệt kê từng đơn + status
- Chỉ còn 1 đơn active → tập trung đơn đó
- Vẫn không xác định được nhưng đã có đủ thông tin order cụ thể → dùng CS judgment, draft phù hợp nhất dựa trên context; không hỏi thêm
- Thực sự không có cơ sở → dùng holding template, hỏi order number: *"Could you share your order number (it starts with #FLW) so I can pull up the right order for you?"*

## Lưu ý
- Nếu MCP `shopify` chưa load (chưa restart Claude), có thể tạm gọi Admin API trực tiếp; nhưng ưu tiên MCP tool.
