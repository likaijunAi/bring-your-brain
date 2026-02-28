import { BaseAdapter } from './base.js';

export class ClaudeAdapter extends BaseAdapter {
    constructor() {
        super();
        this.siteId = 'claude';
        this.selectors = {
            // Claude conversational turn logic based on pd.markdown
            reply: 'div[data-testid^="conversation-turn-"] .font-claude-message, div[data-testid^="conversation-turn-"] .prose', // Fallbacks since Claude updates often
            // Claude is contenteditable now based on Phase 2 plan / generic knowledge
            input: 'div[contenteditable="true"]'
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

        input.focus();

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

        return true;
    }
}
