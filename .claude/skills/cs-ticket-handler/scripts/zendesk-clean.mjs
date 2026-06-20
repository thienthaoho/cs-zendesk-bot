#!/usr/bin/env node
/**
 * zendesk-clean.mjs — Fetch comment thread của 1 ticket Zendesk, làm sạch nhiễu, in text gọn.
 *
 * Mục đích: giảm token đầu vào. Thay vì để MCP get_ticket_comments đổ full body
 * (marketing footer, URL tracking dài, ký tự ẩn, order-confirmation email) vào context,
 * script này fetch qua API → cắt nhiễu → chỉ trả phần khách viết + Order Summary.
 *
 * Dùng:
 *   node zendesk-clean.mjs <ticket_id>
 *   node zendesk-clean.mjs <ticket_id> --json     # output JSON thay vì text
 *   node zendesk-clean.mjs <ticket_id> --raw      # in cả body gốc (debug)
 *
 * Creds tự đọc từ C:/Users/Admin/.claude.json (ZENDESK_SUBDOMAIN/EMAIL/API_TOKEN).
 * Guardrail: chỉ lấy TEXT. KHÔNG tải attachment/ảnh. Link bị rút gọn, KHÔNG fetch.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

// ---------- 1. Đọc credentials ----------
function findZendeskCreds(obj) {
  if (obj && typeof obj === 'object') {
    if (obj.ZENDESK_API_TOKEN && obj.ZENDESK_SUBDOMAIN) return obj;
    for (const k of Object.keys(obj)) {
      const r = findZendeskCreds(obj[k]);
      if (r) return r;
    }
  }
  return null;
}
function loadCreds() {
  const p = path.join(os.homedir(), '.claude.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const c = findZendeskCreds(j);
  if (!c) throw new Error('Không tìm thấy ZENDESK creds trong .claude.json');
  return { subdomain: c.ZENDESK_SUBDOMAIN, email: c.ZENDESK_EMAIL, token: c.ZENDESK_API_TOKEN };
}

// ---------- 2. Làm sạch ----------
const MARKETING_START = [
  /^Thank you letter from CEO/i,
  /^Thank you for choosing Flagwix/i,
  /^Thank you for your order$/i,
  /^Best items for the season/i,
  /^Looking Ahead\?/i,
  /^Keep your space seasonally inspired/i,
  /^With America.s 250th Anniversary/i,
  /^Let.s Mark It Your Way/i,
  /^This email was sent to/i,
  /^Edit preferences/i,
  /^Unsubscribe/i,
  /^CONTACT US/i,
  /^TRACK YOUR ORDER/i,
  /^OUR SHIPPING POLICIES/i,
  /^I.m Ben, the founder/i,
  /^Shop now$/i,
];
// Marker "quay lại GIỮ" — gặp dòng này thì thoát khỏi đoạn nhiễu (vì sau đó là
// nội dung khách/agent hoặc Order Summary cần giữ). Nhờ vậy text khách nằm SAU
// khối marketing (kiểu bottom-post) vẫn KHÔNG bị mất.
const RESUME = [
  /^On .+wrote:\s*$/i,         // header quote email tiếp theo
  /^-----Original Message-----/i,
  /^From:\s/i,                  // header Outlook
  /^Order Summary\s*$/i,        // bắt đầu Order Summary (giữ)
  /Order:\s*FLWSP/i,
];
// Marker ĐÓNG BIÊN khối nhiễu — footer Flagwix luôn kết thúc bằng "Privacy policy".
// Drop chính dòng này rồi GIỮ lại từ dòng sau → text khách nằm dưới footer không mất.
const NOISE_END = [
  /Privacy policy/i,
];

function clean(body) {
  if (!body) return '';
  let t = body;
  // ký tự ẩn padding email marketing
  t = t.replace(/[͏­​-‏⁠﻿]/g, '');
  // URL dài -> bỏ (giữ text mô tả trước ngoặc)
  t = t.replace(/\s*\(https?:\/\/[^\s)]+\)/g, '');
  t = t.replace(/https?:\/\/\S+/g, '');
  // wrapper form-builder
  t = t.replace(/Hi Mr,\s*\n+\s*Someone just submitted a response to your form\.\s*\n+\s*Please find the details below:\s*/i, '');

  // Xóa TỪNG ĐOẠN nhiễu, GIỮ mọi dòng còn lại (kể cả text khách ở bất kỳ vị trí nào).
  // State machine: gặp NOISE_START -> ngừng giữ; gặp RESUME -> giữ lại.
  const lines = t.split('\n');
  const out = [];
  let keep = true;
  for (const raw of lines) {
    const line = raw.trim();
    if (RESUME.some(r => r.test(line))) keep = true;       // ưu tiên RESUME trước
    if (keep && MARKETING_START.some(r => r.test(line))) { keep = false; continue; }
    if (!keep && NOISE_END.some(r => r.test(line))) { keep = true; continue; } // đóng biên: drop dòng này, giữ từ dòng sau
    if (keep) out.push(raw);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
}

// ---------- 3. Fetch ----------
async function fetchComments(creds, ticketId) {
  const auth = Buffer.from(`${creds.email}/token:${creds.token}`).toString('base64');
  const url = `https://${creds.subdomain}.zendesk.com/api/v2/tickets/${ticketId}/comments.json?sort_order=asc`;
  const r = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!r.ok) throw new Error(`Zendesk API ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.comments || [];
}

// ---------- 4. Main ----------
export { clean };

const isDirectRun = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (isDirectRun) await (async () => {
  const args = process.argv.slice(2);
  const ticketId = args.find(a => /^\d+$/.test(a));
  const asJson = args.includes('--json');
  const raw = args.includes('--raw');
  if (!ticketId) { console.error('Usage: node zendesk-clean.mjs <ticket_id> [--json] [--raw]'); process.exit(1); }

  const creds = loadCreds();
  const comments = await fetchComments(creds, ticketId);

  const out = comments.map(c => {
    const author = c.author_id;
    const when = c.created_at;
    const kind = c.public ? 'public' : 'internal-note';
    const cleaned = raw ? (c.body || '') : clean(c.body || '');
    const att = (c.attachments || []).map(a => a.file_name);
    return {
      id: c.id, kind, channel: c.via?.channel, author_id: author, created_at: when,
      attachments: att,             // chỉ tên file — KHÔNG tải
      orig_len: (c.body || '').length, clean_len: cleaned.length, text: cleaned,
    };
  });

  // SAFEGUARD: cảnh báo nếu cắt mạnh bất thường (>90%) mà phần còn lại quá ngắn
  // → có thể đã nuốt mất chữ khách. Model nên chạy lại với --raw để xác minh.
  for (const c of out) {
    if (!raw && c.orig_len > 1500 && c.clean_len < 150) {
      c.warn = `⚠ Comment ${c.id}: cắt từ ${c.orig_len}→${c.clean_len} ký tự (còn rất ngắn). Có thể sót nội dung khách — kiểm tra lại bằng: node zendesk-clean.mjs ${ticketId} --raw`;
    }
  }

  if (asJson) { console.log(JSON.stringify(out, null, 2)); return; }

  let totalOrig = 0, totalClean = 0;
  for (const c of out) { totalOrig += c.orig_len; totalClean += c.clean_len; }
  console.log(`# Ticket ${ticketId} — ${out.length} comment | gốc ${totalOrig} → sạch ${totalClean} ký tự (giảm ${Math.round((1 - totalClean / Math.max(totalOrig,1)) * 100)}%)`);
  for (const c of out) {
    console.log(`\n----- [${c.kind}] ${c.created_at} via ${c.channel} -----`);
    if (c.warn) console.log(c.warn);
    if (c.attachments.length) console.log(`(đính kèm: ${c.attachments.join(', ')} — HUMAN tự mở, skill KHÔNG tải)`);
    console.log(c.text);
  }
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
