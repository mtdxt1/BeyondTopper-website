// netlify/functions/create-order.js
// Creates a Razorpay order server-side and returns the order_id + public key.
// Env vars needed on Netlify: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

const Razorpay = require('razorpay');

exports.handler = async (event) => {
  // CORS + method check
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST')     return json(405, { error: 'Method not allowed' });

  try {
    const { amount, receiptNo } = JSON.parse(event.body || '{}');
    if (!amount || amount < 100) return json(400, { error: 'Invalid amount' });

    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await rzp.orders.create({
      amount: Math.round(amount),   // in paise
      currency: 'INR',
      receipt: receiptNo || ('BT-' + Date.now()),
      payment_capture: 1
    });

    return json(200, {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (e) {
    return json(500, { error: e.message });
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
