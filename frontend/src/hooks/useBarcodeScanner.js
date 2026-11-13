import { useEffect, useRef } from 'react';

/**
 * Hook لاعتراض إشارات قارئ الباركود (Barcode Scanner Interceptor)
 * يعمل قارئ الباركود كمحاكي للوحة المفاتيح (HID Keyboard) بإرسال أحرف سريعة جداً تتبعها Enter.
 * هذا الـ Hook يستمع عالمياً (Global Window Listener) بحيث يلتقط الباركود تلقائياً
 * حتى وإن لم يكن الكاشير قد نقر على مربع الإدخال (Zero Mouse).
 */
export function useBarcodeScanner(onScan, options = {}) {
  const { minLength = 3, maxIntervalMs = 60, enabled = true } = options;
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // إذا كان المستخدم داخل حقل إدخال نصي آخر (مثل نافذة البحث اليدوي أو نافذة الدفع)
      const target = e.target;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      const isBarcodeInput = target && target.getAttribute('data-barcode-input') === 'true';

      // إذا كان الإدخال في حقل غير حقل الباركود وله كلاس منع الاعتراض
      if (isInput && !isBarcodeInput && target.getAttribute('data-ignore-global-scanner') === 'true') {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';

        if (barcode.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();
          onScan(barcode);
        }
        return;
      }

      // إذا مر وقت طويل بين النقرات (شخص يكتب ببطء يدوياً)، نقوم بمسح المخزن المؤقت
      if (timeDiff > maxIntervalMs * 3 && !isBarcodeInput) {
        bufferRef.current = '';
      }

      // تسجيل الحروف والأرقام فقط
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onScan, minLength, maxIntervalMs, enabled]);

  return {
    clearBuffer: () => {
      bufferRef.current = '';
    }
  };
}
