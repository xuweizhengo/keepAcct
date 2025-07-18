import React, { createContext, useContext, useState, useCallback } from 'react';
import { QuickActionMenu } from './QuickActionMenu';
import { useDoubleTap } from '@/hooks/useGesture';

interface RecordingMenuContextType {
  showMenu: () => void;
  hideMenu: () => void;
  isMenuVisible: boolean;
}

const RecordingMenuContext = createContext<RecordingMenuContextType | undefined>(undefined);

interface RecordingMenuProviderProps {
  children: React.ReactNode;
  onScreenshot: () => void;
  onVoiceRecording: () => void;
  onPhotoCapture: () => void;
}

export const RecordingMenuProvider: React.FC<RecordingMenuProviderProps> = ({
  children,
  onScreenshot,
  onVoiceRecording,
  onPhotoCapture,
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const showMenu = useCallback(() => {
    setIsMenuVisible(true);
  }, []);

  const hideMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  // 注册双击手势
  useDoubleTap(showMenu);

  const actions = [
    {
      id: 'screenshot',
      icon: 'screenshot',
      label: '截屏记账',
      description: '支付宝/微信支付',
      color: '#4CAF50',
      onPress: onScreenshot,
    },
    {
      id: 'voice',
      icon: 'mic',
      label: '语音记账',
      description: '现金/快速记录',
      color: '#2196F3',
      onPress: onVoiceRecording,
    },
    {
      id: 'photo',
      icon: 'camera-alt',
      label: '拍照记账',
      description: '小票/发票',
      color: '#FF9800',
      onPress: onPhotoCapture,
    },
  ];

  const contextValue: RecordingMenuContextType = {
    showMenu,
    hideMenu,
    isMenuVisible,
  };

  return (
    <RecordingMenuContext.Provider value={contextValue}>
      {children}
      <QuickActionMenu
        visible={isMenuVisible}
        onClose={hideMenu}
        actions={actions}
        autoHide={true}
        autoHideDelay={5000}
      />
    </RecordingMenuContext.Provider>
  );
};

export const useRecordingMenu = () => {
  const context = useContext(RecordingMenuContext);
  if (context === undefined) {
    throw new Error('useRecordingMenu must be used within a RecordingMenuProvider');
  }
  return context;
};