import { MENU_ID, MENU_TITLE } from '../shared/constants';

// content script を動的に登録（manifest の content_scripts を使わない）
// これにより <all_urls> のホスト権限警告を回避する
// 注意: activeTab のみの場合、初回ページロードでは権限不足で注入されないことがある
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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'REVERSEWIND_CONVERT' });
  } catch {
    // content script が未注入の場合、activeTab 権限を利用して動的に注入
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js'],
      });

      // contextmenu イベントを取りこぼしているので、:hover で右クリック対象を検出して
      // content script の selectionStore にセットする
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const hovered = document.querySelectorAll(':hover');
          const target = hovered[hovered.length - 1];
          if (target instanceof Element) {
            const setTarget = (
              window as unknown as Record<string, (el: Element) => void>
            ).__reversewind_set_target__;
            setTarget?.(target);
          }
        },
      });

      await chrome.tabs.sendMessage(tab.id, { type: 'REVERSEWIND_CONVERT' });
    } catch (err) {
      console.error('[Reversewind] injection or message failed:', err);
    }
  }
});
