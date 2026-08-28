import { onMounted, onUnmounted } from 'vue';

export interface KeyboardHandlers {
  /** Space */
  toggle?: () => void;
  /** ArrowRight */
  step?: () => void;
  /** ArrowLeft */
  stepBack?: () => void;
  /** Home */
  toStart?: () => void;
  /** End */
  toEnd?: () => void;
  /** R */
  reset?: () => void;
}

const EDITABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** Playback keyboard shortcuts. Ignored while a form control has focus. */
export function useKeyboard(handlers: KeyboardHandlers) {
  const onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (EDITABLE.has(target.tagName) || target.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    let handled = true;
    switch (e.key) {
      case ' ': handlers.toggle?.(); break;
      case 'ArrowRight': handlers.step?.(); break;
      case 'ArrowLeft': handlers.stepBack?.(); break;
      case 'Home': handlers.toStart?.(); break;
      case 'End': handlers.toEnd?.(); break;
      case 'r': case 'R': handlers.reset?.(); break;
      default: handled = false;
    }
    if (handled) e.preventDefault();
  };
  onMounted(() => window.addEventListener('keydown', onKey));
  onUnmounted(() => window.removeEventListener('keydown', onKey));
}
