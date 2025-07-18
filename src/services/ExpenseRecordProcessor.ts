import { ExpenseRecord, AIProcessResult, ProcessingResult } from '@/types';
import { aiServiceManager } from './ai/AIServiceManager';
import { Categories } from '@/utils/config';

export class ExpenseRecordProcessor {
  private static instance: ExpenseRecordProcessor;

  private constructor() {}

  static getInstance(): ExpenseRecordProcessor {
    if (!ExpenseRecordProcessor.instance) {
      ExpenseRecordProcessor.instance = new ExpenseRecordProcessor();
    }
    return ExpenseRecordProcessor.instance;
  }

  /**
   * 处理截图输入
   */
  async processScreenshot(imageData: string): Promise<ProcessingResult> {
    try {
      const aiResult = await aiServiceManager.processScreenshot(imageData);
      const record = this.convertToExpenseRecord(aiResult);
      return { success: true, record };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 处理语音输入
   */
  async processVoice(audioData: string): Promise<ProcessingResult> {
    try {
      const aiResult = await aiServiceManager.processVoice(audioData);
      const record = this.convertToExpenseRecord(aiResult);
      return { success: true, record };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 处理小票拍照
   */
  async processReceipt(imageData: string): Promise<ProcessingResult> {
    try {
      const aiResult = await aiServiceManager.processReceipt(imageData);
      const record = this.convertToExpenseRecord(aiResult);
      return { success: true, record };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 处理文本输入
   */
  async processText(text: string): Promise<ProcessingResult> {
    try {
      const aiResult = await aiServiceManager.processText(text);
      const record = this.convertToExpenseRecord(aiResult);
      return { success: true, record };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 将AI处理结果转换为标准的ExpenseRecord
   */
  private convertToExpenseRecord(aiResult: AIProcessResult): ExpenseRecord {
    const record: ExpenseRecord = {
      id: this.generateId(),
      amount: this.validateAmount(aiResult.amount),
      category: this.normalizeCategory(aiResult.category),
      merchant: this.normalizeMerchant(aiResult.merchant),
      description: aiResult.description || '',
      timestamp: aiResult.timestamp || new Date().toISOString(),
      confidence: aiResult.confidence,
      inputMethod: aiResult.inputMethod,
      tags: this.generateTags(aiResult),
      rawData: aiResult.rawData,
      currency: 'CNY',
      verified: aiResult.confidence > 0.8,
      syncStatus: 'pending',
    };

    return this.enhanceRecord(record);
  }

  /**
   * 增强记录信息
   */
  private enhanceRecord(record: ExpenseRecord): ExpenseRecord {
    // 根据商户名称进一步优化分类
    const enhancedCategory = this.enhanceCategory(record.merchant, record.category);
    
    // 生成智能标签
    const enhancedTags = this.enhanceTags(record);
    
    // 检测异常
    const anomaly = this.detectAnomaly(record);
    
    return {
      ...record,
      category: enhancedCategory,
      tags: enhancedTags,
      ...(anomaly && { anomaly }),
    };
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证金额格式
   */
  private validateAmount(amount: number): number {
    if (isNaN(amount) || amount < 0) {
      return 0;
    }
    // 保留两位小数
    return Math.round(amount * 100) / 100;
  }

  /**
   * 标准化类别名称
   */
  private normalizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      '食物': Categories.FOOD,
      '吃饭': Categories.FOOD,
      '饮食': Categories.FOOD,
      '餐饮': Categories.FOOD,
      '购买': Categories.SHOPPING,
      '买东西': Categories.SHOPPING,
      '消费': Categories.SHOPPING,
      '出行': Categories.TRANSPORT,
      '交通费': Categories.TRANSPORT,
      '娱乐': Categories.ENTERTAINMENT,
      '玩乐': Categories.ENTERTAINMENT,
      '医疗': Categories.HEALTHCARE,
      '看病': Categories.HEALTHCARE,
      '学习': Categories.EDUCATION,
      '教育': Categories.EDUCATION,
      '生活': Categories.UTILITIES,
      '缴费': Categories.UTILITIES,
      '旅游': Categories.TRAVEL,
      '旅行': Categories.TRAVEL,
    };

    return categoryMap[category] || category || Categories.OTHERS;
  }

  /**
   * 标准化商户名称
   */
  private normalizeMerchant(merchant: string): string {
    if (!merchant || merchant.trim() === '') {
      return '未知商户';
    }

    // 移除常见的后缀
    const suffixes = ['有限公司', '(北京)', '(上海)', '(深圳)', '(广州)', '专营店', '旗舰店'];
    let normalized = merchant.trim();
    
    for (const suffix of suffixes) {
      if (normalized.endsWith(suffix)) {
        normalized = normalized.slice(0, -suffix.length);
      }
    }

    return normalized;
  }

  /**
   * 生成标签
   */
  private generateTags(aiResult: AIProcessResult): string[] {
    const tags: string[] = [];

    // 根据输入方式添加标签
    switch (aiResult.inputMethod) {
      case 'screenshot':
        tags.push('移动支付');
        break;
      case 'voice':
        tags.push('语音输入');
        break;
      case 'receipt':
        tags.push('小票');
        break;
    }

    // 根据金额添加标签
    if (aiResult.amount > 1000) {
      tags.push('大额消费');
    } else if (aiResult.amount < 10) {
      tags.push('小额消费');
    }

    // 根据时间添加标签
    const hour = new Date(aiResult.timestamp).getHours();
    if (hour >= 6 && hour < 12) {
      tags.push('早晨');
    } else if (hour >= 12 && hour < 18) {
      tags.push('下午');
    } else if (hour >= 18 && hour < 24) {
      tags.push('晚上');
    } else {
      tags.push('深夜');
    }

    return tags;
  }

  /**
   * 增强标签
   */
  private enhanceTags(record: ExpenseRecord): string[] {
    const tags = [...record.tags];

    // 根据商户名称添加特定标签
    const merchantLower = record.merchant.toLowerCase();
    
    if (merchantLower.includes('星巴克') || merchantLower.includes('starbucks')) {
      tags.push('咖啡');
    } else if (merchantLower.includes('肯德基') || merchantLower.includes('麦当劳')) {
      tags.push('快餐');
    } else if (merchantLower.includes('滴滴') || merchantLower.includes('uber')) {
      tags.push('打车');
    } else if (merchantLower.includes('美团') || merchantLower.includes('饿了么')) {
      tags.push('外卖');
    }

    // 根据描述添加标签
    const descriptionLower = record.description.toLowerCase();
    if (descriptionLower.includes('发票')) {
      tags.push('可报销');
    }

    return [...new Set(tags)]; // 去重
  }

  /**
   * 增强分类
   */
  private enhanceCategory(merchant: string, originalCategory: string): string {
    const merchantLower = merchant.toLowerCase();
    
    // 基于商户名称的精确分类
    const merchantCategoryMap: Record<string, string> = {
      '星巴克': Categories.FOOD,
      '肯德基': Categories.FOOD,
      '麦当劳': Categories.FOOD,
      '必胜客': Categories.FOOD,
      '海底捞': Categories.FOOD,
      '滴滴': Categories.TRANSPORT,
      'uber': Categories.TRANSPORT,
      '美团': Categories.FOOD,
      '饿了么': Categories.FOOD,
      '京东': Categories.SHOPPING,
      '淘宝': Categories.SHOPPING,
      '天猫': Categories.SHOPPING,
      '苏宁': Categories.SHOPPING,
      '万达': Categories.ENTERTAINMENT,
      '华为': Categories.SHOPPING,
      '苹果': Categories.SHOPPING,
      '小米': Categories.SHOPPING,
    };

    for (const [key, category] of Object.entries(merchantCategoryMap)) {
      if (merchantLower.includes(key.toLowerCase())) {
        return category;
      }
    }

    return originalCategory;
  }

  /**
   * 检测异常
   */
  private detectAnomaly(record: ExpenseRecord): string | undefined {
    // 检测异常高额消费
    if (record.amount > 10000) {
      return '异常高额消费';
    }

    // 检测可疑的零金额
    if (record.amount === 0) {
      return '零金额消费';
    }

    // 检测深夜消费
    const hour = new Date(record.timestamp).getHours();
    if (hour >= 0 && hour < 6 && record.amount > 500) {
      return '深夜大额消费';
    }

    return undefined;
  }

  /**
   * 批量处理多个记录
   */
  async processBatch(inputs: Array<{
    type: 'screenshot' | 'voice' | 'receipt' | 'text';
    data: string;
  }>): Promise<ExpenseRecord[]> {
    const promises = inputs.map(input => {
      switch (input.type) {
        case 'screenshot':
          return this.processScreenshot(input.data);
        case 'voice':
          return this.processVoice(input.data);
        case 'receipt':
          return this.processReceipt(input.data);
        case 'text':
          return this.processText(input.data);
        default:
          throw new Error(`Unknown input type: ${input.type}`);
      }
    });

    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<ExpenseRecord> => result.status === 'fulfilled')
      .map(result => result.value);
  }
}

// 全局单例
export const expenseProcessor = ExpenseRecordProcessor.getInstance();