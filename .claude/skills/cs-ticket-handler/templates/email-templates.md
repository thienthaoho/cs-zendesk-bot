# Email/Reply Templates (customer-facing, EN) — giọng người thật

ĐỌC [`../references/voice-persona.md`](../references/voice-persona.md) TRƯỚC.

**Templates ở đây là tham khảo tone + cấu trúc — KHÔNG copy rồi điền `[...]`.** Khi draft thật, viết tự nhiên theo đúng hoàn cảnh khách đó: đúng tên, đúng số đơn, đúng vấn đề cụ thể, đúng cảm xúc. Mỗi mail phải nghe như người thật viết riêng cho khách đó, không phải template chung.

Nguyên tắc kỹ thuật: không em dash "—", không emoji, không VIẾT HOA để nhấn, không sáo ngữ AI. Số policy lấy từ `cs-rules.md`.
**Chữ ký AI draft:** `AI[ddmmyy]` (vd: `AI200626`) — human thay bằng tên thật trước khi gửi khách.

---

## 1. order-status / WISMO ("đơn tôi đâu rồi")
```
Hi [First name],

Thank you for writing in, and I'm sorry for the worry. Let me check on this with you right now.

I pulled up your order [#FLW...]. Here is exactly where it stands:
[item] was delivered on [date] (USPS tracking [number]).
[item] is on its way and should reach you by [date].

So nothing is lost, it's just moving through the mail. I'll keep an eye on it until
it gets to your door, and you can always reply here if you'd like an update.

Thanks for your patience, [First name].

Warmly,
AI ddmmyy
```

## 2. shipping-delay
```
Hi [First name],

Thank you for your patience, and I'm sorry your order [#FLW...] is taking longer than
you expected. [Reason if known, in plain words.]

Here's where it is right now: [status, tracking]. It's expected to arrive by [date].
If it hasn't reached you by [policy date], I'll [next step per cs-rules] and make it right.

I know waiting isn't fun, especially when you were looking forward to it. I'm watching
this one personally until it lands.

Warmly,
AI ddmmyy
```

## 3. damaged-item / wrong / missing
```
Hi [First name],

I'm truly sorry your order didn't arrive the way it should have. That's not the
experience we want for you, and I want to get it fixed.

So I can take care of this quickly, could you send me a quick photo of [the item / the
packing slip]? Once I have that, I'll [resolution per cs-rules] right away.

Your order is [#FLW...], item [product/variant]. Thank you for your patience while we
sort this out for you.

Warmly,
AI ddmmyy
```

## 4. split-shipment (đơn nhiều món, ship riêng) — ca rất hay gặp
```
Hi [First name],

Thank you for reaching out, and I'm sorry for the worry. I can understand why this looked
wrong, and you're right to expect everything you paid for. Let me walk you through it.

Your order [#FLW...] has [N] items, and they ship in more than one package, so part of it
arrives before the rest:
The [item delivered] reached you on [date] (USPS tracking [number]).
Your [remaining item(s)] are still being finished and will ship in their own package.

So your [item(s)] aren't lost. They're a little behind the first package, and on the way.
As soon as they ship you'll get a tracking number by email, and I'll keep an eye on them
until they reach you. [→ ETA after supplier confirms]

And please don't worry about your payment. Nothing extra was charged, and everything is in
order on our end. You're in good hands here.

Thank you for your patience, [First name]. We want to make sure you get every piece you ordered.

Warmly,
AI ddmmyy
```

## 5. refund-approved
```
Hi [First name],

I've gone ahead and approved a [full/partial] refund of [amount] for your order [#FLW...].
You'll see it back on your original payment within [X] business days. [Return steps if any.]

I'm sorry for the trouble this caused, and I appreciate you giving us the chance to make
it right.

Warmly,
AI ddmmyy
```

## 6. refund-declined / out-of-policy (DRAFT, thường cần duyệt)
```
Hi [First name],

Thank you for reaching out, and I've looked carefully into your order [#FLW...].
[Reason in plain words, e.g. it was placed on [date], which is past our [X]-day window.]

I do want to help, so here's what I can do for you: [alternative per cs-rules]. Let me know
if that works and I'll take care of it.

Warmly,
AI ddmmyy
```

## 7. cancellation
```
Hi [First name],

Thanks for letting me know.
[If not shipped] Your order [#FLW...] hasn't shipped yet, so I can [cancel/change] it for you.
Just confirm and I'll take care of it.
[If shipped] Your order has already shipped ([tracking]), so I'm not able to stop it now.
Once it arrives you're welcome to [return per cs-rules], and I'll help you through it.

Warmly,
AI ddmmyy
```

## 8. address-change
```
Hi [First name],

[If not shipped] Happy to update the address on your order [#FLW...]. Just send me the full
corrected address and I'll change it before it ships.
[If shipped] Your order has already gone out to [current address], so I can't reroute it now.
Here's what we can do instead: [next step per cs-rules].

Warmly,
AI ddmmyy
```

## 9. product-question / how-to
```
Hi [First name],

[Answer the question directly in plain words — size, material, how to hang/use,
personalization details. No opener needed; start with the answer.]

[Link if helpful.]

If anything's still unclear, just reply here and I'm happy to help.

Warmly,
AI ddmmyy
```

## 10. holding-acknowledgment (gửi ngay khi chưa đủ info / chờ duyệt)

Dùng khi: chờ ảnh/bằng chứng từ khách, chờ fulfillment confirm tracking, chờ duyệt refund/comp, đơn chưa fulfill, bất kỳ ca nào team chưa xử lý được ngay. **Luôn có bản này trong internal note để agent gửi trước**, full reply gửi sau.

```
Hi [First name],

Thank you for writing in. I wanted to make sure you heard from us right away.

I've received your message about [your order / the issue you described], and I'm looking
into it personally right now. [One sentence acknowledging the specific concern — e.g.
"I understand you're wondering where your order is" or "I'm sorry to hear the item
didn't arrive the way it should have."]

I'll have a full update for you [by end of today / within 1 business day / by [date]],
and I'll reach right back out as soon as I do.

Thank you for your patience, [First name]. I've got this on my radar.

Warmly,
AI ddmmyy
```

**Ghi chú điền:**
- `[First name]`: tên từ Zendesk/Shopify
- `[One sentence acknowledging...]`: 1 câu cụ thể theo issue; không để chỗ trống
- `[timeline]`: chọn thực tế — "by end of today" (nếu <4h left in business day), "within 1 business day", "by [date]"
- KHÔNG nhắc chờ duyệt hay quy trình nội bộ — khách chỉ cần biết "đang xử lý + hẹn ngày"

---

## 11. missing-info-request (INTERNAL — agent điền, không tự gửi)
```
[INTERNAL — CẦN BỔ SUNG]
Ticket: [#] | Brand: [brand] | Khách: [email]
Yêu cầu khách: [tóm tắt]
Thiếu để trả lời:
- [ ] [thông tin] — lấy ở: [khách / Shopify / kho / duyệt cấp trên]
DRAFT sau khi có info: [chọn template phù hợp ở trên]
```

---

## 12. tracking-delivered-not-received ("tracking nói đã giao nhưng chưa thấy hàng")

> ⚠️ Theo policy: theft/security tại địa chỉ giao = không hoàn. **Nhưng xác minh trước — chưa kết luận ngay.** Tone: thông cảm, không đổ lỗi, hướng khách kiểm tra thực tế trước.

```
Hi [First name],

I'm sorry to hear your package hasn't shown up, even though the tracking says it was delivered. That's genuinely frustrating and I want to help figure out what happened.

A few things worth checking first, as this does come up from time to time: the carrier may have left it with a neighbor, placed it out of sight near your door, or held it at your local post office if delivery couldn't be completed. It's also worth contacting your local USPS facility directly with tracking number [tracking number] to request a trace.

If it still doesn't turn up after checking those, please let me know and I'll look into what we can do from our end.

Order [#FLW...] | Tracking: [number] | Carrier marked delivered: [date]

Warmly,
AI[ddmmyy]
```

> **Internal note thêm:** nếu khách xác nhận đã kiểm tra hết mà vẫn không có → escalate lên Team Lead trước khi offer resend/refund (theft là ngoại lệ policy, cần duyệt).

---

## 13. wrong-personalization (in sai tên/text/ngày trên sản phẩm POD)

> ⚠️ **Bước xác minh BẮT BUỘC (Bước 4) trước khi draft:** đọc `line_items[].properties` hoặc `customAttributes` trong Shopify order → so sánh với lời khách → xác định lỗi-do-shop hay lỗi-do-khách.

### Nhánh A — lỗi do shop/supplier (in sai so với Shopify order)
→ Resend hoặc refund 100%, không hỏi thêm điều kiện. Yêu cầu ảnh để xác nhận rồi xử lý ngay.

```
Hi [First name],

I'm so sorry — the personalization on your item doesn't match what you ordered, and that's entirely on our end. Something went wrong during production, and I want to make this right for you right away.

Could you send me a quick photo of what you received? Once I have that, I'll [resend with the correct text / process a full refund] immediately. No extra steps needed on your part.

Your order [#FLW...], item [product] — the personalization should have read: "[correct text from Shopify order]".

I'm truly sorry this happened, especially for something this personal.

Warmly,
AI[ddmmyy]
```

---

## 14. ip-trademark-claim (khiếu nại bản quyền / design)

> **Quy tắc:** Luôn khẳng định tự thiết kế. KHÔNG thừa nhận vi phạm. KHÔNG phủ nhận cần kiểm tra. Mua thời gian cho CS verify.

### Nhánh A — Khách mua hàng có link/nguồn cụ thể
```
Hi [First name],

Thank you for reaching out about this. I want you to know that all of our designs are created in-house by our own design team — we take originality seriously and do not use others' work.

That said, I want to take your concern seriously and look into this properly. Could you share the link or source you're referring to? Once I have that, I'll review it carefully and get back to you with a full response.

I appreciate your patience while we look into this.

Warmly,
AI[ddmmyy]
```

### Nhánh B — Khách mua hàng không có nguồn rõ (chỉ cảm nhận/nghe nói)
```
Hi [First name],

Thank you for letting us know. All of our designs are created by our in-house team — originality is something we take seriously, so I appreciate you bringing this to our attention.

If you happen to come across a specific link or source showing the design you're thinking of, please feel free to share it and we'll look into it right away. Without a specific reference, it's difficult for us to investigate further, but we're always open to reviewing any concerns you have.

Warmly,
AI[ddmmyy]
```

### Nhánh C — Rights holder / chính chủ liên hệ với link cụ thể
> ⚠️ Set `cs-need-approval` ngay. AI chỉ draft holding reply — CS phải verify và trả lời thực chất. KHÔNG thừa nhận hay phủ nhận bất cứ điều gì trong holding reply.

```
Hi [First name / Company name],

Thank you for reaching out. We have received your message regarding [brief description of their claim — e.g., "the design on our [product name]"].

We take intellectual property matters seriously. Our team is currently reviewing the information you've provided and will follow up with a proper response as soon as possible.

We appreciate your patience.

Warmly,
AI[ddmmyy]
```

---

### Nhánh B — lỗi do khách nhập sai (Shopify order khớp với hàng đã nhận)
→ Policy: không hoàn (personalized đúng thông tin khách cung cấp). Tone đặc biệt nhẹ. Set `cs-need-approval` nếu muốn offer goodwill.

> 🚨 **Nếu đây là memorial item** (tên người thân đã mất, ngày mất...) → LUÔN set `cs-need-approval` trước khi gửi bất kỳ từ chối nào, dù policy rõ. Cảm xúc khách có thể rất nặng.

```
Hi [First name],

I can hear how upsetting this is, and I'm truly sorry you're going through this.

I looked carefully at your order [#FLW...], and the personalization we received when you placed it read: "[text from Shopify order]" — which matches what was printed on the item. It looks like there may have been a typo when the order was placed.

[IF GOODWILL — needs cs-need-approval]: I'd like to see what I can do to help. Let me check with my team and get back to you within 1 business day.
[IF NO GOODWILL]: Unfortunately, because the item was made exactly to the specifications submitted with your order, I'm not able to offer a replacement or refund in this case. I'm truly sorry — I know that's hard to hear.

If there's anything else I can help with, please don't hesitate to reach out.

Warmly,
AI[ddmmyy]
```
