import { BaseAdapter } from './base.js';

export class ChatGPTAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteId = 'chatgpt';
        this.selectors = {
            reply: 'article[data-turn="assistant"]',
            input: '#prompt-textarea',
        };
    }

    insertRememberBtn(buildRemenerBtn) {
        const replies = document.querySelectorAll(this.selectors.reply);
        replies.forEach(reply => {
            if (!reply.dataset.bybProcessed) {
                const actionContainer = reply.querySelector(".justify-start .items-center")
                const contentBox = reply.querySelector('div[data-message-author-role="assistant"]')
                if (actionContainer && contentBox) {
                    reply.dataset.bybProcessed = 'true';
                    const btnContainer = buildRemenerBtn(async () => {
                        try {
                            const copyBtn = actionContainer.querySelector('button[data-testid="copy-turn-action-button"]');
                            copyBtn?.click();

                            await new Promise(resolve => setTimeout(resolve, 100));

                            const cleanText = await navigator.clipboard.readText();

                            return cleanText || this.extractCleanText(contentBox);

                        } catch (err) {
                            console.warn('剪贴板读取失败，使用备用方案:', err);
                            return this.extractCleanText(contentBox);
                        }
                    });
                    actionContainer.appendChild(btnContainer);
                }
            }
        });
    }

    getInputBox() {
        return document.querySelector(this.selectors.input);
    }

    insertActionBar(buildActionBar) {
        const input = this.getInputBox();
        if (!input) return;
        const wrapper = input.parentElement;
        if (wrapper && !wrapper.dataset.bybActionsAdded) {
            wrapper.dataset.bybActionsAdded = 'true';
            wrapper.appendChild(buildActionBar());
        }
    }

    insertText(text) {
        const input = this.getInputBox();
        if (!input) return false;

        input.focus();

        try {
            // Simulator paste for contenteditable
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', text);

            const event = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: dataTransfer
            });

            input.dispatchEvent(event);

            // Also trigger a generic input event and keyboard wake-up
            this.triggerInputEvents(input);

            return true;
        } catch (e) {
            console.error('ChatGPT insert error:', e);
            // Fallback to execCommand or manual insert
            const success = document.execCommand('insertText', false, text);
            if (!success) {
                return this.manualInsertHtml(input, text);
            }
            return success;
        }
    }
}
