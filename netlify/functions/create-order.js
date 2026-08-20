// netlify/functions/create-order.js
// Creates a Razorpay order server-side.
// Env vars needed: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// v2: Better error handling + amount validation + debug info

const Razorpay = require('razorpay');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST')     return json(405, { error: 'Method not allowed' });

  // ---- Diagnostics: expose safe info to help debug env var issues ----
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    return json(500, {
      error: 'Razorpay credentials missing on server',
      hint: 'Netlify env vars RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set on this deploy. Check the Netlify project connected to beyondtopper.in.',
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret
    });
  }

  const mode = keyId.startsWith('rzp_live_') ? 'LIVE' : keyId.startsWith('rzp_test_') ? 'TEST' : 'UNKNOWN';

  try {
    const body = JSON.parse(event.body || '{}');
    let { amount, receiptNo } = body;

    // ---- SERVER-SIDE AMOUNT VALIDATION ----
    // amount is expected in PAISE (as sent from frontend after *100 conversion)
    amount = Number(amount);
    if (!Number.isFinite(amount) || isNaN(amount)) {
      return json(400, { error: 'Invalid amount', received: body.amount, mode });
    }
    if (amount < 100) { // Razorpay minimum = ₹1 = 100 paise
      return json(400, { error: 'Amount too small (minimum ₹1)', received: amount, mode });
    }
    if (amount > 1500000000) { // hard sanity cap: ₹1.5 Cr
      return json(400, { error: 'Amount too large', received: amount, mode });
    }
    amount = Math.round(amount); // must be integer paise

    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await rzp.orders.create({
      amount: amount,          // in paise
      currency: 'INR',
      receipt: (receiptNo || ('BT-' + Date.now())).slice(0, 40), // Razorpay receipt max 40 chars
      payment_capture: 1
    });

    return json(200, {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      mode: mode
    });
  } catch (e) {
    // Try to extract real Razorpay error
    const errObj = e && e.error ? e.error : {};
    const rzpMsg = errObj.description || errObj.reason || e.message || 'Unknown error';
    const rzpCode = errObj.code || 'NO_CODE';
    console.error('Razorpay order failed:', JSON.stringify({ rzpCode, rzpMsg, mode, keyIdPrefix: keyId.slice(0, 12) }));

    return json(500, {
      error: rzpMsg,
      code: rzpCode,
      mode: mode,
      hint: mode === 'LIVE'
        ? 'Live Razorpay account may need activation for International/domestic payments. Check Razorpay dashboard → Payments → activation status.'
        : 'Check Razorpay Test Mode credentials in Netlify env vars.'
    });
  }
};

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
