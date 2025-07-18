import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GestureDetector } from './components/GestureDetector';
import { ExpenseRecord } from './types';
import { ImageService } from './services/ImageService';
import { AudioService } from './services/AudioService';
import { aiServiceManager } from './services/ai/AIServiceManager';
import { ExpenseRecordProcessor } from './services/ExpenseRecordProcessor';
import { DatabaseService } from './services/DatabaseService';

const App: React.FC = () => {
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const imageService = ImageService.getInstance();
  const audioService = AudioService.getInstance();
  const expenseProcessor = ExpenseRecordProcessor.getInstance();
  const databaseService = DatabaseService.getInstance();

  useEffect(() => {
    // 初始化数据库并加载记录
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await databaseService.init();
      const recentRecords = await databaseService.getExpenseRecords({ limit: 10 });
      setRecords(recentRecords);
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const handleDoubleTap = () => {
    setMenuVisible(true);
    setTimeout(() => {
      setMenuVisible(false);
    }, 3000);
  };

  const handleScreenshot = async () => {
    setMenuVisible(false);
    
    try {
      setIsProcessing(true);
      const imageResult = await imageService.showImagePicker();
      
      if (!imageResult.success || !imageResult.data) {
        Alert.alert('错误', imageResult.error || '获取图片失败');
        return;
      }
      
      if (!imageResult.data.base64) {
        Alert.alert('错误', '图片数据获取失败');
        return;
      }
      
      const processResult = await expenseProcessor.processScreenshot(imageResult.data.base64);
      
      if (processResult.success && processResult.record) {
        await databaseService.insertExpenseRecord(processResult.record);
        setRecords(prev => [processResult.record!, ...prev]);
        Alert.alert('记账成功', `已记录：${processResult.record.merchant} ￥${processResult.record.amount}`);
      } else {
        Alert.alert('处理失败', processResult.error || '截图识别失败');
      }
    } catch (error) {
      console.error('Screenshot processing error:', error);
      Alert.alert('错误', '截图处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceRecording = async () => {
    setMenuVisible(false);
    
    try {
      setIsProcessing(true);
      
      Alert.alert(
        '语音记账',
        '请选择输入方式',
        [
          { text: '取消', style: 'cancel' },
          { text: '语音识别', onPress: () => processVoiceRecognition() },
          { text: '录音记账', onPress: () => processVoiceRecording() },
        ]
      );
    } catch (error) {
      console.error('Voice handling error:', error);
      Alert.alert('错误', '语音功能初始化失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhotoCapture = async () => {
    setMenuVisible(false);
    
    try {
      setIsProcessing(true);
      const imageResult = await imageService.openCamera();
      
      if (!imageResult.success || !imageResult.data) {
        Alert.alert('错误', imageResult.error || '拍照失败');
        return;
      }
      
      if (!imageResult.data.base64) {
        Alert.alert('错误', '图片数据获取失败');
        return;
      }
      
      const processResult = await expenseProcessor.processReceipt(imageResult.data.base64);
      
      if (processResult.success && processResult.record) {
        await databaseService.insertExpenseRecord(processResult.record);
        setRecords(prev => [processResult.record!, ...prev]);
        Alert.alert('记账成功', `已记录：${processResult.record.merchant} ￥${processResult.record.amount}`);
      } else {
        Alert.alert('处理失败', processResult.error || '小票识别失败');
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('错误', '拍照处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const processVoiceRecognition = async () => {
    try {
      setIsProcessing(true);
      const voiceResult = await audioService.startVoiceRecognition();
      
      if (!voiceResult.success || !voiceResult.data) {
        Alert.alert('错误', voiceResult.error || '语音识别失败');
        return;
      }
      
      const processResult = await expenseProcessor.processText(voiceResult.data.text);
      
      if (processResult.success && processResult.record) {
        await databaseService.insertExpenseRecord(processResult.record);
        setRecords(prev => [processResult.record!, ...prev]);
        Alert.alert('记账成功', `已记录：${processResult.record.merchant} ￥${processResult.record.amount}`);
      } else {
        Alert.alert('处理失败', processResult.error || '语音内容处理失败');
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      Alert.alert('错误', '语音识别处理失败');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processVoiceRecording = async () => {
    try {
      setIsProcessing(true);
      
      Alert.alert(
        '录音记账',
        '开始录音，完成后点击确定',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '开始录音', 
            onPress: async () => {
              const recordResult = await audioService.startRecording();
              if (recordResult.success) {
                Alert.alert(
                  '录音中...',
                  '点击停止录音',
                  [
                    {
                      text: '停止录音',
                      onPress: async () => {
                        const stopResult = await audioService.stopRecording();
                        if (stopResult.success && stopResult.data) {
                          // 这里可以添加音频转文字的逻辑
                          const text = '录音转文字结果';
                          const processResult = await expenseProcessor.processText(text);
                          
                          if (processResult.success && processResult.record) {
                            await databaseService.insertExpenseRecord(processResult.record);
                            setRecords(prev => [processResult.record!, ...prev]);
                            Alert.alert('记账成功', `已记录：${processResult.record.merchant} ￥${processResult.record.amount}`);
                          }
                        }
                      }
                    }
                  ]
                );
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Voice recording error:', error);
      Alert.alert('错误', '录音处理失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const QuickMenu = () => (
    <View style={styles.menuOverlay}>
      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>快速记账</Text>
        {isProcessing && (
          <Text style={styles.processingText}>正在处理中...</Text>
        )}
        <View style={styles.menuButtons}>
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: '#4CAF50', opacity: isProcessing ? 0.5 : 1 }]}
            onPress={handleScreenshot}
            disabled={isProcessing}
          >
            <Text style={styles.menuButtonText}>📱</Text>
            <Text style={styles.menuButtonLabel}>截屏记账</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: '#2196F3', opacity: isProcessing ? 0.5 : 1 }]}
            onPress={handleVoiceRecording}
            disabled={isProcessing}
          >
            <Text style={styles.menuButtonText}>🎤</Text>
            <Text style={styles.menuButtonLabel}>语音记账</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: '#FF9800', opacity: isProcessing ? 0.5 : 1 }]}
            onPress={handlePhotoCapture}
            disabled={isProcessing}
          >
            <Text style={styles.menuButtonText}>📷</Text>
            <Text style={styles.menuButtonLabel}>拍照记账</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <GestureDetector onDoubleTap={handleDoubleTap}>
          <View style={styles.content}>
            <Text style={styles.title}>智能记账</Text>
            <Text style={styles.subtitle}>双击屏幕快速记账</Text>
            
            <ScrollView style={styles.recordsList}>
              <Text style={styles.recordsTitle}>最近记录</Text>
              {records.length === 0 ? (
                <Text style={styles.noRecords}>暂无记录，双击屏幕开始记账</Text>
              ) : (
                records.map(record => (
                  <View key={record.id} style={styles.recordItem}>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordMerchant}>{record.merchant}</Text>
                      <Text style={styles.recordDescription}>{record.description}</Text>
                      <Text style={styles.recordTime}>
                        {new Date(record.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.recordRight}>
                      <Text style={styles.recordAmount}>￥{record.amount}</Text>
                      <Text style={styles.recordCategory}>{record.category}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                💡 双击屏幕任意位置打开快速记账菜单
              </Text>
              <Text style={styles.instructionText}>
                📱 截屏记账：识别支付宝/微信支付页面
              </Text>
              <Text style={styles.instructionText}>
                🎤 语音记账：快速记录现金消费
              </Text>
              <Text style={styles.instructionText}>
                📷 拍照记账：识别小票和发票
              </Text>
            </View>
          </View>
        </GestureDetector>
        
        {menuVisible && <QuickMenu />}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  recordsList: {
    flex: 1,
    marginBottom: 20,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  noRecords: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
    lineHeight: 24,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recordInfo: {
    flex: 1,
  },
  recordMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recordDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recordTime: {
    fontSize: 12,
    color: '#999',
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 4,
  },
  recordCategory: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  instructions: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  menuOverlay: {
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
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  processingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  menuButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  menuButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
  },
  menuButtonText: {
    fontSize: 24,
    marginBottom: 8,
  },
  menuButtonLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default App;