import {
  MENU_ID_COMPONENT,
  MENU_TITLE_COMPONENT,
  MENU_ID_PAGE,
  MENU_TITLE_PAGE,
} from '../shared/constants';

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
    if (err instanceof Error && err.message.includes('Duplicate script ID')) {
      return;
    }
    console.warn('[Reversewind] registerContentScripts failed:', err);
  });

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID_COMPONENT,
    title: MENU_TITLE_COMPONENT,
    contexts: ['all'],
  });
  chrome.contextMenus.create({
    id: MENU_ID_PAGE,
    title: MENU_TITLE_PAGE,
    contexts: ['all'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === MENU_ID_COMPONENT) {
    chrome.tabs.sendMessage(tab.id, { type: 'REVERSEWIND_CONVERT' });
  } else if (info.menuItemId === MENU_ID_PAGE) {
    chrome.tabs.sendMessage(tab.id, { type: 'REVERSEWIND_CONVERT_PAGE' });
  }
});
