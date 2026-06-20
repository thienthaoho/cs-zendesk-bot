# CS Zendesk Bot — Bài test nhỏ (DRY-RUN)

Mục tiêu: chứng minh đường **GitHub Actions + Claude subscription (OAuth) + MCP Zendesk** chạy được,
bằng cách draft thử **1-2 ticket** mà **KHÔNG ghi gì lên Zendesk** (chỉ cho phép tool đọc).

- ✅ Chạy trên cloud → máy tắt vẫn chạy
- ✅ Dùng subscription (OAuth token) → KHÔNG tốn Anthropic API
- ✅ Repo **PRIVATE vẫn OK** cho bài test (chỉ chạy tay vài lần, không đụng giới hạn 2000 phút)
- ✅ DRY-RUN: chỉ cho phép `get_ticket` / `search` / `list_tickets` → vật lý không thể ghi

---

## CÁC BƯỚC (làm 1 lần)

### Bước 1 — Tạo OAuth token từ subscription
Mở terminal (máy đã đăng nhập Claude Code), chạy:
```
claude setup-token
```
→ Mở trình duyệt đăng nhập → trả về một token (dạng dài, hạn 1 năm). **Copy lại.**
Nếu lệnh báo không hỗ trợ / bị admin chặn → báo lại, ta chuyển hướng.

### Bước 2 — Tạo GitHub repo (PRIVATE được)
Tạo 1 repo mới (vd `cs-zendesk-bot`), để **Private** cho bài test.

### Bước 3 — Push thư mục này lên repo
Từ trong thư mục `cs-zendesk-bot`:
```
git init
git add .
git commit -m "CS zendesk draft test (dry-run)"
git branch -M main
git remote add origin <URL repo của bạn>
git push -u origin main
```
> `.gitignore` đã chặn các file secret. Thư mục này KHÔNG chứa token nào.

### Bước 4 — Nạp Secrets vào GitHub
Repo → **Settings → Secrets and variables → Actions → New repository secret**.
Tạo đúng 4 secret sau:

| Tên secret | Giá trị |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | token lấy ở Bước 1 |
| `ZENDESK_SUBDOMAIN` | `blockofgear` |
| `ZENDESK_EMAIL` | `seven92167@gmail.com` |
| `ZENDESK_API_TOKEN` | API token Zendesk của bạn |

> ⚠️ Token chỉ nằm trong Secrets — KHÔNG bao giờ nằm trong file/code.

### Bước 5 — Chạy thử
Repo → tab **Actions** → workflow **"CS Ticket Draft — Test (DRY-RUN)"** → **Run workflow**
→ nhập **ticket_id** (một ticket thật trên Zendesk, vd `548708`) → Run.

Mở log bước **"Draft ticket (DRY-RUN)"** → bạn sẽ thấy:
- Draft trả lời (tiếng Anh) + 1 dòng tóm tắt tiếng Việt
- Không có gì bị ghi lên Zendesk (kiểm tra ticket vẫn nguyên)

---

## Nếu lỗi (troubleshooting)
- **Treo ở permission / không có output:** thêm `--permission-mode dontAsk` vào lệnh `claude` trong `draft-test.yml`.
- **MCP config không nhận:** đổi key `"mcpServers"` → `"servers"` trong `mcp.zendesk.json` rồi chạy lại.
- **Auth lỗi:** kiểm tra `CLAUDE_CODE_OAUTH_TOKEN` đã nạp đúng (token Bước 1, không phải API key).
- **Zendesk 401/403:** kiểm tra `ZENDESK_EMAIL` + `ZENDESK_API_TOKEN` + subdomain.
- Copy đoạn log lỗi gửi lại, mình sửa cùng bạn.

---

## Sau khi test OK
- Bản này CHƯA dùng skill `cs-ticket-handler` đầy đủ (chỉ prompt tối giản) — chủ ý để smoke-test pipeline.
- Bước tiếp (production): commit skill vào `.claude/skills/`, đổi sang trigger bằng **Zendesk webhook** (tự chạy khi có ticket), chuyển repo **public** (để free phút Actions ở volume cao), và bật ghi thật (`add_ticket_comment public=false`).
- ⚠️ Nhắc: ở 500 ticket/ngày, quota subscription sẽ nghẽn — lúc đó tính chuyện xin admin cấp API key.
