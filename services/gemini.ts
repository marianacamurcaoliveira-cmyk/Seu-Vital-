
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
  if (!apiKey) {
    console.error("API_KEY não encontrada!");
    return { leads: [], groundingLinks: [] };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const fullPrompt = `Aja como um Agente de Prospecção de Vendas. 
Sua tarefa é encontrar clientes REAIS (estabelecimentos comerciais, condomínios, escolas, etc) que precisem de materiais de limpeza na região de "${location || 'Brasil'}".
Busque especificamente por: "${query}".

Para cada lead encontrado, extraia:
1. Nome do estabelecimento
2. Título (Ex: Condomínio Premium, Hospital Público)
3. Ramo de atividade
4. Localização (Bairro, Cidade)
5. Telefone ou WhatsApp de contato (ESSENCIAL)
6. Descrição curta de por que eles são um bom lead para produtos de limpeza profissional (marcas Talimpo e Superaplast).
7. Score de 0 a 100 de potencial de venda.

Responda OBRIGATORIAMENTE em formato JSON puro dentro de um bloco de código:
{
  "leads": [
    {
      "name": "Nome",
      "title": "Título",
      "businessType": "Ramo",
      "location": "Localização",
      "phone": "Telefone",
      "description": "Explicação",
      "score": 90
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Modelo rápido e eficiente para buscas
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1
      }
    });

    const text = response.text || "";
    
    // Extração segura de JSON
    let jsonStr = "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      jsonStr = match[0];
    } else {
      console.warn("IA não retornou JSON válido:", text);
      return { leads: [], groundingLinks: [] };
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingLinks = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Fonte de pesquisa',
        uri: chunk.web?.uri || ''
      }));

    const data = JSON.parse(jsonStr);
    
    return {
      leads: (data.leads || []).map((l: any) => ({
        ...l,
        id: Math.random().toString(36).substr(2, 9),
        status: 'Novo'
      })),
      groundingLinks
    };
  } catch (e) {
    console.error("Falha na busca Gemini:", e);
    return { leads: [], groundingLinks: [] };
  }
};

export const generateOutreach = async (lead: Lead, myBusiness: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Crie uma mensagem curta de WhatsApp para abordar o lead "${lead.name}" (Local: ${lead.location}).
Falamos em nome da "Vendas Seu Vital", distribuidores de materiais de limpeza com fábricas próprias:
- TALIMPO (Químicos/Saneantes)
- SUPERAPLAST (Sacos de lixo)

Destaque inovação, qualidade e preço de fábrica. 
Finalize perguntando se pode enviar o catálogo em PDF.
Assine como: "Vital, material de limpeza".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Olá! Gostaria de apresentar soluções de limpeza de alta performance para vocês.";
  } catch (e) {
    return "Olá! Somos da Vendas Seu Vital e temos soluções em limpeza profissional. Podemos conversar?";
  }
};
