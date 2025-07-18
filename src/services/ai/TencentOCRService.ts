import { BaseAIService } from './BaseAIService';
import { AIProcessResult } from '@/types';
import { AIConfig } from '@/utils/config';
import * as crypto from 'crypto';

export class TencentOCRService extends BaseAIService {
  private secretId: string;
  private secretKey: string;
  private region: string;
  private endpoint: string;

  constructor() {
    super('', AIConfig.OPENAI.timeout);
    this.secretId = AIConfig.TENCENT.secretId;
    this.secretKey = AIConfig.TENCENT.secretKey;
    this.region = AIConfig.TENCENT.region;
    this.endpoint = AIConfig.TENCENT.endpoint;
  }

  async processImage(imageData: string): Promise<AIProcessResult> {
    return this.retry(async () => {
      const response = await this.createTimeoutPromise(
        this.callTencentOCR(imageData),
        this.timeout
      );

      return this.standardizeResult(response, 'receipt');
    });
  }

  async processText(text: string): Promise<AIProcessResult> {
    // 腾讯OCR主要用于图像处理，文本处理交给其他服务
    throw new Error('TencentOCRService does not support text processing');
  }

  async processAudio(audioData: string): Promise<AIProcessResult> {
    // 腾讯OCR主要用于图像处理，音频处理交给其他服务
    throw new Error('TencentOCRService does not support audio processing');
  }

  private async callTencentOCR(imageData: string): Promise<any> {
    const action = 'GeneralBasicOCR';
    const version = '2018-11-19';
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().substr(0, 10);

    const payload = {
      ImageBase64: imageData,
      LanguageType: 'zh',
      Scene: 'doc',
    };

    const payloadStr = JSON.stringify(payload);

    // 构建签名
    const signature = this.buildSignature(action, version, timestamp, date, payloadStr);

    const headers = {
      'Authorization': signature,
      'Content-Type': 'application/json; charset=utf-8',
      'Host': this.endpoint,
      'X-TC-Action': action,
      'X-TC-Timestamp': timestamp.toString(),
      'X-TC-Version': version,
      'X-TC-Region': this.region,
    };

    const response = await fetch(`https://${this.endpoint}`, {
      method: 'POST',
      headers,
      body: payloadStr,
    });

    if (!response.ok) {
      throw new Error(`Tencent OCR API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.Response.Error) {
      throw new Error(`Tencent OCR error: ${result.Response.Error.Message}`);
    }

    return this.parseTencentOCRResponse(result.Response);
  }

  private buildSignature(action: string, version: string, timestamp: number, date: string, payload: string): string {
    const service = 'ocr';
    const algorithm = 'TC3-HMAC-SHA256';
    
    // 构建规范请求串
    const httpRequestMethod = 'POST';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${this.endpoint}\n`;
    const signedHeaders = 'content-type;host';
    const hashedRequestPayload = crypto.createHash('sha256').update(payload).digest('hex');
    
    const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;
    
    // 构建待签名字符串
    const credentialScope = `${date}/${service}/tc3_request`;
    const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
    
    // 计算签名
    const secretDate = crypto.createHmac('sha256', `TC3${this.secretKey}`).update(date).digest();
    const secretService = crypto.createHmac('sha256', secretDate).update(service).digest();
    const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest();
    const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');
    
    return `${algorithm} Credential=${this.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private parseTencentOCRResponse(response: any): any {
    const textDetections = response.TextDetections || [];
    const fullText = textDetections.map((item: any) => item.DetectedText).join(' ');
    
    // 尝试从OCR结果中提取信息
    const amount = this.extractAmountFromText(fullText);
    const merchant = this.extractMerchantFromText(fullText);
    const timestamp = this.extractTimestampFromText(fullText);
    
    return {
      amount,
      merchant,
      category: this.categorizeMerchant(merchant),
      description: fullText,
      timestamp: timestamp || new Date().toISOString(),
      confidence: this.calculateConfidence(textDetections),
      full_text: fullText,
      raw_detections: textDetections,
    };
  }

  private extractAmountFromText(text: string): number {
    // 匹配金额模式
    const amountPatterns = [
      /¥(\d+(?:\.\d{2})?)/g,
      /(\d+(?:\.\d{2})?)\s*元/g,
      /金额[：:]\s*(\d+(?:\.\d{2})?)/g,
      /总计[：:]\s*(\d+(?:\.\d{2})?)/g,
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseFloat(match[1]);
      }
    }

    return 0;
  }

  private extractMerchantFromText(text: string): string {
    // 尝试提取商户名称
    const merchantPatterns = [
      /收款方[：:]\s*([^\s\n]+)/,
      /商户[：:]\s*([^\s\n]+)/,
      /店铺[：:]\s*([^\s\n]+)/,
    ];

    for (const pattern of merchantPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '未知商户';
  }

  private extractTimestampFromText(text: string): string | null {
    // 匹配时间模式
    const timePatterns = [
      /(\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}:\d{2})/,
      /(\d{4}[-/]\d{2}[-/]\d{2})/,
      /(\d{2}:\d{2}:\d{2})/,
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return new Date(match[1]).toISOString();
      }
    }

    return null;
  }

  private categorizeMerchant(merchant: string): string {
    // 根据商户名称分类
    const categoryKeywords = {
      '餐饮': ['餐厅', '咖啡', '茶', '饭店', '面条', '火锅', '烧烤', '快餐'],
      '购物': ['超市', '商场', '店', '购物', '商城', '市场'],
      '交通': ['出租', '滴滴', '公交', '地铁', '停车', '加油'],
      '娱乐': ['电影', '游戏', 'KTV', '酒吧', '健身'],
      '医疗': ['医院', '药店', '诊所', '体检'],
      '教育': ['学校', '培训', '书店', '图书'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => merchant.includes(keyword))) {
        return category;
      }
    }

    return '其他';
  }

  private calculateConfidence(detections: any[]): number {
    if (!detections || detections.length === 0) return 0;

    const avgConfidence = detections.reduce((sum, detection) => sum + detection.Confidence, 0) / detections.length;
    return avgConfidence / 100; // 转换为0-1范围
  }
}