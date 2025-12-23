
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
  
  // Refinamos o contexto de localização para ser extremamente explícito para a IA
  const locationInstruction = coords 
    ? `BUSCA LOCAL PRIORITÁRIA: Use as coordenadas GPS reais (Lat: ${coords.latitude}, Lng: ${coords.longitude}) para encontrar estabelecimentos no Google Maps. Priorize locais num raio de 15km.`
    : `BUSCA REGIONAL: Procure estabelecimentos em "${regionText}" e cidades vizinhas.`;

  const fullPrompt = `Você é um Agente de Inteligência Geográfica. 
Sua missão é mapear oportunidades de vendas para a empresa "Vendas Seu Vital".

${locationInstruction}
Busca solicitada: "${query}".

PROCEDIMENTO:
1. Use o GOOGLE MAPS para listar os nomes e endereços reais de locais correspondentes à busca.
2. Use o GOOGLE SEARCH para cruzar esses nomes e encontrar os números de WhatsApp ou Telefones comerciais mais atualizados.
3. Garanta que o local está ATIVO e funcionando.

RETORNE APENAS UM JSON VÁLIDO NO SEGUINTE FORMATO:
{
  "leads": [
    {
      "name": "Nome Fantasia Oficial",
      "businessType": "Ramo de Atividade",
      "location": "Endereço, Bairro, Cidade - UF",
      "phone": "(DDD) 9XXXX-XXXX ou Telefone Fixo",
      "description": "Explique por que este local precisa de produtos de limpeza profissional (Talimpo/Superaplast).",
      "score": 85
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: fullPrompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: coords ? {
          retrievalConfig: {
            latLng: {
              latitude: coords.latitude,
              longitude: coords.longitude
            }
          }
        } : undefined,
        temperature: 0.1 // Temperatura baixa para maior precisão nos dados
      }
    });

    const text = response.text || "";
    
    // Extração segura do JSON para lidar com qualquer texto adicional da IA
    let jsonStr = "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      jsonStr = match[0];
    } else {
      return { leads: [], groundingLinks: [] };
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingLinks = groundingChunks
      .map(chunk => {
        if (chunk.maps) return { title: chunk.maps.title || 'Localização no Mapa', uri: chunk.maps.uri || '' };
        if (chunk.web) return { title: chunk.web.title || 'Fonte de Informação', uri: chunk.web.uri || '' };
        return null;
      })
      .filter((link): link is {title: string, uri: string} => link !== null);

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
    console.error("Erro na busca de contatos:", e);
    return { leads: [], groundingLinks: [] };
  }
};

export const generateOutreach = async (lead: Lead, myBusiness: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Crie uma abordagem comercial para o WhatsApp de ${lead.name}.
Somos a "Vendas Seu Vital", especialistas em materiais de limpeza de alto rendimento.
Mencione que atendemos a região de ${lead.location} com logística própria.
Foque em: Economia, Inovação e Qualidade (Marcas Talimpo e Superaplast).
Termine perguntando se pode enviar o catálogo em PDF.
Assine como: "Vital, material de limpeza".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Olá! Gostaria de apresentar nossas soluções em higiene e limpeza para seu estabelecimento.";
  } catch (e) {
    return "Olá! Somos da Vendas Seu Vital e temos condições especiais para sua região. Podemos conversar?";
  }
};
