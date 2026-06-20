#!/usr/bin/env node
// tone-check.mjs — soi lỗi máy móc trong draft (em dash, emoji, sáo ngữ AI, placeholder còn sót,
// thiếu greeting/closing, markdown gây chữ to trên Zendesk). Deterministic, gần như 0 token.
// Dùng:  node tone-check.mjs "<đường dẫn file draft>"   (hoặc pipe qua stdin)
// Exit 0 = sạch; Exit 1 = có lỗi (in danh sách lỗi).

import { readFileSync, existsSync } from "node:fs";

const arg = process.argv[2];
let text = "";
if (arg && existsSync(arg)) text = readFileSync(arg, "utf8");
else if (arg) text = arg;
else text = readFileSync(0, "utf8"); // stdin

const issues = [];

// 1. Em dash / en dash
if (/[—–]/.test(text)) issues.push('Có em dash "—"/"–" → thay bằng dấu phẩy hoặc tách câu.');

// 2. Emoji (các dải phổ biến)
if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/u.test(text))
  issues.push("Có emoji → xóa hết.");

// 3. Sáo ngữ AI cấm
const banned = [
  "rest assured", "great news", "so glad to hear", "i completely understand your frustration",
  "please don't hesitate", "please do not hesitate", "rest easy", "i hope this finds you well",
  "thank you for writing in", "great question", "i wanted to reach out", "we apologize for the inconvenience",
];
const low = text.toLowerCase();
for (const p of banned) if (low.includes(p)) issues.push(`Sáo ngữ AI: "${p}" → viết lại tự nhiên.`);

// 4. Placeholder còn sót: [..] (trừ chữ ký "AI ddmmyy" không có ngoặc)
const ph = text.match(/\[[^\]]+\]/g);
if (ph) issues.push(`Còn placeholder chưa điền: ${[...new Set(ph)].join(", ")} → điền data thật.`);

// 5. Greeting: dòng đầu (không rỗng) phải bắt đầu "Hi " hoặc "Hello "
const firstLine = (text.split(/\r?\n/).find((l) => l.trim() !== "") || "").trim();
if (!/^(hi|hello)\b/i.test(firstLine))
  issues.push(`Thiếu greeting đúng chuẩn. Dòng đầu: "${firstLine.slice(0, 40)}" → cần "Hi [Tên]," riêng 1 dòng.`);
if (/^dear\b/i.test(firstLine)) issues.push('Dùng "Dear" (quá trang trọng) → đổi sang "Hi".');

// 6. Closing word trước sign-off
const closings = ["warmly", "take care", "with gratitude", "hope to see you", "all the best", "best", "thank you,"];
if (!closings.some((c) => low.includes(c))) issues.push("Thiếu closing word (Warmly / Take care / ...) trước sign-off.");

// 7. Markdown gây chữ to trên Zendesk
if (/^#{1,6}\s/m.test(text)) issues.push("Có heading markdown (#, ##) → bỏ, dùng plain text.");
if (/^\s*([-*_]){3,}\s*$/m.test(text)) issues.push("Có dòng --- / *** → bỏ (Zendesk biến dòng trên nó thành chữ to).");
if (/\*\*[^*]+\*\*/.test(text)) issues.push("Có **đậm** markdown → bỏ, Zendesk render thành chữ đậm.");

if (issues.length === 0) {
  console.log("✅ TONE-CHECK PASS — không có lỗi máy móc.");
  process.exit(0);
} else {
  console.log("❌ TONE-CHECK FAIL — sửa các lỗi sau rồi chạy lại:");
  for (const i of issues) console.log("  - " + i);
  process.exit(1);
}
