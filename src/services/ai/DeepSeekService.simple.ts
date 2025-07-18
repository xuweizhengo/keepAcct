import { BaseAIService } from './BaseAIService';
import { AIProcessResult } from '../../types';
import axios from 'axios';

export class DeepSeekService extends BaseAIService {
  private baseUrl: string = 'https://api.deepseek.com/v1';

  constructor(apiKey: string) {
    super(apiKey);
  }

  async processImage(imageData: string): Promise<AIProcessResult> {
    const prompt = `请分析这张图片，提取消费信息并以JSON格式返回：
    {
      "amount": 数字,
      "category": "分类",
      "merchant": "商户",
      "description": "描述",
      "timestamp": "时间",
      "confidence": 0.9,
      "inputMethod": "screenshot",
      "rawData": {},
      "needsConfirmation": false
    }`;

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
        amount: parsedResult.amount || 0,
        category: parsedResult.category || '其他',
        merchant: parsedResult.merchant || '未知商户',
        description: parsedResult.description || '无描述',
        timestamp: parsedResult.timestamp || new Date().toISOString(),
        confidence: parsedResult.confidence || 0.8,
        inputMethod: 'screenshot',
        rawData: parsedResult,
        needsConfirmation: false,
      };
    } catch (error) {
      console.error('DeepSeek processing error:', error);
      return this.getErrorResult();
    }
  }

  async processText(text: string): Promise<AIProcessResult> {
    const prompt = `请分析以下消费描述，提取信息并以JSON格式返回：
    "${text}"
    
    返回格式：
    {
      "amount": 数字,
      "category": "分类",
      "merchant": "商户",
      "description": "描述",
      "timestamp": "当前时间",
      "confidence": 0.8
    }`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
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
        amount: parsedResult.amount || 0,
        category: parsedResult.category || '其他',
        merchant: parsedResult.merchant || '未知商户',
        description: parsedResult.description || text,
        timestamp: parsedResult.timestamp || new Date().toISOString(),
        confidence: parsedResult.confidence || 0.8,
        inputMethod: 'voice',
        rawData: parsedResult,
        needsConfirmation: false,
      };
    } catch (error) {
      console.error('DeepSeek text processing error:', error);
      return this.getErrorResult();
    }
  }

  async processAudio(audioData: string): Promise<AIProcessResult> {
    // DeepSeek不支持音频处理，返回错误结果
    return this.getErrorResult();
  }

  private parseJSONResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('JSON parsing error:', error);
      return {};
    }
  }

  private getErrorResult(): AIProcessResult {
    return {
      amount: 0,
      category: '其他',
      merchant: '识别失败',
      description: '处理失败',
      timestamp: new Date().toISOString(),
      confidence: 0.1,
      inputMethod: 'screenshot',
      rawData: {},
      needsConfirmation: true,
    };
  }
}