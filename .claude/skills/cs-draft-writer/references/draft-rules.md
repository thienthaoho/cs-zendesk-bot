# Draft Rules — quy tắc viết theo ca đặc thù

Chỉ đọc file này khi gặp đúng ca bên dưới. Ca thường (WISMO có tracking, hỏi sản phẩm...) thì dùng template + voice-persona là đủ.

---

## A. Đơn UNFULFILLED — xử lý theo số business day đã qua (Mon–Fri, bỏ Sat–Sun)

Tính business days = từ `created_at` (Shopify) đến ngày khách hỏi (hôm nay).

| Business days kể từ đặt hàng | Cách draft |
|---|---|
| < 3 ngày | Nói thật: đơn đang trong production, thường hoàn thành trong 3 business days, sẽ có tracking sớm. |
| 3–6 ngày | **Khẳng định đã hoàn thành sản xuất và đã ship out.** Tracking sẽ gửi đến sớm nhất có thể. Không đề cập unfulfilled status. |
| 7–10 ngày | **Vẫn nói đã ship out**, thêm lý do khéo léo + thể hiện nỗ lực push đơn (xem bảng lý do dưới). |
| > 10 ngày | Escalate nội bộ, ghi `cs-need-approval` — không tự cam kết, cần human check với fulfillment team. |

**Bảng lý do thuyết phục cho đơn 7–10 ngày unfulfilled** (chọn lý do hợp ngữ cảnh nhất):

| Tình huống | Lý do dùng |
|---|---|
| Gần dịp lễ (4th July, Memorial Day, Christmas...) | "We're in one of our busiest seasons, our fulfillment team is working through a higher-than-usual volume to get every order out as quickly as possible. Yours is in the queue and being prioritized." |
| Đơn có personalization (tên người, in riêng) | "Your order includes custom printing, which goes through an extra quality check before it ships to make sure every detail is exactly right." |
| Không có tín hiệu đặc biệt | "There's sometimes a short gap between when an order ships and when the carrier activates the tracking in their system. Your order has been fulfilled on our end, you should receive tracking details very soon." |
| Khách đã đợi lâu, tone lo lắng | "I've flagged your order to our fulfillment team to make sure it gets priority attention. We want to make sure it reaches you as soon as possible." |

Luôn kết thúc phần này bằng cam kết cụ thể: "If you haven't received tracking by [ngày + 2 business days], please reply here and I'll follow up directly."

---

## B. Đơn nhạy cảm DEADLINE lễ / sự kiện

Kiểm tra: persona là Holiday Helen / Anniversary America / Gift Giver Gary, HOẶC khách nhắc "need it before [date]" / "for [holiday]" / "it's a gift" — VÀ đơn chưa tới hoặc đang delay.

Nếu có → ghi "HOLIDAY DEADLINE AT RISK" trong Phần 1 NỘI BỘ, và khi draft bắt buộc:
- Thừa nhận ý nghĩa dịp lễ / món quà (không né, không "we're sorry for the inconvenience").
- Tìm lý do cụ thể có thật để khách tin đơn đến kịp: tracking đang ở đâu, còn bao nhiêu ngày.
- Tracking còn kịp + có ETA rõ → tone tự tin, nhẹ nhàng cam kết + gợi ý check lại trước lễ.
- Không chắc kịp / chưa có ETA → thành thật + đề xuất plan B rõ ràng (resend expedited / partial refund / giải pháp khác), KHÔNG để khách tự đoán.
- Mục tiêu: khách rời ticket với cảm giác "họ hiểu tôi, tôi biết chuyện gì đang xảy ra, tôi có thể chờ vì có lý do".

---

## C. Positive feedback / delivery confirmed (P4)

Dù không có vấn đề cần giải quyết, reply KHÔNG được là 1 dòng generic. Cấu trúc 3 phần:

1. **Cảm xúc sản phẩm theo ngữ cảnh dùng** (cụ thể theo sản phẩm thật + persona, ngôn ngữ bình thường, KHÔNG triết lý, KHÔNG em dash, KHÔNG câu AI cố tạo cảm xúc):
   - Patriot Pete / Anniversary America → "Nothing like a patriotic flag ready for the Fourth." / "Hope it flies proudly all summer."
   - Grieving Grace → "We hope it brings some comfort." / "It sounds like it found the right home." (nhẹ, không over)
   - Gift Giver Gary → "Hope they love it." / "Sounds like a great gift." (ngắn, ấm)
   - Dog Mom Debbie / Holiday Helen → echo niềm vui: "Love hearing that!" / "So happy it worked out!"
2. **Cảm ơn chân thành + hi vọng gặp lại:** không dùng "Thank you for your feedback", viết như người thật, nói rõ trân trọng việc khách dành thời gian chia sẻ.
3. **Tặng code giảm giá:** luôn kèm code `THANKYOU` giảm 15% cho lần mua tiếp. Vd: "As a small thank-you, use code THANKYOU at checkout for 15% off your next order."

Mục tiêu: khách thấy được trân trọng, muốn quay lại — không phải bị "ack and close".

---

## D. Ca đặc biệt: Email / Address change request

Khi khách báo email cũ sai và cung cấp email mới:
1. Dùng **email cũ (sai)** khách cung cấp để `get-customers` search Shopify.
2. Nếu TÌM THẤY account:
   - Ghi internal note: "Tìm thấy account [email cũ], đề xuất human update email → [email mới] trong Shopify."
   - KHÔNG tự update (dữ liệu nhạy cảm, để human làm).
   - Draft reply: (a) xác nhận sẽ cập nhật email, (b) THÊM tình trạng đơn gần nhất để khách yên tâm.
   - Tone mẫu: "Hi [Name], thanks for letting us know. We've passed your email update request to our team, your account will be updated to [new email] shortly. While I have your order open: your [product] shipped and is on its way to you (tracking: [number]). You're all set on our end."
3. Nếu KHÔNG tìm thấy → draft: xác nhận đã nhận, không tìm thấy account với email cũ, hỏi order number để locate.
Không yêu cầu verify danh tính thêm nếu khách đã cho cả email cũ + email mới.

---

## E. Ca đặc biệt: Ticket chỉ có order number, không có câu hỏi

Khi body ticket chỉ là một order number:
1. **Giả định intent = WISMO** (Where Is My Order) — phổ biến nhất với Flagwix 35+.
2. Kiểm tra sidebar Shopify trước; thiếu → query Shopify theo order number (curl REST) lấy fulfillment + tracking.
3. Draft **proactive status update**: cho khách biết đơn ở đâu, ETA, tracking. KHÔNG hỏi "what can I help you with?" — với tệp 35+ đang lo, câu đó làm tăng lo lắng.
4. Không tìm được order → draft hỏi email đặt hàng để xác minh.
