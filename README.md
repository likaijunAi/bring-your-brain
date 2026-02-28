# Bring Your Brain (BYB)

**Bring Your Brain** is a premium browser extension designed to enhance your productivity across multiple AI chat platforms. It provides a unified workspace to save insightful AI responses and manage frequently used prompts and phrases.

![Bring Your Brain Banner](icons/icon128.png)

## 🌟 Key Features

- **Multi-Platform Support**: Seamless integration with ChatGPT, Claude, Gemini, DeepSeek, and Kimi (Moonshot).
- **Remember Flow**: Quickly save any AI response with a single click using the injected "Remember" button.
- **Common Phrases**: Store and manage your most frequently used prompts. Access them via a floating selection panel directly in the chat interface.
- **My Brain**: A centralized library of all your saved AI insights, reachable from any supported chat platform.
- **Isolated Styling**: Uses a namespaced Tailwind CSS system (`byb-`) to ensure the extension UI never interferes with the host website's design.
- **Multi-Language Support**: Fully localized in English and Chinese.
- **Cloud Sync**: Toggle between local storage and Google account sync to keep your data consistent across devices.

## 🚀 Getting Started

### Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/your-username/bring-your-brain.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the CSS:
    ```bash
    npm run build:css
    ```
4.  Load the extension in Chrome:
    - Open `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked" and select the project directory.

## 🛠️ Tech Stack

- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS 3 (with custom prefixing)
- **Internationalization**: Custom i18n framework using Chrome's `_locales`
- **Adapters**: Modular adapter system for platform-specific DOM manipulation

## 📖 Development

### Commands

- `npm run build:css`: Compiles Tailwind CSS into `styles/content.css`.
- `npm run watch:css`: (If configured) Watch for CSS changes.

### Project Structure

- `adapters/`: Platform-specific logic for button injection and text extraction.
- `components/`: Reusable UI components (Modals, Toasts, Selection Panels).
- `styles/`: Tailwind source and compiled CSS.
- `utils/`: Storage management and i18n utilities.
- `_locales/`: Translation files.

## 🎨 Design Philosophy

BYB aims for a **vibrant, glassmorphic, and premium** aesthetic. We use soft pink gradients, subtle shadows, and smooth micro-animations to provide a high-end user experience that feels native to modern web applications.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
