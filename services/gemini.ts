
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

  const fullPrompt = `Você é o Especialista Chefe de Prospecção da "Vendas Seu Vital".
Sua tarefa é encontrar 10 potenciais clientes (Empresas/Estabelecimentos) para venda de produtos de limpeza profissional.

OBJETIVO: Encontrar "${query}"
LOCALIZAÇÃO: "${locationContext}"

INSTRUÇÕES DE PESQUISA (MUITO IMPORTANTE):
1. Use a busca do Google para encontrar resultados no Google Maps, Instagram, Facebook e sites oficiais em ${city}.
2. Procure por termos como: "Contatos de ${query} em ${city}", "Telefones de ${query} em ${city}", "Melhores ${query} em ${city}".
3. Se a busca em tempo real não retornar resultados específicos com telefone, use seu CONHECIMENTO DE MERCADO para listar os 5-10 estabelecimentos mais famosos desse ramo em ${city}.
4. No campo telefone, se não encontrar o número exato, escreva "Consultar Instagram" ou "Localizado em ${city}".
5. JAMAIS retorne uma lista vazia. Se a cidade for pequena, procure nos arredores ou liste as maiores empresas do setor na região.

FORMATO DE RESPOSTA (JSON APENAS):
{
  "leads": [
    {
      "name": "Nome da Empresa",
      "businessType": "Ramo de Atividade",
      "location": "Endereço ou Bairro em ${city}",
      "phone": "(DDD) XXXX-XXXX",
      "description": "Por que eles precisam de material de limpeza profissional?",
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
        temperature: 0.8
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
        title: chunk.web?.title || 'Fonte Local',
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
  const prompt = `Crie uma mensagem profissional de WhatsApp para ${lead.name} em ${lead.location}.
Somos a Vendas Seu Vital. Fábrica de químicos (Talimpo) e sacos de lixo (Superaplast).
Foque em: Alta performance, Preço direto de fábrica e Atendimento em ${lead.location}.
Peça uma oportunidade para enviar o catálogo digital.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Olá! Gostaria de apresentar nossas soluções em limpeza direta da fábrica.";
  } catch (e) {
    return "Olá! Somos da Vendas Seu Vital e temos condições especiais para sua região. Podemos conversar?";
  }
};
