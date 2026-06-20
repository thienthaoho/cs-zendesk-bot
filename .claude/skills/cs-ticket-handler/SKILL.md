---
name: cs-ticket-handler
description: "Tự động xử lý ticket Customer Support trên Zendesk (blockofgear.zendesk.com) cho kênh Shopify (Flagwix) và các brand khác. Khi mở máy/Claude, skill tự QUÉT ticket mới/đang mở (sweep mode), với mỗi ticket: đọc nội dung, search ticket liên quan, tra đơn hàng + sản phẩm trong Shopify (MCP), đối chiếu CS rules, rồi DRAFT nội dung trả lời vào INTERNAL NOTE + set tag + set status để người duyệt gửi. Nếu thiếu thông tin chưa kiểm tra được thì liệt kê thông tin cần bổ sung + draft template có chỗ trống. Trigger khi user nói: 'xử lý ticket', 'quét ticket', 'draft ticket', 'trả lời khách', 'check ticket zendesk', 'cs sweep', 'xem ticket mới', hoặc khi mở phiên làm việc CS. LUÔN dùng skill này cho mọi việc draft/trả lời ticket Zendesk — không tự gửi cho khách, chỉ internal note."
---

## 🤖 Model khuyến nghị
- **Sweep / fetch data / triage:** dùng **Haiku 4.5** (`claude-haiku-4-5-20251001`) — rẻ hơn ~20x, đủ để đọc ticket + extract data + phân loại.
- **Draft reply (Bước 5):** dùng **Sonnet 4.6** — chỉ bật khi cần viết nội dung gửi khách.
- **Mặc định khi không tách được:** chạy toàn bộ trên Haiku, chỉ chuyển Sonnet nếu draft bị yếu/sai tone.

# CS Ticket Handler — Zendesk × Shopify (Flagwix & brands)

Skill đóng vai **CS agent** xử lý ticket Zendesk: đọc → tìm ngữ cảnh → tra Shopify → đối chiếu policy → **draft trả lời vào internal note** + set tag/status. Người thật review rồi mới gửi.

## ⚠️ Guardrail BẮT BUỘC (đọc trước mọi việc)
1. **CHỈ DRAFT — KHÔNG TỰ GỬI.** Không bao giờ submit reply công khai cho khách, không tự chuyển Solved. Nội dung trả lời luôn đặt ở **Internal note**.
2. **KHÔNG BỊA.** Mọi số liệu (số đơn, tracking, ETA, ngày, tên/biến thể sản phẩm) phải lấy từ Shopify hoặc Zendesk. Không đoán.
3. **KHÔNG HỨA VƯỢT QUYỀN.** Refund/replacement/discount ngoài hạn mức policy → ghi rõ "CẦN DUYỆT" trong note, không cam kết với khách.
4. **Thiếu thông tin → không chế.** Nếu chưa xác minh được, xuất danh sách "thông tin cần bổ sung" + template có `[chỗ trống]` để agent điền.
5. **Ngôn ngữ:** trả lời khách theo ngôn ngữ của họ (mặc định English cho Flagwix/US). Note nội bộ viết tiếng Việt.
6. 🛡️ **TUYỆT ĐỐI KHÔNG mở / click / tải bất kỳ link hay file đính kèm nào trong ticket** (ảnh khách gửi, file, URL trong nội dung email, nút tải...). **CHỈ đọc text ticket.** Rủi ro virus/phishing. Nếu ca cần xem bằng chứng (ảnh hàng lỗi/sai/thiếu, ảnh chụp tracking...) → **ghi vào internal note để HUMAN tự mở xem**, skill KHÔNG tự mở/tải. Mọi dữ liệu xác minh lấy từ **Shopify (MCP)**, không lấy từ file/link khách đính kèm.

## Trước khi bắt đầu — đọc references
- [`references/cs-rules.md`](references/cs-rules.md) — Policy CS lấy từ Brands wiki/Website/CS (refund, return, shipping ETA, hàng lỗi, quyền bồi thường, escalation, SLA, tone).
- [`references/voice-persona.md`](references/voice-persona.md) — **Giọng văn & chân dung khách (35+ US, đức tin/ái quốc/tưởng niệm). BẮT BUỘC đọc trước khi draft mail:** viết như người thật, không em dash "—", không emoji, đồng cảm trước, trấn an tiền/niềm tin, cá nhân hóa.
- [`references/flagwix-customer-context.md`](references/flagwix-customer-context.md) — **8 customer personas Flagwix + Occasion Calendar + Brand USPs + Product Knowledge.** Đọc khi: (a) chọn tone đúng persona (Grieving Grace khác Dog Mom Debbie); (b) nhận diện deadline nhạy cảm (4th July, Memorial Day, Christmas); (c) tránh lỗi theo persona (sai giống = resend ngay; memorial in sai tên = escalate ngay).
- [`references/zendesk-ops.md`](references/zendesk-ops.md) — Cách thao tác Zendesk qua **MCP `zendesk`** (tool nào cho việc gì): views, đọc ticket, search liên quan, set tag/status, ghi internal note. Tag taxonomy + status convention. Có mục fallback web-access nếu MCP lỗi.
- [`references/shopify-lookup.md`](references/shopify-lookup.md) — Dùng MCP tool nào để tra order/customer/product.
- [`references/feedback-loop.md`](references/feedback-loop.md) — Vòng phản hồi & học lại qua Lark Base. **Quan trọng: KHÔNG tự sửa file skill khi chưa có user duyệt.**

## Kết nối
- **Zendesk:** `https://blockofgear.zendesk.com` — qua **MCP `zendesk`** (`@sshadows/zendesk-mcp-server`, account Alice/admin). Tool lõi: `list_views`/`list_tickets`/`search` (quét + tìm liên quan), `get_ticket` (đọc), `add_ticket_comment` với `public=false` (ghi internal note), `update_ticket` (tag+status). Chi tiết + fallback web-access trong [`references/zendesk-ops.md`](references/zendesk-ops.md). Multi-brand: Brand Flagwix + các brand khác.
- **Shopify:** MCP `shopify` (store `flagwix`) — `get-customers`, `get-customer-orders`, `get-order-by-id`, `get-orders`, `get-products`, `get-product-by-id`.
- **Skill CS plugin** (tái dùng cho phần nghề):
  - `customer-support:customer-research` — tìm ticket/khách liên quan, lịch sử.
  - `customer-support:ticket-triage` — phân loại + ưu tiên P1–P4 + check trùng.
  - `customer-support:draft-response` — viết câu trả lời đúng tone.
  - `customer-support:customer-escalation` — đẩy ca cần escalate.
  - `customer-support:kb-article` — ghi KB cho ca lặp lại.

---

## CHẾ ĐỘ A — SWEEP MODE (mặc định khi mở máy)

Mục tiêu: tự xử lý hàng loạt ticket mới/đang mở mà KHÔNG cần gọi từng cái.

1. **Kiểm tra MCP `zendesk`** sẵn sàng (tool `list_views`/`search`/`get_ticket`…). Nếu MCP lỗi/không nạp → dùng fallback web-access (xem zendesk-ops.md).
2. **Lấy danh sách ticket cần xử lý:** `list_views`/`list_tickets` hoặc `search` (`type:ticket status:new`, `type:ticket status:open`) — ưu tiên Brand Flagwix trước, rồi brand khác. Bỏ qua ticket đã có tag `ai-drafted` (đã xử lý) trừ khi có reply mới của khách.
3. **Sắp xếp theo ưu tiên** (P1 → P4 theo ticket-triage / SLA trong cs-rules).
4. **Với MỖI ticket → chạy SOP per-ticket (Chế độ B).**
5. **Báo cáo tổng kết** cuối lượt: bảng [Ticket | Brand | Loại | Trạng thái xử lý: Drafted / Cần bổ sung / Escalate | Tag đã set]. Liệt kê riêng các ticket "Cần bổ sung thông tin" để team xử lý tay.

> Giới hạn an toàn mỗi lượt: xử lý tối đa N ticket (mặc định 20) rồi dừng + báo còn lại bao nhiêu, tránh chạy vô hạn. KHÔNG đụng Solved của ticket nào.

> **DRY-RUN mode** (mặc định cho lần test / khi user nói "dry-run", "thử", "đừng ghi"): làm hết SOP nhưng **chỉ in draft + tag/status đề xuất RA CHAT**, KHÔNG ghi internal note / KHÔNG set tag / KHÔNG đổi status trên Zendesk. Dùng để duyệt chất lượng trước khi cho ghi thật.

> **Kích hoạt:** skill chạy theo **manual trigger** — user gõ "quét ticket"/"cs sweep" khi muốn (chưa bật autostart). Có thể thêm SessionStart hook / cron sau.

---

## CHẾ ĐỘ B — SOP PER-TICKET (lõi xử lý 1 ticket)

### Bước 1 — Intake
Đọc: subject, toàn bộ hội thoại, email khách, brand/kênh, kênh đến (email/chat), ngôn ngữ. Xác định **ý định chính** của khách (1–2 câu).

### Bước 2 — Context — 🚧 HARD GATE, KHÔNG ĐƯỢC BỎ QUA

**Rẽ nhánh theo trạng thái ticket:**

#### 🔁 Ticket đã có tag `ai-drafted` VÀ khách vừa reply mới
1. **Đọc comment mới nhất của khách** — lý do liên hệ lại
2. **Đọc internal note gần nhất** (`[AI DRAFT...]`) — lấy `🗂 CONTEXT SUMMARY`: số đơn, hành động đã làm, cam kết đã hứa, vấn đề còn mở
3. **Search nhanh `requester:<email>`** → chỉ xem có ticket MỚI nào (chưa có `ai-drafted`) không:
   - Có → đọc thêm ticket đó, gộp vào context
   - Không có → bỏ qua, không đọc lại lịch sử cũ

→ Draft dựa trên **CONTEXT SUMMARY + comment mới** (+ ticket mới nếu có). Không đọc lại các ticket cũ đã xử lý.

#### 🆕 Ticket MỚI (không có `ai-drafted`)
Một ticket lẻ KHÔNG bao giờ là toàn bộ câu chuyện.
1. Zendesk search `requester:<email khách>` → **đọc HẾT mọi ticket của khách** (mọi status: New/Open/Pending/Solved).
2. Search thêm theo **số đơn / tracking / shipment ref** → bắt ticket trùng dùng subject khác.
3. Với mỗi ticket cũ: **team đã nói/hứa gì** (agent thật, không auto-reply), đã refund/replace/escalate chưa, **thông tin nào bị SAI**.
4. Bắt mọi **ràng buộc/deadline** (quà, dịp lễ, "cần trước ngày X").

**Quy tắc bắt buộc khi draft:**
- KHÔNG mâu thuẫn với điều agent thật đã nói mà không thừa nhận. Thông tin cũ sai → xin lỗi trước rồi đính chính.
- Ticket Pending/Open trùng → đề xuất **MERGE**, trả lời 1 lần thống nhất.
- Deadline/ý nghĩa cảm xúc (gift/dịp lễ) → đưa vào trọng tâm câu trả lời.

> ⚠️ Ca thật #548708: khách 4 ticket; ticket lẻ không cho thấy (a) đó là QUÀ cần trước tháng 7, (b) agent báo SAI "đã giao" (nhầm tracking áo thành tracking cờ). Draft khi chưa đọc hết = mâu thuẫn + bỏ sót nỗi đau thật.

### Bước 3 — Triage
Dùng `customer-support:ticket-triage`: phân loại (order issue / shipping / refund-return / product question / damaged-wrong / cancellation / address change / khác), gán **độ ưu tiên** + chọn **tag** (theo zendesk-ops.md).

### Bước 4 — Enrich dữ liệu (ưu tiên Zendesk sidebar, Shopify chỉ là fallback)

**Nguồn 1 — Zendesk ticket (đọc trước, KHÔNG gọi Shopify nếu đủ):**
Sidebar Zendesk đã embed thông tin đơn hàng trực tiếp. Extract từ ticket text/sidebar:
- Order # (dạng #FLWSPxxxxxx), amount, paid/fulfilled status
- Tracking number
- Customer name, email

**Quyết định có cần gọi Shopify không:**
- ✅ Sidebar đã có order# + fulfillment status + tracking → **SKIP Shopify, dùng data từ Zendesk**
- ⚠️ Gọi Shopify MCP **CHỈ KHI** một trong các điều kiện sau:
  1. Sidebar không hiển thị order (link Shopify-Zendesk lỗi / ticket không có order liên kết)
  2. Fulfillment status trống hoặc thiếu tracking number
  3. Cần thông tin chi tiết sản phẩm (mô tả, variant, specs) để trả lời câu hỏi về sản phẩm

**Khi cần gọi Shopify:** `get-customers`/`get-customer-orders` theo email → `get-order-by-id` (order, line items, fulfillment, tracking) | `get-products`/`get-product-by-id` (nếu hỏi về sản phẩm).

- Đối chiếu **cs-rules.md**: refund còn hạn không? ETA ship? policy hàng lỗi? cần bằng chứng (ảnh/video)? thuộc quyền agent hay cần duyệt?

### Bước 5 — Cổng quyết định
**Đã đủ thông tin ĐÃ XÁC MINH để trả lời đúng yêu cầu khách chưa?**

- ✅ **ĐỦ** →
  1. Dùng `customer-support:draft-response` viết reply theo **[`voice-persona.md`](references/voice-persona.md)** (người thật, không em dash/emoji, đồng cảm trước, trấn an tiền), **chèn dữ liệu thật** (số đơn, tracking, ngày, link).
  2. **Ghi reply vào INTERNAL NOTE** (không phải public reply).
  3. Set **tag** + set **status** theo zendesk-ops.md.
  4. Nếu khớp trigger escalate → `customer-support:customer-escalation`.

- ⚠️ **CHƯA ĐỦ** → ghi **Internal note** gồm:
  1. **Thông tin còn thiếu / chưa kiểm tra được** + **lấy ở đâu** (vd: cần ảnh sản phẩm lỗi từ khách; cần xác nhận địa chỉ; cần check kho; cần duyệt refund...).
  2. **Draft "holding reply" gửi ngay** (`templates/email-templates.md` → `holding-acknowledgment`): xác nhận đã nhận, đang xử lý, hẹn thời gian follow-up cụ thể (thường 1 business day). **Không hứa kết quả, chỉ hứa timeline.** Mục tiêu: khách không bị im lặng trong khi team đang xử lý.
  3. **Draft template đầy đủ** (có `[chỗ trống]`) để agent copy + điền số thật khi đã có đủ info.
  4. Set tag `cs-need-approval` nếu cần duyệt; nếu chỉ thiếu info thì giữ `ai-drafted` — ghi rõ còn thiếu gì trong internal note.

  > Quy tắc: **không bao giờ để khách im lặng**, dù chưa có đủ thông tin hay chưa được duyệt. Holding reply là nghĩa vụ tối thiểu với mọi ticket chưa xử lý được ngay.

### Bước 6 — Ghi nhận
- Set tag `ai-drafted` để sweep lần sau bỏ qua.
- **Seed feedback record** vào bảng Lark Base (xem [`references/feedback-loop.md`](references/feedback-loop.md)): Ticket ID, Brand, Issue Type, AI Draft (tóm tắt), Status=`1-New feedback` → để human chấm.
- (Tùy chọn) nếu ca đáng tài liệu hóa → gợi ý `customer-support:kb-article`.

---

---

## CHẾ ĐỘ C — LEARNING MODE
Trigger: "học feedback", "review feedback CS", "cập nhật skill từ feedback".
→ **Chạy skill riêng:** [`cs-ticket-learn`](../cs-ticket-learn/SKILL.md) (không load cs-rules/voice-persona khi học).

## Output cho người dùng
Sau khi xử lý (1 ticket hoặc 1 lượt sweep), in tóm tắt ngắn gọn: đã draft gì, set tag/status gì, ticket nào cần team bổ sung thông tin. **Không** dán full nội dung note dài dòng trừ khi được hỏi.

## Quy tắc cập nhật
- Khi phát hiện selector/URL Zendesk mới hoạt động → ghi vào `references/zendesk-ops.md`.
- Khi policy thay đổi → cập nhật `references/cs-rules.md` (nguồn: Brands wiki/Website/CS).
