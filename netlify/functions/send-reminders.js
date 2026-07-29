// netlify/functions/send-reminders.js
// SCHEDULED FUNCTION — runs once a day (see netlify.toml).
// Scans Airtable for upcoming/overdue installments and sends WhatsApp reminders.
// Triggers: 7 days before, 3 days before, on due date, 3 days after (overdue).

exports.handler = async () => {
  const key    = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_NAME || 'FeeRecords';
  if (!key || !baseId) return ok({ skipped: 'no airtable config' });

  const provider = (process.env.WA_PROVIDER || 'off').toLowerCase();
  if (provider === 'off') return ok({ skipped: 'wa off' });

  const today = new Date(); today.setHours(0,0,0,0);
  const targets = {
    '-7':  daysFrom(today, 7),   // 7 days before due
    '-3':  daysFrom(today, 3),   // 3 days before due
    '0':   daysFrom(today, 0),   // due today
    '+3':  daysFrom(today, -3)   // overdue by 3 days
  };

  // Fetch all pending records
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(`{Status}='Partial'`)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
  const j = await res.json();
  const records = j.records || [];

  let sent = 0;
  for (const rec of records) {
    const f = rec.fields;
    if (!f['Next Due Date'] || !f['WhatsApp']) continue;
    const due = new Date(f['Next Due Date']); due.setHours(0,0,0,0);
    const diff = Math.round((due - today) / (1000*60*60*24));

    let type = null;
    if (diff === 7)  type = '7days';
    else if (diff === 3) type = '3days';
    else if (diff === 0) type = 'today';
    else if (diff === -3) type = 'overdue';
    if (!type) continue;

    try {
      await sendWa(provider, f, type);
      sent++;
    } catch (e) { console.error("WA send failed:", e.message); }
  }

  return ok({ scanned: records.length, sent });
};

function daysFrom(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }

async function sendWa(provider, f, type) {
  const dueStr = new Date(f['Next Due Date']).toLocaleDateString('en-GB');
  const bal = (f['Balance']||0).toLocaleString('en-IN');
  const messages = {
    '7days':   `🔔 Beyond Topper — आपकी अगली installment ₹${bal} की due date ${dueStr} है। कृपया समय पर fee जमा करें।`,
    '3days':   `⏰ Beyond Topper Reminder — केवल 3 दिन बचे! ₹${bal} की installment ${dueStr} तक जमा करनी है।`,
    'today':   `📢 Beyond Topper — आज (${dueStr}) आपकी installment ₹${bal} due है। कृपया आज ही जमा करें।`,
    'overdue': `⚠️ Beyond Topper — आपकी fee ₹${bal} 3 दिन overdue है। कृपया तुरंत जमा करें अन्यथा late fee लगेगी।`
  };
  const text = `${messages[type]}\n\nPay Now: https://beyondtopper.in/fee-deposit.html\n\n— Amit Dixit Sir`;
  const to = '91' + String(f['WhatsApp']).replace(/\D/g,'').slice(-10);

  if (provider === 'meta') {
    const url = `https://graph.facebook.com/v20.0/${process.env.WA_PHONE_ID}/messages`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
    });
  } else if (provider === 'interakt') {
    await fetch('https://api.interakt.ai/v1/public/message/', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countryCode: '+91',
        phoneNumber: String(f['WhatsApp']),
        type: 'Text',
        data: { message: text }
      })
    });
  }
}

function ok(obj){ return { statusCode: 200, body: JSON.stringify(obj) }; }
