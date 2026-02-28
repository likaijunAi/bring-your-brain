import { AlertToast } from '../components/AlertToast.js';
import { i18n } from './i18n.js';

export const STORAGE_KEYS = {
    SYNC_MODE: 'syncMode',      // 'local' | 'sync'
    LANGUAGE: 'userLanguage',   // 'auto' | 'zh_CN' | 'en'
    REPLIES: 'replies',
    PHRASES: 'commonPhrases'
};

export class StorageManager {
    constructor() {
        this.mode = 'local';
        // Max sync size is 100kb, recommend 80kb limit. We'll use 80 * 1024 bytes
        this.SYNC_LIMIT = 81920;
    }

    async init() {
        // Determine sync mode
        const res = await chrome.storage.local.get([STORAGE_KEYS.SYNC_MODE]);
        this.mode = res[STORAGE_KEYS.SYNC_MODE] || 'local';
    }

    get storage() {
        return this.mode === 'sync' ? chrome.storage.sync : chrome.storage.local;
    }

    async get(keys) {
        try {
            return await this.storage.get(keys);
        } catch (e) {
            console.error('[BringYourBrain] Storage get error:', e);
            return Array.isArray(keys) ? {} : { [keys]: undefined };
        }
    }

    async set(items) {
        try {
            if (this.mode === 'sync') {
                const currentData = await this.storage.get(null);
                const newData = { ...currentData, ...items };
                const estimatedSize = new Blob([JSON.stringify(newData)]).size;

                if (estimatedSize > this.SYNC_LIMIT) {
                    new AlertToast({
                        message: i18n.t('alertError') + " (Sync limit reached)",
                        type: 'warning',
                        duration: 5000
                    }).show();
                    throw new Error("Quota exceeded");
                }
            }
            return await this.storage.set(items);
        } catch (e) {
            console.error('[BringYourBrain] Storage set error:', e);
            new AlertToast({
                message: i18n.t('alertError'),
                type: 'error'
            }).show();
            throw e;
        }
    }

    // Helpers for specific data
    async getReplies() {
        const data = await this.get([STORAGE_KEYS.REPLIES]);
        return data[STORAGE_KEYS.REPLIES] || [];
    }

    async addReply(site, rawText) {
        // Truncate to 5000 chars
        const text = rawText.substring(0, 5000);
        const title = text.substring(0, 60).replace(/\n/g, ' ') + (text.length > 60 ? '...' : '');

        const reply = {
            id: 'r' + Date.now(),
            site,
            text,
            timestamp: Date.now(),
            title
        };

        const replies = await this.getReplies();
        replies.unshift(reply); // Add to beginning (newest first)
        await this.set({ [STORAGE_KEYS.REPLIES]: replies });
        return reply;
    }

    async deleteReply(id) {
        let replies = await this.getReplies();
        replies = replies.filter(r => r.id !== id);
        await this.set({ [STORAGE_KEYS.REPLIES]: replies });
    }

    async getPhrases() {
        const data = await this.get([STORAGE_KEYS.PHRASES]);
        return data[STORAGE_KEYS.PHRASES] || [];
    }

    async addPhrase(text) {
        const phrase = {
            id: Date.now(), // Generate ID
            text,
            created: Date.now()
        };

        const phrases = await this.getPhrases();
        phrases.unshift(phrase);
        await this.set({ [STORAGE_KEYS.PHRASES]: phrases });
        return phrase;
    }

    async deletePhrase(id) {
        let phrases = await this.getPhrases();
        phrases = phrases.filter(p => p.id !== id);
        await this.set({ [STORAGE_KEYS.PHRASES]: phrases });
    }
}

export const storage = new StorageManager();
