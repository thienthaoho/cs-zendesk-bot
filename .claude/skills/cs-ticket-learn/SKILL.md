---
name: cs-ticket-learn
description: "Learning mode cho cs-ticket-handler: đọc feedback human từ Lark Base, phân tích, đề xuất sửa skill. KHÔNG tự sửa file trước khi user duyệt. Trigger: 'học feedback', 'review feedback CS', 'cập nhật skill từ feedback', 'cs learn'."
---

# CS Ticket Learn — Learning Mode

Skill đọc feedback human từ Lark Base, phân tích lỗi, đề xuất thay đổi skill CS → **chờ user duyệt** trước khi áp dụng.

## Kết nối
- **Lark Base:** bảng `NMzKbxBLqa71FzskfWmu8zwis5d` / table `tbl2o1H6GQKttR3O`
- Chi tiết field & trạng thái: [`../cs-ticket-process/references/feedback-loop.md`](../cs-ticket-process/references/feedback-loop.md)

## Quy trình

1. **Lấy feedback mới:** đọc bảng Lark Base, lọc record có `Human Feedback` và `Status = 1-New feedback`.
2. **Phân tích từng record:**
   - Sai ở đâu: tone / policy / process / product / template?
   - Nên sửa file nào: `cs-rules.md` / `voice-persona.md` / `zendesk-ops.md` / `templates/` / `SKILL.md`?
   - Gộp các feedback cùng nhóm lỗi.
3. **Điền đề xuất vào record:**
   - `AI Proposed Change`: file + đoạn cũ → đoạn mới + lý do (dẫn lại Human Feedback)
   - `Lesson Category`: tone / policy / process / product / template
   - `Target File`: tên file cần sửa
   - Set `Status = 2-AI proposed`
4. 🚧 **GỬI USER bản đề xuất tổng hợp trong chat. DỪNG.** Không sửa bất kỳ file skill nào cho tới khi user duyệt (trả lời OK trong chat hoặc tick "Approved by user" trong Lark Base).
5. **Sau khi user duyệt:**
   - Sửa đúng file skill theo đề xuất đã duyệt
   - Set `Status = 4-Applied`, ghi tóm tắt thay đổi vào record
   - Nếu user từ chối: `Status = 5-Rejected`, chỉnh lại đề xuất nếu cần

> **Cổng duyệt** này tránh skill tự "học lệch". Mọi thay đổi skill từ feedback PHẢI qua mắt user trước.
