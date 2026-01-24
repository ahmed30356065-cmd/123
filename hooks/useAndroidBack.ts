
import { useEffect, useRef } from 'react';
import { NativeBridge } from '../utils/NativeBridge';

/**
 * Hook لإدارة زر الرجوع بنظام LIFO (Last-In-First-Out)
 * يضمن أن المودال أو الصفحة العلوية هي التي تستجيب للرجوع أولاً
 * 
 * @param handler دالة تعيد true إذا قامت بإغلاق شيء ما (تم التعامل مع الحدث)
 * @param deps مصفوفة الاعتمادات
 */
const useAndroidBack = (handler: () => boolean, deps: any[] = []) => {
  // Use Ref to ensure the bridge always calls the latest version of the handler
  const handlerRef = useRef(handler);

  // Update ref whenever handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler = () => {
        // Always call the current version of the handler
        return handlerRef.current();
    };

    // Register to the global stack
    const unsubscribe = NativeBridge.subscribeBackHandler(wrappedHandler);
    
    // Unsubscribe on unmount to prevent leaks and stale handlers
    return () => {
        unsubscribe();
    };
  }, deps); 
};

export default useAndroidBack;
