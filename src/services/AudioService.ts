import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Voice from '@react-native-voice/voice';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import RNFS from 'react-native-fs';

export interface AudioResult {
  success: boolean;
  data?: {
    uri: string;
    fileName: string;
    fileSize: number;
    duration: number;
    text?: string;
  };
  error?: string;
}

export interface VoiceResult {
  success: boolean;
  data?: {
    text: string;
    confidence: number;
    language: string;
  };
  error?: string;
}

export class AudioService {
  private static instance: AudioService;
  private audioRecorderPlayer: any;
  private isRecording = false;
  private isPlaying = false;
  private recordingPath = '';

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.initializeVoice();
  }

  private async initializeVoice() {
    try {
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechRecognized = this.onSpeechRecognized;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechError = this.onSpeechError;
      Voice.onSpeechResults = this.onSpeechResults;
    } catch (error) {
      console.error('Voice initialization error:', error);
    }
  }

  private onSpeechStart = (e: any) => {
    console.log('Speech started:', e);
  };

  private onSpeechRecognized = (e: any) => {
    console.log('Speech recognized:', e);
  };

  private onSpeechEnd = (e: any) => {
    console.log('Speech ended:', e);
  };

  private onSpeechError = (e: any) => {
    console.error('Speech error:', e);
  };

  private onSpeechResults = (e: any) => {
    console.log('Speech results:', e);
  };

  private async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: '麦克风权限',
            message: '智能记账需要麦克风权限来录制语音',
            buttonNeutral: '稍后询问',
            buttonNegative: '拒绝',
            buttonPositive: '允许',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Microphone permission request error:', err);
        return false;
      }
    } else {
      const result = await request(PERMISSIONS.IOS.MICROPHONE);
      return result === RESULTS.GRANTED;
    }
  }

  private async requestSpeechRecognitionPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const result = await request(PERMISSIONS.IOS.SPEECH_RECOGNITION);
      return result === RESULTS.GRANTED;
    }
    return true; // Android 不需要单独的语音识别权限
  }

  private getAudioPath(): string {
    const documentsPath = RNFS.DocumentDirectoryPath;
    const audioPath = `${documentsPath}/audio`;
    const fileName = `recording_${Date.now()}.m4a`;
    return `${audioPath}/${fileName}`;
  }

  async startRecording(): Promise<AudioResult> {
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      return {
        success: false,
        error: '麦克风权限被拒绝',
      };
    }

    if (this.isRecording) {
      return {
        success: false,
        error: '正在录制中',
      };
    }

    try {
      // 确保音频目录存在
      const documentsPath = RNFS.DocumentDirectoryPath;
      const audioPath = `${documentsPath}/audio`;
      await RNFS.mkdir(audioPath);

      this.recordingPath = this.getAudioPath();
      
      const result = await this.audioRecorderPlayer.startRecorder(this.recordingPath);
      this.isRecording = true;

      return {
        success: true,
        data: {
          uri: result,
          fileName: this.recordingPath.split('/').pop() || 'recording.m4a',
          fileSize: 0,
          duration: 0,
        },
      };
    } catch (error) {
      console.error('Start recording error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '录制启动失败',
      };
    }
  }

  async stopRecording(): Promise<AudioResult> {
    if (!this.isRecording) {
      return {
        success: false,
        error: '没有正在进行的录制',
      };
    }

    try {
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.isRecording = false;

      // 获取文件信息
      const fileInfo = await RNFS.stat(this.recordingPath);
      
      return {
        success: true,
        data: {
          uri: result,
          fileName: this.recordingPath.split('/').pop() || 'recording.m4a',
          fileSize: fileInfo.size,
          duration: 0, // 需要其他方法获取音频时长
        },
      };
    } catch (error) {
      console.error('Stop recording error:', error);
      this.isRecording = false;
      return {
        success: false,
        error: error instanceof Error ? error.message : '录制停止失败',
      };
    }
  }

  async playAudio(uri: string): Promise<boolean> {
    if (this.isPlaying) {
      return false;
    }

    try {
      await this.audioRecorderPlayer.startPlayer(uri);
      this.isPlaying = true;
      
      this.audioRecorderPlayer.addPlayBackListener((e: any) => {
        if (e.currentPosition === e.duration) {
          this.stopAudio();
        }
      });

      return true;
    } catch (error) {
      console.error('Play audio error:', error);
      return false;
    }
  }

  async stopAudio(): Promise<boolean> {
    if (!this.isPlaying) {
      return false;
    }

    try {
      await this.audioRecorderPlayer.stopPlayer();
      this.isPlaying = false;
      return true;
    } catch (error) {
      console.error('Stop audio error:', error);
      return false;
    }
  }

  async pauseAudio(): Promise<boolean> {
    if (!this.isPlaying) {
      return false;
    }

    try {
      await this.audioRecorderPlayer.pausePlayer();
      return true;
    } catch (error) {
      console.error('Pause audio error:', error);
      return false;
    }
  }

  async resumeAudio(): Promise<boolean> {
    try {
      await this.audioRecorderPlayer.resumePlayer();
      return true;
    } catch (error) {
      console.error('Resume audio error:', error);
      return false;
    }
  }

  async startVoiceRecognition(): Promise<VoiceResult> {
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      return {
        success: false,
        error: '麦克风权限被拒绝',
      };
    }

    const hasSpeechPermission = await this.requestSpeechRecognitionPermission();
    if (!hasSpeechPermission) {
      return {
        success: false,
        error: '语音识别权限被拒绝',
      };
    }

    try {
      await Voice.start('zh-CN');
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          Voice.stop();
          resolve({
            success: false,
            error: '语音识别超时',
          });
        }, 10000);

        Voice.onSpeechResults = (e: any) => {
          clearTimeout(timeout);
          if (e.value && e.value.length > 0) {
            resolve({
              success: true,
              data: {
                text: e.value[0],
                confidence: 0.8,
                language: 'zh-CN',
              },
            });
          } else {
            resolve({
              success: false,
              error: '没有识别到语音',
            });
          }
        };

        Voice.onSpeechError = (e: any) => {
          clearTimeout(timeout);
          resolve({
            success: false,
            error: e.error?.message || '语音识别失败',
          });
        };
      });
    } catch (error) {
      console.error('Voice recognition error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '语音识别启动失败',
      };
    }
  }

  async stopVoiceRecognition(): Promise<void> {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Stop voice recognition error:', error);
    }
  }

  async convertAudioToText(audioUri: string): Promise<string> {
    // 这里需要集成语音转文字服务，如 Azure Speech Service 或 Google Speech-to-Text
    // 目前返回模拟结果
    return '模拟语音转文字结果';
  }

  async saveAudioToLocal(uri: string, fileName: string): Promise<string> {
    try {
      const documentsPath = RNFS.DocumentDirectoryPath;
      const audioPath = `${documentsPath}/audio`;
      
      // 确保目录存在
      await RNFS.mkdir(audioPath);
      
      const filePath = `${audioPath}/${fileName}`;
      await RNFS.copyFile(uri, filePath);
      
      return filePath;
    } catch (error) {
      console.error('Save audio error:', error);
      throw new Error('保存音频失败');
    }
  }

  async deleteAudio(uri: string): Promise<boolean> {
    try {
      await RNFS.unlink(uri);
      return true;
    } catch (error) {
      console.error('Delete audio error:', error);
      return false;
    }
  }

  async getAudioInfo(uri: string): Promise<{
    size: number;
    duration: number;
    format: string;
  }> {
    try {
      const fileInfo = await RNFS.stat(uri);
      return {
        size: fileInfo.size,
        duration: 0, // 需要其他库来获取音频时长
        format: 'm4a',
      };
    } catch (error) {
      console.error('Get audio info error:', error);
      throw new Error('获取音频信息失败');
    }
  }

  isRecordingActive(): boolean {
    return this.isRecording;
  }

  isPlayingActive(): boolean {
    return this.isPlaying;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
      if (this.isPlaying) {
        await this.stopAudio();
      }
      await Voice.destroy();
    } catch (error) {
      console.error('Audio service cleanup error:', error);
    }
  }
}