
import { GoogleGenAI } from "@google/genai";
import { Lead, SearchResult, LocationData } from "../types";

// Declare process para satisfazer o TS sem @types/node
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
  
  // Refinamos o prompt para usar o contexto geográfico
  const locationContext = coords 
    ? `Estamos nas coordenadas Lat: ${coords.latitude}, Lng: ${coords.longitude}. Procure estabelecimentos num raio de 20km daqui.`
    : `Região de busca: ${regionText}`;

  const fullPrompt = `Aja como um Agente de Prospecção Regional de Vendas.
${locationContext}

Sua tarefa é encontrar estabelecimentos REAIS (condomínios, hotéis, hospitais, indústrias, comércios) que são potenciais compradores de materiais de limpeza profissional.
Busca específica: "${query}".

Para cada lead encontrado no Google Maps ou Search, extraia:
1. Nome oficial
2. Ramo de atividade
3. Endereço completo (Bairro e Cidade são essenciais)
4. Telefone ou WhatsApp (com DDD regional)
5. Uma breve explicação de por que eles precisam de produtos profissionais agora.
6. Score de 0 a 100 de potencial.

Responda OBRIGATORIAMENTE com um bloco de código JSON como este:
{
  "leads": [
    {
      "name": "Nome do Local",
      "businessType": "Tipo",
      "location": "Endereço, Bairro, Cidade",
      "phone": "(XX) XXXXX-XXXX",
      "description": "Motivo da prospecção...",
      "score": 95
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Modelo que suporta Google Maps Grounding
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
        temperature: 0.2
      }
    });

    const text = response.text || "";
    
    // Extração robusta de JSON
    let jsonStr = "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      jsonStr = match[0];
    } else {
      console.warn("IA não retornou JSON estruturado, tentando recuperar dados do texto...");
      return { leads: [], groundingLinks: [] };
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingLinks = groundingChunks
      .map(chunk => {
        if (chunk.maps) return { title: chunk.maps.title || 'Local no Maps', uri: chunk.maps.uri || '' };
        if (chunk.web) return { title: chunk.web.title || 'Fonte Web', uri: chunk.web.uri || '' };
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
    console.error("Erro na busca regional:", e);
    return { leads: [], groundingLinks: [] };
  }
};

export const generateOutreach = async (lead: Lead, myBusiness: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Crie uma mensagem curta de WhatsApp para o lead "${lead.name}" em ${lead.location}.
Somos da "Vendas Seu Vital", especialistas em limpeza com fábricas próprias (TALIMPO e SUPERAPLAST).
Oferecemos economia, inovação e entrega rápida na nossa região.
Seja educado e peça para enviar o catálogo digital.
Assine: "Vital, material de limpeza".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Olá! Gostaria de apresentar nossas soluções em limpeza profissional.";
  } catch (e) {
    return "Olá! Somos da Vendas Seu Vital. Temos condições especiais em materiais de limpeza para sua região. Podemos conversar?";
  }
};
