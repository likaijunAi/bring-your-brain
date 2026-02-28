import { i18n } from '../utils/i18n.js';

export class BaseAdapter {
    constructor() {
        this.siteId = '';
        this.selectors = {};
    }



    getInputBox() {
        throw new Error('必须实现 getInputBox');
    }

    insertRememberBtn(buildRemenerBtn) {
        throw new Error('必须实现 insertRememberBtn');
    }

    insertActionBar(buildActionBar) {
        throw new Error('必须实现 insertActionBar');
    }

    insertText(text) {
        throw new Error('必须实现 insertText');
    }

    init() { }

    createRememberButton() {
        const btn = document.createElement('button');
        btn.className = 'byb-remember-btn byb-flex byb-items-center byb-gap-1.5 byb-px-3 byb-py-1.5 byb-bg-pink-500 hover:byb-bg-pink-600 byb-text-white byb-text-xs byb-font-medium byb-rounded-full byb-transition-all byb-duration-200 byb-shadow-lg byb-shadow-pink-500/30 hover:byb-shadow-pink-500/50 active:byb-scale-95';
        btn.innerHTML = `
      <svg class="byb-w-3.5 byb-h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
      </svg>
      <span>${i18n.t('rememberButton')}</span>
    `;
        return btn;
    }

    createActionBar() {
        const bar = document.createElement('div');
        bar.className = 'byb-action-bar byb-flex byb-items-center byb-gap-2 byb-mt-2';

        // Common Phrases Button
        const phrasesBtn = document.createElement('button');
        phrasesBtn.className = 'byb-phrases-btn byb-flex byb-items-center byb-gap-1.5 byb-px-3 byb-py-1.5 byb-bg-pink-100 hover:byb-bg-pink-200 byb-text-xs byb-font-medium byb-rounded-lg byb-border byb-border-pink-200 byb-transition-all byb-duration-200 active:byb-scale-95';
        phrasesBtn.innerHTML = `
      <svg class="byb-w-3.5 byb-h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      <span>${i18n.t('commonPhrasesButton')}</span>
      <svg class="byb-w-3 byb-h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    `;

        // My Brain Button
        const brainBtn = document.createElement('button');
        brainBtn.className = 'byb-brain-btn byb-flex byb-items-center byb-gap-1.5 byb-px-3 byb-py-1.5 byb-bg-pink-100 hover:byb-bg-pink-200 byb-text-xs byb-font-medium byb-rounded-lg byb-border byb-border-pink-200 byb-transition-all byb-duration-200 active:byb-scale-95';
        brainBtn.innerHTML = `
      <svg class="byb-w-3.5 byb-h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
      <span>${i18n.t('myBrainButton')}</span>
      <svg class="byb-w-3 byb-h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    `;

        bar.appendChild(phrasesBtn);
        bar.appendChild(brainBtn);
        return bar;
    }

    extractCleanText(element) {
        const clone = element.cloneNode(true);

        clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
        clone.querySelectorAll('p').forEach(p => {
            p.appendChild(document.createTextNode('\n'));
        });

        let text = clone.innerText || clone.textContent;

        return text
            .replace(/\n\s*\n/g, '\n\n')
            .replace(/^\s+|\s+$/g, '');
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    formatTextToHtml(text) {
        const paragraphs = text.split('\n').map(line => {
            const escaped = this.escapeHtml(line);
            return line.trim() === '' ? '<p><br></p>' : `<p>${escaped}</p>`;
        });

        return paragraphs.join('');
    }

    // 触发事件唤醒发送按钮
    triggerInputEvents(input) {
        // Input 事件（必须 bubbles）
        input.dispatchEvent(new Event('input', { bubbles: true }));

        // React/Vue 可能需要 composition 事件
        input.dispatchEvent(new Event('compositionstart', { bubbles: true }));
        input.dispatchEvent(new Event('compositionend', { bubbles: true }));

        // 键盘事件触发按钮状态更新
        ['keydown', 'keypress', 'keyup'].forEach(type => {
            input.dispatchEvent(new KeyboardEvent(type, {
                bubbles: true,
                cancelable: true,
                key: ' ',
                code: 'Space',
                keyCode: 32
            }));
        });
    }

    // 手动插入（execCommand 失败时使用）
    manualInsertHtml(input, text) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return false;

        const range = selection.getRangeAt(0);

        // 删除当前选区
        range.deleteContents();

        // 创建文档片段
        const fragment = document.createDocumentFragment();

        const lines = text.split('\n');
        lines.forEach((line, index) => {
            // 创建 <p> 元素
            const p = document.createElement('p');

            if (line.trim() === '') {
                // 空行：<p><br></p>
                p.appendChild(document.createElement('br'));
            } else {
                // 有内容的行
                p.textContent = line;
            }

            fragment.appendChild(p);
        });

        // 插入片段
        range.insertNode(fragment);

        // 移动光标到末尾
        const lastP = fragment.lastChild;
        if (lastP) {
            range.setStartAfter(lastP);
            range.setEndAfter(lastP);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        return true;
    }
}
