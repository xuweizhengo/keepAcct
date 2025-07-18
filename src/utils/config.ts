import Config from 'react-native-config';

export const AppConfig = {
  // AI Service Configuration
  DEEPSEEK_API_KEY: Config.DEEPSEEK_API_KEY || '',
  OPENAI_API_KEY: Config.OPENAI_API_KEY || '',
  TENCENT_CLOUD_SECRET_ID: Config.TENCENT_CLOUD_SECRET_ID || '',
  TENCENT_CLOUD_SECRET_KEY: Config.TENCENT_CLOUD_SECRET_KEY || '',
  ALIYUN_ACCESS_KEY_ID: Config.ALIYUN_ACCESS_KEY_ID || '',
  ALIYUN_ACCESS_KEY_SECRET: Config.ALIYUN_ACCESS_KEY_SECRET || '',

  // App Configuration
  APP_ENV: Config.APP_ENV || 'development',
  API_BASE_URL: Config.API_BASE_URL || 'https://api.yourdomain.com',
  DEFAULT_CURRENCY: Config.DEFAULT_CURRENCY || 'CNY',
  DEFAULT_LANGUAGE: Config.DEFAULT_LANGUAGE || 'zh-CN',

  // Feature Flags
  ENABLE_VOICE_RECORDING: Config.ENABLE_VOICE_RECORDING === 'true',
  ENABLE_SCREENSHOT_OCR: Config.ENABLE_SCREENSHOT_OCR === 'true',
  ENABLE_RECEIPT_OCR: Config.ENABLE_RECEIPT_OCR === 'true',
  ENABLE_AI_CATEGORIZATION: Config.ENABLE_AI_CATEGORIZATION === 'true',
  ENABLE_OFFLINE_MODE: Config.ENABLE_OFFLINE_MODE === 'true',

  // Analytics
  ENABLE_ANALYTICS: Config.ENABLE_ANALYTICS === 'true',
  ANALYTICS_API_KEY: Config.ANALYTICS_API_KEY || '',

  // Debug
  DEBUG_MODE: Config.DEBUG_MODE === 'true',
  VERBOSE_LOGGING: Config.VERBOSE_LOGGING === 'true',
};

export const AIConfig = {
  DEEPSEEK: {
    apiKey: AppConfig.DEEPSEEK_API_KEY,
    model: 'deepseek-chat',
    maxTokens: 1000,
    temperature: 0.1,
    timeout: 30000,
    baseUrl: 'https://api.deepseek.com/v1',
  },
  OPENAI: {
    apiKey: AppConfig.OPENAI_API_KEY,
    model: 'gpt-4-vision-preview',
    maxTokens: 1000,
    temperature: 0.1,
    timeout: 30000,
  },
  TENCENT: {
    secretId: AppConfig.TENCENT_CLOUD_SECRET_ID,
    secretKey: AppConfig.TENCENT_CLOUD_SECRET_KEY,
    region: 'ap-beijing',
    endpoint: 'ocr.tencentcloudapi.com',
  },
  ALIYUN: {
    accessKeyId: AppConfig.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: AppConfig.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: 'https://ocr-api.cn-hangzhou.aliyuncs.com',
  },
};

export const GestureConfig = {
  DOUBLE_TAP_INTERVAL: 300, // ms
  VIBRATION_DURATION: 100, // ms
  MENU_AUTO_HIDE_DURATION: 5000, // ms
  SENSITIVITY: 0.8,
};

export const Categories = {
  FOOD: '餐饮',
  SHOPPING: '购物',
  TRANSPORT: '交通',
  ENTERTAINMENT: '娱乐',
  HEALTHCARE: '医疗',
  EDUCATION: '教育',
  UTILITIES: '生活缴费',
  TRAVEL: '旅行',
  OTHERS: '其他',
};

export const PaymentMethods = {
  ALIPAY: 'alipay',
  WECHAT: 'wechat',
  CASH: 'cash',
  CARD: 'card',
  OTHER: 'other',
};