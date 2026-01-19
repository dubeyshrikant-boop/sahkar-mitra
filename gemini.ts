
import { GoogleGenAI } from "@google/genai";
import { Document, Message } from "./types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async chat(
    userMessage: string,
    history: Message[],
    documents: Document[]
  ): Promise<{ text: string; sources: string[] }> {
    const readyDocs = documents.filter(d => d.status === 'ready');
    let contextString = "सिस्टम संदर्भ (SYSTEM CONTEXT):\n\n";
    
    if (readyDocs.length > 0) {
      readyDocs.forEach(doc => {
        contextString += `--- ${doc.name} मधील मजकूर ---\n${doc.content}\n\n`;
      });
    } else {
      contextString += "कोणतीही फाईल उपलब्ध नाही. कृपया गुगल सर्च वापरा.\n";
    }

    const systemInstruction = `
      तुम्ही 'सहकार मित्र प्रो' (Sahkar Mitra Pro) एआय आहात. महाराष्ट्रातील सहकारी गृहनिर्माण संस्थांच्या (Housing Societies) कायद्यांविषयी तुम्ही तज्ज्ञ सल्लागार आहात.
      
      नियम:
      १. तुमचे सर्व उत्तर फक्त आणि फक्त मराठीत (Marathi) असावेत.
      २. प्रत्येक उत्तराची सुरुवात "सीए श्रीकांत दुबे यांच्या मार्गदर्शनानुसार," या वाक्याने करा.
      ३. प्रदान केलेल्या संदर्भाचा (Context) वापर करा. जर उत्तर तिथे नसेल, तर अचूक माहितीसाठी Google Search वापरा.
      ४. उत्तरे कायदेशीर भाषेत पण समजण्यास सोपी असावीत.
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
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      
      if (groundingMetadata?.groundingChunks) {
        groundingMetadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) sources.push(chunk.web.uri);
          if (chunk.web?.title) console.log("Source Title:", chunk.web.title);
        });
      }

      return {
        text: response.text || "क्षमस्व, मी सध्या उत्तर देऊ शकत नाही. कृपया पुन्हा प्रयत्न करा.",
        sources: Array.from(new Set(sources))
      };
    } catch (err) {
      console.error("Gemini Error:", err);
      return { 
        text: "तांत्रिक अडचण आली आहे. सीए श्रीकांत दुबे यांना थेट संपर्क करण्यासाठी 'Ask CA' बटन वापरा.", 
        sources: [] 
      };
    }
  }
}
