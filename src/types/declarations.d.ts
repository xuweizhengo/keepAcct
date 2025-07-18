// 声明文件，解决第三方库类型错误

declare module 'react-native-sqlite-storage' {
  export interface SQLiteDatabase {
    executeSql(sql: string, params?: any[]): Promise<[any]>;
    close(): Promise<void>;
  }
  
  export interface SQLiteOptions {
    name: string;
    location?: string;
    createFromLocation?: number;
  }
  
  export function openDatabase(options: SQLiteOptions): Promise<SQLiteDatabase>;
  export function DEBUG(debug: boolean): void;
  export function enablePromise(enable: boolean): void;
  
  const SQLite: {
    openDatabase: typeof openDatabase;
    DEBUG: typeof DEBUG;
    enablePromise: typeof enablePromise;
  };
  
  export default SQLite;
}

declare module 'react-native-vector-icons/MaterialIcons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';
  
  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }
  
  export default class MaterialIcons extends Component<IconProps> {}
}

declare module '@react-native-community/blur' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';
  
  interface BlurViewProps extends ViewProps {
    blurType?: 'light' | 'dark' | 'xlight';
    blurAmount?: number;
  }
  
  export class BlurView extends Component<BlurViewProps> {}
}

declare module 'react-native-audio-recorder-player' {
  export interface AudioRecorderPlayerOptions {
    onStart?: () => void;
    onStop?: () => void;
    onPause?: () => void;
    onResume?: () => void;
  }
  
  export interface RecordBackType {
    isRecording?: boolean;
    currentPosition: number;
    currentMetering?: number;
  }
  
  export interface PlayBackType {
    isMuted?: boolean;
    currentPosition: number;
    duration: number;
  }
  
  export default class AudioRecorderPlayer {
    constructor();
    startRecorder(uri?: string): Promise<string>;
    stopRecorder(): Promise<string>;
    startPlayer(uri?: string): Promise<string>;
    stopPlayer(): Promise<string>;
    pausePlayer(): Promise<string>;
    resumePlayer(): Promise<string>;
    addPlayBackListener(callback: (data: PlayBackType) => void): void;
    addRecordBackListener(callback: (data: RecordBackType) => void): void;
    removePlayBackListener(): void;
    removeRecordBackListener(): void;
  }
}