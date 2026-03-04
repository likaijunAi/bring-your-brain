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
            // Always treat REPLIES as local even if global mode is sync
            if (keys === STORAGE_KEYS.REPLIES || (Array.isArray(keys) && keys.includes(STORAGE_KEYS.REPLIES))) {
                const localData = await chrome.storage.local.get(keys);
                if (this.mode === 'sync') {
                    const syncKeys = Array.isArray(keys) ? keys.filter(k => k !== STORAGE_KEYS.REPLIES) : null;
                    if (syncKeys && syncKeys.length > 0) {
                        const syncData = await chrome.storage.sync.get(syncKeys);
                        return { ...localData, ...syncData };
                    }
                    if (!syncKeys && keys !== STORAGE_KEYS.REPLIES) {
                        // Should not happen with current keys but for completeness
                        const syncData = await chrome.storage.sync.get(keys);
                        return { ...localData, ...syncData };
                    }
                }
                return localData;
            }
            return await this.storage.get(keys);
        } catch (e) {
            console.error('[BringYourBrain] Storage get error:', e);
            return Array.isArray(keys) ? {} : { [keys]: undefined };
        }
    }

    async set(items) {
        try {
            const localItems = {};
            const syncItems = {};

            for (const key in items) {
                if (key === STORAGE_KEYS.REPLIES) {
                    localItems[key] = items[key];
                } else {
                    if (this.mode === 'sync') {
                        syncItems[key] = items[key];
                    } else {
                        localItems[key] = items[key];
                    }
                }
            }

            const promises = [];
            if (Object.keys(localItems).length > 0) {
                promises.push(chrome.storage.local.set(localItems));
            }

            if (Object.keys(syncItems).length > 0) {
                // Check quota for sync items (8KB per item limit)
                for (const key in syncItems) {
                    const valueStr = JSON.stringify(syncItems[key]);
                    const size = new Blob([valueStr]).size;
                    if (size > 8000) { // Safety margin before 8192
                        new AlertToast({
                            message: `${i18n.t('alertError')} (Item "${key}" too large for sync: ${Math.round(size / 1024)}KB)`,
                            type: 'warning',
                            duration: 5000
                        }).show();
                        throw new Error(`Quota exceeded for item: ${key}`);
                    }
                }
                promises.push(chrome.storage.sync.set(syncItems));
            }

            return await Promise.all(promises);
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
        // Force local for replies
        const data = await chrome.storage.local.get([STORAGE_KEYS.REPLIES]);
        return data[STORAGE_KEYS.REPLIES] || [];
    }

    async addReply(site, rawText) {
        // Truncate to 5000 chars to be safe even for local storage
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
        replies.unshift(reply);
        await chrome.storage.local.set({ [STORAGE_KEYS.REPLIES]: replies });
        return reply;
    }

    async deleteReply(id) {
        let replies = await this.getReplies();
        replies = replies.filter(r => r.id !== id);
        await chrome.storage.local.set({ [STORAGE_KEYS.REPLIES]: replies });
    }

    async getPhrases() {
        const data = await this.get([STORAGE_KEYS.PHRASES]);
        return data[STORAGE_KEYS.PHRASES] || [];
    }

    async addPhrase(text) {
        const phrase = {
            id: Date.now(),
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
