import { BaseAdapter } from './base.js';

export class KimiAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteId = 'kimi';
        this.selectors = {
            // Latest selector per guidelines
            reply: 'div.segment-assistant',
            // Contenteditable area
            input: 'div[contenteditable="true"]',
            inputActionArea: 'div.chat-editor-action .left-area'
        };
    }

    insertRememberBtn(buildRemenerBtn) {
        const replies = document.querySelectorAll(this.selectors.reply);
        replies.forEach(reply => {
            if (!reply.dataset.bybProcessed) {
                const actionContainer = reply.querySelector(".segment-assistant-actions-content")
                const contentBox = reply.querySelector(".segment-content-box")
                if (actionContainer && contentBox) {
                    reply.dataset.bybProcessed = 'true';
                    const btnContainer = buildRemenerBtn(async () => {
                        try {
                            const copyBtn = actionContainer.querySelector('svg[name="Copy"]')?.closest('.icon-button');
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

    insertActionBar(buildActionBar) {
        const actionArea = document.querySelector(this.selectors.inputActionArea);
        const wrapper = actionArea;
        if (wrapper && !wrapper.dataset.bybActionsAdded) {
            wrapper.dataset.bybActionsAdded = 'true';
            wrapper.insertBefore(buildActionBar(), wrapper.lastChild);
        }
    }

    getInputBox() {
        return document.querySelector(this.selectors.input);
    }

    insertText(text) {
        const input = this.getInputBox();
        if (!input) return false;

        input.focus();

        try {
            text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            const pasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: new DataTransfer()
            });

            pasteEvent.clipboardData.setData('text/plain', text);
            pasteEvent.clipboardData.setData('text/html', text.replace(/\n/g, '<br>'));

            input.dispatchEvent(pasteEvent);
            return true;
        } catch (error) {
            console.error('Failed to insert text:', error);
            return this.fallbackInsertText(text);
        }
    }

    fallbackInsertText(text) {
        const input = this.getInputBox();
        if (!input) return false;

        const lines = text.split(/\r?\n/);
        const html = lines.map(line =>
            line ? `<p>${line}</p>` : '<p><br></p>'
        ).join('');

        input.innerHTML = html;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
    }
}
