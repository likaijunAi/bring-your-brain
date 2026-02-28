export class SelectionPanel {
  constructor(options = {}) {
    this.title = options.title || '';
    this.items = options.items || [];
    this.onSelect = options.onSelect || (() => { });
    this.placeholder = options.placeholder || 'Search...';
    this.container = null;
  }

  render() {
    const id = 'byb-selection-panel-' + Date.now();
    const html = `
      <div id="${id}" class="byb-selection-panel byb-fixed byb-z-[11000] byb-bg-white byb-rounded-2xl byb-shadow-2xl byb-border byb-border-pink-100 byb-flex byb-flex-col byb-overflow-hidden byb-animate-in byb-fade-in byb-zoom-in byb-duration-200" style="width: 320px; max-height: 400px;">
        <!-- Header -->
        <div class="byb-p-4 byb-border-b byb-border-gray-50 byb-flex byb-items-center byb-justify-between byb-bg-pink-50/50">
          <h3 class="byb-text-sm byb-font-bold byb-text-gray-800">${this.title}</h3>
          <button class="close-btn byb-p-1 hover:byb-bg-pink-100 byb-rounded-full byb-text-gray-400 hover:byb-text-pink-500 byb-transition-colors">
            <svg class="byb-w-4 byb-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <!-- Search -->
        <div class="byb-p-3">
          <div class="byb-relative">
            <input type="text" class="search-input byb-w-full byb-pl-8 byb-pr-3 byb-py-2 byb-bg-gray-50 byb-border byb-border-transparent focus:byb-border-pink-200 focus:byb-bg-white byb-rounded-xl byb-text-sm byb-transition-all focus:byb-outline-none" placeholder="${this.placeholder}">
            <svg class="byb-absolute byb-left-2.5 byb-top-2.5 byb-w-4 byb-h-4 byb-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>
        
        <!-- List -->
        <div class="list-container byb-flex-1 byb-overflow-y-auto byb-p-2 byb-space-y-1 custom-scrollbar">
          ${this.renderList(this.items)}
        </div>
        
        <!-- Footer -->
        <div class="byb-p-2 byb-border-t byb-border-gray-50 byb-bg-gray-50/50">
          <p class="byb-text-[10px] byb-text-gray-400 byb-text-center">Bring Your Brain</p>
        </div>
      </div>
    `;
    return { html, id };
  }

  renderList(items) {
    if (items.length === 0) {
      return `<div class="byb-text-center byb-py-8 byb-text-gray-400 byb-text-xs">No items found</div>`;
    }

    return items.map(item => `
      <div class="item-row byb-p-2.5 byb-bg-white hover:byb-bg-pink-50 byb-border byb-border-transparent hover:byb-border-pink-100 byb-rounded-xl byb-cursor-pointer byb-transition-all byb-group" data-text="${this.escapeHtml(item.text)}">
        <div class="byb-flex byb-flex-col byb-gap-0.5">
          ${item.title ? `<span class="byb-text-[10px] byb-font-bold byb-text-pink-500 byb-uppercase byb-tracking-tight">${item.title}</span>` : ''}
          <p class="byb-text-sm byb-text-gray-700 byb-line-clamp-2 group-hover:byb-text-gray-900">${this.escapeHtml(item.text)}</p>
        </div>
      </div>
    `).join('');
  }

  show(x, y) {
    // Remove existing panels
    const existing = document.querySelectorAll('.byb-selection-panel');
    existing.forEach(p => p.remove());

    const { html, id } = this.render();
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    this.container = div.firstElementChild;

    // Position adjustment
    const width = 320;
    const height = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (left + width > viewportWidth) left = viewportWidth - width - 20;
    if (top + height > viewportHeight) top = viewportHeight - height - 20;
    if (left < 0) left = 10;
    if (top < 0) top = 10;

    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;

    document.body.appendChild(this.container);

    // Bind Events
    this.container.querySelector('.close-btn').addEventListener('click', () => this.hide());

    const searchInput = this.container.querySelector('.search-input');
    searchInput.focus();
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase();
      const filtered = this.items.filter(i =>
        (i.text || '').toLowerCase().includes(val) ||
        (i.title || '').toLowerCase().includes(val)
      );
      this.container.querySelector('.list-container').innerHTML = this.renderList(filtered);
      this.bindItemEvents();
    });

    this.bindItemEvents();

    // Close on outside click
    this.outsideClickListener = (e) => {
      if (!this.container.contains(e.target)) {
        this.hide();
      }
    };
    setTimeout(() => document.addEventListener('click', this.outsideClickListener), 0);

    // Close on ESC
    this.escListener = (e) => {
      if (e.key === 'Escape') this.hide();
    };
    document.addEventListener('keydown', this.escListener);
  }

  bindItemEvents() {
    this.container.querySelectorAll('.item-row').forEach(row => {
      row.addEventListener('click', () => {
        const text = row.getAttribute('data-text');
        this.onSelect(text);
        this.hide();
      });
    });
  }

  hide() {
    if (this.container) {
      this.container.classList.add('byb-animate-out', 'byb-fade-out', 'byb-zoom-out', 'byb-duration-200');
      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          this.container.remove();
        }
      }, 180);
    }
    document.removeEventListener('click', this.outsideClickListener);
    document.removeEventListener('keydown', this.escListener);
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
