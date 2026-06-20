# Feedback & Learning Loop — bảng Lark Base

Nơi human chấm điểm draft và để skill học lại. **Skill KHÔNG được tự sửa file skill cho tới khi user duyệt đề xuất.**

## Bảng feedback (Lark Base)
- base_token: `NMzKbxBLqa71FzskfWmu8zwis5d`
- table_id: `tbl2o1H6GQKttR3O`
- Link: https://kd2olxcu0u.larksuite.com/base/NMzKbxBLqa71FzskfWmu8zwis5d?table=tbl2o1H6GQKttR3O&view=vewSVDHiYO

## Field & ai điền
| Field | Ai điền | Ý nghĩa |
|---|---|---|
| Ticket ID | Human (hoặc skill seed) | Số ticket Zendesk |
| Brand / Issue Type | Skill seed / Human | Phân loại |
| AI Draft (tóm tắt) | **Skill** | Tóm tắt draft skill đã ghi vào internal note |
| Reviewer | Human | Người chấm |
| **Verdict** | **Human** | ✅ Good as-is / ✏️ Minor edits / ❌ Wrong-rework |
| **Human Feedback** | **Human** | Phần sửa cụ thể (trường quan trọng nhất) |
| Lesson Category | Skill | Tone/Policy/Process/Product/Template |
| **AI Proposed Change** | **Skill** | Skill đề xuất sửa gì trong skill |
| Target File | Skill | File skill sẽ chỉnh |
| Status | Skill+Human | 1-New → 2-AI proposed → 3-Approved → 4-Applied / 5-Rejected |
| Approved by user | **User** | ✅ = cho phép áp vào skill |
| Ngày feedback | auto | created_at |

## Vòng lặp (5 bước)
1. **Skill seed:** sau khi ghi internal note, skill tạo/điền record (Ticket ID, Brand, Issue Type, AI Draft, Status=`1-New feedback`).
2. **Human chấm:** đọc draft trên Zendesk → điền Verdict + Human Feedback (giữ Status `1-New feedback`).
3. **Skill học (LEARNING MODE):** đọc record có Human Feedback mà Status=`1-New feedback` → phân tích → điền **AI Proposed Change** + Lesson Category + Target File → set Status=`2-AI proposed`. **RỒI GỬI USER bản đề xuất trong chat.** TUYỆT ĐỐI chưa sửa file skill.
4. **User duyệt:** user trả lời trong chat (hoặc tick "Approved by user"). Nếu OK → Status=`3-Approved`. Nếu không → Status=`5-Rejected`, skill chỉnh lại đề xuất.
5. **Skill áp dụng:** chỉ khi đã duyệt → sửa file skill tương ứng (Target File) → set Status=`4-Applied`, ghi tóm tắt thay đổi vào record.

## Quy tắc cứng
- KHÔNG sửa file skill khi chưa có duyệt của user (Approved). Đây là cổng chống sai lệch.
- Mỗi đề xuất phải ghi rõ: **file nào**, **đoạn cũ → đoạn mới**, **vì sao** (dẫn lại Human Feedback).
- Gộp nhiều feedback cùng category thành 1 đề xuất nếu trùng, tránh sửa vụn vặt mâu thuẫn.
- Đề xuất bám Human Feedback; KHÔNG tự bịa quy tắc mới ngoài phản hồi.
