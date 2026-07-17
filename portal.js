/* ==========================================================================
   Blessed Obiora ICT Limited — User Portal JavaScript
   ========================================================================== */
'use strict';

/* ---- Config ---- */
const PAYSTACK_KEY  = 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // Replace with your live key
const MIN_TOPUP     = 500; // ₦500 minimum

/* ---- Storage Keys ---- */
const SK = {
    USERS:   'boi_portal_users',
    SESSION: 'boi_portal_session',
    WALLET:  email => `boi_wallet_${email}`,
    TXNS:    email => `boi_txns_${email}`,
};

/* ---- Payable Services (8 services, no Software Dev or Printing) ---- */
const SERVICES = [
    { id:'online-reg',  name:'Online Registrations',   icon:'fa-solid fa-file-signature',     price:1000,  color:'#3b82f6', colorBg:'rgba(59,130,246,0.12)'  },
    { id:'jamb',        name:'JAMB Services',           icon:'fa-solid fa-graduation-cap',     price:2500,  color:'#8b5cf6', colorBg:'rgba(139,92,246,0.12)'  },
    { id:'nysc',        name:'NYSC Services',           icon:'fa-solid fa-user-tie',           price:1500,  color:'#06b6d4', colorBg:'rgba(6,182,212,0.12)'   },
    { id:'nin',         name:'NIN Services',            icon:'fa-solid fa-id-card',            price:1200,  color:'#10b981', colorBg:'rgba(16,185,129,0.12)'  },
    { id:'bvn',         name:'BVN Services',            icon:'fa-solid fa-fingerprint',        price:5500,  color:'#f59e0b', colorBg:'rgba(245,158,11,0.12)'  },
    { id:'tin',         name:'TIN Services',            icon:'fa-solid fa-file-invoice-dollar',price:2000,  color:'#ec4899', colorBg:'rgba(236,72,153,0.12)'  },
    { id:'cac',         name:'CAC Services',            icon:'fa-solid fa-building-columns',   price:15000, color:'#6366f1', colorBg:'rgba(99,102,241,0.12)'  },
    { id:'newspaper',   name:'Newspaper Publications',  icon:'fa-solid fa-newspaper',          price:5000,  color:'#84cc16', colorBg:'rgba(132,204,22,0.12)'  },
];

/* ---- DOM helpers ---- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = n => Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---- State ---- */
let currentUser = null;
let confirmServiceId = null;


/* ==========================================================================
   AUTH HELPERS
   ========================================================================== */
function getUsers() {
    try { return JSON.parse(localStorage.getItem(SK.USERS) || '{}'); } catch { return {}; }
}
function saveUsers(u) { localStorage.setItem(SK.USERS, JSON.stringify(u)); }

function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
    return h.toString(36);
}

function loadSession() {
    try { return JSON.parse(sessionStorage.getItem(SK.SESSION) || 'null'); } catch { return null; }
}
function saveSession(user) { sessionStorage.setItem(SK.SESSION, JSON.stringify(user)); }
function clearSession() { sessionStorage.removeItem(SK.SESSION); }


/* ==========================================================================
   WALLET HELPERS
   ========================================================================== */
function getBalance(email) {
    return parseFloat(localStorage.getItem(SK.WALLET(email)) || '0');
}
function setBalance(email, amount) {
    localStorage.setItem(SK.WALLET(email), String(Math.max(0, parseFloat(amount.toFixed(2)))));
}
function creditWallet(email, amount) { setBalance(email, getBalance(email) + amount); }
function debitWallet(email, amount)  { setBalance(email, getBalance(email) - amount); }

function getTxns(email) {
    try { return JSON.parse(localStorage.getItem(SK.TXNS(email)) || '[]'); } catch { return []; }
}
function logTxn(email, txn) {
    const txns = getTxns(email);
    txns.unshift({ ...txn, id: `TXN${Date.now()}`, timestamp: new Date().toISOString() });
    localStorage.setItem(SK.TXNS(email), JSON.stringify(txns));
}

function generateRef() {
    return `BOI-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}


/* ==========================================================================
   AUTH — REGISTER
   ========================================================================== */
function handleRegister(e) {
    e.preventDefault();
    const form    = $('#register-form');
    const errEl   = $('#reg-error');
    const btn     = $('#reg-btn');
    const name    = $('#reg-name').value.trim();
    const email   = $('#reg-email').value.trim().toLowerCase();
    const phone   = $('#reg-phone').value.trim();
    const pw      = $('#reg-pw').value;
    const pw2     = $('#reg-pw2').value;

    errEl.classList.remove('visible');

    if (!name || !email || !phone || !pw) {
        return showAuthError(errEl, 'Please fill in all fields.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return showAuthError(errEl, 'Please enter a valid email address.');
    }
    if (pw.length < 6) {
        return showAuthError(errEl, 'Password must be at least 6 characters.');
    }
    if (pw !== pw2) {
        return showAuthError(errEl, 'Passwords do not match.');
    }

    const users = getUsers();
    if (users[email]) {
        return showAuthError(errEl, 'An account with this email already exists.');
    }

    btn.classList.add('loading');
    setTimeout(() => {
        users[email] = { name, email, phone, pw: simpleHash(pw), createdAt: Date.now() };
        saveUsers(users);
        btn.classList.remove('loading');
        showToast('Account created! Please log in.', 'success');
        // Switch to login tab
        switchAuthTab('login');
        $('#login-email').value = email;
        $('#login-pw').focus();
    }, 700);
}

/* ==========================================================================
   AUTH — LOGIN
   ========================================================================== */
function handleLogin(e) {
    e.preventDefault();
    const errEl  = $('#login-error');
    const btn    = $('#login-btn');
    const email  = $('#login-email').value.trim().toLowerCase();
    const pw     = $('#login-pw').value;

    errEl.classList.remove('visible');
    if (!email || !pw) return showAuthError(errEl, 'Please enter your email and password.');

    btn.classList.add('loading');
    setTimeout(() => {
        const users = getUsers();
        const user  = users[email];
        if (!user || user.pw !== simpleHash(pw)) {
            btn.classList.remove('loading');
            return showAuthError(errEl, 'Invalid email or password. Please try again.');
        }
        btn.classList.remove('loading');
        currentUser = { name: user.name, email: user.email, phone: user.phone };
        saveSession(currentUser);
        bootPortal();
    }, 800);
}

function showAuthError(el, msg) {
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
    el.classList.add('visible');
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */
function logout() {
    clearSession();
    currentUser = null;
    $('#portal').classList.add('hidden');
    $('#auth-page').classList.remove('hidden');
    $('#login-email').value = '';
    $('#login-pw').value = '';
    $('#login-error').classList.remove('visible');
    showToast('You have been logged out.', 'info');
}


/* ==========================================================================
   AUTH TAB SWITCHING
   ========================================================================== */
function switchAuthTab(tab) {
    $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    $$('.auth-form').forEach(f => f.classList.toggle('active', f.id === `${tab}-form`));
    // Toggle helper notes
    const loginNote    = document.getElementById('login-note');
    const registerNote = document.getElementById('register-note');
    if (loginNote)    loginNote.classList.toggle('hidden', tab !== 'login');
    if (registerNote) registerNote.classList.toggle('hidden', tab !== 'register');
}

function initAuthTabs() {
    $$('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });
    $('#go-register').addEventListener('click', () => switchAuthTab('register'));
    $('#go-login').addEventListener('click',    () => switchAuthTab('login'));

    // Password visibility toggles
    $$('.auth-toggle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const isText = input.type === 'text';
            input.type = isText ? 'password' : 'text';
            btn.querySelector('i').className = isText ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        });
    });

    $('#login-form').addEventListener('submit', handleLogin);
    $('#register-form').addEventListener('submit', handleRegister);
}


/* ==========================================================================
   BOOT PORTAL (after successful login)
   ========================================================================== */
function bootPortal() {
    $('#auth-page').classList.add('hidden');
    $('#portal').classList.remove('hidden');
    updateUserUI();
    updateBalanceUI();
    updateStatsUI();
    renderServices();
    renderTransactions();
    navigateTo('overview');
}

function updateUserUI() {
    const initial = currentUser.name.charAt(0).toUpperCase();
    $$('.p-user-avatar-init').forEach(el => el.textContent = initial);
    $$('.p-user-name-display').forEach(el => el.textContent = currentUser.name);
    $$('.p-user-email-display').forEach(el => el.textContent = currentUser.email);
}

function updateBalanceUI() {
    const bal = getBalance(currentUser.email);
    $$('.p-balance-display').forEach(el => el.textContent = `₦${fmt(bal)}`);
    // Sidebar mini balance
    const miniEl = $('.p-wallet-mini-balance');
    if (miniEl) miniEl.textContent = `₦${fmt(bal)}`;
}

function updateStatsUI() {
    const txns = getTxns(currentUser.email);
    const totalFunded  = txns.filter(t=>t.type==='top-up').reduce((s,t)=>s+t.amount,0);
    const totalSpent   = txns.filter(t=>t.type==='payment').reduce((s,t)=>s+t.amount,0);
    const totalOrders  = txns.filter(t=>t.type==='payment').length;

    const el = id => document.getElementById(id);
    if (el('stat-funded'))  el('stat-funded').textContent  = `₦${fmt(totalFunded)}`;
    if (el('stat-spent'))   el('stat-spent').textContent   = `₦${fmt(totalSpent)}`;
    if (el('stat-orders'))  el('stat-orders').textContent  = totalOrders;

    // Wallet hero bottom stats
    if (el('hero-funded')) el('hero-funded').textContent = `₦${fmt(totalFunded)}`;
    if (el('hero-spent'))  el('hero-spent').textContent  = `₦${fmt(totalSpent)}`;
}


/* ==========================================================================
   RENDER SERVICES
   ========================================================================== */
function renderServices() {
    const grid = $('#services-grid');
    if (!grid) return;
    grid.innerHTML = '';

    SERVICES.forEach(svc => {
        const card = document.createElement('div');
        card.className = 'p-svc-card';
        card.innerHTML = `
            <div class="p-svc-icon" style="background:${svc.colorBg}; border-color:${svc.color}40; color:${svc.color}">
                <i class="${svc.icon}"></i>
            </div>
            <div class="p-svc-name">${svc.name}</div>
            <div class="p-svc-price">
                ₦${fmt(svc.price)}
                <span>Service Fee</span>
            </div>
            <button class="p-pay-btn" data-id="${svc.id}">
                <i class="fa-solid fa-wallet"></i> Pay &amp; Request
            </button>
        `;
        grid.appendChild(card);
    });

    // Bind pay buttons
    $$('.p-pay-btn').forEach(btn => {
        btn.addEventListener('click', () => openConfirmPayment(btn.dataset.id));
    });
}


/* ==========================================================================
   RENDER TRANSACTIONS
   ========================================================================== */
function buildTxnTable(txns, limit = null) {
    if (txns.length === 0) {
        return `<div class="p-txn-empty">
            <i class="fa-solid fa-receipt"></i>
            No transactions yet. Fund your wallet to get started!
        </div>`;
    }
    const rows = (limit ? txns.slice(0, limit) : txns).map(t => {
        const isCredit = t.type === 'top-up';
        const date = new Date(t.timestamp);
        const dateStr = date.toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric' });
        const timeStr = date.toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' });
        return `<tr>
            <td><span class="txn-type-badge ${t.type}">
                <i class="fa-solid fa-${isCredit ? 'arrow-down' : 'arrow-up'}"></i>
                ${isCredit ? 'Top-Up' : 'Payment'}
            </span></td>
            <td>${t.description || '—'}</td>
            <td><span class="txn-amount ${isCredit ? 'credit' : 'debit'}">${isCredit ? '+' : '-'}\u20A6${fmt(t.amount)}</span></td>
            <td><span class="txn-ref">${t.reference}</span></td>
            <td><span class="txn-date">${dateStr}, ${timeStr}</span></td>
        </tr>`;
    }).join('');
    return `<div class="p-txn-table"><table>
        <thead><tr>
            <th>Type</th><th>Description</th><th>Amount</th><th>Reference</th><th>Date &amp; Time</th>
        </tr></thead>
        <tbody>${rows}</tbody>
    </table></div>`;
}

function renderTransactions() {
    const txns = getTxns(currentUser.email);
    // Overview: show latest 5
    const overview = $('#txn-container');
    if (overview) overview.innerHTML = buildTxnTable(txns, 5);
    // Full transactions tab: show all
    const full = $('#txn-container-full');
    if (full) full.innerHTML = buildTxnTable(txns);
}


/* ==========================================================================
   FUND WALLET MODAL
   ========================================================================== */
function openFundWallet() {
    $('#fw-amount').value = '';
    $$('.fw-preset').forEach(b => b.classList.remove('selected'));
    $('#fund-modal').classList.add('active');
    setTimeout(() => $('#fw-amount').focus(), 200);
}

function initFundModal() {
    $('#fund-modal').addEventListener('click', e => { if (e.target === $('#fund-modal')) closeFundModal(); });
    $('#fund-modal-close').addEventListener('click', closeFundModal);

    // Preset amount buttons
    $$('.fw-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.fw-preset').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            $('#fw-amount').value = btn.dataset.amount;
        });
    });

    $('#fw-amount').addEventListener('input', () => {
        $$('.fw-preset').forEach(b => b.classList.remove('selected'));
        const matching = $$(`.fw-preset[data-amount="${$('#fw-amount').value}"]`);
        matching.forEach(b => b.classList.add('selected'));
    });

    $('#fw-pay-btn').addEventListener('click', initiatePaystack);
}

function closeFundModal() {
    $('#fund-modal').classList.remove('active');
}

function initiatePaystack() {
    const raw = parseFloat($('#fw-amount').value);
    if (!raw || isNaN(raw) || raw < MIN_TOPUP) {
        showToast(`Minimum top-up is ₦${MIN_TOPUP.toLocaleString()}.`, 'warning');
        return;
    }

    const btn = $('#fw-pay-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    const amountKobo = Math.round(raw * 100);
    const ref = generateRef();

    // Small delay for UX before Paystack popup
    setTimeout(() => {
        btn.classList.remove('loading');
        btn.disabled = false;

        try {
            const handler = PaystackPop.setup({
                key:      PAYSTACK_KEY,
                email:    currentUser.email,
                amount:   amountKobo,
                currency: 'NGN',
                ref,
                metadata: {
                    custom_fields: [{
                        display_name: 'Customer Name',
                        variable_name: 'customer_name',
                        value: currentUser.name
                    }]
                },
                callback: function(response) {
                    handleTopUpSuccess(raw, response.reference || ref);
                },
                onClose: function() {
                    showToast('Payment window closed.', 'info');
                }
            });
            handler.openIframe();
        } catch (err) {
            showToast('Could not open payment window. Check your Paystack key.', 'error');
        }
    }, 400);
}

function handleTopUpSuccess(amount, reference) {
    creditWallet(currentUser.email, amount);
    logTxn(currentUser.email, {
        type: 'top-up',
        amount,
        description: 'Wallet Top-Up via Paystack',
        reference,
        status: 'success'
    });
    closeFundModal();
    updateBalanceUI();
    updateStatsUI();
    renderTransactions();
    showToast(`₦${fmt(amount)} added to your wallet!`, 'success');
}


/* ==========================================================================
   CONFIRM PAYMENT MODAL
   ========================================================================== */
function openConfirmPayment(serviceId) {
    const svc = SERVICES.find(s => s.id === serviceId);
    if (!svc) return;
    confirmServiceId = serviceId;

    const balance = getBalance(currentUser.email);
    const after   = balance - svc.price;
    const canPay  = balance >= svc.price;

    // Populate modal
    const icon = $('#cp-icon');
    icon.style.background = svc.colorBg;
    icon.style.color = svc.color;
    icon.innerHTML = `<i class="${svc.icon}"></i>`;
    $('#cp-svc-name').textContent    = svc.name;
    $('#cp-price').textContent       = `₦${fmt(svc.price)}`;
    $('#cp-balance').textContent     = `₦${fmt(balance)}`;
    $('#cp-after').textContent       = canPay ? `₦${fmt(after)}` : 'Insufficient';
    $('#cp-after').className         = `cp-row-val after${!canPay ? ' insufficient' : ''}`;
    $('#cp-insufficient').classList.toggle('visible', !canPay);
    $('#cp-confirm-btn').disabled    = !canPay;

    // Show "Fund Wallet" link if insufficient
    const fundBtn = $('#cp-fund-btn');
    if (fundBtn) fundBtn.style.display = !canPay ? 'flex' : 'none';
    const confirmBtn = $('#cp-confirm-btn');
    if (confirmBtn) confirmBtn.style.display = canPay ? 'flex' : 'none';

    $('#confirm-modal').classList.add('active');
}

function confirmPayment() {
    const svc = SERVICES.find(s => s.id === confirmServiceId);
    if (!svc) return;

    const balance = getBalance(currentUser.email);
    if (balance < svc.price) {
        showToast('Insufficient wallet balance.', 'error');
        return;
    }

    debitWallet(currentUser.email, svc.price);
    const ref = generateRef();
    logTxn(currentUser.email, {
        type: 'payment',
        amount: svc.price,
        description: `Service Request: ${svc.name}`,
        reference: ref,
        status: 'success'
    });

    $('#confirm-modal').classList.remove('active');
    confirmServiceId = null;
    updateBalanceUI();
    updateStatsUI();
    renderTransactions();
    showToast(`Payment successful! Your ${svc.name} request has been received.`, 'success');

    // Auto-navigate to transactions to show the entry
    setTimeout(() => navigateTo('transactions'), 1200);
}

function initConfirmModal() {
    $('#confirm-modal').addEventListener('click', e => { if (e.target === $('#confirm-modal')) $('#confirm-modal').classList.remove('active'); });
    $('#cp-modal-close').addEventListener('click', () => $('#confirm-modal').classList.remove('active'));
    $('#cp-cancel-btn').addEventListener('click', () => $('#confirm-modal').classList.remove('active'));
    $('#cp-confirm-btn').addEventListener('click', confirmPayment);

    const fundBtn = $('#cp-fund-btn');
    if (fundBtn) {
        fundBtn.addEventListener('click', () => {
            $('#confirm-modal').classList.remove('active');
            openFundWallet();
        });
    }
}


/* ==========================================================================
   SIDEBAR NAVIGATION (tab-based)
   ========================================================================== */
function navigateTo(section) {
    $$('.p-nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === section));
    $$('.p-section').forEach(s => s.classList.toggle('active', s.dataset.section === section));

    const titles = {
        overview:     ['Overview', 'Your wallet & activity summary'],
        services:     ['Services', 'Browse and pay for available services'],
        transactions: ['Transactions', 'Your complete payment history'],
    };
    const [title, sub] = titles[section] || ['Dashboard', ''];
    const titleEl = document.getElementById('p-page-title');
    const subEl   = document.getElementById('p-page-sub');
    if (titleEl) titleEl.textContent = title;
    if (subEl)   subEl.textContent   = sub;
}

function initNav() {
    $$('.p-nav-link[data-section]').forEach(link => {
        link.addEventListener('click', () => {
            navigateTo(link.dataset.section);
            if (window.innerWidth <= 860) closeSidebar();
        });
    });
}


/* ==========================================================================
   SIDEBAR MOBILE TOGGLE
   ========================================================================== */
function openSidebar()  { $('.p-sidebar').classList.add('open'); $('.p-sidebar-overlay').classList.add('active'); }
function closeSidebar() { $('.p-sidebar').classList.remove('open'); $('.p-sidebar-overlay').classList.remove('active'); }

function initSidebar() {
    $('.p-hamburger').addEventListener('click', () =>
        $('.p-sidebar').classList.contains('open') ? closeSidebar() : openSidebar()
    );
    $('.p-sidebar-overlay').addEventListener('click', closeSidebar);
}


/* ==========================================================================
   TOAST
   ========================================================================== */
function showToast(msg, type = 'info') {
    const icons = { success:'fa-circle-check', warning:'fa-triangle-exclamation', info:'fa-circle-info', error:'fa-circle-xmark' };
    const t = document.createElement('div');
    t.className = `p-toast ${type}`;
    t.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    $('#p-toasts').appendChild(t);
    setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 350); }, 3400);
}


/* ==========================================================================
   FUND WALLET BUTTONS (multiple entry points)
   ========================================================================== */
function bindFundButtons() {
    $$('.open-fund-wallet').forEach(btn => btn.addEventListener('click', openFundWallet));
    $$('.do-logout').forEach(btn => btn.addEventListener('click', logout));
}


/* ==========================================================================
   INIT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initAuthTabs();
    initSidebar();
    initNav();
    initFundModal();
    initConfirmModal();
    bindFundButtons();

    // Auto-login from session
    const session = loadSession();
    if (session) {
        const users = getUsers();
        if (users[session.email]) {
            currentUser = session;
            bootPortal();
            return;
        }
    }

    // Show auth
    $('#auth-page').classList.remove('hidden');
});
