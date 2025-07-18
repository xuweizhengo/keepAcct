import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { gestureService } from '@/services/GestureService';

interface GestureDetectorProps {
  children: React.ReactNode;
  onDoubleTap?: () => void;
}

const { width, height } = Dimensions.get('window');

export const GestureDetector: React.FC<GestureDetectorProps> = ({ 
  children, 
  onDoubleTap 
}) => {
  const tapRef = useRef<TapGestureHandler>(null);

  useEffect(() => {
    // 注册双击回调
    let unsubscribe: (() => void) | undefined;
    
    if (onDoubleTap) {
      unsubscribe = gestureService.onDoubleTap(onDoubleTap);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [onDoubleTap]);

  const handleTap = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      gestureService.handleTap();
    }
  };

  return (
    <View style={styles.container}>
      <TapGestureHandler
        ref={tapRef}
        onHandlerStateChange={handleTap}
        numberOfTaps={1}
        maxDelayMs={200}
      >
        <View style={styles.gestureArea}>
          {children}
        </View>
      </TapGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  gestureArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});