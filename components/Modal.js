import { i18n } from '../utils/i18n.js';

export class Modal {
  constructor(options = {}) {
    this.title = options.title || '';
    this.content = options.content || '';
    this.confirmText = options.confirmText || i18n.t('confirm');
    this.cancelText = options.cancelText || i18n.t('cancel');
    this.overlayEl = null;
  }

  render() {
    return `
      <div class="byb-modal-overlay byb-fixed byb-inset-0 byb-bg-black/50 byb-backdrop-blur-sm byb-z-[9999] byb-flex byb-items-center byb-justify-center byb-opacity-0 byb-transition-opacity byb-duration-200">
        <div class="byb-modal byb-bg-white byb-rounded-2xl byb-shadow-2xl byb-max-w-md byb-w-full byb-mx-4 byb-transform byb-scale-95 byb-transition-transform byb-duration-200 byb-border byb-border-pink-100">
          <div class="byb-flex byb-items-center byb-justify-between byb-p-4 byb-border-b byb-border-pink-100">
            <h3 class="byb-text-lg byb-font-semibold byb-text-gray-900">${this.title}</h3>
            <button class="byb-modal-close byb-p-1.5 byb-text-gray-400 hover:byb-text-pink-500 hover:byb-bg-pink-50 byb-rounded-lg byb-transition-colors">
              <svg class="byb-w-5 byb-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div class="byb-p-4 byb-max-h-96 byb-overflow-y-auto">
            ${this.content}
          </div>
          
          <div class="byb-flex byb-justify-end byb-gap-3 byb-p-4 byb-bg-gray-50 byb-rounded-b-2xl byb-border-t byb-border-pink-100">
            <button class="byb-modal-cancel byb-px-4 byb-py-2 byb-text-sm byb-font-medium byb-text-gray-700 byb-bg-white byb-border byb-border-gray-300 byb-rounded-xl hover:byb-bg-gray-50 byb-transition-colors">${this.cancelText}</button>
            <button class="byb-modal-confirm byb-px-4 byb-py-2 byb-text-sm byb-font-medium byb-text-white byb-bg-pink-500 byb-rounded-xl hover:byb-bg-pink-600 byb-transition-colors byb-shadow-lg byb-shadow-pink-500/30">${this.confirmText}</button>
          </div>
        </div>
      </div>
    `;
  }

  show() {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.innerHTML = this.render().trim();
      const overlay = el.firstElementChild;
      const modal = overlay.querySelector('.byb-modal');
      this.overlayEl = overlay;

      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.classList.remove('byb-opacity-0');
        overlay.classList.add('byb-opacity-100');
        modal.classList.remove('byb-scale-95');
        modal.classList.add('byb-scale-100');
      });

      const closeDialog = (result) => {
        overlay.classList.remove('byb-opacity-100');
        overlay.classList.add('byb-opacity-0');
        modal.classList.remove('byb-scale-100');
        modal.classList.add('byb-scale-95');

        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          resolve(result);
        }, 200);
      };

      overlay.querySelector('.byb-modal-close').addEventListener('click', () => closeDialog(false));
      overlay.querySelector('.byb-modal-cancel').addEventListener('click', () => closeDialog(false));
      overlay.querySelector('.byb-modal-confirm').addEventListener('click', () => {
        closeDialog(true);
      });
    });
  }
}
