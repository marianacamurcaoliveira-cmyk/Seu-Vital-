
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
  const [hasSearched, setHasSearched] = useState(false);
  
  const businessProfile = "Vendas Seu Vital - Distribuidora com fábricas próprias (Talimpo e Superaplast).";

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => setLocationError(true),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRegion = region.trim() || (location ? "minha localização" : "");
    
    if (!searchQuery.trim() || !finalRegion) {
      alert("Informe o que procura e em qual cidade.");
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    try {
      const results = await searchLeads(searchQuery, finalRegion, location);
      setLeads(results.leads || []);
      setGroundingLinks(results.groundingLinks || []);
      if (results.leads && results.leads.length > 0) {
        setActiveTab('crm');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
  };

  const handleNotesChange = (id: string, notes: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
  };

  const handleGenerateScript = async (lead: Lead) => {
    setSelectedLead(lead);
    setOutreachMsg('Criando abordagem personalizada...');
    const msg = await generateOutreach(lead, businessProfile);
    setOutreachMsg(msg);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 flex-1 p-10 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">Vendas Seu Vital 🚀</h2>
                  <p className="text-slate-500">Mapeamento regional de clientes.</p>
                </div>
                <div className={`px-4 py-2 rounded-xl border ${location ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 text-slate-400'} text-xs font-bold`}>
                  GPS: {location ? 'ATIVO' : 'DESATIVADO'}
                </div>
              </header>

              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" placeholder="Ex: Condomínios, Hotéis..." 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  />
                  <input 
                    type="text" placeholder="Cidade ou Região" 
                    className="md:w-64 bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={region} onChange={e => setRegion(e.target.value)}
                  />
                  <button 
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-2xl shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Pesquisando...' : 'Prospectar'}
                  </button>
                </form>
              </div>

              {hasSearched && leads.length === 0 && !loading && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center animate-in slide-in-from-top-4">
                  <div className="text-4xl mb-4">📍</div>
                  <h3 className="text-xl font-bold text-orange-800">Nenhum contato direto encontrado</h3>
                  <p className="text-orange-600 mt-2 max-w-lg mx-auto">
                    Tente buscar por categorias mais genéricas como <strong>"Academias"</strong> ou <strong>"Hospitais"</strong> em vez de nomes específicos. Verifique também se o nome da cidade está correto.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Clientes Mapeados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leads.map(lead => (
                  <LeadCard 
                    key={lead.id} lead={lead} 
                    onAction={handleGenerateScript}
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
                    onUpdate={(u) => setLeads(prev => prev.map(l => l.id === u.id ? u : l))}
                    onDelete={(id) => setLeads(prev => prev.filter(l => l.id !== id))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-2xl font-bold">{selectedLead.name}</h3>
              <button onClick={() => setSelectedLead(null)}>✕</button>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl mb-6 border">
              <p className="text-slate-700 italic">{outreachMsg}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => {navigator.clipboard.writeText(outreachMsg); alert("Copiado!")}} className="flex-1 bg-slate-800 text-white py-4 rounded-xl font-bold">Copiar</button>
              <a href={`https://wa.me/${selectedLead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(outreachMsg)}`} target="_blank" className="flex-1 bg-green-500 text-white py-4 rounded-xl font-bold text-center">WhatsApp</a>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-bold mt-4">Escaneando contatos em {region || 'sua região'}...</h2>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
