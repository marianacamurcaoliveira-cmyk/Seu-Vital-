
import { GoogleGenAI } from "@google/genai";
import { Lead, SearchResult } from "../types";

declare const process: {
  env: {
    API_KEY: string;
  };
};

export const searchLeads = async (query: string, city: string, country: string): Promise<SearchResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY não encontrada!");
    return { leads: [], groundingLinks: [] };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const locationContext = `${city}, ${country}`;

  const fullPrompt = `Você é o Agente de Elite da "Vendas Seu Vital". Sua missão é mapear o mercado de "${query}" na cidade de "${city}", "${country}".

INSTRUÇÕES CRÍTICAS:
1. FOCO TOTAL NA CIDADE: Ignore qualquer outra localização. Sua pesquisa DEVE ser em "${city}".
2. BUSCA WEB: Use a ferramenta Google Search para encontrar empresas reais, seus endereços, telefones e nomes.
3. CONHECIMENTO DE APOIO: Se a busca web estiver limitada para essa cidade específica, use seu conhecimento geral para listar os maiores e mais conhecidos estabelecimentos desse ramo (ex: condomínios famosos, maiores hospitais, hotéis centrais) em "${city}".
4. DADOS DE CONTATO: Se não achar o WhatsApp, informe o endereço físico no campo location e coloque "Visita Presencial" no campo telefone. JAMAIS retorne uma lista vazia.
5. PÚBLICO: O cliente vende materiais de limpeza profissional (Talimpo/Superaplast). Foque em lugares que consomem muito papel, químicos e sacos de lixo.

RESPONDA APENAS EM JSON:
{
  "leads": [
    {
      "name": "Nome da Empresa",
      "businessType": "Tipo de Negócio",
      "location": "Bairro ou Endereço em ${city}",
      "phone": "(XX) XXXX-XXXX",
      "description": "Por que eles precisam de material de limpeza?",
      "score": 95
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.6
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
        title: chunk.web?.title || 'Fonte de Informação',
        uri: chunk.web?.uri || ''
      }));

    return {
      leads: (data.leads || []).map((l: any) => ({
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
  const prompt = `Crie uma mensagem profissional e amigável para enviar via WhatsApp para ${lead.name} em ${lead.location}.
Somos a Vendas Seu Vital (Marcas Talimpo e Superaplast).
Vendemos direto da fábrica químicos de limpeza e sacos de lixo.
Destaque: Preço imbatível e qualidade superior.
Peça para enviar o catálogo digital.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Olá! Gostaria de apresentar nossos produtos de limpeza para seu negócio.";
  } catch (e) {
    return "Olá! Somos da Vendas Seu Vital e temos condições especiais para sua região.";
  }
};
