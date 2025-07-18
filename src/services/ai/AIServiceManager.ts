import { BaseAIService } from './BaseAIService';
import { OpenAIService } from './OpenAIService';
import { TencentOCRService } from './TencentOCRService';
import { DeepSeekService } from './DeepSeekService';
import { AIProcessResult } from '@/types';
import { AppConfig } from '@/utils/config';

export type AIProvider = 'openai' | 'tencent' | 'deepseek' | 'hybrid';

export class AIServiceManager {
  private static instance: AIServiceManager;
  private services: Map<AIProvider, BaseAIService> = new Map();
  private primaryProvider: AIProvider = 'deepseek';

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }

  private initializeServices() {
    // 初始化DeepSeek服务
    if (AppConfig.DEEPSEEK_API_KEY) {
      this.services.set('deepseek', new DeepSeekService(AppConfig.DEEPSEEK_API_KEY));
    }

    // 初始化OpenAI服务
    if (AppConfig.OPENAI_API_KEY) {
      this.services.set('openai', new OpenAIService());
    }

    // 初始化腾讯OCR服务
    if (AppConfig.TENCENT_CLOUD_SECRET_ID && AppConfig.TENCENT_CLOUD_SECRET_KEY) {
      this.services.set('tencent', new TencentOCRService());
    }
  }

  setPrimaryProvider(provider: AIProvider) {
    this.primaryProvider = provider;
  }

  async processScreenshot(imageData: string): Promise<AIProcessResult> {
    // 截图处理优先使用DeepSeek视觉模型
    const service = this.services.get('deepseek');
    if (!service) {
      throw new Error('DeepSeek service not available');
    }

    try {
      if (service instanceof DeepSeekService) {
        return await service.processScreenshot(imageData);
      } else {
        return await service.processImage(imageData);
      }
    } catch (error) {
      console.error('DeepSeek screenshot processing failed:', error);
      
      // 降级到OpenAI
      const fallbackService = this.services.get('openai');
      if (fallbackService) {
        return await fallbackService.processImage(imageData);
      }
      
      // 再降级到腾讯OCR
      const tencentService = this.services.get('tencent');
      if (tencentService) {
        return await tencentService.processImage(imageData);
      }
      
      throw error;
    }
  }

  async processReceipt(imageData: string): Promise<AIProcessResult> {
    // 小票处理可以使用混合策略
    if (this.primaryProvider === 'hybrid') {
      return this.processWithHybridStrategy(imageData);
    }

    const service = this.services.get(this.primaryProvider);
    if (!service) {
      throw new Error(`${this.primaryProvider} service not available`);
    }

    if (this.primaryProvider === 'deepseek' && service instanceof DeepSeekService) {
      return await service.processReceipt(imageData);
    }

    return await service.processImage(imageData);
  }

  async processVoice(audioData: string): Promise<AIProcessResult> {
    // 语音处理主要使用OpenAI
    const service = this.services.get('openai');
    if (!service) {
      throw new Error('OpenAI service not available');
    }

    return await service.processAudio(audioData);
  }

  async processText(text: string): Promise<AIProcessResult> {
    // 文本处理优先使用DeepSeek
    const service = this.services.get('deepseek');
    if (!service) {
      // 降级到OpenAI
      const fallbackService = this.services.get('openai');
      if (!fallbackService) {
        throw new Error('No text processing service available');
      }
      return await fallbackService.processText(text);
    }

    try {
      return await service.processText(text);
    } catch (error) {
      console.error('DeepSeek text processing failed:', error);
      
      // 降级到OpenAI
      const fallbackService = this.services.get('openai');
      if (fallbackService) {
        return await fallbackService.processText(text);
      }
      
      throw error;
    }
  }

  private async processWithHybridStrategy(imageData: string): Promise<AIProcessResult> {
    // 并行处理，取最佳结果
    const promises: Promise<AIProcessResult>[] = [];

    // DeepSeek处理
    const deepseekService = this.services.get('deepseek');
    if (deepseekService && deepseekService instanceof DeepSeekService) {
      promises.push(deepseekService.processReceipt(imageData));
    }

    // OpenAI处理
    const openaiService = this.services.get('openai');
    if (openaiService) {
      promises.push(openaiService.processImage(imageData));
    }

    // 腾讯OCR处理
    const tencentService = this.services.get('tencent');
    if (tencentService) {
      promises.push(tencentService.processImage(imageData));
    }

    if (promises.length === 0) {
      throw new Error('No AI services available');
    }

    try {
      const results = await Promise.allSettled(promises);
      const successResults = results
        .filter((result): result is PromiseFulfilledResult<AIProcessResult> => result.status === 'fulfilled')
        .map(result => result.value);

      if (successResults.length === 0) {
        throw new Error('All AI services failed');
      }

      // 选择置信度最高的结果
      return successResults.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
    } catch (error) {
      // 如果并行处理失败，尝试串行处理
      for (const promise of promises) {
        try {
          return await promise;
        } catch (serviceError) {
          console.error('Service failed:', serviceError);
          continue;
        }
      }
      
      throw error;
    }
  }

  // 获取服务状态
  getServiceStatus(): Record<AIProvider, boolean> {
    return {
      deepseek: this.services.has('deepseek'),
      openai: this.services.has('openai'),
      tencent: this.services.has('tencent'),
      hybrid: this.services.has('deepseek') || this.services.has('openai') || this.services.has('tencent'),
    };
  }

  // 获取推荐的处理方式
  getRecommendedProvider(inputType: 'screenshot' | 'voice' | 'receipt'): AIProvider {
    switch (inputType) {
      case 'screenshot':
        return this.services.has('deepseek') ? 'deepseek' : (this.services.has('openai') ? 'openai' : 'tencent');
      case 'voice':
        return 'openai'; // 语音处理需要OpenAI
      case 'receipt':
        return this.services.has('deepseek') && this.services.has('openai') && this.services.has('tencent') ? 'hybrid' : 'deepseek';
      default:
        return this.services.has('deepseek') ? 'deepseek' : 'openai';
    }
  }
}

// 全局单例
export const aiServiceManager = AIServiceManager.getInstance();