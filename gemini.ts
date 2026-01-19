
import { GoogleGenAI } from "@google/genai";
import { Document, Message } from "./types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  async chat(
    userMessage: string,
    history: Message[],
    documents: Document[]
  ): Promise<{ text: string; sources: string[] }> {
    const readyDocs = documents.filter(d => d.status === 'ready');
    let contextString = "SYSTEM CONTEXT (RELIABLE DATA):\n\n";
    readyDocs.forEach(doc => {
      contextString += `--- CONTENT FROM ${doc.name} ---\n${doc.content}\n\n`;
    });

    const systemInstruction = `
      You are Sahkar Mitra Pro AI, a legal advisor for Housing Societies in Maharashtra.
      Rules: 
      1. RESPOND ONLY IN MARATHI.
      2. Always mention "सीए श्रीकांत दुबे यांच्या मार्गदर्शनानुसार".
      3. Use provided context. If not enough, use Google Search tool.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...history.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const sources: string[] = [];
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) sources.push(chunk.web.uri);
        });
      }

      return {
        text: response.text || "क्षमस्व, मी सध्या उत्तर देऊ शकत नाही.",
        sources: Array.from(new Set(sources))
      };
    } catch (err) {
      console.error("Gemini Error:", err);
      return { text: "तांत्रिक त्रुटी आली आहे.", sources: [] };
    }
  }
}
