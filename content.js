// Global module references for dynamically loaded dependencies
let storage, i18n, AlertToast, SelectionPanel;

// Dynamically import the right adapter based on hostname
async function initAdapter() {
    const hostname = location.hostname;
    let adapterModule;

    try {
        if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
            const { ChatGPTAdapter } = await import(chrome.runtime.getURL('adapters/chatgpt.js'));
            adapterModule = new ChatGPTAdapter();
        } else if (hostname.includes('kimi.com') || hostname.includes('kimi.moonshot.cn')) {
            const { KimiAdapter } = await import(chrome.runtime.getURL('adapters/kimi.js'));
            adapterModule = new KimiAdapter();
        } else if (hostname.includes('chat.deepseek.com') || hostname.includes('deepseek.com')) {
            const { DeepSeekAdapter } = await import(chrome.runtime.getURL('adapters/deepseek.js'));
            adapterModule = new DeepSeekAdapter();
        } else if (hostname.includes('claude.ai')) {
            const { ClaudeAdapter } = await import(chrome.runtime.getURL('adapters/claude.js'));
            adapterModule = new ClaudeAdapter();
        } else if (hostname.includes('gemini.google.com')) {
            const { GeminiAdapter } = await import(chrome.runtime.getURL('adapters/gemini.js'));
            adapterModule = new GeminiAdapter();
        } else {
            console.log(`[BringYourBrain] Site ${hostname} not supported yet.`);
            return null;
        }
    } catch (e) {
        console.error(`[BringYourBrain] Error loading adapter for ${hostname}:`, e);
        return null;
    }
    return adapterModule;
}

async function main() {
    // Dynamically load the core utilities to avoid static import strictness in content scripts
    try {
        const storageModule = await import(chrome.runtime.getURL('utils/storage.js'));
        const i18nModule = await import(chrome.runtime.getURL('utils/i18n.js'));
        const toastModule = await import(chrome.runtime.getURL('components/AlertToast.js'));
        const panelModule = await import(chrome.runtime.getURL('components/SelectionPanel.js'));

        storage = storageModule.storage;
        i18n = i18nModule.i18n;
        AlertToast = toastModule.AlertToast;
        SelectionPanel = panelModule.SelectionPanel;
    } catch (e) {
        console.error('[BringYourBrain] Failed to dynamically load core modules:', e);
        return;
    }

    await storage.init();
    await i18n.init();
    const adapter = await initAdapter();
    if (!adapter) return;

    console.log(`[BringYourBrain] Initialized ${adapter.siteId} adapter.`);

    const observer = new MutationObserver(throttle(() => processDOM(adapter), 200));
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial scan
    requestAnimationFrame(() => processDOM(adapter));
}

function processDOM(adapter) {
    // 1. Process AI Replies to add "Remember" buttons 
    const buildRemenerBtn = function (getInnerText) {
        const btnContainer = document.createElement('div');
        btnContainer.className = 'byb-reply-actions byb-flex byb-justify-end byb-mt-2 byb-mb-4';

        const rememberBtn = adapter.createRememberButton();
        rememberBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Extract text (simplified, real implementation might need to handle specific formats)
            let textToSave = await getInnerText();
            try {
                await storage.addReply(adapter.siteId, textToSave);
                new AlertToast({ message: i18n.t('alertSuccess'), type: 'success' }).show();
            } catch (err) {
                // Handled in storage layer mostly
            }
        });

        btnContainer.appendChild(rememberBtn);
        return btnContainer;
    }

    adapter.insertRememberBtn(buildRemenerBtn)

    // 2. Process Input Box to add Action Bar
    const buildActionBar = function () {
        const actionBar = adapter.createActionBar();

        // Bind selection panel events
        actionBar.querySelector('.byb-phrases-btn').addEventListener('click', async (e) => {
            const phrases = await storage.getPhrases();
            const panel = new SelectionPanel({
                title: i18n.t('commonPhrasesButton'),
                items: phrases.map(p => ({ id: p.id, text: p.text })),
                onSelect: (text) => adapter.insertText(text),
                placeholder: i18n.t('searchPlaceholder') || 'Search phrases...'
            });
            panel.show(e.clientX, e.clientY);
        });

        actionBar.querySelector('.byb-brain-btn').addEventListener('click', async (e) => {
            const brainData = await storage.getReplies();
            const panel = new SelectionPanel({
                title: i18n.t('myBrainButton'),
                items: brainData.map(b => ({ id: b.id, text: b.text, title: b.site })),
                onSelect: (text) => adapter.insertText(text),
                placeholder: i18n.t('searchPlaceholder') || 'Search messages...'
            });
            panel.show(e.clientX, e.clientY);
        });
        return actionBar;
    }
    adapter.insertActionBar(
        buildActionBar
    );
}

// Simple throttle utility
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Global active adapter reference for shortcut handlers
let currentAdapter = null;

// Listen for background scripts sending shotcut events
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "open_panel_brain" && currentAdapter) {
        // Open the brain panel at the center of the screen
        (async () => {
            const brainData = await storage.getReplies();
            const panel = new SelectionPanel({
                title: i18n.t('myBrainButton'),
                items: brainData.map(b => ({ id: b.id, text: b.text, title: b.site })),
                onSelect: (text) => currentAdapter.insertText(text),
                placeholder: i18n.t('searchPlaceholder') || 'Search messages...'
            });
            panel.show(window.innerWidth / 2 - 160, window.innerHeight / 2 - 200);
        })();
    }
});

main().then(adapter => {
    currentAdapter = adapter;
});
