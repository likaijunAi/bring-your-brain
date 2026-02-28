import { BaseAdapter } from './base.js';

export class ChatGPTAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteId = 'chatgpt';
        this.selectors = {
            reply: 'div[data-message-author-role="assistant"]',
            input: 'textarea#prompt-textarea'
        };
    }

    insertRememberBtn(buildRemenerBtn) {
        const replies = document.querySelectorAll(this.selectors.reply);
        replies.forEach(reply => {
            if (!reply.dataset.bybProcessed) {
                reply.dataset.bybProcessed = 'true';
                const btnContainer = buildRemenerBtn(() => reply.innerText);
                reply.appendChild(btnContainer);
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

        // Focus first
        input.focus();

        // Strategy 1: document.execCommand (best for React if still active)
        const success = document.execCommand('insertText', false, text);

        // Strategy 2: If execCommand fails, manually mock React event
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
