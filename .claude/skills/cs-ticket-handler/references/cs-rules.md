# CS Rules — nguồn: Brands Wiki → "Brands" space → Customer Support Hub (Lark)

> ✅ **Phạm vi:** Policy Flagwix/Shopify (nguồn: flagwix.com + Brands wiki). Mục nào ghi **[CẦN BỔ SUNG]** thì skill KHÔNG được tự chế — ghi rõ trong internal note và set `cs-need-approval` nếu cần duyệt.

## 1. Chính sách Cancel / Refund / Resend

**Flagwix refund window (nguồn: flagwix.com/pages/return-refund):**
| Loại sản phẩm | Window | Điều kiện |
|---|---|---|
| Flag products | **6 tháng** từ ngày nhận | Lỗi vật liệu / gia công |
| Non-flag items | **30 ngày** từ ngày nhận | Damaged, wrong, defective, lost |
- Phải liên hệ **trong 3 ngày** kể từ khi nhận hàng để mở claim + gửi ảnh bằng chứng
- Sửa đơn: chỉ trong **12 giờ** sau khi đặt; sau đó không sửa được
- Personalized order: không sửa / hủy sau khi đã process

**Không hoàn (Flagwix-specific):**
- Đổi ý / không thích sau khi đã nhận
- Địa chỉ sai do khách nhập
- Theft / security issue tại địa chỉ giao
- Refused delivery
- Personalized đúng thông tin khách cung cấp

### Cancel — theo trạng thái đơn (check Shopify fulfillment TRƯỚC khi trả lời)
| Trạng thái | Hành động | Offer cho khách |
|---|---|---|
| Chưa gửi supplier / chưa sản xuất | Cancel ngay | Cancel + code giảm 10% mua lại |
| Supplier đã sản xuất | Cancel khó, cần check | Opt 1: vẫn ship + hoàn 15% / Opt 2: khách chịu phí cancel 15% |
| Đã ship (fulfilled) | KHÔNG cancel được | Hướng khách từ chối nhận để return; theo dõi shipment |
Nguyên tắc: không cancel nếu đã sản xuất mà khách không chịu phí; log mọi cancel request.
🔶 Flagwix (Shopify POD): map "chưa sản xuất" ≈ đơn chưa `fulfilled`; "đã ship" ≈ có tracking/fulfilled.

### Refund
- **Full 100%:** lỗi sản phẩm do NSX (**có ảnh**); hàng mất khi vận chuyển (**tracking xác nhận lost**); giao sai sản phẩm; hư hỏng nặng khi vận chuyển (**có ảnh**).
- **Một phần:** cancel khi đang sản xuất → hoàn **85%** (giữ 15% phí SX); delay do carrier nhưng hàng vẫn tới → case-by-case (ship fee/coupon); khiếm khuyết nhỏ vẫn dùng được → hoàn **15–30%** tùy mức.
- **KHÔNG hoàn:** đổi ý sau khi đã sản xuất xong; khách nhập sai địa chỉ; sản phẩm custom/made-to-order đúng thông tin khách cung cấp; hàng đã giao thành công nhưng khách không thích.

### Resend (gửi lại)
- Điều kiện: lost in transit (tracking không update **>14 ngày USPS, >20 ngày quốc tế**); hư hỏng vận chuyển (có ảnh); giao sai do lỗi shop/supplier; return do lỗi địa chỉ phía shop.
- Quy trình: xác nhận điều kiện với supplier → xác nhận lại địa chỉ với khách → tạo đơn mới + tracking → log & theo dõi tới delivered.

**Source:** https://kd2olxcu0u.sg.larksuite.com/wiki/RYH9wsSGEi8ZcVkYtvMlM9KzgKd

## 2. Vận chuyển
- **Lost in transit:** USPS **>14 ngày** không update; quốc tế **>20 ngày**. Quá ngưỡng → đủ điều kiện resend/refund.
- Delay nhưng hàng vẫn tới: case-by-case (refund ship fee hoặc coupon).
**ETA Flagwix — nguồn: flagwix.com product pages (listing):**
| Loại | Processing | Transit (từ ngày ship) | Tổng từ ngày đặt |
|---|---|---|---|
| Standard US | 1–3 BD | 7–9 BD | **8–12 BD** |
| 3-Day Shipping (select items) | 1–2 BD | 1–3 BD | **4–5 BD** |
| International | 1–3 BD | 10–12 BD | **11–15 BD** |
BD = business days. **Lưu ý quan trọng:** Transit 7–9 BD tính từ ngày ship, KHÔNG phải ngày đặt. Shipping cost: miễn phí order >$99; còn lại $9.99. Ưu tiên `estimatedDeliveryAt` từ Shopify nếu có.

## 3. Sản phẩm lỗi / sai / mất
- Damaged / defective / wrong / lost → nhóm hoàn 100% hoặc resend.
- **Bằng chứng bắt buộc:** lỗi NSX & hư hỏng vận chuyển → **yêu cầu ẢNH**; hàng mất → **tracking lost**. (Tài liệu chỉ nêu ảnh, không bắt video.)
- Sai/return do lỗi địa chỉ phía shop → resend free; do khách nhập sai → không hoàn.

## 4. POD / IP / Personalization
- Custom/made-to-order **đúng thông tin khách cung cấp** → KHÔNG hoàn.

### IP / Trademark / Design claim
Luôn khẳng định shop tự thiết kế. KHÔNG thừa nhận vi phạm, KHÔNG phủ nhận cần kiểm tra. Mọi case đều mua thời gian để CS verify trước khi cam kết bất cứ điều gì.

| Case | Xử lý | Tag |
|---|---|---|
| Khách mua hàng hỏi/claim IP, **có link/nguồn cụ thể** | Khẳng định tự thiết kế + xin link để kiểm tra + hẹn trả lời | `cs-need-approval` |
| Khách mua hàng hỏi/claim IP, **không có nguồn rõ ràng** (chỉ cảm nhận) | Khẳng định tự thiết kế + mời họ cung cấp link nguồn gốc nếu có | `ai-drafted` |
| **Rights holder / chính chủ** liên hệ trực tiếp với link cụ thể | AI chỉ draft holding reply (chờ kiểm tra) — CS **bắt buộc** verify và trả lời thực chất | `cs-need-approval` |

> AI chỉ đóng vai trung gian giữ chân khách với case rights holder. Xác nhận thông tin thật phải do CS check và trả lời.

## 5. Thẩm quyền phê duyệt (quan trọng — quyết định khi nào để `cs-need-approval`)
| Cấp | Được tự quyết |
|---|---|
| **CS Staff** | Cancel đơn chưa sản xuất; resend do ship lỗi rõ ràng |
| **Team Lead** | Hoàn tiền **>50%**; cancel khi đã sản xuất; resend international |
| **Manager** | Hoàn **100% cho đơn lớn**; các exception |
→ Skill draft ở mức CS Staff. Mọi đề xuất refund >50% / cancel-sau-SX / resend intl / refund đơn lớn → ghi **`cs-need-approval`**, KHÔNG cam kết con số với khách.

## 6. Escalation & Chargeback

### Escalation
- Escalate ngay khi **vượt scope CS staff**. Cấp bậc: CS Staff → Team Lead → Manager.
- 🔶 Trigger Tier 1 trong wiki là **Amazon-only** (A-to-Z claim, ODR) — **không áp dụng Flagwix/Shopify**. Với Flagwix: chargeback/dispute, khách dọa chargeback hoặc public review xấu, nhiều khách cùng 1 lỗi sản phẩm → escalate.
- Kênh escalation cụ thể (Slack/Lark group, ai): **[CẦN BỔ SUNG]**.

### Chargeback / Dispute (nguồn: WEB-SOP-008)
AI **không xử lý chargeback** — set `cs-need-approval`, draft holding reply giữ chân khách, ghi rõ trong internal note những gì human cần làm (evidence, deadline).

**Nhận diện:** ticket từ `requester:shopify` (tự động gửi khi Shopify nhận dispute) hoặc khách đề cập "dispute", "chargeback", "bank".

**Reason thường gặp:**
| Reason | Xử lý hướng |
|---|---|
| Unauthorized transaction | Check billing = shipping address; contact khách xác nhận |
| Item not received | Check tracking; nếu delivered → proof of delivery; nếu lost → offer solution + nhờ đóng case |
| Item defective / damaged | Xin ảnh + offer solution sớm; nhờ khách đóng case |
| Missing refund/credit | Check xem team đã confirm refund/cancel chưa; nếu chưa → xử lý; nếu rồi → cung cấp proof |
| Item not as described | Check order vs sản phẩm → offer giải pháp phù hợp |

**Evidence cần thu thập (human lo):** Communication log (Zendesk), Proof of delivery (carrier page), Shipping label (xin supplier), Refund policy (nếu liên quan refund).

**Deadline:** Submit evidence trước deadline Shopify. Chargeback có deadline cứng — **không được bỏ lỡ**.

**AI draft holding reply cho khách** (set `cs-need-approval`):
> "Thank you for reaching out. I've received your message and want to make sure we resolve this for you as quickly as possible. I'm currently reviewing the details of your order and will be in touch with a full update very soon."

## 7. SLA phản hồi
| Tier | Loại | Phản hồi | Target |
|---|---|---|---|
| 🔴 1 Cấp bách | (Flagwix) chargeback/dispute, khách escalate gắt | **2–4h** | 100% |
| 🟠 2 Cao | Cancel/modify, shipment lost, khách escalate | **4–8h** | 100% |
| 🟡 3 Bình thường | Hỏi trước mua, tracking delay, hỏi info | **8–16h** | ≥99% |
| 🟢 4 Thấp | Follow-up, nội bộ | **<24h** | ≥95% |
Dùng để xếp ưu tiên sweep. Maximize First Contact Resolution; follow ticket end-to-end.

**Source:** https://kd2olxcu0u.sg.larksuite.com/wiki/KQw0w9L9cig2Fik9r18l9tGHgRe

## 8. Tone & Brand Voice — CRAFT (áp dụng MỌI message)
| | Rule | Vi phạm thường gặp |
|---|---|---|
| **C**lear | 1 mục đích, không jargon | Giải thích lan man, không đúng câu hỏi |
| **R**esponsive | Trong SLA tier; cần thêm giờ → acknowledge trước | Im lặng chờ đủ info mới reply |
| **A**ccurate | Verify trước, copy EXACT số/ngày từ hệ thống, không đoán | Hứa ETA mà không check tracking |
| **F**riendly | Đồng cảm trước giải thích, không blame khách, kết bằng offer | Vào thẳng giải thích khi khách đang bực |
| **T**horough | Trả lời đủ mọi câu trong 1 message, nêu next step | Bỏ sót 1 câu hỏi trong email nhiều câu |

**Audit nhanh:** rõ ràng? · đúng câu hỏi? · đã verify? · tone thân thiện? · còn câu nào chưa trả lời? · next step rõ?
Chữ ký AI draft: `AI[ddmmyy]` (vd: `AI200626`) — human thay bằng tên thật trước khi gửi. Mặc định English cho Flagwix.

**Source:** https://kd2olxcu0u.sg.larksuite.com/wiki/DJzPwQJn8i0DgukW7yQlXstIgZ2

## 9. Zendesk conventions (tag / status / macro)
- Tag taxonomy chính thức lấy từ WEB-SOP-007 — xem đầy đủ trong [`zendesk-ops.md`](zendesk-ops.md) §5.
- Ticket phải fill đủ: Order number, Tên khách, Tracking (nếu shipment), Loại issue, Product Type, Priority, Assignee — **trước khi close**.
- Due date: tối đa 3 ngày kể từ lần reply trước (set qua Type → Task → Due date trong Zendesk).

## 10. Store / brand mapping
- Hub theo kênh: Etsy / Website Shopify / Amazon / TikTok Shop / Customer Support Hub.
- Node "Website Shopify" chỉ có tài liệu marketing, **không có CS**.
- Mapping store→kênh chi tiết: **[CẦN BỔ SUNG]**. (Memory: Flagwix = store Shopify chính trên Zendesk `blockofgear`, brand "Flagwix".)

---
## ⚠️ Khoảng trống còn lại
- Escalation contacts cụ thể (Lark group, tên người duyệt theo cấp) — hiện tại human tự xử lý khi đọc internal note `cs-need-approval`.

**Mục lục CS Policies:** https://kd2olxcu0u.sg.larksuite.com/wiki/FjhEww8r5iDp6EkPhLtllOZvgvb
