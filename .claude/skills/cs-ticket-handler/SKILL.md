---
name: cs-ticket-handler
description: Draft trả lời ticket CS Zendesk (blockofgear.zendesk.com) cho Flagwix/Shopify vào internal note — không tự gửi khách. Sweep tất cả ticket new/open, tra Shopify MCP, đối chiếu policy, set tag ai-drafted. LUÔN dùng skill này cho mọi việc draft/trả lời ticket Zendesk, đừng tự làm thủ công. Trigger khi user nói: 'xử lý ticket', 'quét ticket', 'draft ticket', 'check ticket zendesk', 'cs sweep', 'xem ticket mới', 'handle ticket', 'reply customer', 'zendesk sweep', 'process ticket', 'draft cs', 'check tickets', 'new tickets', 'handle cs', 'sweep zendesk', 'ticket zendesk'.
---

## 🤖 Model khuyến nghị
- **Sweep / fetch data / triage:** dùng **Haiku 4.5** (`claude-haiku-4-5-20251001`) — rẻ hơn ~20x, đủ để đọc ticket + extract data + phân loại.
- **Draft reply (Bước 5):** dùng **Sonnet 4.6** — chỉ bật khi cần viết nội dung gửi khách.
- **Mặc định khi không tách được:** chạy toàn bộ trên Haiku, chỉ chuyển Sonnet nếu draft bị yếu/sai tone.

## Input
| Dạng | Mô tả | Bắt buộc |
|---|---|---|
| Không cần input | Sweep mode tự query Zendesk | — |
| Ticket ID / URL | Xử lý 1 ticket cụ thể | Tùy chọn |
| `từ <ISO8601>` | Chỉ lấy ticket từ timestamp (do workflow truyền vào, vd `từ 2026-06-20T10:00:00Z`) | Tùy chọn |
| `dry-run` / `thử` / `đừng ghi` | Chỉ in ra chat, không ghi Zendesk | Tùy chọn |

# CS Ticket Handler — Zendesk × Shopify (Flagwix & brands)

Skill đóng vai **CS agent** xử lý ticket Zendesk: đọc → tìm ngữ cảnh → tra Shopify → đối chiếu policy → **kiểm tra đủ thông tin + tone audit** → **draft trả lời vào internal note** + set tag/status. Người thật review rồi mới gửi.
## ⚠️ Guardrail BẮT BUỘC (đọc trước mọi việc)
1. **CHỈ DRAFT — KHÔNG TỰ GỬI.** Không bao giờ submit reply công khai cho khách, không tự chuyển Solved. Nội dung trả lời luôn đặt ở **Internal note**.
2. **KHÔNG BỊA.** Mọi số liệu (số đơn, tracking, ETA, ngày, tên/biến thể sản phẩm) phải lấy từ Shopify hoặc Zendesk. Không đoán.
3. **KHÔNG HỨA VƯỢT QUYỀN.** Refund/replacement/discount ngoài hạn mức policy → ghi rõ "CẦN DUYỆT" trong note, không cam kết với khách.
4. **Thiếu thông tin → không chế.** Nếu chưa xác minh được, xuất danh sách "thông tin cần bổ sung" + template có `[chỗ trống]` để agent điền.
5. **Ngôn ngữ:** trả lời khách bằng English cho Flagwix/US). Note nội bộ viết tiếng Việt.
6. 🛡️ **TUYỆT ĐỐI KHÔNG mở / click / tải bất kỳ link hay file đính kèm nào trong ticket** (ảnh khách gửi, file, URL trong nội dung email, nút tải...). **CHỈ đọc text ticket.** Rủi ro virus/phishing. Nếu ca cần xem bằng chứng (ảnh hàng lỗi/sai/thiếu, ảnh chụp tracking...) → **ghi vào internal note để HUMAN tự mở xem**, skill KHÔNG tự mở/tải. Mọi dữ liệu xác minh lấy từ **Shopify (MCP)**, không lấy từ file/link khách đính kèm.
7. ✂️ **CHỈ ĐỌC NỘI DUNG KHÁCH VIẾT — bỏ text thừa.** Email khách thường lẫn rất nhiều rác: marketing footer/banner ("Best items for the season", "Shop now"), thư cảm ơn CEO, URL tracking dài, ký tự ẩn, unsubscribe/privacy, chuỗi quote email cũ. **Đọc ticket QUA script [`scripts/zendesk-clean.mjs`](scripts/zendesk-clean.mjs)** (xem Bước 1) để cắt sạch các phần này trước khi vào context — giảm ~80% token mà vẫn giữ phần khách viết + Order Summary. KHÔNG parse/đọc nội dung trong link.

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
2. **Lấy danh sách ticket cần xử lý:**
   - Nếu prompt có chứa cụm `từ [timestamp]` (do workflow truyền vào theo dạng ISO 8601, vd `từ 2026-06-20T10:13:00Z`), thêm filter `updated>[timestamp]` vào mọi search query — chỉ lấy ticket tạo/update từ thời điểm đó.
   - Query mẫu khi có timestamp: `type:ticket status:new updated>2026-06-20T10:13:00Z`
   - Query mặc định (không có timestamp): `type:ticket status:new`, `type:ticket status:open`
   - Ưu tiên Brand Flagwix trước, rồi brand khác.
   - Bỏ qua ticket đã có tag `ai-drafted` (đã xử lý) trừ khi có reply mới của khách.
   - Bỏ qua ticket có requester email là `mailer@shopify.com` (Shopify system notification, không phải khách thật).
3. **Sắp xếp theo ưu tiên** (P1 → P4 theo ticket-triage / SLA trong cs-rules).
4. **Với MỖI ticket → chạy SOP per-ticket (Chế độ B).**
5. **Báo cáo tổng kết** cuối lượt: bảng [Ticket | Brand | Loại | Trạng thái xử lý: Drafted / Cần bổ sung / Escalate | Tag đã set]. Liệt kê riêng các ticket "Cần bổ sung thông tin" để team xử lý tay.

> Giới hạn an toàn mỗi lượt: xử lý tối đa N ticket (mặc định 20) rồi dừng + báo còn lại bao nhiêu, tránh chạy vô hạn. KHÔNG đụng Solved của ticket nào.

> **DRY-RUN mode** (mặc định cho lần test / khi user nói "dry-run", "thử", "đừng ghi"): làm hết SOP nhưng **chỉ in draft + tag/status đề xuất RA CHAT**, KHÔNG ghi internal note / KHÔNG set tag / KHÔNG đổi status trên Zendesk. Dùng để duyệt chất lượng trước khi cho ghi thật.

> **Kích hoạt:** skill chạy theo **manual trigger** — user gõ "quét ticket"/"cs sweep" khi muốn (chưa bật autostart). Có thể thêm SessionStart hook / cron sau.

---

## CHẾ ĐỘ B — SOP PER-TICKET (lõi xử lý 1 ticket)

### Bước 1 — Intake

**Đọc nội dung ticket QUA script làm sạch (BẮT BUỘC — tiết kiệm token):**
```bash
node "C:/Users/Admin/.claude/skills/cs-ticket-handler/scripts/zendesk-clean.mjs" <ticket_id>
```
Script tự fetch comment thread qua Zendesk API, cắt marketing/footer/URL/ký tự ẩn, **giữ phần khách viết + Order Summary** (order#, sản phẩm, địa chỉ ship), liệt kê tên file đính kèm (KHÔNG tải). Dùng output này thay cho `get_ticket_comments` raw.
- Vẫn dùng `get_ticket` (không `include_comments`) để lấy **metadata**: tags hiện có, brand, status, requester, custom fields.
- Nếu script lỗi (creds/Node/API) → fallback `get_ticket_comments` rồi tự bỏ qua phần marketing khi đọc.

Đọc: subject, toàn bộ hội thoại (đã làm sạch), email khách, brand/kênh, kênh đến (email/chat), ngôn ngữ. Xác định **ý định chính** của khách (1–2 câu).

**Tên khách:** luôn lấy từ **form field First Name** (hoặc Zendesk user profile), KHÔNG dùng nickname/sign-off cuối message (vd: "Thanks Tony" ≠ tên). Convert sang Title case nếu ALL CAPS.

**Nhận diện persona** (xác định ngay sau khi đọc ticket — ảnh hưởng toàn bộ tone từ câu đầu tiên):

| Tín hiệu | Persona |
|---|---|
| Sản phẩm memorial (hummingbird, cardinal, "in loving memory", in tên người đã mất) | 🕊️ Grieving Grace |
| Sản phẩm military / POW-MIA / US flag / 250th | 🇺🇸 Patriot Pete |
| Sản phẩm religious (cross, scripture, blessed) | ✝️ Faith-Driven Faye |
| Sản phẩm pet flag (breed-specific) | 🐾 Dog Mom Debbie |
| Sản phẩm seasonal / holiday / "for Christmas / Halloween..." | 🎃 Holiday Helen |
| Mua tặng ("it's a gift", "for my mom/dad") | 🎁 Gift Giver Gary |
| Sản phẩm garden flag, nhiều cái cùng lúc | 🌸 Garden Gina |
| Đặt hàng cho 4th of July 2026, 250th Anniversary | 🇺🇸 Anniversary America |

Nếu có nhiều tín hiệu → xem rule ưu tiên trong [`references/flagwix-customer-context.md`](references/flagwix-customer-context.md) §Multi-persona.
Ghi rõ persona đã chọn vào internal note header để dễ review.

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
> **Fallback nếu plugin lỗi/không available:** phân loại thủ công dựa vào Bước 1 — dùng danh sách type trên + priority theo SLA table trong `cs-rules.md §7`.

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

**Khi cần tìm order theo tên (FLWSPXXXXXX) mà không có email khớp:**
Dùng Bash + curl gọi Shopify REST API:
```bash
curl -s "https://flagwix.myshopify.com/admin/api/2026-01/orders.json?name=%23FLWSPXXXXXX&status=any" \
  -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN"
```
Thay `FLWSPXXXXXX` bằng order number thực. Response trả về JSON với customer, line_items, fulfillments (tracking_number, tracking_url), financial_status. Dùng data này để draft WISMO reply.

**Ca đặc biệt: Email / Address change request**
Khi khách báo email cũ sai và cung cấp email mới:
1. Dùng **email cũ (sai)** khách đã cung cấp trong message để `get-customers` search Shopify.
2. Nếu TÌM THẤY account:
   - Ghi internal note: "Tìm thấy account [email cũ] — đề xuất human update email → [email mới] trong Shopify."
   - KHÔNG tự update — để human thực hiện (đây là thay đổi dữ liệu nhạy cảm).
   - Draft reply khách: (a) xác nhận sẽ cập nhật email, (b) THÊM tình trạng đơn hàng gần nhất để khách yên tâm (get order status từ Shopify trước khi draft).
   - Ví dụ tone: "Got it, Jerrill — I've flagged your account to get your email updated to janikj1806@mediacombb.net. While I have your order pulled up, your [product] shipped on [date] and is on its way to you, tracking [number]."
3. Nếu KHÔNG tìm thấy → draft reply: xác nhận đã nhận, không tìm thấy account với email cũ, hỏi order number để locate và update.
KHÔNG yêu cầu verify danh tính thêm nếu khách đã cho cả email cũ + email mới.

**Ca đặc biệt: Ticket chỉ có order number, không có câu hỏi**
Khi body ticket chỉ là một order number (không có mô tả vấn đề):
1. **Giả định intent = WISMO** (Where Is My Order) — đây là intent phổ biến nhất với Flagwix 35+.
2. Tìm order trong Shopify theo email khách → lấy fulfillment status + tracking.
3. Draft **proactive status update**: cho khách biết đơn ở đâu, ETA, tracking. Không hỏi "what can I help you with?" — với tệp 35+ đang lo lắng về đơn hàng, câu đó làm tăng lo lắng thay vì trấn an.
4. Nếu không tìm được order → draft reply hỏi email đặt hàng để xác minh.

- Đối chiếu **cs-rules.md**: refund còn hạn không? ETA ship? policy hàng lỗi? cần bằng chứng (ảnh/video)? thuộc quyền agent hay cần duyệt?

### Bước 5 — Cổng quyết định
**Đã đủ thông tin ĐÃ XÁC MINH để trả lời đúng yêu cầu khách chưa?**

- ✅ **ĐỦ** →
  1. Dùng `customer-support:draft-response` viết reply theo **[`voice-persona.md`](references/voice-persona.md)** (người thật, không em dash/emoji, đồng cảm trước, trấn an tiền), **chèn dữ liệu thật** (số đơn, tracking, ngày, link).

  **Tone audit — bắt buộc trước khi ghi note (tự kiểm từng dòng):**
  - [ ] Có ký tự "—" (em dash) nào không? → thay bằng dấu phẩy hoặc tách câu
  - [ ] Có emoji không? → xóa
  - [ ] Có phrase AI nào không? ("rest assured", "Great news!", "I completely understand your frustration", "please don't hesitate", "rest easy", "I hope this finds you well", "Thank you for writing in", "Great question") → rewrite
  - [ ] Còn `[chỗ trống]` hoặc placeholder chưa điền không? → điền data thật hoặc đánh dấu rõ cho human
  - [ ] Câu đầu có specific với đúng vấn đề ticket này không (không phải mở đầu generic)? → nếu không, rewrite
  - [ ] Tone match với persona đã xác định ở Bước 1 chưa? (Grieving Grace: chậm/nhẹ/cảm xúc trước; Dog Mom Debbie: nhanh/friendly; Patriot Pete: tôn trọng/honor)
  - [ ] Sign-off: dùng `AI ddmmyy` (ví dụ `AI 200626`), KHÔNG ghi "Flagwix Customer Care"

  2. **Ghi reply vào INTERNAL NOTE** (không phải public reply). Viết note bằng plain text thuần — KHÔNG dùng `##`, `###`, `---` vì Zendesk render thành HTML heading/HR gây font size loạn.
  3. Set **tag** theo zendesk-ops.md. **KHÔNG đổi status** — chỉ human mới đổi status khi họ thật sự reply khách.
  4. Nếu khớp trigger escalate → `customer-support:customer-escalation`.

- ⚠️ **CHƯA ĐỦ** → ghi **Internal note** gồm:
  1. **Thông tin còn thiếu / chưa kiểm tra được** + **lấy ở đâu** (vd: cần ảnh sản phẩm lỗi từ khách; cần xác nhận địa chỉ; cần check kho; cần duyệt refund...).
  2. **Draft "holding reply" gửi ngay** (`templates/email-templates.md` → `holding-acknowledgment`): xác nhận đã nhận, đang xử lý, hẹn thời gian follow-up cụ thể (thường 1 business day). **Không hứa kết quả, chỉ hứa timeline.** Mục tiêu: khách không bị im lặng trong khi team đang xử lý.
  3. **Draft template đầy đủ** (có `[chỗ trống]`) để agent copy + điền số thật khi đã có đủ info.
  4. Set tag `cs-need-approval` nếu cần duyệt; nếu chỉ thiếu info thì giữ `ai-drafted` — ghi rõ còn thiếu gì trong internal note. **KHÔNG đổi status ticket trong mọi trường hợp.**

  > Quy tắc: **không bao giờ để khách im lặng**, dù chưa có đủ thông tin hay chưa được duyệt. Holding reply là nghĩa vụ tối thiểu với mọi ticket chưa xử lý được ngay.

### Bước 6 — Ghi nhận
- Set tag `ai-drafted` để sweep lần sau bỏ qua.
- **Seed feedback record** vào bảng Lark Base (xem [`references/feedback-loop.md`](references/feedback-loop.md)): Ticket ID, Brand, Issue Type, AI Draft (tóm tắt), Status=`1-New feedback` → để human chấm.
  > Nếu Lark Base lỗi / không kết nối → **skip, không block luồng chính**. Ghi `⚠ Lark Base: không seed được feedback record` vào output tóm tắt cuối lượt.
- (Tùy chọn) nếu ca đáng tài liệu hóa → gợi ý `customer-support:kb-article`.

---

## CHẾ ĐỘ C — LEARNING MODE
Trigger: "học feedback", "review feedback CS", "cập nhật skill từ feedback".
→ **Chạy skill riêng:** [`cs-ticket-learn`](../cs-ticket-learn/SKILL.md) (không load cs-rules/voice-persona khi học).

## Output cho người dùng
Sau khi xử lý (1 ticket hoặc 1 lượt sweep), in tóm tắt ngắn gọn: đã draft gì, set tag/status gì, ticket nào cần team bổ sung thông tin. **Không** dán full nội dung note dài dòng trừ khi được hỏi.

## Quy tắc cập nhật
- Khi phát hiện selector/URL Zendesk mới hoạt động → ghi vào `references/zendesk-ops.md`.
- Khi policy thay đổi → cập nhật `references/cs-rules.md` (nguồn: Brands wiki/Website/CS).

---
<!-- Maintenance: Created 2026-06, Owner: CS Team
     Review triggers:
       - Policy thay đổi → cập nhật references/cs-rules.md
       - Zendesk UI/API upgrade → cập nhật references/zendesk-ops.md
       - Sau 4th July 2026 → review persona "Anniversary America" trong references/flagwix-customer-context.md (chỉ còn hiệu lực năm 2026)
       - Shopify MCP version bump → kiểm tra tool names trong references/shopify-lookup.md
     Last updated: 2026-06-20 -->
