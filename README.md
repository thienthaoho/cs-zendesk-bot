# CS Zendesk Bot

Tự động draft trả lời ticket Customer Support trên Zendesk (blockofgear.zendesk.com) cho store Flagwix.

**Cách hoạt động:** Khi khách gửi ticket mới hoặc reply → Zendesk webhook → GitHub Actions → Claude Code chạy skill `cs-orchestrator` → mỗi ticket đi qua `cs-ticket-process` (đọc → context → triage) → `cs-draft-writer` viết draft → `cs-draft-reviewer` soi chất lượng → ghi draft vào **internal note** trên ticket → CS team đọc, chỉnh nếu cần, rồi gửi.

- Chạy trên cloud — máy tắt vẫn chạy
- Dùng Claude subscription (OAuth) — không tốn Anthropic API key
- KHÔNG tự gửi mail cho khách — chỉ ghi internal note để CS review

---

## Cấu trúc repo — kiến trúc nhiều skill phối hợp

```
.claude/skills/
  cs-orchestrator/      # ĐIỀU PHỐI: quét ticket, định tuyến, báo cáo (entry point, luôn nhẹ)
  cs-ticket-process/    # XỬ LÝ 1 TICKET: đọc → context (lịch sử + đơn) → triage + persona
    references/         #   cs-rules, zendesk-ops, shopify-lookup, personas, feedback-loop (đọc khi cần)
    scripts/            #   zendesk-clean.mjs (lọc rác ticket, giữ chữ khách)
  cs-draft-writer/      # VIẾT DRAFT: giọng người thật, đúng tone, không bịa
    references/         #   voice-persona.md, draft-rules.md
    data/               #   templates.md (← SỬA Ở ĐÂY) + get-template.mjs (đọc 1 template)
    scripts/            #   tone-check.mjs (soi em dash/emoji/sáo ngữ bằng code)
  cs-draft-reviewer/    # SOI CHẤT LƯỢNG: sai nghĩa / ngữ cảnh / khó hiểu / thiếu chuyên nghiệp
  cs-ticket-learn/      # HỌC FEEDBACK từ Lark Base → đề xuất sửa skill (chờ duyệt)
.github/workflows/
  production.yml        # workflow chính (webhook + cron fallback) — chạy --model claude-sonnet-4-6
  draft-test.yml        # dry-run test thủ công (không ghi Zendesk)
mcp.json                # MCP config: Zendesk + Shopify
mcp.zendesk.json        # MCP config cũ (chỉ Zendesk, dùng cho dry-run test)
```

### Sửa nội dung — chỉ cần sửa file `.md`
- **Mẫu câu trả lời:** sửa `cs-draft-writer/data/templates.md` (text thường, dễ đọc). Script `get-template.mjs` tự đọc file này — **không có file JSON nào để đồng bộ**.
- **Policy / SLA / refund:** `cs-ticket-process/references/cs-rules.md`
- **Giọng văn:** `cs-draft-writer/references/voice-persona.md`
- **Quy tắc viết theo ca (đơn chưa ship, deadline lễ, positive feedback...):** `cs-draft-writer/references/draft-rules.md`

### Đổi model (chất lượng vs chi phí)
Trong `production.yml` / `draft-test.yml`, đổi `--model claude-sonnet-4-6` thành `--model claude-opus-4-8` nếu cần văn chất lượng cao nhất (đắt hơn). Sonnet 4.6 là mức cân bằng khuyến nghị.

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
