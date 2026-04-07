import { MENU_ID, MENU_TITLE } from '../shared/constants';

// content script を動的に登録（manifest の content_scripts を使わない）
// host_permissions により全ページで自動注入される
chrome.scripting
  .registerContentScripts([
    {
      id: 'reversewind-content',
      matches: ['<all_urls>'],
      js: ['content-script.js'],
      runAt: 'document_idle',
    },
  ])
  .catch((err: unknown) => {
    // 既に登録済み（Duplicate script ID）の場合は正常
    if (err instanceof Error && err.message.includes('Duplicate script ID')) {
      return;
    }
    console.warn('[Reversewind] registerContentScripts failed:', err);
  });

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: MENU_TITLE,
    contexts: ['all'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { type: 'REVERSEWIND_CONVERT' });
});
