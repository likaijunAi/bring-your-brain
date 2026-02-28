import { storage } from './utils/storage.js';

// Simple background script piece
chrome.runtime.onInstalled.addListener(() => {
    console.log('[BringYourBrain] Extension installed');
});

// Shortcut listening mapped from manifest.json
chrome.commands.onCommand.addListener((command) => {
    if (command === "_execute_action") {
        // This is handled automatically by Chrome to open the popup.
        // If we had custom commands like 'open-brain' in manifest, we could forward them here:
    } else if (command === "insert_phrase") {
        // Forward to active tab Content Script
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "open_panel_brain" });
            }
        });
    }
});
