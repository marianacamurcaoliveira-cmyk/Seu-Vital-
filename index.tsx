
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar';
import LeadCard from './components/LeadCard';
import { searchLeads, generateOutreach } from './services/gemini';
import { Lead } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [groundingLinks, setGroundingLinks] = useState<{title: string, uri: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [outreachMsg, setOutreachMsg] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  const businessProfile = "Vendas Seu Vital - Distribuidora com fábricas próprias (Talimpo e Superaplast).";

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      alert("O que você quer vender? (ex: Academias)");
      return;
    }
    if (!city.trim()) {
      alert("Em qual cidade você quer buscar?");
      return;
    }
    
    setLoading(true);
    setHasSearched(true);
    try {
      const results = await searchLeads(searchQuery, city, country);
      setLeads(results.leads || []);
      setGroundingLinks(results.groundingLinks || []);
      if (results.leads && results.leads.length > 0) {
        setActiveTab('crm');
      }
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro na busca. Tente novamente.");
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
    setOutreachMsg('Criando abordagem para ' + lead.name + '...');
    const msg = await generateOutreach(lead, businessProfile);
    setOutreachMsg(msg);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 flex-1 p-10 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' || activeTab === 'search' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Vendas Seu Vital 🚀</h2>
                <p className="text-slate-500 font-medium">Prospecção Regional Inteligente (Cidade/País)</p>
              </header>

              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
                  <span className="text-xl">📍</span> Onde vamos vender hoje?
                </h3>
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Alvo (Tipo de Cliente)</label>
                      <input 
                        type="text" placeholder="Ex: Condomínios, Hotéis, Escolas..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Cidade</label>
                      <input 
                        type="text" placeholder="Ex: Rio de Janeiro" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-blue-600"
                        value={city} onChange={e => setCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">País</label>
                      <input 
                        type="text" placeholder="Ex: Brasil" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        value={country} onChange={e => setCountry(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      disabled={loading}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-black h-16 px-12 rounded-2xl shadow-xl shadow-orange-100 disabled:bg-slate-300 transition-all flex items-center gap-3 text-lg"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : '🔍 Captar Clientes'}
                    </button>
                  </div>
                </form>
              </div>

              {hasSearched && leads.length === 0 && !loading && (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-2xl mx-auto">
                  <div className="text-6xl mb-6">🏜️</div>
                  <h3 className="text-2xl font-bold text-slate-800">Buscando oportunidades em {city}...</h3>
                  <p className="text-slate-500 mt-3 leading-relaxed">
                    A IA está mapeando a região de <strong>{city}</strong>. Se não encontrarmos contatos digitais, listaremos os endereços para visita presencial.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === 'crm' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Leads Encontrados</h2>
                  <p className="text-slate-500">Resultados para: <strong>{searchQuery}</strong> em <strong>{city}</strong></p>
                </div>
                <button 
                  onClick={() => setActiveTab('search')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all"
                >
                  Nova Busca
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{selectedLead.name}</h3>
                <p className="text-blue-600 font-bold mt-1">📍 {selectedLead.location}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Pitch de Abordagem WhatsApp</h4>
              <p className="text-slate-700 italic leading-relaxed text-lg">"{outreachMsg}"</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {navigator.clipboard.writeText(outreachMsg); alert("Mensagem copiada!")}} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-5 rounded-2xl font-black transition-all"
              >
                Copiar Texto
              </button>
              <a 
                href={`https://wa.me/${selectedLead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(outreachMsg)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-black text-center flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-200"
              >
                Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-center px-8">
          <div className="relative mb-10">
            <div className="w-24 h-24 border-8 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl">🎯</div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Mapeando {city}</h2>
          <p className="text-slate-500 mt-3 text-lg max-w-md">
            Localizando os melhores {searchQuery} para sua carteira de clientes.
          </p>
        </div>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) createRoot(rootElement).render(<App />);
