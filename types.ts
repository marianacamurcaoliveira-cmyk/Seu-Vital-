
export interface Lead {
  id: string;
  name: string;
  businessType: string;
  location: string;
  website?: string;
  phone?: string;
  description: string;
  status: 'Novo' | 'Em Contato' | 'Negociando' | 'Fechado' | 'Perdido';
  score: number;
  contactedAt?: string;
  sourceUrl?: string;
  notes?: string;
}

export interface SearchResult {
  leads: Lead[];
  groundingLinks: { title: string; uri: string }[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
}
