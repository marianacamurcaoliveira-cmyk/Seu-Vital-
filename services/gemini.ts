
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

  // Criamos uma instância nova para garantir o uso da chave correta
  const ai = new GoogleGenAI({ apiKey });
  
  // Prepara o contexto de localização
  let geoContext = "";
  if (coords) {
    geoContext = `O usuário está fisicamente nas coordenadas (Lat: ${coords.latitude}, Lng: ${coords.longitude}). Priorize resultados num raio de 20km deste ponto.`;
  }
  
  const fullPrompt = `Aja como um Especialista em Inteligência de Mercado e Prospecção.
Sua missão é localizar contatos comerciais REAIS para venda de produtos de limpeza profissional.

CONTEXTO DE LOCALIZAÇÃO: 
Região informada: "${regionText || 'Brasil'}".
${geoContext}

ALVO DA BUSCA: "${query}".

INSTRUÇÕES DE PESQUISA:
1. Pesquise no Google Search por: "${query} em ${regionText || 'minha região'}", "telefone de ${query} em ${regionText}", "contato whatsapp ${query}".
2. Procure em redes sociais (Instagram/Facebook), sites oficiais, guias locais (Telelistas, Apontador) e Google Maps.
3. Extraia o nome do local, o bairro/cidade e, principalmente, o TELEFONE ou WHATSAPP.
4. Se não encontrar o telefone direto, procure o site ou link de rede social.

RETORNE APENAS UM JSON NO FORMATO:
{
  "leads": [
    {
      "name": "Nome do Estabelecimento",
      "businessType": "Ramo (ex: Condomínio, Academia)",
      "location": "Endereço ou Bairro/Cidade",
      "phone": "(DDD) Número",
      "description": "Por que precisam de produtos de limpeza?",
      "score": 90
    }
  ]
}
Forneça o máximo de leads que conseguir encontrar (até 10).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Modelo mais capaz para buscas complexas
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3
      }
    });

    const text = response.text || "";
    
    // Extração segura de JSON
    let jsonStr = "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      jsonStr = match[0];
    } else {
      console.warn("IA não gerou JSON. Resposta:", text);
      return { leads: [], groundingLinks: [] };
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingLinks = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Fonte encontrada',
        uri: chunk.web?.uri || ''
      }));

    const data = JSON.parse(jsonStr);
    
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
    console.error("Falha na prospecção generalizada:", e);
    return { leads: [], groundingLinks: [] };
  }
};

export const generateOutreach = async (lead: Lead, myBusiness: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Crie uma mensagem curta para o WhatsApp de ${lead.name}.
Somos a "Vendas Seu Vital", distribuidores de material de limpeza com fábricas próprias (TALIMPO e SUPERAPLAST).
Foque em: Alta Qualidade, Preço de Fábrica e Entrega na região de ${lead.location}.
Termine perguntando se pode enviar o catálogo em PDF.
Assine: "Vital, material de limpeza".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Olá! Gostaria de apresentar nossas soluções em limpeza profissional.";
  } catch (e) {
    return "Olá! Somos da Vendas Seu Vital. Temos condições especiais para sua região. Podemos conversar?";
  }
};
