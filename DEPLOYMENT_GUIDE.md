# Beyond Topper — Fee Deposit System DEPLOYMENT GUIDE

Sir, यह guide पूरी step-by-step है। हर step **exactly इसी order में** करें।
No coding knowledge required — सिर्फ copy-paste और click।

---

## 📁 FILES बनाई गई हैं (Total: 8 files)

```
Website and AI Automation/
├── fee-deposit.html                    ← Main form page
├── netlify.toml                        ← Netlify config
├── admin/
│   └── fee-dashboard.html              ← Admin dashboard
└── netlify/
    └── functions/
        ├── package.json                ← Dependencies
        ├── create-order.js             ← Razorpay order creator
        ├── verify-payment.js           ← Payment verifier + Airtable save + WhatsApp
        ├── list-records.js             ← Admin data fetcher
        └── send-reminders.js           ← Daily reminder scheduler
```

---

## 🚀 STEP 1: GitHub पर Push करें (10 min)

1. **GitHub Desktop** खोलें
2. अपना repo select करें: `mtdxt1/BeyondTopper-website`
3. Left side में सारी नई files दिखेंगी
4. Summary में लिखें: `Add Fee Deposit System`
5. **Commit to main** → **Push origin**

✅ Verify: github.com/mtdxt1/BeyondTopper-website पर files दिख रही हों

---

## 🚀 STEP 2: index.html में Fee Deposit Button जोड़ें (5 min)

अपनी `index.html` में जहाँ nav menu है, वहाँ यह link जोड़ दें:

```html
<a href="/fee-deposit.html" class="nav-link" style="background:#f59e0b;color:#fff;padding:8px 16px;border-radius:8px;font-weight:600;">
  💰 Fee Deposit / फीस जमा करें
</a>
```

और homepage hero के नीचे भी एक बड़ा button:

```html
<div style="text-align:center;margin:20px 0;">
  <a href="/fee-deposit.html" style="display:inline-block;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;font-size:18px;">
    💳 Pay Course Fee Online →
  </a>
</div>
```

Push again to GitHub Desktop.

---

## 🚀 STEP 3: Razorpay Account (1 day for KYC)

1. जाएँ: **https://razorpay.com** → **Sign Up**
2. Email + Mobile से account बनाएँ
3. Business Type: **Sole Proprietor** या **Individual** (जो आप हैं)
4. **KYC docs upload** करें:
   - PAN card (आपका)
   - Aadhaar
   - Bank account details (जहाँ fee आएगी)
   - Business proof (Institute का letterhead या GST cert)
5. **KYC 1-2 दिन में approve** होगा

### Test Mode की keys तुरंत मिलेंगी:
1. Dashboard → **Settings** → **API Keys**
2. **Generate Test Key**
3. Copy करें: `rzp_test_XXXXXXXX` और `secret`

⚠️ **पहले Test mode में सब test करें**, फिर Live mode ON करें।

---

## 🚀 STEP 4: Airtable Setup (30 min)

### 4.1 Account बनाएँ
- जाएँ: **https://airtable.com** → **Sign Up** (Free plan sufficient है)

### 4.2 Base बनाएँ
1. **+ Create a base** → नाम: `Beyond Topper Fees`
2. Default table का नाम बदलें: `FeeRecords`

### 4.3 इन Fields को जोड़ें (exact names — case sensitive)

| Field Name | Type |
|---|---|
| Receipt No | Single line text |
| Date | Date (include time) |
| Student Name | Single line text |
| Father Name | Single line text |
| Mother Name | Single line text |
| Mobile | Phone |
| WhatsApp | Phone |
| Email | Email |
| Address | Long text |
| PIN | Single line text |
| Class | Single select (Class 6, 7, 8, 9, 10, 11, 12, Dropper) |
| Course | Single select (Foundation, NEET, JEE, Board Exam Booster, Crash Course) |
| Target Year | Single select (2026, 2027, 2028, 2029, 2030) |
| Batch Mode | Single select (Online, Offline, Hybrid) |
| Total Fee | Number |
| Discount | Number |
| Paid | Number (currency) |
| Balance | Number (currency) |
| Installments | Number |
| Next Due Date | Date |
| Razorpay Payment ID | Single line text |
| Status | Single select (Paid, Partial, Overdue) |

### 4.4 API Key लें
1. Top-right profile → **Developer Hub** → **Personal Access Tokens**
2. **Create new token**:
   - Name: `Beyond Topper Netlify`
   - Scopes: `data.records:read` + `data.records:write`
   - Access: Add your base `Beyond Topper Fees`
3. **Create** → copy token (starts with `pat...`)

### 4.5 Base ID लें
1. जाएँ: **https://airtable.com/api**
2. अपना base select करें
3. Top में दिखेगा: `The ID of this base is appXXXXXXXX` — यह Base ID है

---

## 🚀 STEP 5: WhatsApp Setup — Interakt (Recommended, Easy)

**Meta Cloud API** free है पर setup कठिन। **Interakt** ₹999/month से शुरू, आसान।

1. जाएँ: **https://interakt.ai** → Sign up
2. WhatsApp Business Number verify करें (Institute का number)
3. **Developer Setup** → API Key copy करें
4. Encode करें: `echo -n "API_KEY:" | base64` (या online base64 encoder use करें)

### सस्ता विकल्प — Meta Cloud API (Free tier: 1000 conversations/month)
1. **business.facebook.com** → WhatsApp → API Setup
2. Test number + Access Token मिलेगा
3. Production के लिए business verification + phone verification चाहिए
4. Docs: developers.facebook.com/docs/whatsapp/cloud-api

---

## 🚀 STEP 6: Netlify Environment Variables (5 min)

1. जाएँ: **app.netlify.com** → अपनी site select करें
2. **Site settings** → **Environment variables** → **Add variables**
3. यह सब variables एक-एक करके add करें:

| Variable | Value | कहाँ से मिला |
|---|---|---|
| `RAZORPAY_KEY_ID` | rzp_test_XXXX | Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | XXXXX | Razorpay Dashboard |
| `AIRTABLE_API_KEY` | pat.XXXX | Airtable Developer Hub |
| `AIRTABLE_BASE_ID` | appXXXX | Airtable API page |
| `AIRTABLE_TABLE_NAME` | FeeRecords | (as-is) |
| `WA_PROVIDER` | interakt (या meta या off) | आपकी choice |
| `WA_TOKEN` | XXXX | Interakt/Meta |
| `WA_PHONE_ID` | XXXX (सिर्फ Meta के लिए) | Meta Dashboard |
| `INSTITUTE_EMAIL` | janchpathology@gmail.com | (as-is) |

4. **Save** → **Deploys** tab → **Trigger deploy** → **Deploy site**

---

## 🚀 STEP 7: Test Checklist (2 hours)

Netlify deploy successful होने के बाद:

### Test 1 — Form load होता है?
- Open: `https://beyondtopper.in/fee-deposit.html`
- सारे fields दिख रहे हैं? Class select करने पर Course dropdown update होता है? ✅

### Test 2 — Fee calculation
- Class 11 + NEET select करें → ₹55,000 दिखना चाहिए
- Full Payment select → ₹52,250 payable (5% discount) दिखना चाहिए
- Part Payment (4 installments) select → ₹13,750 × 4 table दिखनी चाहिए ✅

### Test 3 — Razorpay Test Payment
- सारा form भरें → **Pay** button दबाएँ
- Razorpay popup खुले → **Test card**: `4111 1111 1111 1111`, CVV: `123`, Expiry: कोई भी future date
- Success page दिखे → Receipt PDF download करें ✅

### Test 4 — Data Airtable में save हुआ?
- Airtable base खोलें → नया record दिखना चाहिए सारी details के साथ ✅

### Test 5 — WhatsApp confirmation आया?
- अपने WhatsApp पर message आना चाहिए ✅
- अगर नहीं आया: Netlify → Functions → verify-payment → logs check करें

### Test 6 — Admin dashboard
- Open: `https://beyondtopper.in/admin/fee-dashboard.html`
- Password: `changeMe123` (fee-dashboard.html में line change करके अपना password set करें)
- Records दिख रहे हैं, KPIs सही हैं ✅

### Test 7 — Live Mode ON
- Razorpay Dashboard → **Live Mode** ON करें (KYC approve होने पर)
- Live keys लें → Netlify env vars में update करें
- ₹1 का real test payment करें (खुद से) → verify हो जाए → refund कर दें

---

## 💰 MONTHLY COST (100-500 Students)

| Service | Cost |
|---|---|
| Netlify Hosting | ₹0 (Free tier — 100GB bandwidth) |
| Razorpay | 2% per transaction (कोई fixed नहीं) |
| Airtable | ₹0 (Free — 1000 records) |
| Interakt WhatsApp | ₹999/month + per message |
| **या Meta Cloud API** | ₹0 (1000 free conversations/month) |
| **Total (fixed)** | **₹0 – ₹1,500/month** |

---

## ⚖️ LEGAL / COMPLIANCE Notes

1. **GST**: अगर annual turnover > ₹20 लाख (services), तो GST registration mandatory. Registration है तो GSTIN receipt में add करें (`fee-deposit.html` में `INSTITUTE.gstin` line update करें)
2. **Refund Policy**: `/refund.html` page बनाएँ जिसमें clearly refund rules लिखें (form में उसका link है)
3. **Terms & Conditions**: `/terms.html` भी बनाएँ
4. **Payment Aggregator Rules**: Razorpay RBI-approved है, इसलिए safe है
5. **Data Protection**: Airtable में student data safely stored है। Admin dashboard का password strong रखें

---

## 🔧 CUSTOMIZATION (कब बदलें कहाँ)

### Fee change करनी है
`fee-deposit.html` खोलें → line ~200 पर `FEE_CONFIG = { ... }` में edit करें → push to GitHub

### Institute details change
`fee-deposit.html` में `INSTITUTE = { ... }` object update करें

### Admin password change
`admin/fee-dashboard.html` में line ~110: `const ADMIN_PASSWORD = "yourNewStrongPassword";`

### Reminder timing बदलें
`netlify.toml` में `schedule = "30 3 * * *"` change करें (cron format)

---

## 📞 PROBLEM आए तो

1. **Netlify Deploy fail**: Netlify → Deploys → last deploy → View logs → error copy करें → Claude को paste करें
2. **Razorpay error**: Function logs check करें (`Netlify → Functions → create-order → Logs`)
3. **Airtable में data नहीं आ रहा**: Field names EXACT match करें (case-sensitive)
4. **WhatsApp नहीं आ रहा**: WA_PROVIDER = "off" कर के test करें first, फिर provider setup verify करें

---

## ✅ PHASED ROLLOUT (Sir, यह ज़रूर follow करें)

| Week | क्या करें |
|---|---|
| Week 1 | Sirf Test mode में सब test करें, WA_PROVIDER = "off" रखें |
| Week 2 | Airtable save + admin dashboard verify करें |
| Week 3 | WhatsApp integration ON करें |
| Week 4 | Reminders ON करें, Live Razorpay keys डालें, launch! |

एक साथ सब कुछ live मत करें — bugs छूट सकते हैं और fee collection रुक सकता है।

---

**बस Sir! अब आप fully self-service coaching institute run कर सकते हैं। सारे screenshots + screen recordings बनवा लीजिए launch से पहले।**

— Built with ❤️ for Beyond Topper
