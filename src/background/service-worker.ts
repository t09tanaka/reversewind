import { MENU_ID, MENU_TITLE } from '../shared/constants';

// content script を動的に登録（manifest の content_scripts を使わない）
// これにより <all_urls> のホスト権限警告を回避する
chrome.scripting
  .registerContentScripts([
    {
      id: 'reversewind-content',
      matches: ['<all_urls>'],
      js: ['content-script.js'],
      runAt: 'document_idle',
    },
  ])
  .catch(() => {
    // 既に登録済みの場合はエラーになるので無視
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
