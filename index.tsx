
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
  const [hasSearched, setHasSearched] = useState(false);
  
  const businessProfile = "Vendas Seu Vital - Distribuidora com fábricas próprias (Talimpo e Superaplast).";

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => console.log("GPS não disponível, usando busca manual."),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Priorizamos o que o usuário escreveu. O GPS é apenas um fallback.
    const searchRegion = region.trim();
    
    if (!searchQuery.trim()) {
      alert("O que você quer vender hoje? Digite um termo (ex: Restaurantes).");
      return;
    }

    if (!searchRegion && !location) {
      alert("Por favor, digite o nome da sua Cidade ou Região.");
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    try {
      // Passamos o texto da região prioritariamente
      const results = await searchLeads(searchQuery, searchRegion, searchRegion ? null : location);
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
    setOutreachMsg('Gerando proposta personalizada para este local...');
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
                  <p className="text-slate-500">Prospecção Inteligente em {region || 'Sua Região'}.</p>
                </div>
              </header>

              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-slate-700">🔎 Nova Busca Regional</h3>
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">O que você quer vender?</label>
                    <input 
                      type="text" placeholder="Ex: Condomínios, Academias, Hotéis..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="md:w-72">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Onde? (Cidade ou Bairro)</label>
                    <input 
                      type="text" placeholder="Digite sua cidade" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                      value={region} onChange={e => setRegion(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      disabled={loading}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-[62px] px-10 rounded-2xl shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : '🔍 Prospectar'}
                    </button>
                  </div>
                </form>
              </div>

              {hasSearched && leads.length === 0 && !loading && (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                  <div className="text-5xl mb-4">🏠</div>
                  <h3 className="text-xl font-bold text-slate-800">Ainda buscando os melhores contatos...</h3>
                  <p className="text-slate-500 mt-2 max-w-lg mx-auto">
                    Tente usar termos mais simples como <strong>"Escolas"</strong> ou <strong>"Hospitais"</strong>. 
                    Certifique-se que o nome da cidade <strong>"{region}"</strong> está escrito corretamente.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Oportunidades Encontradas</h2>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="text-blue-600 font-bold hover:underline"
                >
                  + Nova Busca
                </button>
              </div>
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-slate-800">{selectedLead.name}</h3>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-blue-600 font-medium mb-6">📍 {selectedLead.location}</p>
            <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-200">
              <p className="text-slate-700 italic leading-relaxed">"{outreachMsg}"</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => {navigator.clipboard.writeText(outreachMsg); alert("Texto copiado para o teclado!")}} 
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-4 rounded-xl font-bold transition-all"
              >
                Copiar Texto
              </button>
              <a 
                href={`https://wa.me/${selectedLead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(outreachMsg)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200"
              >
                Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tighter">Escaneando {region || 'Região'}</h2>
          <p className="text-slate-500 mt-2">Estamos buscando em diretórios, redes sociais e sites locais.</p>
          <div className="mt-8 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black animate-pulse">
            INTELIGÊNCIA ARTIFICIAL EM OPERAÇÃO
          </div>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
