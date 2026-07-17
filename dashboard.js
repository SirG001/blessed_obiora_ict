/* ==========================================================================
   Blessed Obiora ICT Limited — Admin Dashboard JS
   ========================================================================== */

'use strict';

/* ---- Constants ---- */
const CREDENTIALS = { username: 'admin', password: 'blessed2026' };
const SESSION_KEY  = 'boi_admin_session';
const STATE_KEY    = 'boi_services_state';
const NOTICES_KEY  = 'boi_notices_dismissed';

/* ---- Service Definitions ---- */
const SERVICES = [
    {
        id: 'online-reg',
        name: 'Online Registrations',
        icon: 'fa-solid fa-file-signature',
        desc: 'Swift, secure, and accurate data entry processing for institutional registrations, recruitment drives, and portal submissions.',
        cost: null,
        notice: null,
    },
    {
        id: 'printing',
        name: 'Printing',
        icon: 'fa-solid fa-print',
        desc: 'Professional design and high-quality digital printing for branding assets — business cards, flyers, banners, and brochures.',
        cost: 'Contact Us',
        notice: null,
    },
    {
        id: 'jamb',
        name: 'JAMB Services',
        icon: 'fa-solid fa-graduation-cap',
        desc: 'Approved UTME/DE registration, profile creation, result checking, admission letter printing, and change of institution or course.',
        cost: null,
        notice: 'Waiting time is 2 to 3 hours from 9am to 5pm on business days.',
    },
    {
        id: 'nysc',
        name: 'NYSC Services',
        icon: 'fa-solid fa-user-tie',
        desc: 'Seamless registration for mobilisation, green card generation, call-up letter printing, and relocation request tracking.',
        cost: null,
        notice: null,
    },
    {
        id: 'nin',
        name: 'NIN Services',
        icon: 'fa-solid fa-id-card',
        desc: 'Official National Identification Number enrollment, detail modifications (name/DOB), verification lookups, and secure slip prints.',
        cost: null,
        notice: null,
    },
    {
        id: 'bvn',
        name: 'BVN Services',
        icon: 'fa-solid fa-fingerprint',
        desc: 'Fast and secure Bank Verification Number enrollment, lookup by phone number, and bank account linking support.',
        cost: '₦5,500',
        notice: null,
    },
    {
        id: 'tin',
        name: 'TIN Services',
        icon: 'fa-solid fa-file-invoice-dollar',
        desc: 'Tax Identification Number registration and verification support for individuals and corporates with FIRS.',
        cost: null,
        notice: null,
    },
    {
        id: 'cac',
        name: 'CAC Services',
        icon: 'fa-solid fa-building-columns',
        desc: 'End-to-end CAC filing — business name registration, company incorporation (RC), and annual returns.',
        cost: 'Contact Us',
        notice: null,
    },
    {
        id: 'software-dev',
        name: 'Software Development',
        icon: 'fa-solid fa-laptop-code',
        desc: 'Custom software solutions — desktop apps, management systems, APIs, and enterprise platforms tailored to your workflow.',
        cost: 'Get Quote',
        notice: null,
    },
    {
        id: 'newspaper',
        name: 'Newspaper Publications',
        icon: 'fa-solid fa-newspaper',
        desc: 'Professional newspaper publication services — obituaries, change-of-name, public notices, and legal advertisements.',
        cost: 'Contact Us',
        notice: null,
    },
];

/* ---- DOM Helpers ---- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---- State ---- */
let serviceStates = {};   // { [id]: { enabled: bool, notice: string|null } }
let dismissedNotices = {}; // { [id]: bool }
let activeDetailId = null;
let noticeTargetId = null;

/* ==========================================================================
   PERSISTENCE
   ========================================================================== */
/* Services that are always forced to Active regardless of saved state */
const FORCE_ENABLED = new Set(['online-reg']);

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
        const dismissed = JSON.parse(localStorage.getItem(NOTICES_KEY) || '{}');
        SERVICES.forEach(s => {
            const forcedOn = FORCE_ENABLED.has(s.id);
            serviceStates[s.id] = {
                enabled: forcedOn ? true : (saved[s.id]?.enabled ?? true),
                notice: saved[s.id]?.notice !== undefined ? saved[s.id].notice : s.notice,
            };
            dismissedNotices[s.id] = dismissed[s.id] ?? false;
        });
    } catch {
        SERVICES.forEach(s => {
            serviceStates[s.id] = { enabled: true, notice: s.notice };
            dismissedNotices[s.id] = false;
        });
    }
}


function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(serviceStates));
    localStorage.setItem(NOTICES_KEY, JSON.stringify(dismissedNotices));
}

/* ==========================================================================
   SESSION
   ========================================================================== */
function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
}
function setSession(val) {
    if (val) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
}

/* ==========================================================================
   LOGIN GATE
   ========================================================================== */
function initLogin() {
    const gate     = $('#login-gate');
    const dashboard = $('#dashboard');
    const form     = $('#login-form');
    const usernameInput = $('#login-username');
    const passwordInput = $('#login-password');
    const loginBtn  = $('#login-btn');
    const loginError = $('#login-error');
    const togglePw  = $('#toggle-pw');

    if (isLoggedIn()) {
        gate.classList.add('hidden');
        dashboard.classList.remove('hidden');
        return;
    }

    // Toggle password visibility
    togglePw.addEventListener('click', () => {
        const isText = passwordInput.type === 'text';
        passwordInput.type = isText ? 'password' : 'text';
        togglePw.querySelector('i').className = isText ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        loginError.classList.remove('visible');
        loginBtn.classList.add('loading');

        setTimeout(() => {
            const user = usernameInput.value.trim().toLowerCase();
            const pass = passwordInput.value;

            if (user === CREDENTIALS.username && pass === CREDENTIALS.password) {
                setSession(true);
                gate.classList.add('hidden');
                dashboard.classList.remove('hidden');
                showToast('Welcome back, Admin!', 'success');
            } else {
                loginBtn.classList.remove('loading');
                loginError.classList.add('visible');
                passwordInput.value = '';
                passwordInput.focus();
            }
        }, 900);
    });
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */
function logout() {
    setSession(false);
    const gate = $('#login-gate');
    const dashboard = $('#dashboard');
    dashboard.classList.add('hidden');
    gate.classList.remove('hidden');
    $('#login-username').value = '';
    $('#login-password').value = '';
    $('#login-error').classList.remove('visible');
    showToast('You have been logged out.', 'info');
}

/* ==========================================================================
   SIDEBAR MOBILE TOGGLE
   ========================================================================== */
function initSidebar() {
    const sidebar   = $('.db-sidebar');
    const overlay   = $('.db-sidebar-overlay');
    const hamburger = $('.db-hamburger');

    const open = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
    const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };

    hamburger.addEventListener('click', () => sidebar.classList.contains('open') ? close() : open());
    overlay.addEventListener('click', close);

    // Close sidebar on link click (mobile)
    $$('.sidebar-link').forEach(link => link.addEventListener('click', () => {
        if (window.innerWidth <= 860) close();
    }));
}

/* ==========================================================================
   RENDER SERVICE CARDS
   ========================================================================== */
function renderCards() {
    const grid = $('#services-grid');
    grid.innerHTML = '';

    SERVICES.forEach(service => {
        const state   = serviceStates[service.id];
        const enabled = state.enabled;
        const notice  = state.notice;
        const dismissed = dismissedNotices[service.id];
        const hasCost = !!service.cost;

        const card = document.createElement('div');
        card.className = `db-service-card${!enabled ? ' disabled' : ''}`;
        card.dataset.id = service.id;

        card.innerHTML = `
            <div class="db-card-top">
                <div class="db-card-icon-wrap">
                    <i class="${service.icon}"></i>
                </div>
                <div class="db-toggle-wrap">
                    ${FORCE_ENABLED.has(service.id)
                        ? `<span class="db-forced-active" title="This service is permanently active">
                               <i class="fa-solid fa-lock" style="font-size:0.7rem;margin-right:4px;"></i>Active
                           </span>`
                        : `<label class="db-toggle" title="${enabled ? 'Service Active' : 'Service Inactive'}">
                               <input type="checkbox" class="svc-toggle" data-id="${service.id}" ${enabled ? 'checked' : ''}>
                               <span class="db-toggle-slider"></span>
                           </label>
                           <span class="db-toggle-label">${enabled ? 'Active' : 'Off'}</span>`
                    }
                </div>
            </div>

            <div>
                <div class="db-card-name">${service.name}</div>
                <div class="db-card-desc">${service.desc}</div>
            </div>

            ${notice && !dismissed ? `
            <div class="db-card-notice" id="notice-${service.id}">
                <i class="fa-solid fa-triangle-exclamation notice-icon"></i>
                <span>${notice}</span>
                <button class="db-notice-dismiss" data-id="${service.id}" title="Dismiss notice">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>` : ''}

            <div class="db-card-footer">
                <span class="db-cost-badge${!hasCost ? ' invisible' : ''}">${hasCost ? `Unit Cost: ${service.cost}` : '—'}</span>
                <button class="db-check-btn" data-id="${service.id}">
                    <i class="fa-solid fa-arrow-right"></i> Check Service
                </button>
            </div>
        `;

        grid.appendChild(card);
    });

    bindCardEvents();
}

function bindCardEvents() {
    // Toggle enable/disable
    $$('.svc-toggle').forEach(toggle => {
        toggle.addEventListener('change', e => {
            const id = e.target.dataset.id;
            const enabled = e.target.checked;
            serviceStates[id].enabled = enabled;
            saveState();
            const card = $(`.db-service-card[data-id="${id}"]`);
            card.classList.toggle('disabled', !enabled);
            const label = card.querySelector('.db-toggle-label');
            label.textContent = enabled ? 'Active' : 'Off';
            const svc = SERVICES.find(s => s.id === id);
            showToast(`${svc.name} ${enabled ? 'activated' : 'deactivated'}.`, enabled ? 'success' : 'warning');
        });
    });

    // Dismiss notice
    $$('.db-notice-dismiss').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.currentTarget.dataset.id;
            dismissedNotices[id] = true;
            saveState();
            const noticeEl = $(`#notice-${id}`);
            if (noticeEl) noticeEl.classList.add('hidden');
            showToast('Notice dismissed.', 'info');
        });
    });

    // Check Service button → open detail modal
    $$('.db-check-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.currentTarget.dataset.id;
            openDetailModal(id);
        });
    });
}

/* ==========================================================================
   DETAIL MODAL (Check Service)
   ========================================================================== */
function openDetailModal(id) {
    const svc   = SERVICES.find(s => s.id === id);
    const state = serviceStates[id];
    activeDetailId = id;

    $('#detail-icon').className   = svc.icon + ' ';
    $('#detail-name').textContent = svc.name;
    $('#detail-desc').textContent = svc.desc;
    $('#detail-status').textContent = state.enabled ? 'Active' : 'Inactive';
    $('#detail-status').className = state.enabled ? 'db-status-active' : 'db-status-inactive';
    $('#detail-cost').textContent = svc.cost || 'Not specified';
    $('#detail-notice-val').textContent = state.notice && !dismissedNotices[id] ? state.notice : 'None';

    $('#detail-add-notice-btn').textContent = state.notice ? 'Edit Notice' : 'Add Notice';

    $('#detail-modal').classList.add('active');
}

/* ==========================================================================
   NOTICE MODAL (Add / Edit)
   ========================================================================== */
function openNoticeModal(id) {
    noticeTargetId = id;
    const svc = SERVICES.find(s => s.id === id);
    const state = serviceStates[id];

    $('#notice-modal-title').textContent = state.notice ? `Edit Notice — ${svc.name}` : `Add Notice — ${svc.name}`;
    $('#notice-textarea').value = state.notice || '';
    $('#notice-modal').classList.add('active');
    setTimeout(() => $('#notice-textarea').focus(), 200);
}

function saveNotice() {
    const text = $('#notice-textarea').value.trim();
    if (noticeTargetId) {
        serviceStates[noticeTargetId].notice = text || null;
        dismissedNotices[noticeTargetId] = false; // Re-show if re-added
        saveState();
        closeModal('notice-modal');
        renderCards();

        // Re-open detail modal with fresh data
        openDetailModal(noticeTargetId);
        showToast(text ? 'Notice saved.' : 'Notice cleared.', 'success');
    }
}

/* ==========================================================================
   MODAL HELPERS
   ========================================================================== */
function closeModal(id) {
    $('#' + id).classList.remove('active');
}

function initModals() {
    // Detail modal
    $('#detail-modal').addEventListener('click', e => {
        if (e.target === $('#detail-modal')) closeModal('detail-modal');
    });
    $('#detail-modal-close').addEventListener('click', () => closeModal('detail-modal'));

    $('#detail-add-notice-btn').addEventListener('click', () => {
        closeModal('detail-modal');
        openNoticeModal(activeDetailId);
    });

    // Notice modal
    $('#notice-modal').addEventListener('click', e => {
        if (e.target === $('#notice-modal')) closeModal('notice-modal');
    });
    $('#notice-modal-close').addEventListener('click', () => closeModal('notice-modal'));
    $('#notice-modal-cancel').addEventListener('click', () => closeModal('notice-modal'));
    $('#notice-modal-save').addEventListener('click', saveNotice);
}

/* ==========================================================================
   SIDEBAR NAV FILTERING
   ========================================================================== */
function initNavFiltering() {
    $$('.sidebar-link[data-filter]').forEach(link => {
        link.addEventListener('click', () => {
            $$('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const filter = link.dataset.filter;
            filterCards(filter);
            $('#db-page-title').textContent = link.dataset.filter === 'all'
                ? 'All Services'
                : link.querySelector('.link-label').textContent;
        });
    });
}

function filterCards(filter) {
    $$('.db-service-card').forEach(card => {
        const id = card.dataset.id;
        if (filter === 'all' || filter === id) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

/* ==========================================================================
   TOAST
   ========================================================================== */
function showToast(message, type = 'info') {
    const icons = { success: 'fa-circle-check', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const container = $('#db-toasts');
    const toast = document.createElement('div');
    toast.className = `db-toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 350);
    }, 3200);
}

/* ==========================================================================
   LOGOUT BUTTONS
   ========================================================================== */
function initLogoutButtons() {
    $$('.do-logout').forEach(btn => btn.addEventListener('click', logout));
}

/* ==========================================================================
   INIT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initLogin();
    initSidebar();
    initModals();
    initNavFiltering();
    initLogoutButtons();
    renderCards();
});
