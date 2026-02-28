export class AlertToast {
    constructor(options = {}) {
        this.message = options.message || '';
        this.type = options.type || 'info'; // info, success, warning, error
        this.duration = options.duration !== undefined ? options.duration : 3000;
    }

    getIcon() {
        switch (this.type) {
            case 'success':
                return `<svg class="byb-w-5 byb-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            case 'warning':
                return `<svg class="byb-w-5 byb-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
            case 'error':
                return `<svg class="byb-w-5 byb-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
            default: // info
                return `<svg class="byb-w-5 byb-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
        }
    }

    render() {
        const colors = {
            info: 'byb-bg-pink-500',
            success: 'byb-bg-green-500',
            warning: 'byb-bg-amber-500',
            error: 'byb-bg-red-500'
        };

        return `
      <div class="byb-toast byb-fixed byb-top-4 byb-left-1/2 -byb-translate-x-1/2 ${colors[this.type]} byb-text-white byb-px-6 byb-py-3 byb-rounded-full byb-shadow-lg byb-shadow-pink-500/30 byb-z-[10000] byb-flex byb-items-center byb-gap-2 byb-transform -byb-translate-y-full byb-transition-transform byb-duration-300">
        <span class="byb-toast-icon byb-flex-shrink-0">${this.getIcon()}</span>
        <span class="byb-text-sm byb-font-medium">${this.message}</span>
      </div>
    `;
    }

    show() {
        const el = document.createElement('div');
        el.innerHTML = this.render().trim();
        const node = el.firstElementChild;
        document.body.appendChild(node);

        requestAnimationFrame(() => {
            node.classList.remove('-byb-translate-y-full');
            node.classList.add('byb-translate-y-0');
        });

        if (this.duration > 0) {
            setTimeout(() => {
                this.close(node);
            }, this.duration);
        }
        return node;
    }

    close(node) {
        node.classList.remove('byb-translate-y-0');
        node.classList.add('-byb-translate-y-full');
        setTimeout(() => {
            if (node.parentNode) node.remove();
        }, 300);
    }
}
