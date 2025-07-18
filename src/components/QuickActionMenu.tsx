import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GestureConfig } from '@/utils/config';

interface ActionButton {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}

interface QuickActionMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: ActionButton[];
  autoHide?: boolean;
  autoHideDelay?: number;
}

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.85;
const MENU_HEIGHT = 200;

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  visible,
  onClose,
  actions,
  autoHide = true,
  autoHideDelay = GestureConfig.MENU_AUTO_HIDE_DURATION,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      showMenu();
      if (autoHide) {
        const timer = setTimeout(() => {
          hideMenu();
        }, autoHideDelay);
        return () => clearTimeout(timer);
      }
    } else {
      hideMenu();
    }
  }, [visible]);

  const showMenu = () => {
    setIsAnimating(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const hideMenu = () => {
    setIsAnimating(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
      onClose();
    });
  };

  const handleActionPress = (action: ActionButton) => {
    action.onPress();
    hideMenu();
  };

  if (!visible && !isAnimating) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={hideMenu}
      />
      
      <Animated.View
        style={[
          styles.menuContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.menuContent}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>快速记账</Text>
            <TouchableOpacity onPress={hideMenu} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionButton,
                  { backgroundColor: action.color },
                ]}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIcon}>
                  <Icon name={action.icon} size={32} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContainer: {
    width: MENU_WIDTH,
    maxHeight: MENU_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  menuContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
});