import { BaseAdapter } from './base.js';

export class QwenAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteId = 'qwen';
        this.selectors = {
            reply: '.qwen-chat-message-assistant',
            input: '.message-input-textarea',
            actionContainer: '.qwen-chat-package-comp-new-action-control-icons',
            contentBox: '.response-message-content',
            inputArea: '.message-input-container-area'
        };
    }

    insertRememberBtn(buildRemenerBtn) {
        const replies = document.querySelectorAll(this.selectors.reply);
        replies.forEach(reply => {
            if (!reply.dataset.bybProcessed) {
                const actionContainer = reply.querySelector(this.selectors.actionContainer);
                const contentBox = reply.querySelector(this.selectors.contentBox);

                const copyBtn = actionContainer.querySelector('.qwen-chat-package-comp-new-action-control-container-copy');

                if (actionContainer && contentBox && copyBtn) {
                    reply.dataset.bybProcessed = 'true';
                    const btnContainer = buildRemenerBtn(async () => {
                        try {
                            copyBtn?.click();

                            await new Promise(resolve => setTimeout(resolve, 100));

                            const cleanText = await navigator.clipboard.readText();
                            return cleanText || this.extractCleanText(contentBox);
                        } catch (err) {
                            console.warn('[QwenAdapter] Clipboard read failed, using fallback:', err);
                            return this.extractCleanText(contentBox);
                        }
                    });

                    // Inject into the action control icons list
                    actionContainer.appendChild(btnContainer);

                    // Style fix for the injected container to match Qwen's flex layout if needed
                    btnContainer.classList.remove('byb-mt-2', 'byb-mb-4');
                    btnContainer.classList.add('byb-mt-0', 'byb-mb-0', 'byb-inline-flex');
                }
            }
        });
    }

    getInputBox() {
        return document.querySelector(this.selectors.input);
    }

    insertActionBar(buildActionBar) {
        const input = document.querySelector(this.selectors.inputArea).querySelector(".message-input-right-button");
        const wrapper = input;
        if (wrapper && !wrapper.dataset.bybActionsAdded) {
            wrapper.dataset.bybActionsAdded = 'true';
            wrapper.prepend(buildActionBar());
        }
    }

    insertText(text) {
        const input = this.getInputBox();
        if (!input) return false;

        input.focus();

        // Standard textarea insertion
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        input.value = value.substring(0, start) + text + value.substring(end);
        input.selectionStart = input.selectionEnd = start + text.length;

        // Trigger events to wake up the "Send" button
        this.triggerInputEvents(input);

        // Auto-resize for Qwen's textarea if it uses a dynamic height
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';

        return true;
    }
}
