/** 右クリック対象要素を保持するストア */
class SelectionStore {
  private ref: WeakRef<Element> | null = null;

  set(element: Element): void {
    this.ref = new WeakRef(element);
  }

  get(): Element | null {
    return this.ref?.deref() ?? null;
  }

  clear(): void {
    this.ref = null;
  }
}

export const selectionStore = new SelectionStore();
