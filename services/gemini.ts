
import { GoogleGenAI } from "@google/genai";
import { Lead, SearchResult } from "../types";

// Declare process para satisfazer o TS sem @types/node
declare const process: {
  env: {
    API_KEY: string;
  };
};

export const searchLeads = async (query: string, location?: string): Promise<SearchResult> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const fullPrompt = `Você é um especialista em prospecção de vendas B2B. 
Encontre empresas, estabelecimentos, condomínios ou instituições do ramo de "${query}" na região de "${location || 'Brasil'}".
O objetivo é identificar potenciais compradores de materiais de limpeza (marcas Talimpo e Superaplast).

Para cada lead encontrado via Google Search, extraia:
1. Nome oficial
2. Um título curto (ex: "Condomínio de Luxo", "Hospital Regional")
3. Tipo de negócio
4. Localização exata (Bairro/Cidade)
5. Telefone ou WhatsApp de contato (MUITO IMPORTANTE)
6. Uma breve descrição de por que eles precisam de produtos de limpeza profissional agora.
7. Um Score de 1 a 100 de potencial de venda.

Responda OBRIGATORIAMENTE seguindo este formato JSON dentro de um bloco de código:
{
  "leads": [
    {
      "name": "Nome",
      "title": "Título",
      "businessType": "Tipo",
      "location": "Local",
      "description": "Por que prospectar...",
      "phone": "Telefone",
      "score": 85
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: fullPrompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const text = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const groundingLinks = groundingChunks
    .filter(chunk => chunk.web)
    .map(chunk => ({
      title: chunk.web?.title || 'Fonte',
      uri: chunk.web?.uri || ''
    }));

  try {
    // Extrai o JSON de dentro do bloco de código markdown se existir
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    const jsonString = jsonMatch ? jsonMatch[0].replace(/```json|```/g, '') : '{"leads":[]}';
    const data = JSON.parse(jsonString);
    
    return {
      leads: (data.leads || []).map((l: any) => ({
        ...l,
        id: Math.random().toString(36).substr(2, 9),
        status: 'Novo'
      })),
      groundingLinks
    };
  } catch (e) {
    console.error("Erro ao processar resposta do Gemini:", e);
    // Fallback: tenta encontrar leads no texto de forma mais simples se o JSON falhar
    return { leads: [], groundingLinks: [] };
  }
};

export const generateOutreach = async (lead: Lead, myBusiness: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Crie uma mensagem de WhatsApp persuasiva para abordar o lead "${lead.name}".
  Dados do lead: ${lead.description}. Local: ${lead.location}.
  
  Sobre meu negócio: ${myBusiness}.
  
  DIRETRIZES DA MENSAGEM:
  1. Comece de forma amigável e profissional.
  2. Mencione inovação e qualidade superior.
  3. Destaque marcas próprias TALIMPO (químicos) e SUPERAPLAST (sacos de lixo).
  4. Seja breve e peça uma oportunidade de apresentação.
  5. Assine sempre como: "Vital, material de limpeza".`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || "Olá, gostaria de apresentar nossas soluções em limpeza.";
};
