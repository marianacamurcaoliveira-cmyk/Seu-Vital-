
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
  
  // Reforço geográfico para a busca
  const geoText = coords ? `Latitude: ${coords.latitude}, Longitude: ${coords.longitude}` : regionText;

  const fullPrompt = `Você é um Agente de Elite em Prospecção B2B. Sua meta é encontrar 10 potenciais clientes para venda de materiais de limpeza.

PROCURAR POR: "${query}"
ONDE: "${regionText}" (Contexto: ${geoText})

INSTRUÇÕES CRÍTICAS DE BUSCA:
1. Use o GOOGLE SEARCH para encontrar listas de empresas, guias comerciais, perfis de Instagram e resultados do Maps.
2. Realize pelo menos 3 pesquisas internas: 
   - "Melhores ${query} em ${regionText} contatos"
   - "Lista de ${query} em ${regionText} telefone"
   - "${query} em ${regionText} site oficial"
3. NÃO IGNORE locais sem telefone imediato. Se encontrar o nome de um local relevante mas não o telefone, retorne o nome e coloque "Pesquisar nas redes sociais" no campo telefone.
4. PRIORIZE: Condomínios, Hotéis, Academias, Escolas, Hospitais e Restaurantes.

REGRAS DE RESPOSTA:
- Retorne APENAS um objeto JSON.
- Se não encontrar contatos exatos, use seu conhecimento geral para listar os 5 maiores estabelecimentos desse tipo na região de ${regionText}.

FORMATO JSON:
{
  "leads": [
    {
      "name": "Nome do Estabelecimento",
      "businessType": "Tipo de Negócio",
      "location": "Endereço ou Bairro em ${regionText}",
      "phone": "(XX) XXXXX-XXXX",
      "description": "Explicação do porquê eles precisam de produtos de limpeza profissional agora.",
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
        temperature: 0.5 // Aumentado para permitir mais criatividade na busca de fontes
      }
    });

    const text = response.text || "";
    
    // Extração robusta
    let jsonStr = "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      jsonStr = match[0];
    } else {
      console.warn("IA retornou texto puro, tentando recuperar...");
      return { leads: [], groundingLinks: [] };
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingLinks = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || 'Fonte de Dados',
        uri: chunk.web?.uri || ''
      }));

    const data = JSON.parse(jsonStr);
    
    // Fallback: se a IA retornar lista vazia mas tiver texto explicativo, vamos simular um erro amigável
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
    console.error("Erro na busca:", e);
    return { leads: [], groundingLinks: [] };
  }
};

export const generateOutreach = async (lead: Lead, myBusiness: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Crie um pitch de vendas rápido para ${lead.name} em ${lead.location}.
Somos a Vendas Seu Vital (Marcas Talimpo e Superaplast).
Foco: Economia real e qualidade superior.
Peça para enviar o catálogo.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "Olá! Temos soluções de limpeza para sua região.";
  } catch (e) {
    return "Olá! Podemos conversar sobre materiais de limpeza para seu negócio?";
  }
};
