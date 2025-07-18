import { AIProcessResult } from '@/types';

export abstract class BaseAIService {
  protected apiKey: string;
  protected timeout: number;
  protected maxRetries: number;

  constructor(apiKey: string, timeout: number = 30000, maxRetries: number = 3) {
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  abstract processImage(imageData: string): Promise<AIProcessResult>;
  abstract processText(text: string): Promise<AIProcessResult>;
  abstract processAudio(audioData: string): Promise<AIProcessResult>;

  protected async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) {
          throw lastError;
        }
        
        // 指数退避
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  protected createTimeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      })
    ]);
  }

  protected standardizeResult(rawResult: any, inputMethod: 'screenshot' | 'voice' | 'receipt'): AIProcessResult {
    return {
      amount: this.extractAmount(rawResult),
      category: this.extractCategory(rawResult),
      merchant: this.extractMerchant(rawResult),
      description: this.extractDescription(rawResult),
      timestamp: this.extractTimestamp(rawResult),
      confidence: this.extractConfidence(rawResult),
      inputMethod,
      rawData: rawResult,
      suggestions: this.extractSuggestions(rawResult),
      needsConfirmation: this.extractConfidence(rawResult) < 0.8,
    };
  }

  protected extractAmount(data: any): number {
    // 从各种格式中提取金额
    const amountStr = data.amount || data.money || data.price || '0';
    const amount = parseFloat(amountStr.toString().replace(/[^\d.]/g, ''));
    return isNaN(amount) ? 0 : amount;
  }

  protected extractCategory(data: any): string {
    return data.category || data.type || data.classification || '其他';
  }

  protected extractMerchant(data: any): string {
    return data.merchant || data.store || data.shop || data.vendor || '未知商户';
  }

  protected extractDescription(data: any): string {
    return data.description || data.note || data.memo || data.remark || '';
  }

  protected extractTimestamp(data: any): string {
    if (data.timestamp) return data.timestamp;
    if (data.time) return data.time;
    if (data.date) return data.date;
    return new Date().toISOString();
  }

  protected extractConfidence(data: any): number {
    const confidence = data.confidence || data.score || 0.5;
    return Math.max(0, Math.min(1, confidence));
  }

  protected extractSuggestions(data: any): string[] {
    return data.suggestions || data.alternatives || [];
  }
}