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
];
const ORDER_END = [
  /^OUR SHIPPING POLICIES/i,
  /^With America.s 250th/i,
  /^Best items for the season/i,
  /^Looking Ahead\?/i,
  /^Let.s Mark It Your Way/i,
  /^This email was sent to/i,
  /^CONTACT US/i,
  /^TRACK YOUR ORDER/i,
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

  const lines = t.split('\n');

  // (a) phần hội thoại = trước marketing marker đầu tiên
  let convEnd = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (MARKETING_START.some(r => r.test(lines[i].trim()))) { convEnd = i; break; }
  }
  const conv = lines.slice(0, convEnd);

  // (b) Order Summary (nếu có) = từ "Order Summary"/"Order: FLWSP" đến footer marker
  let osStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^Order Summary/i.test(lines[i].trim()) || /Order:\s*FLWSP/i.test(lines[i].trim())) { osStart = i; break; }
  }
  let orderBlock = [];
  if (osStart !== -1) {
    let osEnd = lines.length;
    for (let i = osStart + 1; i < lines.length; i++) {
      if (ORDER_END.some(r => r.test(lines[i].trim()))) { osEnd = i; break; }
    }
    orderBlock = lines.slice(osStart, osEnd).filter(l => !/Shop now/i.test(l));
  }

  let res = conv.join('\n');
  if (orderBlock.length) res += '\n\n' + orderBlock.join('\n');
  return res.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
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
(async () => {
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

  if (asJson) { console.log(JSON.stringify(out, null, 2)); return; }

  let totalOrig = 0, totalClean = 0;
  for (const c of out) { totalOrig += c.orig_len; totalClean += c.clean_len; }
  console.log(`# Ticket ${ticketId} — ${out.length} comment | gốc ${totalOrig} → sạch ${totalClean} ký tự (giảm ${Math.round((1 - totalClean / Math.max(totalOrig,1)) * 100)}%)`);
  for (const c of out) {
    console.log(`\n----- [${c.kind}] ${c.created_at} via ${c.channel} -----`);
    if (c.attachments.length) console.log(`(đính kèm: ${c.attachments.join(', ')} — HUMAN tự mở, skill KHÔNG tải)`);
    console.log(c.text);
  }
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
