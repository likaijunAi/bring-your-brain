export class ConfirmDialog {
  constructor(options = {}) {
    this.title = options.title || '确认';
    this.message = options.message || '';
    this.confirmText = options.confirmText || '确认';
    this.cancelText = options.cancelText || '取消';
    this.type = options.type || 'primary'; // primary or danger
  }

  render() {
    const confirmBtnClass = this.type === 'danger' ? 'byb-bg-red-500 hover:byb-bg-red-600 byb-shadow-red-500/30' : 'byb-bg-pink-500 hover:byb-bg-pink-600 byb-shadow-pink-500/30';
    const iconClass = this.type === 'danger' ? 'byb-text-red-500 byb-bg-red-100' : 'byb-text-pink-500 byb-bg-pink-100';

    return `
      <div class="byb-modal-overlay byb-fixed byb-inset-0 byb-bg-black/50 byb-backdrop-blur-sm byb-z-[9999] byb-flex byb-items-center byb-justify-center byb-opacity-0 byb-transition-opacity byb-duration-200" id="byb-confirm-overlay">
        <div class="byb-modal byb-bg-white byb-rounded-2xl byb-shadow-2xl byb-max-w-sm byb-w-full byb-mx-4 byb-transform byb-scale-95 byb-transition-transform byb-duration-200 byb-border byb-border-pink-100">
          <div class="byb-p-6">
            <div class="byb-w-12 byb-h-12 ${iconClass} byb-rounded-full byb-flex byb-items-center byb-justify-center byb-mb-4 byb-mx-auto">
              <svg class="byb-w-6 byb-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 class="byb-text-lg byb-font-semibold byb-text-gray-900 byb-text-center byb-mb-2">${this.title}</h3>
            <p class="byb-text-gray-600 byb-text-sm byb-text-center byb-leading-relaxed">${this.message}</p>
          </div>
          <div class="byb-flex byb-gap-3 byb-p-4 byb-bg-gray-50 byb-rounded-b-2xl">
            <button class="byb-btn-cancel byb-flex-1 byb-px-4 byb-py-2.5 byb-text-sm byb-font-medium byb-text-gray-700 byb-bg-white byb-border byb-border-gray-300 byb-rounded-xl hover:byb-bg-gray-50 byb-transition-colors" id="byb-confirm-cancel">
              ${this.cancelText}
            </button>
            <button class="byb-btn-confirm byb-flex-1 byb-px-4 byb-py-2.5 byb-text-sm byb-font-medium byb-text-white ${confirmBtnClass} byb-rounded-xl byb-shadow-lg byb-transition-colors" id="byb-confirm-ok">
              ${this.confirmText}
            </button>
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

      document.body.appendChild(overlay);

      // Animation
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

      overlay.querySelector('#byb-confirm-cancel').addEventListener('click', () => closeDialog(false));
      overlay.querySelector('#byb-confirm-ok').addEventListener('click', () => closeDialog(true));

      // Close on backdrop click (optional depending on guidelines, skip for now to force explicit action)
    });
  }
}
