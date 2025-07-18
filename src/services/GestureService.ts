import { Platform, DeviceEventEmitter, NativeEventEmitter, NativeModules } from 'react-native';
import { GestureConfig } from '@/utils/config';
import HapticFeedback from 'react-native-haptic-feedback';
import Sound from 'react-native-sound';

export class GestureService {
  private static instance: GestureService;
  private lastTapTime = 0;
  private isEnabled = true;
  private callbacks: Set<() => void> = new Set();
  private tapSound: Sound | null = null;

  private constructor() {
    this.initializeSound();
  }

  static getInstance(): GestureService {
    if (!GestureService.instance) {
      GestureService.instance = new GestureService();
    }
    return GestureService.instance;
  }

  private initializeSound() {
    // 初始化点击音效
    this.tapSound = new Sound('tap_sound.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load tap sound', error);
      }
    });
  }

  /**
   * 启用双击手势检测
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * 禁用双击手势检测
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * 注册双击回调
   */
  onDoubleTap(callback: () => void) {
    this.callbacks.add(callback);
    
    // 返回取消注册函数
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * 处理点击事件
   */
  handleTap() {
    if (!this.isEnabled) return;

    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastTapTime;

    if (timeDiff < GestureConfig.DOUBLE_TAP_INTERVAL) {
      // 双击检测到
      this.triggerDoubleTap();
    }

    this.lastTapTime = currentTime;
  }

  /**
   * 触发双击事件
   */
  private triggerDoubleTap() {
    // 触觉反馈
    HapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    // 声音反馈
    if (this.tapSound) {
      this.tapSound.play();
    }

    // 通知所有回调
    this.callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error executing double tap callback:', error);
      }
    });
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.callbacks.clear();
    if (this.tapSound) {
      this.tapSound.release();
      this.tapSound = null;
    }
  }
}

// 全局单例实例
export const gestureService = GestureService.getInstance();