import { GoogleGenAI, Type } from "@google/genai";
import { LineItem } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // 1. 자연어 입력을 받아 견적서 항목 리스트(JSON)로 변환
  async generateQuoteDraft(prompt: string, currency: string): Promise<LineItem[]> {
    const model = "gemini-3-flash-preview";
    
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: `Create a structured list of quote line items based on this request: "${prompt}". 
                   Currency context: ${currency}. 
                   If quantity is not specified, assume 1.
                   If tax/discount is not specified, use 0.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING, description: "Professional service or item name" },
                    quantity: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    taxRate: { type: Type.NUMBER, description: "Percentage, usually 10 for VAT" },
                    discount: { type: Type.NUMBER, description: "Discount amount" },
                  },
                  required: ["description", "quantity", "unitPrice"]
                }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || '{"items": []}');
      
      // ID와 기본값 주입
      return parsed.items.map((item: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        taxRate: item.taxRate || 10,
        discount: item.discount || 0,
        discountType: 'amount'
      }));

    } catch (error) {
      console.error("Gemini Parsing Error:", error);
      return [];
    }
  }

  // 2. 설명 문구 다듬기
  async polishDescription(description: string, language: 'en' | 'ko'): Promise<string> {
    const prompt = language === 'ko' 
      ? `다음 견적서 항목 설명을 전문적인 비즈니스 용어로 다듬어 주세요. 설명만 출력하세요: "${description}"`
      : `Rewrite the following quotation line item description into professional business language. Output only the description: "${description}"`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text?.trim() || description;
    } catch (error) {
      return description;
    }
  }

  // 3. 약관 생성
  async generateTerms(businessType: string, language: 'en' | 'ko'): Promise<string> {
    const prompt = language === 'ko'
      ? `${businessType} 비즈니스를 위한 표준 견적서 이용약관(Terms and Conditions)을 5개 항목 내외의 글머리 기호로 작성해 주세요.`
      : `Write a summarized standard Terms and Conditions for a ${businessType} business quotation, around 5 bullet points.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text?.trim() || "Default Terms apply.";
    } catch (error) {
      return "Terms could not be generated.";
    }
  }
}

export const geminiService = new GeminiService();