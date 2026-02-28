import { BaseAdapter } from './base.js';

export class DeepSeekAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteId = 'deepseek';
        this.selectors = {
            // Per pd.markdown: div.ds-markdown
            reply: 'div[style*="--assistant-last-margin-bottom: 32px"]',
            // Per pd.markdown: textarea#chat-input
            input: 'textarea.ds-scroll-area',
            inputActionArea: 'div.ds-atom-button'
        };
    }

    insertRememberBtn(buildRemenerBtn) {
        const replies = document.querySelectorAll(this.selectors.reply);
        replies.forEach(reply => {
            if (!reply.dataset.bybProcessed) {
                const actionContainer = reply.querySelector(".ds-icon-button")?.parentElement;
                const contentBox = reply.querySelector(".ds-markdown")
                if (actionContainer && contentBox) {
                    reply.dataset.bybProcessed = 'true';
                    const btnContainer = buildRemenerBtn(async () => {
                        try {
                            const copyBtn = actionContainer.querySelectorAll('.ds-icon-button')[0];
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
        const actionArea = document.querySelector(this.selectors.inputActionArea);
        if (!actionArea) return;
        const wrapper = actionArea.parentElement;
        if (wrapper && !wrapper.dataset.bybActionsAdded) {
            wrapper.dataset.bybActionsAdded = 'true';
            wrapper.insertBefore(buildActionBar(), wrapper.lastChild);
        }
    }

    insertText(text) {
        const input = this.getInputBox();
        if (!input) return false;

        input.focus();

        // Standard textarea insertion
        const success = document.execCommand('insertText', false, text);

        if (!success) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const val = input.value;

            nativeInputValueSetter.call(input, val.substring(0, start) + text + val.substring(end));
            input.selectionStart = input.selectionEnd = start + text.length;

            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        }

        return true;
    }
}
