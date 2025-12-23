
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
  
  // Prompt otimizado para busca regional no Brasil
  const fullPrompt = `Você é um robô de prospecção de vendas B2B para a empresa "Vendas Seu Vital".
Busque na internet por empresas REAIS do tipo "${query}" localizadas em ou perto de "${location || 'Brasil'}".
Foque em: condomínios, hotéis, hospitais, escolas, indústrias ou comércios grandes que precisam de limpeza profissional (marcas Talimpo e Superaplast).

Para cada estabelecimento encontrado, você DEVE retornar as seguintes informações:
1. Nome oficial da empresa.
2. Um título curto e impactante para o lead.
3. Tipo de negócio.
4. Bairro e Cidade.
5. Telefone ou WhatsApp de contato (Tente encontrar números reais com DDD).
6. Uma descrição rápida do motivo do contato.
7. Score de 1 a 100 de quão provável é eles comprarem materiais de limpeza em atacado.

RESPONDA APENAS com um bloco de código JSON seguindo EXATAMENTE este formato:
{
  "leads": [
    {
      "name": "Nome da Empresa",
      "title": "Título Curto",
      "businessType": "Ramo",
      "location": "Bairro, Cidade - UF",
      "description": "Explicação do potencial",
      "phone": "(XX) XXXXX-XXXX",
      "score": 85
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Usamos uma temperatura baixa para garantir que ele siga o formato JSON
        temperature: 0.1,
      }
    });

    const text = response.text || "";
    console.debug("Resposta bruta da IA:", text);

    // Extração robusta de JSON do texto (procurando blocos de código ou chaves)
    let jsonContent = "";
    const jsonBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonBlockMatch) {
      jsonContent = jsonBlockMatch[1];
    } else {
      const braceMatch = text.match(/{[\s\S]*}/);
      if (braceMatch) {
        jsonContent = braceMatch[0];
      }
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingLinks = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Fonte de pesquisa',
        uri: chunk.web?.uri || ''
      }));

    if (!jsonContent) {
      throw new Error("Não foi possível encontrar um JSON válido na resposta da IA.");
    }

    const data = JSON.parse(jsonContent);
    
    return {
      leads: (data.leads || []).map((l: any) => ({
        ...l,
        id: Math.random().toString(36).substr(2, 9),
        status: 'Novo'
      })),
      groundingLinks
    };
  } catch (e) {
    console.error("Erro na busca de leads Gemini:", e);
    return { leads: [], groundingLinks: [] };
  }
};

export const generateOutreach = async (lead: Lead, myBusiness: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Crie uma mensagem curta e amigável de WhatsApp para o lead "${lead.name}".
  Atuamos na região dele: ${lead.location}.
  
  Nosso diferencial: Somos distribuidores diretos com fábricas próprias:
  - TALIMPO: Químicos e saneantes de alta performance.
  - SUPERAPLAST: Sacos de lixo super resistentes.
  
  Foque em INOVAÇÃO e economia na limpeza.
  Termine pedindo para enviar o catálogo.
  Assine sempre como: "Vital, material de limpeza".`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || "Olá, gostaria de apresentar soluções inovadoras para a limpeza do seu estabelecimento.";
};
