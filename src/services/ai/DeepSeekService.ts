import { BaseAIService } from './BaseAIService';
import { AIServiceResponse, ExpenseRecord } from '../../types';
import axios from 'axios';

export class DeepSeekService extends BaseAIService {
  protected apiKey: string;
  private baseUrl: string = 'https://api.deepseek.com/v1';

  constructor(apiKey: string) {
    super(apiKey);
  }

  async processScreenshot(imageData: string): Promise<AIServiceResponse> {
    const prompt = `请分析这张支付截图，提取以下信息并以JSON格式返回：
    {
      "amount": 数字(支付金额),
      "merchant": "商户名称",
      "description": "商品描述",
      "category": "消费类型(如：餐饮、交通、购物、娱乐等)",
      "timestamp": "支付时间(ISO格式)",
      "confidence": 数字(识别置信度0-1),
      "paymentMethod": "支付方式(如：支付宝、微信、银行卡等)"
    }
    
    请仔细识别截图中的关键信息，如果某些信息不确定，请在confidence中反映。`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageData}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const result = response.data.choices[0].message.content;
      const parsedResult = this.parseJSONResponse(result);
      
      return {
        success: true,
        data: parsedResult,
        confidence: parsedResult.confidence || 0.8,
        service: 'deepseek',
        processingTime: Date.now(),
      };
    } catch (error) {
      console.error('DeepSeek screenshot processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        service: 'deepseek',
        processingTime: Date.now(),
      };
    }
  }

  async processVoice(audioData: string): Promise<AIServiceResponse> {
    // DeepSeek 暂时不支持语音识别，使用文本处理
    return {
      success: false,
      error: 'DeepSeek does not support voice processing directly',
      confidence: 0,
      service: 'deepseek',
      processingTime: Date.now(),
    };
  }

  async processAudio(audioData: string): Promise<AIServiceResponse> {
    return this.processVoice(audioData);
  }

  async processImage(imageData: string): Promise<AIServiceResponse> {
    return this.processScreenshot(imageData);
  }

  async processText(text: string): Promise<AIServiceResponse> {
    const prompt = `请分析以下消费描述，提取关键信息并以JSON格式返回：
    
    "${text}"
    
    返回格式：
    {
      "amount": 数字(支付金额),
      "merchant": "商户名称",
      "description": "商品描述",
      "category": "消费类型(如：餐饮、交通、购物、娱乐等)",
      "timestamp": "当前时间(ISO格式)",
      "confidence": 数字(识别置信度0-1),
      "paymentMethod": "支付方式(如：现金、支付宝、微信等)"
    }
    
    如果某些信息无法确定，请合理推测并在confidence中反映准确度。`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const result = response.data.choices[0].message.content;
      const parsedResult = this.parseJSONResponse(result);
      
      return {
        success: true,
        data: parsedResult,
        confidence: parsedResult.confidence || 0.8,
        service: 'deepseek',
        processingTime: Date.now(),
      };
    } catch (error) {
      console.error('DeepSeek text processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        service: 'deepseek',
        processingTime: Date.now(),
      };
    }
  }

  async processReceipt(imageData: string): Promise<AIServiceResponse> {
    const prompt = `请分析这张小票/发票图片，提取消费信息并以JSON格式返回：
    {
      "amount": 数字(总金额),
      "merchant": "商户名称",
      "description": "主要商品描述",
      "category": "消费类型(如：餐饮、购物、超市等)",
      "timestamp": "消费时间(ISO格式，如果小票上有的话)",
      "confidence": 数字(识别置信度0-1),
      "items": [
        {
          "name": "商品名称",
          "price": 数字,
          "quantity": 数字
        }
      ]
    }
    
    请仔细识别小票上的所有信息，特别关注总金额、商户名称和消费时间。`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageData}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const result = response.data.choices[0].message.content;
      const parsedResult = this.parseJSONResponse(result);
      
      return {
        success: true,
        data: parsedResult,
        confidence: parsedResult.confidence || 0.8,
        service: 'deepseek',
        processingTime: Date.now(),
      };
    } catch (error) {
      console.error('DeepSeek receipt processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        service: 'deepseek',
        processingTime: Date.now(),
      };
    }
  }

  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 10000,
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('DeepSeek service availability check failed:', error);
      return false;
    }
  }

  getServiceInfo() {
    return {
      name: 'DeepSeek',
      version: '1.0.0',
      capabilities: ['screenshot', 'text', 'receipt'],
      maxImageSize: 20 * 1024 * 1024, // 20MB
      supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    };
  }

  private parseJSONResponse(response: string): any {
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 如果没有找到JSON，尝试整体解析
      return JSON.parse(response);
    } catch (error) {
      console.error('JSON parsing error:', error);
      // 如果解析失败，返回默认结构
      return {
        amount: 0,
        merchant: '未知商户',
        description: '识别失败',
        category: '其他',
        timestamp: new Date().toISOString(),
        confidence: 0.1,
        paymentMethod: '未知',
      };
    }
  }
}