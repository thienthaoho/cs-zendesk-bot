# CS Zendesk Bot

Tự động draft trả lời ticket Customer Support trên Zendesk (blockofgear.zendesk.com) cho store Flagwix.

**Cách hoạt động:** Khi khách gửi ticket mới hoặc reply → Zendesk webhook → GitHub Actions → Claude Code chạy skill `cs-ticket-handler` → ghi draft vào **internal note** trên ticket → CS team đọc, chỉnh nếu cần, rồi gửi.

- Chạy trên cloud — máy tắt vẫn chạy
- Dùng Claude subscription (OAuth) — không tốn Anthropic API key
- KHÔNG tự gửi mail cho khách — chỉ ghi internal note để CS review

---

## Cấu trúc repo

```
.claude/skills/cs-ticket-handler/   # skill logic (policy, tone, templates)
.github/workflows/
  production.yml                    # workflow chính (webhook + cron fallback)
  draft-test.yml                    # dry-run test thủ công (không ghi Zendesk)
mcp.json                            # MCP config: Zendesk + Shopify
mcp.zendesk.json                    # MCP config cũ (chỉ Zendesk, dùng cho dry-run test)
```

---

## GitHub Secrets cần có

Repo → **Settings → Secrets and variables → Actions**

| Secret | Giá trị |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | OAuth token từ `claude setup-token` |
| `ZENDESK_SUBDOMAIN` | `blockofgear` |
| `ZENDESK_EMAIL` | `seven92167@gmail.com` |
| `ZENDESK_API_TOKEN` | API token Zendesk |
| `SHOPIFY_ACCESS_TOKEN` | Access token store Flagwix (`shpat_...`) |

---

## Trigger tự động (đã setup)

| Trigger | Zendesk trigger name | Khi nào chạy |
|---|---|---|
| Ticket mới | CS Bot — New ticket | Khách gửi ticket mới |
| Khách reply | CS Bot — Customer reply | Khách comment vào ticket đang mở |
| Fallback | cron `0 * * * *` | Mỗi 1 tiếng — bắt ticket bỏ sót |

Nhiều ticket đến cùng lúc → concurrency group `cs-draft` đảm bảo chỉ 1 sweep chạy tại 1 thời điểm, sweep sau bắt hết ticket còn lại.

---

## Chạy thủ công

**Actions → CS Ticket Draft — Production → Run workflow**

Dùng khi muốn sweep ngay mà không chờ trigger.

---

## Dry-run test

**Actions → CS Ticket Draft — Test (DRY-RUN) → Run workflow** → nhập `ticket_id`

Đọc 1 ticket cụ thể, in draft ra log, **không ghi gì lên Zendesk**. Dùng để kiểm tra chất lượng draft trước khi cho chạy thật.

---

## Troubleshooting

| Lỗi | Hướng xử lý |
|---|---|
| Workflow không trigger khi có ticket | Kiểm tra Zendesk trigger `CS Bot — New ticket` còn active không; kiểm tra webhook `GitHub CS Bot` còn active không |
| `401` / `403` Zendesk | Kiểm tra `ZENDESK_EMAIL` + `ZENDESK_API_TOKEN` + subdomain |
| `401` GitHub trong Zendesk webhook log | OAuth token hết hạn → chạy lại `claude setup-token`, cập nhật secret `CLAUDE_CODE_OAUTH_TOKEN` |
| `401` Shopify | Kiểm tra `SHOPIFY_ACCESS_TOKEN` |
| Workflow treo không có output | `--permission-mode dontAsk` đã có trong workflow — kiểm tra log bước install Claude Code |
| Draft chất lượng kém | Chạy dry-run test với ticket cụ thể → xem log → điều chỉnh skill trong `.claude/skills/cs-ticket-handler/` |
