---
name: cs-ticket-process
description: "Xử lý 1 ticket CS Zendesk theo SOP: đọc → thu thập context (lịch sử + đơn Shopify) → triage + persona → gọi cs-draft-writer viết draft → cs-draft-reviewer soi chất lượng → ghi internal note + tag. Được gọi bởi cs-orchestrator (mỗi ticket), hoặc trực tiếp khi user nói 'xử lý ticket #<id>'."
---

# CS Ticket Process — SOP 1 ticket

Xử lý **đúng 1 ticket** từ đọc đến ghi note. Đây là **khung điều phối các bước** — chi tiết để trong reference, **chỉ đọc đúng file khi tới bước cần** (lazy: đừng đọc hết ở đầu).

## ⚠️ Guardrail BẮT BUỘC (đọc trước mọi việc)
1. **CHỈ DRAFT — KHÔNG TỰ GỬI.** Reply luôn đặt ở **Internal note** (`public=false`). Không tự chuyển Solved.
2. **KHÔNG BỊA.** Mọi số liệu (số đơn, tracking, ETA, ngày, tên/variant) lấy từ Shopify/Zendesk. Không đoán.
3. **KHÔNG HỨA VƯỢT QUYỀN.** Refund/replacement/discount ngoài hạn mức → ghi "CẦN DUYỆT", không cam kết với khách.
4. **Thiếu info → không chế.** Chưa xác minh được thì xuất "thông tin cần bổ sung" + holding reply, KHÔNG bịa.
5. **Ngôn ngữ:** trả lời khách bằng **English** (Flagwix/US). Note nội bộ tiếng Việt.
6. 🛡️ **KHÔNG mở/click/tải bất kỳ link hay file đính kèm nào** trong ticket (rủi ro virus/phishing). Chỉ đọc text. Cần xem bằng chứng → ghi vào note để HUMAN tự mở. Data xác minh chỉ lấy từ Shopify.

## Kết nối
- **Zendesk:** MCP `zendesk` — `search`/`get_ticket` (đọc), `add_ticket_comment` `public=false` (note), `update_ticket` (tag). Chi tiết tool + fallback: [`references/zendesk-ops.md`](references/zendesk-ops.md).
- **Shopify:** MCP `shopify` (store `flagwix`) + curl REST cho tracking. Chi tiết: [`references/shopify-lookup.md`](references/shopify-lookup.md).

---

## Bước 1 — Intake

**Đọc ticket QUA script làm sạch (BẮT BUỘC — tiết kiệm token):**
```bash
node ".claude/skills/cs-ticket-process/scripts/zendesk-clean.mjs" <ticket_id>
```
Script vứt rác (marketing/footer/URL/ký tự ẩn/CEO letter), **giữ 100% chữ khách viết** + Order Summary, liệt kê tên file đính kèm (KHÔNG tải). Dùng output này thay cho `get_ticket_comments` raw.
- Vẫn gọi `get_ticket` (không kèm comments) để lấy **metadata**: tags, brand, status, requester, custom fields.
- Nếu output cảnh báo `⚠ Comment ... cắt ...` → chạy lại với `--raw` để xác minh không sót chữ khách.
- Script lỗi → fallback `get_ticket_comments`, tự bỏ qua marketing khi đọc.

Xác định **ý định SƠ BỘ** của khách (1–2 câu). Lấy **tên khách** từ form field First Name / Zendesk profile (KHÔNG dùng sign-off cuối mail). Ghi nhận tín hiệu persona sơ bộ (loại sản phẩm, "it's a gift", "in loving memory"...).

## Bước 2 — Thu thập context — 🚧 HARD GATE, KHÔNG BỎ QUA

> Gom HẾT thông tin TRƯỚC khi triage/draft. **Một ticket lẻ không bao giờ là toàn bộ câu chuyện.** Thiếu khúc nào lấy cho đủ tại đây.

**2.1 Lịch sử ticket:**
- Ticket đã `ai-drafted` + khách reply mới → đọc comment mới nhất + internal note gần nhất (lấy Phần 1 NỘI BỘ), search nhanh `requester:<email>` xem có ticket MỚI nào không. KHÔNG đọc lại ticket cũ đã xử lý.
- Ticket MỚI → search `requester:<email khách>` đọc **HẾT** ticket của khách (mọi status) + search theo số đơn/tracking. Bắt: team đã hứa/làm gì, thông tin nào SAI, có deadline/ý nghĩa cảm xúc (quà, dịp lễ) không.
- **Quy tắc:** KHÔNG mâu thuẫn điều agent thật đã nói; thông tin cũ sai → xin lỗi + đính chính. Ticket trùng → đề xuất MERGE.

**2.2 Dữ liệu đơn (ưu tiên Zendesk sidebar, Shopify chỉ khi cần):**
- Sidebar đã đủ order# + fulfillment + tracking → **dùng luôn, KHÔNG query Shopify**.
- Thiếu fulfillment/tracking, hoặc chạy headless (không có sidebar), hoặc cần chi tiết sản phẩm → query Shopify. **Đọc [`references/shopify-lookup.md`](references/shopify-lookup.md) đúng lúc này** để biết dùng tool/curl nào (lưu ý: lấy tracking phải dùng curl REST, không phải `get-order-by-id`).
- Đối chiếu **[`references/cs-rules.md`](references/cs-rules.md)**: còn hạn refund? ETA ship? policy hàng lỗi? cần bằng chứng? thuộc quyền agent hay cần duyệt?

## Bước 3 — Triage + Persona (sau khi đủ facts)

- Phân loại: order/shipping/refund-return/product-question/damaged-wrong/cancellation/address-change/khác. Gán ưu tiên P1–P4 theo SLA trong `cs-rules.md`.
- **Xác nhận persona:** nếu có tín hiệu persona (memorial, military, religious, pet, holiday, gift...) → **đọc [`references/personas.md`](references/personas.md)** để chọn đúng persona + bắt deadline nhạy cảm. Không có tín hiệu rõ → bỏ qua, khỏi đọc file này.
- Ghi persona đã chốt vào Phần 1 NỘI BỘ.

## Bước 4 — Viết draft

**Đủ thông tin đã xác minh để trả lời?**

- ✅ **ĐỦ** → **gọi skill `cs-draft-writer`** với: loại ticket, persona, data đơn thật, tóm tắt vấn đề + context. Nó viết draft đúng tone + chèn data thật, rồi tự gọi `cs-draft-reviewer` soi 4 lỗi (sai nghĩa/ngữ cảnh/khó hiểu/thiếu chuyên nghiệp) trước khi trả về.
  - Nhận draft đạt → **ghi vào INTERNAL NOTE** theo template [`references/zendesk-ops.md`](references/zendesk-ops.md) §4: **Phần 1 NỘI BỘ** (phân tích + việc human cần làm + theo dõi, mỗi dữ kiện 1 lần) + **Phần 2 GỬI KHÁCH**. Note **100% plain text** — KHÔNG `#`/`##`, `---`, `**đậm**` (Zendesk render markdown thành chữ to). Ranh giới dùng `===== NHÃN =====`.
  - Set **tag** theo zendesk-ops.md. **KHÔNG đổi status.** Khớp escalate → ghi `cs-need-approval`.

- ⚠️ **CHƯA ĐỦ** → ghi internal note gồm: (1) thông tin còn thiếu + lấy ở đâu; (2) **holding reply gửi ngay** (gọi `cs-draft-writer` loại `holding-acknowledgment` — xác nhận đã nhận, hẹn follow-up cụ thể, KHÔNG hứa kết quả); (3) draft đầy đủ có `[chỗ trống]` để agent điền sau. Set `cs-need-approval` nếu cần duyệt, nếu chỉ thiếu info thì giữ `ai-drafted`. **KHÔNG đổi status.**

> Quy tắc: **không bao giờ để khách im lặng** — luôn có holding reply dù chưa đủ info/chưa duyệt.

## Bước 5 — Ghi nhận
- Set tag `ai-drafted`.
- **Seed feedback record** vào Lark Base (xem [`references/feedback-loop.md`](references/feedback-loop.md)): Ticket ID, Brand, Issue Type, AI Draft (tóm tắt), Status=`1-New feedback`. Lỗi Lark → skip, không block, ghi `⚠ Lark Base: không seed được` vào output.

## Output
Trả về **đúng 1 dòng tóm tắt** cho orchestrator: `#<id> | <brand> | <loại> | <Drafted/Cần bổ sung/Escalate> | <tag>`. Không in full note trừ khi được hỏi (hoặc dry-run đơn lẻ).
