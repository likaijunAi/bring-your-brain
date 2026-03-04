# 带上脑子 (BYB)

**Bring Your Brain** 是一款高级浏览器扩展，旨在提升你在多个 AI 聊天平台上的生产力。它提供统一的工作区，用于保存有价值的 AI 回复，并管理常用提示词与短语。

![Bring Your Brain Banner](icons/icon128.png)

## 🌟 核心功能

- **多平台支持**：无缝集成 ChatGPT、Claude、Gemini、DeepSeek 和 Kimi（Moonshot）。
- **Remember 流程**：通过注入的 “Remember” 按钮，一键保存任意 AI 回复。
- **常用短语**：存储并管理高频提示词；可在聊天界面通过悬浮选择面板快速调用。
- **My Brain**：集中管理你保存的所有 AI 洞察，可从任意支持的平台访问。
- **样式隔离**：使用带命名空间前缀（`byb-`）的 Tailwind CSS，确保扩展 UI 不会干扰宿主网站样式。
- **多语言支持**：完整支持英文与中文本地化。
- **云端同步**：可在本地存储和 Google 账号同步之间切换，实现多设备数据一致。

## 🚀 快速开始

### 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-username/bring-your-brain.git
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 构建 CSS：
   ```bash
   npm run build:css
   ```
4. 在 Chrome 中加载扩展：
   - 打开 `chrome://extensions/`
   - 启用“开发者模式”
   - 点击“加载已解压的扩展程序”，并选择项目目录。

## 🛠️ 技术栈

- **核心**：Vanilla JavaScript (ES6+)
- **样式**：Tailwind CSS 3（含自定义前缀）
- **国际化**：基于 Chrome `_locales` 的自定义 i18n 框架
- **适配器**：用于平台特定 DOM 操作的模块化适配器系统

## 📖 开发

### 命令

- `npm run build:css`：将 Tailwind CSS 编译到 `styles/content.css`。
- `npm run watch:css`：（若已配置）监听 CSS 变更。

### 项目结构

- `adapters/`：各平台按钮注入与文本提取逻辑。
- `components/`：可复用 UI 组件（模态框、Toast、选择面板等）。
- `styles/`：Tailwind 源文件与编译产物。
- `utils/`：存储管理与 i18n 工具。
- `_locales/`：翻译文件。

## 🎨 设计理念

BYB 追求 **活力、玻璃拟态、高级感** 的视觉风格。通过柔和粉色渐变、细腻阴影与流畅微动效，提供贴近现代 Web 应用的高品质交互体验。

## 📄 许可证

Apache License 2.0 - 详见 [LICENSE](LICENSE)。
