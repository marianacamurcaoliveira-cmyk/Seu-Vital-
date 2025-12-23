
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar';
import LeadCard from './components/LeadCard';
import { searchLeads, generateOutreach } from './services/gemini';
import { Lead, LocationData } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [groundingLinks, setGroundingLinks] = useState<{title: string, uri: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [outreachMsg, setOutreachMsg] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(
    "Distribuidora completa de materiais de limpeza focada em trazer inovação e máxima qualidade. Possuímos duas fábricas próprias: Talimpo (saneantes e químicos de alta performance) e Superaplast (sacos de lixo de alta resistência), além de um catálogo vasto de outros produtos essenciais para higiene e limpeza profissional."
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          setRegion("Minha Localização Atual");
        },
        (err) => {
          console.warn("Localização negada ou indisponível");
          setLocationError(true);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert("Por favor, digite o que você está procurando (ex: Condomínios)");
      return;
    }
    
    setLoading(true);
    try {
      const results = await searchLeads(searchQuery, region, location);
      if (results.leads && results.leads.length > 0) {
        setLeads(results.leads);
        setGroundingLinks(results.groundingLinks);
        setActiveTab('crm');
      } else {
        alert("Nenhum cliente encontrado nesta região. Tente mudar o termo de busca ou a cidade.");
      }
    } catch (err) {
      console.error("Erro no fluxo de busca:", err);
      alert("Houve um erro ao realizar a busca. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: Lead['status']) => {
    setLeads(prevLeads => prevLeads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
  };

  const handleNotesChange = (id: string, notes: string) => {
    setLeads(prevLeads => prevLeads.map(lead => lead.id === id ? { ...lead, notes: notes } : lead));
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(prevLeads => prevLeads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
  };

  const handleGenerateScript = async (lead: Lead) => {
    setSelectedLead(lead);
    setOutreachMsg('Gerando proposta para sua região...');
    const msg = await generateOutreach(lead, businessProfile);
    setOutreachMsg(msg);
  };

  const positivados = leads.filter(l => l.status === 'Fechado').length;
  const perdidos = leads.filter(l => l.status === 'Perdido').length;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 flex-1 p-10 min-h-screen relative">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">Bora vender! 🚀</h2>
                  <p className="text-slate-500">Gestão regional Vendas Seu Vital.</p>
                </div>
                <div className="flex gap-4">
                  <div className={`bg-white px-4 py-2 rounded-xl border ${location ? 'border-green-200' : 'border-slate-200'} shadow-sm text-sm flex items-center gap-2`}>
                    <div className={`w-2 h-2 rounded-full ${location ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-slate-400">Status GPS:</span> 
                    <span className={`font-bold ${location ? 'text-green-600' : 'text-slate-500'}`}>
                      {location ? 'Localização Ativa' : 'Não Detectada'}
                    </span>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl">
                  <p className="text-blue-100 text-sm font-medium mb-1">Total de Leads</p>
                  <h3 className="text-4xl font-bold">{leads.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-slate-500 text-sm font-medium mb-1">Vendas Fechadas</p>
                  <h3 className="text-4xl font-bold text-green-600">{positivados}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-slate-500 text-sm font-medium mb-1">Perdidos</p>
                  <h3 className="text-4xl font-bold text-red-500">{perdidos}</h3>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  📍 Encontrar Clientes na Minha Região
                </h3>
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Ex: Condomínios, Hotéis, Academias..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Cidade ou Bairro"
                    className="md:w-64 bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg text-lg"
                  >
                    {loading ? 'Mapeando...' : 'Prospectar'}
                  </button>
                </form>
                {locationError && (
                  <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                    ⚠️ Ative o GPS no navegador para uma busca regional mais precisa.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Minha Carteira</h2>
              </div>
              
              {groundingLinks.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Resultados baseados em:</h4>
                  <div className="flex flex-wrap gap-2">
                    {groundingLinks.map((link, idx) => (
                      <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-[11px] bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
                        📍 {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leads.map(lead => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onAction={handleGenerateScript} 
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
                    onUpdate={handleUpdateLead}
                    onDelete={handleDeleteLead}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm max-w-2xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Configuração da Agência</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Perfil do meu Negócio</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 h-40 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    value={businessProfile}
                    onChange={(e) => setBusinessProfile(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{selectedLead.name}</h3>
                <p className="text-blue-600">{selectedLead.location}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl mb-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-3">Abordagem Sugerida (WhatsApp)</h4>
              <p className="italic text-slate-700 whitespace-pre-wrap leading-relaxed">{outreachMsg}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => { navigator.clipboard.writeText(outreachMsg); alert("Copiado!"); }} className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-xl">Copiar Texto</button>
              <a href={`https://wa.me/${selectedLead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(outreachMsg)}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500 text-white font-bold py-4 rounded-xl text-center">Abrir WhatsApp</a>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[60] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-orange-500 rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-slate-800">Sincronizando com Google Maps...</h2>
          <p className="text-slate-500 mt-2">Buscando oportunidades reais na sua vizinhança.</p>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
}
