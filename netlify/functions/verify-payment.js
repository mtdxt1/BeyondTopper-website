// netlify/functions/verify-payment.js
// Verifies Razorpay signature, saves record to Airtable, sends WhatsApp confirmation.
// Env vars needed on Netlify:
//   RAZORPAY_KEY_SECRET
//   AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME (e.g., "FeeRecords")
//   WA_PROVIDER  = "meta" | "interakt" | "off"
//   WA_TOKEN     = provider token
//   WA_PHONE_ID  = Meta Cloud API phone number id (only for meta)
//   WA_TEMPLATE  = template name (approved template) — optional; if empty uses text (session window)
//   INSTITUTE_EMAIL = janchpathology@gmail.com   (for future email logging)

const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST')     return json(405, { error: 'Method not allowed' });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, data } = JSON.parse(event.body || '{}');

    // 1) Verify signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return json(400, { ok: false, error: 'Invalid signature' });
    }

    // 2) Save to Airtable (best-effort)
    try { await saveToAirtable(data, razorpay_payment_id); }
    catch (e) { console.error("Airtable save failed:", e.message); }

    // 3) Send WhatsApp (best-effort)
    try { await sendWhatsApp(data); }
    catch (e) { console.error("WhatsApp failed:", e.message); }

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { ok: false, error: e.message });
  }
};

/* ---------- Airtable ---------- */
async function saveToAirtable(d, paymentId) {
  const key = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_NAME || 'FeeRecords';
  if (!key || !baseId) return;

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
  const fields = {
    "Receipt No":      d.receiptNo,
    "Date":            new Date(d.date).toISOString(),
    "Student Name":    d.student.name,
    "Father Name":     d.student.fatherName,
    "Mother Name":     d.student.motherName || '',
    "Mobile":          d.student.mobile,
    "WhatsApp":        d.student.whatsapp,
    "Email":           d.student.email || '',
    "Address":         `${d.student.address}, ${d.student.city}, ${d.student.state}`,
    "PIN":             d.student.pincode,
    "Class":           d.course.class,
    "Course":          d.course.name,
    "Target Year":     d.course.targetYear,
    "Batch Mode":      d.course.batchMode,
    "Total Fee":       d.payment.totalFee,
    "Discount":        d.payment.discount,
    "Paid":            d.payment.paidToday,
    "Balance":         d.payment.balance,
    "Installments":    d.payment.installments,
    "Next Due Date":   d.payment.nextDueDate || null,
    "Razorpay Payment ID": paymentId,
    "Status":          d.payment.balance > 0 ? "Partial" : "Paid"
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ fields }] })
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
}

/* ---------- WhatsApp ---------- */
async function sendWhatsApp(d) {
  const provider = (process.env.WA_PROVIDER || 'off').toLowerCase();
  if (provider === 'off') return;

  const to = '91' + d.student.whatsapp.replace(/\D/g, '').slice(-10);
  const balance = d.payment.balance;
  const nextDue = d.payment.nextDueDate ? new Date(d.payment.nextDueDate).toLocaleDateString('en-GB') : '-';
  const text =
`🎓 *Beyond Topper — Fee Payment Confirmation*

प्रिय ${d.student.name},

आपकी फीस ₹${d.payment.paidToday.toLocaleString('en-IN')} सफलतापूर्वक जमा हो गई है ✅

📋 Receipt No: ${d.receiptNo}
📚 Course: ${d.course.name} (${d.course.targetYear})
💰 Balance: ₹${balance.toLocaleString('en-IN')}
📅 Next Due Date: ${nextDue}

धन्यवाद 🙏
— Amit Dixit Sir
Beyond Topper | beyondtopper.in`;

  if (provider === 'meta') {
    const url = `https://graph.facebook.com/v20.0/${process.env.WA_PHONE_ID}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Meta WA ${res.status}: ${await res.text()}`);
  }
  else if (provider === 'interakt') {
    const res = await fetch('https://api.interakt.ai/v1/public/message/', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countryCode: '+91',
        phoneNumber: d.student.whatsapp,
        type: 'Text',
        data: { message: text }
      })
    });
    if (!res.ok) throw new Error(`Interakt ${res.status}: ${await res.text()}`);
  }
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}
function json(code, obj) {
  return { statusCode: code, headers: { 'Content-Type':'application/json', ...cors() }, body: JSON.stringify(obj) };
}
