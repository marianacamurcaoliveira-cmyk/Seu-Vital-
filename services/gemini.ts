
import { GoogleGenAI } from "@google/genai";
import { Lead, SearchResult, LocationData } from "../types";

declare const process: {
  env: {
    API_KEY: string;
  };
};

export const searchLeads = async (query: string, regionText: string, coords?: LocationData | null): Promise<SearchResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY não encontrada!");
    return { leads: [], groundingLinks: [] };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Se o usuário escreveu uma região, ignoramos as coordenadas para não confundir a IA
  const finalRegion = regionText || (coords ? `coordenadas ${coords.latitude}, ${coords.longitude}` : "Brasil");

  const fullPrompt = `Você é o Diretor de Inteligência da "Vendas Seu Vital". Sua missão é encontrar CLIENTES REAIS para produtos de limpeza profissional.

SOLICITAÇÃO: "${query}"
LOCALIZAÇÃO: "${finalRegion}"

INSTRUÇÕES DE BUSCA AMPLA:
1. PESQUISA WEB: Use a ferramenta de busca para encontrar: "Lista de ${query} em ${finalRegion}", "Telefones de ${query} em ${finalRegion}", "Instagram de ${query} em ${finalRegion}".
2. CONHECIMENTO INTERNO: Se a pesquisa web não trouxer resultados imediatos, use seu conhecimento sobre a geografia de "${finalRegion}" para listar os 5-10 estabelecimentos mais conhecidos desse ramo na área.
3. FLEXIBILIDADE DE CONTATO: Se não achar o WhatsApp, coloque no campo telefone: "Buscar no Instagram" ou "Visitar no local (Endereço)". NÃO RETORNE LISTA VAZIA.
4. FOCO B2B: Procure por Condomínios, Academias, Restaurantes, Clínicas, Escolas e Hotéis.

FORMATO DE RESPOSTA (JSON APENAS):
{
  "leads": [
    {
      "name": "Nome do Local",
      "businessType": "Ramo de Atividade",
      "location": "Bairro/Rua em ${finalRegion}",
      "phone": "(DDD) XXXX-XXXX",
      "description": "Por que eles são um bom alvo para produtos Talimpo/Superaplast?",
      "score": 90
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7 // Aumentado para permitir que a IA use conhecimento prévio se a busca falhar
      }
    });

    const text = response.text || "";
    let jsonStr = "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      jsonStr = match[0];
    } else {
      return { leads: [], groundingLinks: [] };
    }

    const data = JSON.parse(jsonStr);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingLinks = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Referência Local',
        uri: chunk.web?.uri || ''
      }));

    if (!data.leads || data.leads.length === 0) {
      return { leads: [], groundingLinks: [] };
    }

    return {
      leads: data.leads.map((l: any) => ({
        ...l,
        id: Math.random().toString(36).substr(2, 9),
        status: 'Novo',
        title: l.businessType
      })),
      groundingLinks
    };
  } catch (e) {
    console.error("Erro na busca de leads:", e);
    return { leads: [], groundingLinks: [] };
  }
};

export const generateOutreach = async (lead: Lead, myBusiness: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Crie uma saudação de WhatsApp para ${lead.name}.
Diga que somos da Vendas Seu Vital e atendemos a região de ${lead.location}.
Fale sobre a economia de comprar direto da fábrica (Talimpo e Superaplast).
Seja cordial e direto.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Olá! Gostaria de apresentar nossos produtos de limpeza para seu negócio.";
  } catch (e) {
    return "Olá! Podemos conversar sobre materiais de limpeza para sua região?";
  }
};
