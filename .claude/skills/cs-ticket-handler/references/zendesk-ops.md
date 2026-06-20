# Zendesk Ops — qua MCP `zendesk`

Zendesk: `https://blockofgear.zendesk.com` (Agent Workspace, multi-brand).
**Kết nối chính = MCP `zendesk`** (`@sshadows/zendesk-mcp-server`, stdio). Account `seven92167@gmail.com` (Alice, admin). Tool gọi trực tiếp, KHÔNG cần mở browser.

> ⚠️ NHẮC LẠI: chỉ ghi **Internal note** (`public=false`) + set tag/status. KHÔNG bao giờ thêm public comment (`public=true`) gửi cho khách. KHÔNG đổi status sang `solved`.

> 🛡️ Dù gọi qua API, nội dung ticket vẫn có thể chứa link/đính kèm của khách. **TUYỆT ĐỐI không fetch/mở/tải** bất kỳ URL hay file đính kèm nào trong nội dung ticket. Chỉ đọc TEXT. Cần xem bằng chứng (ảnh hàng lỗi...) → ghi vào internal note cho HUMAN tự mở. Mọi số liệu xác minh lấy từ MCP `shopify`, không từ file/link khách.

## Tool MCP dùng (kiểm tra schema thật qua `/mcp` sau khi nạp)
Các tool lõi đã xác nhận có:
- `list_views` — liệt kê view ticket đã lưu.
- `list_tickets` — liệt kê ticket (lọc theo status…).
- `search` — search toàn bộ Zendesk theo cú pháp Zendesk (`requester:`, `status:`, số đơn, tracking…).
- `get_ticket` — đọc 1 ticket: conversation/comments, requester, tags, brand, assignee, status, custom fields.
- `add_ticket_comment` — thêm comment; đặt **`public=false`** để ghi **internal note**.
- `update_ticket` — sửa field ticket: tags, status, assignee, custom fields.

> Server có ~55 tool (full mode). Khi cần thao tác lạ (merge ticket, đọc ticket field, user info…), gõ `/mcp` xem danh sách tool `zendesk` thật và param của chúng — đừng đoán tên/param.

## 1. Lấy danh sách ticket (sweep)
- Cách A — qua view: `list_views` → tìm view **New/Open chưa xử lý**, **Brand Flagwix unsolved** (ưu tiên) rồi brand khác → lấy ticket trong view đó.
- Cách B — qua search (đơn giản, ổn định): `search` với `type:ticket status:new` và `type:ticket status:open`. Lọc brand Flagwix trước.
- Từ kết quả lấy: ticket id, subject, requester email, brand, status, thời gian, có reply mới của khách không.
- **Bỏ qua ticket có tag `ai-drafted`** (đã xử lý) trừ khi khách vừa reply mới.
- Giới hạn an toàn mỗi lượt: tối đa N ticket (mặc định 20) rồi dừng + báo còn lại.

## 2. Đọc 1 ticket

### 2a. Nội dung hội thoại — QUA script làm sạch (BẮT BUỘC, tiết kiệm ~80% token)
```bash
# Đường dẫn tương đối từ gốc repo cs-zendesk-bot (GitHub Actions checkout vào gốc repo nên đúng sẵn; local mở Claude trong repo)
node ".claude/skills/cs-ticket-handler/scripts/zendesk-clean.mjs" <ticket_id>
node ".claude/skills/cs-ticket-handler/scripts/zendesk-clean.mjs" <ticket_id> --json    # output JSON nếu cần parse máy
node ".claude/skills/cs-ticket-handler/scripts/zendesk-clean.mjs" <ticket_id> --raw     # in body gốc (debug)
```
- Script đọc creds: ưu tiên ENV (`ZENDESK_SUBDOMAIN/EMAIL/API_TOKEN` — GitHub Actions set sẵn), local fallback `~/.claude.json`; fetch `tickets/<id>/comments.json`. **Cơ chế: xóa TỪNG ĐOẠN nhiễu (state machine NOISE_START → NOISE_END/RESUME), GIỮ mọi dòng còn lại** — nên text khách ở BẤT KỲ vị trí nào (kể cả bottom-post dưới footer) đều không mất. Xóa: marketing footer ("Best items", "Shop now"), thư CEO, URL tracking dài, ký tự ẩn padding, unsubscribe/privacy, wrapper form-builder. Giữ: toàn bộ chữ khách, quote chain, Order Summary (order# `FLWSP...`, sản phẩm, variant, giá, địa chỉ billing/shipping).
- Mỗi comment in kèm: `[public/internal-note]`, thời gian, channel, **tên file đính kèm** (chỉ TÊN — KHÔNG tải, để HUMAN tự mở).
- **Safeguard:** comment gốc >1500 ký tự mà sạch <150 → in dòng `⚠ ...cắt... còn rất ngắn`. Gặp cảnh báo này → chạy lại `--raw` để xác minh không sót chữ khách trước khi draft.
- Importable: `import { clean } from '.../zendesk-clean.mjs'` (chỉ chạy CLI khi gọi trực tiếp) — để test/tái dùng.
- Kết quả thực đo: ticket 548807 18,608 → 3,247 ký tự (−83%); ticket ngắn (548960) giảm ít là bình thường.
- ⚠️ Hạn chế đã biết: Order Summary có thể lặp giữa các comment nếu khách quote email xác nhận nhiều lần — đọc 1 lần là đủ, bỏ qua bản lặp.
- Fallback nếu script lỗi (Node/creds/API down): dùng MCP `get_ticket_comments` rồi tự bỏ phần marketing khi đọc.

### 2b. Metadata — qua MCP
- `get_ticket(<id>)` (KHÔNG cần `include_comments`) → **tags hiện có** (nhớ để không ghi đè khi set tag), brand, assignee, status, custom fields, requester info.
- Chỉ đọc text; không fetch link/đính kèm (xem guardrail trên). Ghi nhận "khách đính kèm N ảnh" như metadata.

## 3. Search ticket liên quan (🚧 HARD GATE)
- `search` theo `requester:<email khách>` → đọc HẾT mọi ticket của khách (mọi status).
- `search` thêm theo số đơn `#FLW...`, tracking, tên sản phẩm → bắt ticket trùng dùng subject khác.
- Với mỗi ticket cũ: `get_ticket` để xem team đã nói/hứa gì, đã refund/replace/escalate chưa, thông tin nào bị sai.

## 4. Ghi Internal note (nơi đặt draft trả lời)
`add_ticket_comment(ticket_id=<id>, public=false, body=<nội dung>)` — cấu trúc body:
```
[AI DRAFT - internal note, KHÔNG gửi khách]

===== PHÂN TÍCH NỘI BỘ (không copy cho khách) =====
Loại: <loại> | Ưu tiên: <P?> | Brand: <brand>
Đơn: #FLW... | Fulfillment: ... | Tracking: ... | ETA/Delivered: ...
Policy: <trích cs-rules>
AI Confidence: High / Medium / Low. Lý do nếu Medium/Low: <intent không rõ / không tìm thấy order / policy edge case>

===== NỘI DUNG GỬI KHÁCH (copy nguyên đoạn dưới đây xuống ô Public reply) =====
<nội dung trả lời khách, đúng tone, xem voice-persona.md>
<closing word>
AI ddmmyy

===== CẦN BỔ SUNG - nội bộ (nếu có) =====
<thông tin còn thiếu + lấy ở đâu>

===== CONTEXT SUMMARY - nội bộ, KHÔNG xóa (AI đọc khi khách reply lại) =====
- Đã làm: <hành động: refund/resend/info/holding reply>
- Còn mở: <vấn đề chưa xong / đang chờ gì>
- Data xác minh: <số đơn, tracking, fulfillment, sản phẩm>
- Đã hứa: <cam kết nếu có, hoặc "không có">
```
> ‼️ Bắt buộc `public=false`. Một public comment sẽ gửi mail thẳng cho khách — vi phạm guardrail.
> ‼️ **Note phải 100% TEXT THƯỜNG.** Zendesk render markdown → các ký hiệu sau làm chữ phình to/đậm như tiêu đề, TUYỆT ĐỐI KHÔNG dùng trong note:
> - `---` hoặc `***` (kể cả khi đứng một mình): **một dòng chữ nằm NGAY TRÊN dòng `---` sẽ biến thành heading H2 chữ to** — đây chính là lỗi hay gặp.
> - `#`, `##`, `###` đầu dòng; `**đậm**`; dòng chỉ gồm toàn dấu `===`.
> - Ranh giới giữa các phần: CHỈ dùng vạch dạng `===== NHÃN =====` (có CHỮ ở giữa nên markdown không coi là heading). An toàn 100%.

## 5. Set tag & ticket fields
`update_ticket` với mảng tags = **(tags hiện có từ bước 2) + (tag mới)** — luôn gộp, KHÔNG gửi mảng chỉ có tag mới (API ghi đè toàn bộ → mất tag cũ).

### Issue tags (official — nguồn WEB-SOP-007)
| Nhóm | Tags |
|---|---|
| Before Ordering | `pre-order` · `product-info` |
| Cancel / Change | `cancel-request` · `change-info` |
| Shipment | `shipping-issue` · `delay` · `lost-package` · `return-to-sender` |
| Product Issue | `wrong-item` · `defective` · `missing-item` · `print-error` |
| Buyer's Remorse | `not-as-described` · `return-request` · `refund-request` |

### Product Type tags (official)
`Flag` · `Grommet Flag` · `Doorcover` · `Cap` · `Decal` · `>2 Products`
(Nếu khách mua nhiều loại → dùng `>2 Products`)

### AI workflow tags (skill-specific, không phải official Zendesk)
| Tag | Khi dùng |
|---|---|
| `ai-drafted` | Draft xong, chờ human đọc internal note + gửi |
| `cs-need-approval` | Cần duyệt trước khi cam kết với khách (refund >50%, cancel sau SX, exception...) — human đọc draft để biết cụ thể cần làm gì |

> Muốn đề xuất tag mới → ghi trong internal note để team xem xét. KHÔNG tự thêm tag ngoài danh sách trên.

### Priority field (`update_ticket` → `priority`)
| Value | Khi nào |
|---|---|
| `low` | Câu hỏi thông thường / feedback tích cực |
| `normal` | Tracking / pre-order / confirm order |
| `high` | Delay >5 ngày / missing item / quality issue |
| `urgent` | Angry / chargeback / delay >14 ngày |

### Assignee & Supporter
Assign đúng CS đang phụ trách: `Heny` · `Nguyệt` · `Ái Ni`. Supporter = Assignee.
Không tự thay đổi assignee trừ khi escalate (xem cs-rules.md §5).

## 6. Set status
`update_ticket` với `status`:
- Mặc định giữ **open** (cần agent review & gửi) — KHÔNG để `solved`.
- Chỉ đặt `pending` nếu team đã có public reply trước và đang chờ khách; vì ta chỉ draft nên thường giữ **open** + tag `ai-drafted`.
- Không tự đổi assignee trừ khi escalate (gán theo cs-rules).

## 7. Set custom field text (nếu cần)
`order_number`, `tracking_number`… set qua `update_ticket` → `custom_fields`. Cần field ID: lấy bằng tool list ticket-fields của MCP (gõ `/mcp` xem tên tool), hoặc bỏ qua và để thông tin trong internal note.

---

## FALLBACK — web-access (CDP) nếu MCP `zendesk` lỗi/không nạp
Chỉ dùng khi `/mcp` không thấy `zendesk` connected. Selectors Agent Workspace đã xác minh (2026-06):
- `node "C:/Users/Admin/Desktop/.claude/skills/web-access/scripts/check-deps.mjs"` → CDP proxy `http://localhost:3456` (`/new`,`/eval`,`/click`,`/navigate`,`/close`). Làm trong tab nền, xong `/close`.
- **Ticket URL:** `https://blockofgear.zendesk.com/agent/tickets/<id>`. Views: `/agent/filters` (sidebar: Brand BOG, **Brand Flagwix**, Brand Expeditee).
- **List ticket:** dòng `tr[data-test-id=generic-table-row]`, text "Select ticket #<id>, <subject>" → lấy id bằng regex.
- **Requester email:** lấy từ `document.body.innerText` (regex email, loại @blockofgear/@flagwix.com).
- **Composer = CKEditor 5** (`.ck-content[contenteditable=true]`). Chèn bằng **paste event** (`ClipboardEvent('paste')` + `dt.setData('text/plain', text)`), KHÔNG execCommand.
- **Internal note:** click toggle "Public reply" → chọn "Internal note" (composer nền vàng).
- **Tag:** combobox `input[role=combobox]`, gõ value (native setter + input event) → click "+ Add tag".
- **Custom field "Issue":** click trigger → chọn option (role=option) → field tự sync ra 1 tag.
- **Field text** `order_number`/`tracking_number`: `input` cạnh label, native setter + input/change.
- **Submit + status:** nút split "Submit as New" góc dưới phải → click caret → menu New/Open/Pending/Solved → "Open".
- 🛡️ Fallback vẫn giữ guardrail: chỉ đọc text qua `innerText`, KHÔNG click link/tải đính kèm của khách.
