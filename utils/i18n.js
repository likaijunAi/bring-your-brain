export class I18n {
    constructor() {
        this.currentLang = 'en';
        this.messages = null;
    }

    async init() {
        // 1. Get from storage
        const result = await chrome.storage.local.get(['userLanguage']);
        const lang = result.userLanguage;

        if (lang && lang !== 'auto') {
            this.currentLang = lang;
        } else {
            // 2. Auto detect
            const uiLang = chrome.i18n.getUILanguage();
            this.currentLang = uiLang.startsWith('zh') ? 'zh_CN' : 'en';
        }

        try {
            const url = chrome.runtime.getURL(`_locales/${this.currentLang}/messages.json`);
            const response = await fetch(url);
            if (!response.ok) throw new Error("Could not fetch locales");
            this.messages = await response.json();
        } catch (e) {
            console.error('[BringYourBrain] i18n load error:', e);
            this.messages = {};
        }
    }

    t(key, ...substitutions) {
        if (!this.messages) {
            console.warn('[BringYourBrain] i18n not initialized calling', key);
            return key; // Not initialized yet
        }

        const msgObj = this.messages[key];
        if (!msgObj || !msgObj.message) return key;

        let text = msgObj.message;
        substitutions.forEach((sub, i) => {
            text = text.replace(`$${i + 1}`, sub);
        });
        return text;
    }
}

export const i18n = new I18n();
