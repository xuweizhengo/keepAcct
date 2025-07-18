import { useEffect, useCallback } from 'react';
import { gestureService } from '@/services/GestureService';

export const useGesture = () => {
  const registerDoubleTap = useCallback((callback: () => void) => {
    return gestureService.onDoubleTap(callback);
  }, []);

  const enableGesture = useCallback(() => {
    gestureService.enable();
  }, []);

  const disableGesture = useCallback(() => {
    gestureService.disable();
  }, []);

  const triggerTap = useCallback(() => {
    gestureService.handleTap();
  }, []);

  return {
    registerDoubleTap,
    enableGesture,
    disableGesture,
    triggerTap,
  };
};

// 全局双击手势Hook
export const useDoubleTap = (callback: () => void) => {
  useEffect(() => {
    const unsubscribe = gestureService.onDoubleTap(callback);
    return unsubscribe;
  }, [callback]);
};