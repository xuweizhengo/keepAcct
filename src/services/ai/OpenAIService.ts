import { BaseAIService } from './BaseAIService';
import { AIProcessResult } from '@/types';
import { AIConfig } from '@/utils/config';
import OpenAI from 'openai';

export class OpenAIService extends BaseAIService {
  private client: OpenAI;

  constructor() {
    super(AIConfig.OPENAI.apiKey, AIConfig.OPENAI.timeout);
    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  async processImage(imageData: string): Promise<AIProcessResult> {
    return this.retry(async () => {
      const response = await this.createTimeoutPromise(
        this.client.chat.completions.create({
          model: AIConfig.OPENAI.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: this.getImageAnalysisPrompt(),
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageData}`,
                  },
                },
              ],
            },
          ],
          max_tokens: AIConfig.OPENAI.maxTokens,
          temperature: AIConfig.OPENAI.temperature,
        }),
        this.timeout
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsedResult = this.parseJSONResponse(content);
      return this.standardizeResult(parsedResult, 'screenshot');
    });
  }

  async processText(text: string): Promise<AIProcessResult> {
    return this.retry(async () => {
      const response = await this.createTimeoutPromise(
        this.client.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: this.getTextAnalysisPrompt(text),
            },
          ],
          max_tokens: AIConfig.OPENAI.maxTokens,
          temperature: AIConfig.OPENAI.temperature,
        }),
        this.timeout
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsedResult = this.parseJSONResponse(content);
      return this.standardizeResult(parsedResult, 'voice');
    });
  }

  async processAudio(audioData: string): Promise<AIProcessResult> {
    return this.retry(async () => {
      // 首先使用 Whisper 转录音频
      const transcription = await this.createTimeoutPromise(
        this.client.audio.transcriptions.create({
          file: Buffer.from(audioData, 'base64') as any,
          model: 'whisper-1',
          language: 'zh',
        }),
        this.timeout
      );

      // 然后分析转录的文本
      return this.processText(transcription.text);
    });
  }

  private getImageAnalysisPrompt(): string {
    return `
      分析这张图片，提取消费记录信息。请识别以下内容：

      1. 如果是支付APP截图（支付宝、微信支付等），提取：
         - 支付金额
         - 收款方名称
         - 支付时间
         - 订单号（如果有）

      2. 如果是小票/发票，提取：
         - 总金额
         - 商户名称
         - 消费时间
         - 商品列表（如果清晰）

      3. 根据商户名称智能分类：
         - 餐饮（餐厅、咖啡店、外卖等）
         - 购物（超市、商场、网购等）
         - 交通（打车、公交、地铁等）
         - 娱乐（电影、游戏、KTV等）
         - 医疗（医院、药店等）
         - 教育（学校、培训等）
         - 生活缴费（水电气、话费等）
         - 其他

      请以JSON格式返回：
      {
        "amount": 金额(数字),
        "merchant": "商户名称",
        "category": "消费类别",
        "description": "详细描述",
        "timestamp": "时间(ISO格式)",
        "confidence": 置信度(0-1),
        "suggestions": ["可能的替代分类"],
        "order_id": "订单号(如果有)",
        "payment_method": "支付方式"
      }

      注意：
      - 金额只返回数字，不包含货币符号
      - 时间格式为ISO 8601
      - 置信度基于识别清晰度
      - 如果信息不确定，降低置信度
    `;
  }

  private getTextAnalysisPrompt(text: string): string {
    return `
      分析这段语音转文字的消费记录："${text}"

      请提取以下信息：
      1. 消费金额
      2. 商户名称或消费地点
      3. 消费类别
      4. 详细描述

      根据描述智能分类：
      - 餐饮：餐厅、咖啡、外卖、零食等
      - 购物：超市、商场、网购、日用品等
      - 交通：打车、公交、地铁、加油等
      - 娱乐：电影、游戏、KTV、旅游等
      - 医疗：医院、药店、体检等
      - 教育：学费、培训、书籍等
      - 生活缴费：水电气、话费、房租等
      - 其他：无法明确分类的消费

      请以JSON格式返回：
      {
        "amount": 金额(数字),
        "merchant": "商户名称",
        "category": "消费类别",
        "description": "详细描述",
        "timestamp": "当前时间(ISO格式)",
        "confidence": 置信度(0-1),
        "suggestions": ["可能的替代分类"],
        "payment_method": "支付方式(现金/卡/移动支付)"
      }

      示例：
      输入："我在星巴克买了一杯咖啡35块钱"
      输出：{
        "amount": 35,
        "merchant": "星巴克",
        "category": "餐饮",
        "description": "咖啡",
        "timestamp": "2024-01-15T10:30:00Z",
        "confidence": 0.95,
        "suggestions": ["饮品"],
        "payment_method": "移动支付"
      }
    `;
  }

  private parseJSONResponse(content: string): any {
    try {
      // 提取JSON内容
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response from AI service');
    }
  }
}