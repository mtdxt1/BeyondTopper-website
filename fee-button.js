/* Beyond Topper — Fee Deposit Button Injector
   ============================================
   This script auto-adds "Fee Deposit" buttons to the homepage:
   1. Top navigation button (next to Book Free Demo)
   2. Hero section big CTA button
   3. Mobile floating action button (bottom-right)

   USAGE: Add this line before </body> in index.html:
   <script src="/fee-button.js" defer></script>
*/

(function () {
  'use strict';

  const FEE_URL = '/fee-deposit.html';

  // ============ INJECT STYLES ============
  const style = document.createElement('style');
  style.textContent = `
    /* Top nav button (desktop) */
    .bt-fee-nav-btn {
      display: inline-block;
      background: linear-gradient(135deg, #16a34a, #22c55e);
      color: #fff !important;
      padding: 10px 20px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      margin-right: 8px;
      box-shadow: 0 4px 14px rgba(22,163,74,0.4);
      transition: transform 0.2s, box-shadow 0.2s;
      white-space: nowrap;
    }
    .bt-fee-nav-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(22,163,74,0.5);
      color: #fff !important;
    }

    /* Hero section big button */
    .bt-fee-hero-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #16a34a, #22c55e);
      color: #fff !important;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 18px;
      text-decoration: none;
      margin: 12px 8px 12px 0;
      box-shadow: 0 6px 20px rgba(22,163,74,0.4);
      transition: transform 0.2s;
    }
    .bt-fee-hero-btn:hover {
      transform: translateY(-3px);
      color: #fff !important;
    }

    /* Mobile floating action button */
    .bt-fee-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9998;
      background: linear-gradient(135deg, #16a34a, #22c55e);
      color: #fff !important;
      padding: 14px 22px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      box-shadow: 0 8px 25px rgba(22,163,74,0.6);
      display: none;
      align-items: center;
      gap: 8px;
      animation: btFabPulse 2s infinite;
    }
    @keyframes btFabPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @media (max-width: 768px) {
      .bt-fee-fab { display: inline-flex; }
      .bt-fee-nav-btn { padding: 8px 14px; font-size: 12px; }
      .bt-fee-hero-btn { font-size: 15px; padding: 12px 20px; }
    }

    /* Highlight badge */
    .bt-fee-badge {
      display: inline-block;
      background: #ef4444;
      color: #fff;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 999px;
      margin-left: 6px;
      font-weight: 700;
      animation: btBlink 1.5s infinite;
    }
    @keyframes btBlink {
      50% { opacity: 0.6; }
    }
  `;
  document.head.appendChild(style);

  // ============ 1. TOP NAV BUTTON ============
  function addNavButton() {
    // Find "Book Free Demo" button (yellow) — insert our button BEFORE it
    const allLinks = document.querySelectorAll('a, button');
    let bookDemoBtn = null;
    for (const el of allLinks) {
      const text = (el.textContent || '').toLowerCase();
      if (text.includes('book') && (text.includes('demo') || text.includes('free'))) {
        bookDemoBtn = el;
        break;
      }
    }

    const navBtn = document.createElement('a');
    navBtn.href = FEE_URL;
    navBtn.className = 'bt-fee-nav-btn';
    navBtn.innerHTML = '💰 Fee Deposit <span class="bt-fee-badge">NEW</span>';
    navBtn.setAttribute('aria-label', 'Fee Deposit / फीस जमा करें');

    if (bookDemoBtn && bookDemoBtn.parentNode) {
      bookDemoBtn.parentNode.insertBefore(navBtn, bookDemoBtn);
    } else {
      // Fallback: add to top of body
      const header = document.querySelector('header, nav, .header, .nav');
      if (header) {
        header.appendChild(navBtn);
      }
    }
  }

  // ============ 2. HERO BUTTON ============
  function addHeroButton() {
    // Try to find hero section — look for h1 with NEET/JEE/Board text
    const h1s = document.querySelectorAll('h1, h2');
    let heroContainer = null;
    for (const h of h1s) {
      const text = (h.textContent || '').toLowerCase();
      if (text.includes('neet') || text.includes('jee') || text.includes('board')) {
        heroContainer = h.parentNode;
        break;
      }
    }

    if (!heroContainer) return;

    const heroBtn = document.createElement('a');
    heroBtn.href = FEE_URL;
    heroBtn.className = 'bt-fee-hero-btn';
    heroBtn.innerHTML = '💳 Pay Course Fee Online →';
    heroBtn.setAttribute('aria-label', 'Fee Deposit / फीस जमा करें');

    // Insert after any existing buttons or paragraphs
    heroContainer.appendChild(heroBtn);
  }

  // ============ 3. MOBILE FLOATING BUTTON ============
  function addMobileFAB() {
    const fab = document.createElement('a');
    fab.href = FEE_URL;
    fab.className = 'bt-fee-fab';
    fab.innerHTML = '💰 Pay Fee';
    fab.setAttribute('aria-label', 'Fee Deposit / फीस जमा करें');
    document.body.appendChild(fab);
  }

  // ============ RUN AFTER DOM READY ============
  function init() {
    try { addNavButton(); } catch (e) { console.warn('BT nav button failed:', e); }
    try { addHeroButton(); } catch (e) { console.warn('BT hero button failed:', e); }
    try { addMobileFAB(); } catch (e) { console.warn('BT FAB failed:', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 300); // small delay for React-rendered pages
  }
})();
