import { BaseAdapter } from './base.js';

export class GeminiAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteId = 'gemini';
        this.selectors = {
            // Per pd.markdown: div.model-response
            reply: 'model-response, div.model-response, message-content',
            // Per pd.markdown: textarea[aria-label*="prompt"] or rich-textarea
            input: 'rich-textarea div[contenteditable="true"], textarea[aria-label*="prompt"]'
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
        // Gemini often changes input fields.
        const input = document.querySelector(this.selectors.input);
        return input;
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

        // Check if it's a textarea or contenteditable
        const isTextarea = input.tagName.toLowerCase() === 'textarea';

        if (isTextarea) {
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
        } else {
            // contenteditable
            const success = document.execCommand('insertText', false, text);
            if (!success) {
                const selection = window.getSelection();
                if (!selection.rangeCount) return false;

                const range = selection.getRangeAt(0);
                range.deleteContents();
                const node = document.createTextNode(text);
                range.insertNode(node);

                range.setStartAfter(node);
                range.setEndAfter(node);
                selection.removeAllRanges();
                selection.addRange(range);

                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            }
        }

        return true;
    }
}
