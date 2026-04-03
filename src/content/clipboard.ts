/**
 * テキストをクリップボードにコピーする。
 * コンテキストメニュー経由ではドキュメントのフォーカスが外れるため
 * navigator.clipboard.writeText() が失敗する。
 * その場合は execCommand('copy') にフォールバックする。
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    execCommandCopy(text);
  }
}

/**
 * 一時的なtextareaを使ったフォールバックコピー
 */
function execCommandCopy(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
