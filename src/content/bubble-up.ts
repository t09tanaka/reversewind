/**
 * 右クリック対象要素からほぼ同サイズの親要素まで自動的にバブルアップする。
 * カード内の子要素をクリックした場合にカード全体をコピー対象にするための機能。
 */

/** バブルアップ除外タグ */
const STOP_TAGS = new Set(['BODY', 'HTML']);

/** 子の面積が親の面積のこの割合以上なら「ほぼ同サイズ」とみなす */
const AREA_RATIO_THRESHOLD = 0.9;

/**
 * 要素の面積を返す（0の場合はバブルアップしない）
 */
function getArea(el: Element): number {
  const rect = el.getBoundingClientRect();
  return rect.width * rect.height;
}

/**
 * 右クリックされた要素から「意味のある最外殻」まで遡る。
 *
 * 判定ロジック:
 * - 親要素の面積と子要素の面積を比較
 * - 子が親の90%以上の面積を占めていれば、親に遡る
 * - body/html には遡らない
 * - 面積0の要素では止まる
 */
export function findMeaningfulAncestor(element: Element): Element {
  let current = element;

  for (let i = 0; i < 10; i++) {
    const parent = current.parentElement;
    if (!parent) break;
    if (STOP_TAGS.has(parent.tagName)) break;

    const childArea = getArea(current);
    const parentArea = getArea(parent);

    // 面積0の場合はバブルアップしない
    if (childArea === 0 || parentArea === 0) break;

    const ratio = childArea / parentArea;
    if (ratio >= AREA_RATIO_THRESHOLD) {
      current = parent;
    } else {
      break;
    }
  }

  return current;
}
