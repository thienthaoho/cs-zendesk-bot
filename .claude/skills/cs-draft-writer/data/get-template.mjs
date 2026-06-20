#!/usr/bin/env node
// get-template.mjs — trả về ĐÚNG 1 template từ templates.md (không nạp cả file vào context).
// Dùng: node get-template.mjs <key>
//   key ví dụ: wismo, shipping-delay, damaged, split-shipment, refund-approved,
//   refund-declined, cancellation, address-change, product-question, holding,
//   tracking-delivered-not-received, wrong-personalization, ip-trademark
//
// Cách hoạt động: tìm dòng header "## ..." có chứa <key>, in từ đó tới header "## " kế tiếp.
// => Anh chỉ cần sửa templates.md (text), script tự đọc. Không có file JSON nào để đồng bộ.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const MD = join(__dir, "templates.md");

const key = (process.argv[2] || "").trim().toLowerCase();
if (!key) {
  console.error("Thiếu key. Vd: node get-template.mjs wismo");
  process.exit(1);
}

const lines = readFileSync(MD, "utf8").split(/\r?\n/);

// Tìm header "## ..." (top-level, không phải ###) có chứa key
const isTop = (l) => /^##\s/.test(l) && !/^###/.test(l);
let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (isTop(lines[i]) && lines[i].toLowerCase().includes(key)) { start = i; break; }
}

if (start === -1) {
  // Không thấy -> liệt kê các template có sẵn để chọn lại
  const avail = lines.filter(isTop).map((l) => l.replace(/^##\s*/, "").trim());
  console.error(`Không thấy template cho key "${key}". Các template có sẵn:\n- ${avail.join("\n- ")}`);
  process.exit(2);
}

// Thu tới header top-level kế tiếp
let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (isTop(lines[i])) { end = i; break; }
}

// Bỏ dòng phân cách "---" ở cuối nếu có
let block = lines.slice(start, end);
while (block.length && /^---+\s*$/.test(block[block.length - 1].trim())) block.pop();
while (block.length && block[block.length - 1].trim() === "") block.pop();

console.log(block.join("\n"));
