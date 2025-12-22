
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, SearchResult } from "../types";

// @ts-ignore
const API_KEY = (typeof process !== 'undefined' ? process.env.API_KEY : '') || '';

export const searchLeads = async (query: string, location?: string): Promise<SearchResult> => {
  if (!API_KEY) {
    console.error("API_KEY não encontrada no ambiente.");
  }
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const fullPrompt = `Encontre empresas, estabelecimentos comerciais, condomínios ou instituições do ramo de "${query}" na região de "${location || 'Brasil'}". 
  O objetivo é identificar potenciais compradores de materiais de limpeza em larga escala.
  Tente encontrar o número de telefone de contato (WhatsApp ou fixo) para cada lead.
  Forneça detalhes como nome, o que fazem, telefone e uma breve justificativa de por que precisam de produtos de limpeza agora.
  Crie também um "título" curto e chamativo para cada lead (ex: "Condomínio de Alto Padrão", "Hospital Regional", "Academia Premium").`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: fullPrompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          leads: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING, description: "Um título curto e chamativo para o lead" },
                businessType: { type: Type.STRING },
                location: { type: Type.STRING },
                description: { type: Type.STRING },
                website: { type: Type.STRING },
                phone: { type: Type.STRING, description: "Número de telefone ou WhatsApp do estabelecimento" },
                score: { type: Type.NUMBER, description: "Score de 1 a 100 de quão bom o lead parece ser para venda de materiais de limpeza" }
              },
              required: ["name", "title", "businessType", "location", "description", "score"]
            }
          }
        }
      }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const groundingLinks = groundingChunks
    .filter(chunk => chunk.web)
    .map(chunk => ({
      title: chunk.web?.title || 'Fonte',
      uri: chunk.web?.uri || ''
    }));

  try {
    const data = JSON.parse(response.text || '{"leads":[]}');
    return {
      leads: data.leads.map((l: any) => ({
        ...l,
        id: Math.random().toString(36).substr(2, 9),
        status: 'Novo'
      })),
      groundingLinks
    };
  } catch (e) {
    console.error("Erro ao processar JSON do Gemini", e);
    return { leads: [], groundingLinks: [] };
  }
};

export const generateOutreach = async (lead: Lead, myBusiness: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `Crie uma mensagem de WhatsApp persuasiva para abordar o lead "${lead.name}".
  Dados do lead: ${lead.description}. Local: ${lead.location}.
  
  Sobre meu negócio: ${myBusiness}.
  
  DIRETRIZES DA MENSAGEM:
  1. Comece de forma amigável e profissional.
  2. Mencione que queremos trazer INOVAÇÃO e QUALIDADE superior na rotina de limpeza deles.
  3. Destaque que somos distribuidores completos e temos fábricas próprias das marcas TALIMPO (saneantes) e SUPERAPLAST (sacos de lixo).
  4. Enfatize que além dessas marcas, oferecemos uma linha completa de produtos para todas as necessidades.
  5. Seja breve, direto e peça uma oportunidade para apresentar as soluções inovadoras que temos.
  6. IMPORTANTE: Sempre assine a mensagem EXATAMENTE como: "Vital, material de limpeza".
  7. Use emojis de forma profissional e moderada.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || "Erro ao gerar mensagem automática.";
};
