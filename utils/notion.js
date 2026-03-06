import { storage, STORAGE_KEYS } from './storage.js';
import { AlertToast } from '../components/AlertToast.js';

export class NotionManager {
    constructor() {
        this.redirectUri = chrome.identity?.getRedirectURL ? chrome.identity.getRedirectURL() : '';
    }

    async getDatabases(token) {
        try {
            console.log('[BringYourBrain] Notion: Fetching databases...');
            const response = await fetch('https://api.notion.com/v1/search', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                body: JSON.stringify({
                    filter: { property: 'object', value: 'database' }
                })
            });

            const data = await response.json();
            const databases = data.results || [];
            console.log(`[BringYourBrain] Notion: Found ${databases.length} databases`);
            return databases;
        } catch (e) {
            console.error('[BringYourBrain] Notion: Fetch Databases Error:', e);
            return [];
        }
    }

    async getDatabaseSchema(token, databaseId) {
        try {
            const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Notion-Version': '2022-06-28'
                }
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.properties;
        } catch (e) {
            console.error('[BringYourBrain] Notion: Fetch Schema Error:', e);
            return null;
        }
    }

    async saveReply(reply) {
        const token = (await storage.get([STORAGE_KEYS.NOTION_ACCESS_TOKEN]))[STORAGE_KEYS.NOTION_ACCESS_TOKEN];
        const databaseId = (await storage.get([STORAGE_KEYS.NOTION_DATABASE_ID]))[STORAGE_KEYS.NOTION_DATABASE_ID];

        if (!token || !databaseId) {
            console.warn('[BringYourBrain] Notion: Missing token or database ID skipping sync');
            return;
        }

        try {
            console.log(`[BringYourBrain] Notion: Saving reply "${reply.title}" to database ${databaseId}...`);

            // Fetch schema to map properties dynamically
            const schema = await this.getDatabaseSchema(token, databaseId);
            const props = {};

            if (schema) {
                // 1. Find the title property (required)
                const titleProp = Object.entries(schema).find(([_, p]) => p.type === 'title');
                if (titleProp) {
                    props[titleProp[0]] = {
                        title: [{ text: { content: reply.title || 'AI Reply' } }]
                    };
                }

                // 2. Map optional properties if they exist
                if (schema['Source'] && schema['Source'].type === 'select') {
                    props['Source'] = { select: { name: reply.cite || 'Unknown' } };
                }
                if (schema['Date'] && schema['Date'].type === 'date') {
                    props['Date'] = { date: { start: new Date(reply.timestamp).toISOString() } };
                }
            } else {
                // Fallback for unexpected failures getting schema
                props['Title'] = { title: [{ text: { content: reply.title || 'AI Reply' } }] };
            }

            const blocks = this.markdownToBlocks(reply.text);
            console.log(`[BringYourBrain] Notion: Converted to ${blocks.length} blocks`);

            const response = await fetch('https://api.notion.com/v1/pages', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                body: JSON.stringify({
                    parent: { database_id: databaseId },
                    properties: props,
                    children: blocks
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('[BringYourBrain] Notion: Save failed', error);
                throw new Error(error.message || 'Failed to save to Notion');
            }

            const result = await response.json();
            console.log('[BringYourBrain] Notion: Saved successfully!', result);
            return result;
        } catch (e) {
            console.error('[BringYourBrain] Notion: Save Error:', e);
            if (typeof document !== 'undefined') {
                new AlertToast({ message: 'Notion Sync Error: ' + e.message, type: 'warning' }).show();
            }
            throw e;
        }
    }

    markdownToBlocks(markdown) {
        const lines = markdown.split('\n');
        const blocks = [];
        let codeBlock = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code block handling
            if (line.startsWith('```')) {
                if (codeBlock) {
                    blocks.push(codeBlock);
                    codeBlock = null;
                } else {
                    const language = line.slice(3).trim() || 'plain text';
                    codeBlock = {
                        object: 'block',
                        type: 'code',
                        code: {
                            rich_text: [],
                            language: language
                        }
                    };
                }
                continue;
            }

            if (codeBlock) {
                codeBlock.code.rich_text.push({
                    type: 'text',
                    text: { content: line + (i === lines.length - 1 ? '' : '\n') }
                });
                continue;
            }

            // Headings
            const h3Match = line.match(/^###\s+(.*)/);
            if (h3Match) {
                blocks.push({
                    object: 'block',
                    type: 'heading_3',
                    heading_3: { rich_text: [{ text: { content: h3Match[1] } }] }
                });
                continue;
            }

            const h2Match = line.match(/^##\s+(.*)/);
            if (h2Match) {
                blocks.push({
                    object: 'block',
                    type: 'heading_2',
                    heading_2: { rich_text: [{ text: { content: h2Match[1] } }] }
                });
                continue;
            }

            const h1Match = line.match(/^#\s+(.*)/);
            if (h1Match) {
                blocks.push({
                    object: 'block',
                    type: 'heading_1',
                    heading_1: { rich_text: [{ text: { content: h1Match[1] } }] }
                });
                continue;
            }

            // Bulleted lists
            const bulletMatch = line.match(/^[\-\*]\s+(.*)/);
            if (bulletMatch) {
                blocks.push({
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: { rich_text: [{ text: { content: bulletMatch[1] } }] }
                });
                continue;
            }

            // Numbered lists
            const numberMatch = line.match(/^\d+\.\s+(.*)/);
            if (numberMatch) {
                blocks.push({
                    object: 'block',
                    type: 'numbered_list_item',
                    numbered_list_item: { rich_text: [{ text: { content: numberMatch[1] } }] }
                });
                continue;
            }

            // Paragraph/Empty line
            if (line.trim() === '') continue;

            blocks.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{ text: { content: line } }]
                }
            });
        }

        // Close unclosed code blocks
        if (codeBlock) blocks.push(codeBlock);

        // Max 100 blocks per request in Notion API for children
        return blocks.slice(0, 100);
    }
}

export const notion = new NotionManager();
