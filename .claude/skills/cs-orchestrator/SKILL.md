---
name: cs-orchestrator
description: "Điều phối xử lý ticket CS Zendesk (Flagwix/Shopify): quét ticket new/open, định tuyến mỗi ticket cho cs-ticket-process, gom kết quả thành báo cáo. LUÔN dùng cho mọi việc quét/xử lý/draft ticket Zendesk. Trigger: 'quét ticket', 'cs sweep', 'xử lý ticket', 'draft ticket', 'check ticket zendesk', 'xem ticket mới', 'handle ticket', 'process ticket', 'zendesk sweep', 'reply customer'."
---

# CS Orchestrator — điều phối + báo cáo

Skill **entry point** cho toàn bộ luồng CS. Việc của nó **rất nhẹ**: lấy danh sách ticket cần xử lý, giao mỗi ticket cho skill xử lý, gom kết quả lại. **KHÔNG tự đọc policy/tone/persona** — đó là việc của `cs-ticket-process` và `cs-draft-writer`.

## Input
| Dạng | Ý nghĩa |
|---|---|
| Không có input | Sweep mode: tự quét ticket new/open |
| `từ <ISO8601>` | Chỉ lấy ticket tạo/update từ timestamp (workflow truyền vào) |
| Ticket ID / `#123` | Xử lý 1 ticket cụ thể |
| `dry-run` / `thử` / `đừng ghi` | Chỉ in ra chat, không ghi Zendesk (truyền tiếp xuống) |

## Định tuyến — quyết định inline hay sub-agent

- **1 ticket** (có ticket ID, hoặc sweep ra đúng 1 ticket): **gọi thẳng skill `cs-ticket-process`** cho ticket đó — KHÔNG mở sub-agent (nhanh nhất, ~1–2 phút).
- **Nhiều ticket** (sweep ra ≥2): **mỗi ticket = 1 sub-agent riêng** (dùng Task tool), mỗi sub-agent chạy `cs-ticket-process` cho 1 ticket rồi trả về **đúng 1 dòng tóm tắt**. Lý do: cô lập context từng ticket → token không dồn cục, an toàn dưới mức ngân sách.

> Sub-agent prompt mẫu: *"Dùng skill cs-ticket-process xử lý ticket Zendesk #<id>. Trả về đúng 1 dòng: `#<id> | <brand> | <loại> | <Drafted/Cần bổ sung/Escalate> | <tag đã set>`. Không in nội dung note dài."*

## Sweep mode — lấy danh sách ticket

1. Kiểm tra MCP `zendesk` sẵn sàng (`list_views`/`search`/`get_ticket`). Lỗi → fallback web-access (xem `cs-ticket-process` → references/zendesk-ops.md).
2. Query ticket:
   - Có `từ [timestamp]` trong prompt → thêm filter `updated>[timestamp]` vào mọi query. Vd: `type:ticket status:new updated>2026-06-20T10:13:00Z`.
   - Không có timestamp → `type:ticket status:new`, `type:ticket status:open`.
   - **Bỏ qua** ticket đã có tag `ai-drafted` (trừ khi khách có reply mới).
   - **Bỏ qua** ticket requester `mailer@shopify.com` (thông báo hệ thống, không phải khách).
   - Ưu tiên Brand Flagwix trước.
3. Giới hạn an toàn: tối đa **20 ticket/lượt**, rồi dừng + báo còn bao nhiêu. KHÔNG đụng Solved của bất kỳ ticket nào.

## Báo cáo cuối lượt

Gom kết quả (từ inline hoặc các sub-agent) → in **1 bảng**:

| Ticket | Brand | Loại | Trạng thái | Tag |
|--------|-------|------|-----------|-----|

Liệt kê riêng nhóm **"Cần bổ sung thông tin"** để team xử lý tay. Nếu có ticket bị skip (vượt giới hạn 20, lỗi...) → ghi rõ số lượng. **Không** dán full nội dung note.

> **DRY-RUN:** nếu prompt có "dry-run"/"thử"/"đừng ghi" → truyền cờ này xuống `cs-ticket-process` để nó chỉ in draft ra chat, không ghi Zendesk.
