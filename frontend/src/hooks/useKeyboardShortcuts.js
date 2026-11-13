import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers = {}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // تفادي التداخل إذا كان المستخدم يكتب في حقل بحث أو إدخال مبالغ
      const target = e.target;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      const isIgnoreTarget = isInput && target.getAttribute('data-ignore-global-shortcuts') === 'true';

      // مفاتيح الوظائف F1 إلى F12 يتم التقاطها دائماً لمنع سلوك المتصفح الافتراضي (مثل F1 Help أو F3 Find)
      if (e.key === 'F1') {
        e.preventDefault();
        handlers.onF1?.();
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        handlers.onF2?.();
        return;
      }

      if (e.key === 'F3') {
        e.preventDefault();
        handlers.onF3?.();
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        handlers.onF4?.();
        return;
      }

      if (e.key === 'F6') {
        e.preventDefault();
        handlers.onF6?.();
        return;
      }

      if (e.key === 'F8') {
        e.preventDefault();
        handlers.onF8?.();
        return;
      }

      if (e.key === 'F9') {
        e.preventDefault();
        handlers.onF9?.();
        return;
      }

      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const num = parseInt(e.key, 10) - 1;
        handlers.onQuickKey?.(num);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.onEscape?.();
        return;
      }

      if (isIgnoreTarget) return;

      if (e.key === 'Delete' || (e.key === 'Backspace' && !isInput)) {
        if (!isInput) {
          e.preventDefault();
          handlers.onDelete?.();
        }
        return;
      }

      if (e.key === '+' && !isInput) {
        e.preventDefault();
        handlers.onPlus?.();
        return;
      }

      if (e.key === '-' && !isInput) {
        e.preventDefault();
        handlers.onMinus?.();
        return;
      }

      if (e.key === 'ArrowUp' && !isInput) {
        e.preventDefault();
        handlers.onArrowUp?.();
        return;
      }

      if (e.key === 'ArrowDown' && !isInput) {
        e.preventDefault();
        handlers.onArrowDown?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}
