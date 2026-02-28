import { storage, STORAGE_KEYS } from './utils/storage.js';
import { i18n } from './utils/i18n.js';
import { ConfirmDialog, Modal, AlertToast } from './components/index.js';

let phrasesList = [];
let brainList = [];

async function initPopup() {
    await storage.init();
    await i18n.init();

    // Basic Localization
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerText = i18n.t(key);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const parts = el.getAttribute('data-i18n-attr').split('|');
        if (parts.length === 2) {
            el.setAttribute(parts[0], i18n.t(parts[1]));
        }
    });

    // Language Select Setup
    const langSelect = document.getElementById('lang-select');
    const { userLanguage = 'auto' } = await chrome.storage.local.get('userLanguage');
    langSelect.value = userLanguage;

    langSelect.addEventListener('change', async (e) => {
        await chrome.storage.local.set({ userLanguage: e.target.value });
        location.reload();
    });

    // Sync mode toggle rendering
    const btnLocal = document.getElementById('btn-sync-local');
    const btnCloud = document.getElementById('btn-sync-cloud');

    if (storage.mode === 'local') {
        btnLocal.classList.add('byb-bg-white', 'byb-shadow-sm', 'byb-text-pink-600');
    } else {
        btnCloud.classList.add('byb-bg-white', 'byb-shadow-sm', 'byb-text-pink-600');
    }

    btnLocal.addEventListener('click', async () => {
        await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_MODE]: 'local' });
        location.reload();
    });

    btnCloud.addEventListener('click', async () => {
        await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_MODE]: 'sync' });
        location.reload();
    });

    // Setup routing
    document.getElementById('btn-back').addEventListener('click', () => switchView('view-home'));
    document.getElementById('btn-manage-phrases').addEventListener('click', () => switchView('view-phrases'));
    document.getElementById('btn-manage-brain').addEventListener('click', () => switchView('view-brain'));

    // Phrases Setup
    document.getElementById('btn-add-phrase').addEventListener('click', async () => {
        const modal = new Modal({
            title: i18n.t('addPhrase'),
            content: '<textarea id="new-phrase-text" class="byb-w-full byb-h-24 byb-p-2 byb-border byb-border-gray-300 byb-rounded-lg focus:byb-ring-1 focus:byb-ring-pink-500 focus:byb-outline-none byb-text-sm" placeholder="Enter phrase..."></textarea>',
            confirmText: i18n.t('confirm')
        });
        const confirmed = await modal.show();
        if (confirmed && modal.overlayEl) {
            const text = modal.overlayEl.querySelector('#new-phrase-text').value.trim();
            if (text) {
                await storage.addPhrase(text);
                new AlertToast({ message: i18n.t('alertSuccess'), type: 'success' }).show();
                await loadData();
            }
        }
    });

    document.getElementById('search-phrases').addEventListener('input', (e) => {
        renderPhrases(e.target.value);
    });

    document.getElementById('search-brain').addEventListener('input', (e) => {
        renderBrain(e.target.value);
    });

    // Delete All Functionality
    document.getElementById('btn-delete-all-phrases').addEventListener('click', async () => {
        if (phrasesList.length === 0) return;
        const confirmed = await new ConfirmDialog({
            title: i18n.t('confirmTitle'),
            message: i18n.t('deleteAllConfirm'),
            confirmText: i18n.t('deleteAll'),
            cancelText: i18n.t('cancel'),
            type: 'danger'
        }).show();
        if (confirmed) {
            // Delete sequentially to ensure sync storage triggers
            for (let p of phrasesList) {
                await storage.deletePhrase(p.id);
            }
            new AlertToast({ message: i18n.t('alertSuccess'), type: 'success' }).show();
            await loadData();
        }
    });

    document.getElementById('btn-delete-all-brain').addEventListener('click', async () => {
        if (brainList.length === 0) return;
        const confirmed = await new ConfirmDialog({
            title: i18n.t('confirmTitle'),
            message: i18n.t('deleteAllConfirm'),
            confirmText: i18n.t('deleteAll'),
            cancelText: i18n.t('cancel'),
            type: 'danger'
        }).show();
        if (confirmed) {
            for (let b of brainList) {
                await storage.deleteReply(b.id);
            }
            new AlertToast({ message: i18n.t('alertSuccess'), type: 'success' }).show();
            await loadData();
        }
    });

    // Initial Load
    await loadData();
}

async function loadData() {
    phrasesList = await storage.getPhrases();
    brainList = await storage.getReplies();

    document.getElementById('stat-phrases').innerText = phrasesList.length;
    document.getElementById('stat-brain').innerText = brainList.length;

    renderPhrases();
    renderBrain();
}

function switchView(viewId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    // Toggle header icons based on view
    const btnBack = document.getElementById('btn-back');
    const logoIcon = document.getElementById('logo-icon');

    if (viewId === 'view-home') {
        btnBack.style.display = 'none';
        logoIcon.style.display = 'none';
    } else {
        btnBack.style.display = 'flex';
        logoIcon.style.display = 'flex';
    }
}

function renderPhrases(filter = '') {
    const container = document.getElementById('list-phrases');
    container.innerHTML = '';

    const filtered = phrasesList.filter(p => (p.text || '').toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        container.innerHTML = `<div class="byb-text-sm byb-text-gray-400 byb-text-center byb-py-4">${i18n.t('noResults')}</div>`;
        return;
    }

    filtered.forEach(p => {
        const el = document.createElement('div');
        el.className = 'byb-group byb-flex byb-items-center byb-justify-between byb-p-3 byb-bg-white hover:byb-bg-pink-50 byb-rounded-xl byb-shadow-sm byb-border byb-border-gray-100 byb-transition-colors';
        el.innerHTML = `
      <span class="byb-text-sm byb-text-gray-700 byb-line-clamp-2 title-text byb-flex-1 byb-pr-2">${escapeHtml(p.text)}</span>
      <div class="byb-flex byb-gap-1 byb-shrink-0 byb-opacity-0 group-hover:byb-opacity-100 byb-transition-all">
        <button class="copy-btn byb-p-1.5 byb-text-gray-400 hover:byb-text-pink-500 hover:byb-bg-pink-100 byb-rounded-lg byb-transition-colors" title="${i18n.t('copy')}">
          <svg class="byb-w-4 byb-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </button>
        <button class="delete-btn byb-p-1.5 byb-text-pink-400 hover:byb-text-red-500 hover:byb-bg-pink-100 byb-rounded-lg byb-transition-colors" title="${i18n.t('delete')}">
          <svg class="byb-w-4 byb-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    `;

        el.querySelector('.copy-btn').addEventListener('click', async () => {
            await navigator.clipboard.writeText(p.text);
            new AlertToast({ message: i18n.t('copySuccess'), type: 'success', duration: 2000 }).show();
        });

        el.querySelector('.delete-btn').addEventListener('click', async () => {
            const confirmed = await new ConfirmDialog({
                title: i18n.t('confirmTitle'),
                message: i18n.t('confirmDelete'),
                confirmText: i18n.t('delete'),
                cancelText: i18n.t('cancel'),
                type: 'danger'
            }).show();

            if (confirmed) {
                await storage.deletePhrase(p.id);
                new AlertToast({ message: i18n.t('alertSuccess'), type: 'success' }).show();
                await loadData();
            }
        });

        container.appendChild(el);
    });
}

function renderBrain(filter = '') {
    const container = document.getElementById('list-brain');
    container.innerHTML = '';

    const filtered = brainList.filter(b =>
        (b.title || '').toLowerCase().includes(filter.toLowerCase()) ||
        (b.text || '').toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = `<div class="byb-text-sm byb-text-gray-400 byb-text-center byb-py-4">${i18n.t('noResults')}</div>`;
        return;
    }

    filtered.forEach(b => {
        const el = document.createElement('div');
        el.className = 'byb-group byb-p-3 byb-bg-white hover:byb-bg-pink-50 byb-rounded-xl byb-shadow-sm byb-border byb-border-gray-100 byb-transition-colors byb-relative';

        const date = new Date(b.timestamp).toLocaleDateString();

        el.innerHTML = `
      <div class="byb-flex byb-justify-between byb-items-center byb-mb-1">
        <span class="byb-text-xs byb-font-semibold byb-text-pink-600 byb-bg-pink-100 byb-px-1.5 byb-py-0.5 byb-rounded byb-capitalize">${b.site}</span>
        <span class="byb-text-xs byb-text-gray-400">${date}</span>
      </div>
      <p class="byb-text-sm byb-text-gray-700 byb-line-clamp-3 byb-mb-1 byb-pr-12">${escapeHtml(b.text)}</p>
      
      <div class="byb-absolute byb-bottom-3 byb-right-3 byb-flex byb-gap-1 byb-opacity-0 group-hover:byb-opacity-100 byb-transition-all">
        <button class="copy-btn byb-p-1.5 byb-text-gray-400 hover:byb-text-pink-500 hover:byb-bg-pink-100 byb-rounded-lg byb-transition-colors" title="${i18n.t('copy')}">
          <svg class="byb-w-4 byb-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </button>
        <button class="delete-btn byb-p-1.5 byb-text-pink-400 hover:byb-text-red-500 hover:byb-bg-pink-100 byb-rounded-lg byb-transition-colors" title="${i18n.t('delete')}">
          <svg class="byb-w-4 byb-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    `;

        el.querySelector('.copy-btn').addEventListener('click', async () => {
            await navigator.clipboard.writeText(b.text);
            new AlertToast({ message: i18n.t('copySuccess'), type: 'success', duration: 2000 }).show();
        });

        el.querySelector('.delete-btn').addEventListener('click', async () => {
            const confirmed = await new ConfirmDialog({
                title: i18n.t('confirmTitle'),
                message: i18n.t('confirmDelete'),
                confirmText: i18n.t('delete'),
                cancelText: i18n.t('cancel'),
                type: 'danger'
            }).show();

            if (confirmed) {
                await storage.deleteReply(b.id);
                new AlertToast({ message: i18n.t('alertSuccess'), type: 'success' }).show();
                await loadData();
            }
        });

        container.appendChild(el);
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', initPopup);
