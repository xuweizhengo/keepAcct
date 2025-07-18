// 核心数据类型定义

export interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  merchant: string;
  description: string;
  timestamp: string;
  confidence: number;
  inputMethod: 'screenshot' | 'voice' | 'receipt';
  tags: string[];
  rawData?: any;
  location?: string;
  currency: string;
  verified: boolean;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface AIProcessResult {
  amount: number;
  category: string;
  merchant: string;
  description: string;
  timestamp: string;
  confidence: number;
  inputMethod: 'screenshot' | 'voice' | 'receipt';
  rawData: any;
  suggestions?: string[];
  needsConfirmation: boolean;
}

export interface AIServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  confidence: number;
  service: string;
  processingTime: number;
}

export interface ProcessingResult {
  success: boolean;
  record?: ExpenseRecord;
  error?: string;
}

export interface PaymentAppTemplate {
  appName: string;
  version: string;
  selectors: {
    amount: string;
    merchant: string;
    timestamp: string;
    orderId?: string;
  };
  patterns: {
    amount: RegExp;
    timestamp: RegExp;
    merchant?: RegExp;
  };
  categoryMapping: Record<string, string>;
}

export interface VoiceProcessingResult {
  transcript: string;
  confidence: number;
  parsedData: Partial<ExpenseRecord>;
  needsClarification: boolean;
  clarificationQuestions: string[];
}

export interface GestureConfig {
  enabled: boolean;
  sensitivity: number;
  doubleTapInterval: number;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

export interface AppSettings {
  defaultCurrency: string;
  autoSync: boolean;
  offlineMode: boolean;
  gestureConfig: GestureConfig;
  aiConfig: {
    provider: 'openai' | 'tencent' | 'aliyun';
    apiKey: string;
    model: string;
    timeout: number;
  };
  categoryConfig: {
    customCategories: string[];
    defaultCategory: string;
    autoCategorizationEnabled: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  preferences: AppSettings;
  statistics: {
    totalRecords: number;
    totalAmount: number;
    averageDaily: number;
    topCategories: Array<{category: string; amount: number}>;
  };
}