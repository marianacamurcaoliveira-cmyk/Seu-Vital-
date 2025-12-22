
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LeadCard from './components/LeadCard';
import { searchLeads, generateOutreach } from './services/gemini';
import { Lead, LocationData } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState('Minha Região');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [outreachMsg, setOutreachMsg] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [businessProfile, setBusinessProfile] = useState(
    "Distribuidora completa de materiais de limpeza focada em trazer inovação e máxima qualidade. Possuímos duas fábricas próprias: Talimpo (saneantes e químicos de alta performance) e Superaplast (sacos de lixo de alta resistência), além de um catálogo vasto de outros produtos essenciais para higiene e limpeza profissional."
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      });
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    try {
      const results = await searchLeads(searchQuery, region);
      setLeads(results.leads);
      setActiveTab('crm');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: Lead['status']) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === id ? { ...lead, status: newStatus } : lead
      )
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === id ? { ...lead, notes: notes } : lead
      )
    );
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      )
    );
  };

  const handleGenerateScript = async (lead: Lead) => {
    setSelectedLead(lead);
    setOutreachMsg('Gerando script personalizado com foco em inovação e qualidade...');
    const msg = await generateOutreach(lead, businessProfile);
    setOutreachMsg(msg);
  };

  // Stats calculation
  const totalLeads = leads.length;
  const positivados = leads.filter(l => l.status === 'Fechado').length;
  const perdidos = leads.filter(l => l.status === 'Perdido').length;

  const renderDashboard = () => (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Bora vender! 🚀</h2>
          <p className="text-slate-500">Gestão regional Vendas Seu Vital.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm">
            <span className="text-slate-400">Região:</span> <span className="font-bold text-blue-600">{region}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl">
          <p className="text-blue-100 text-sm font-medium mb-1">Total de Leads</p>
          <h3 className="text-4xl font-bold">{totalLeads}</h3>
          <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 w-fit px-2 py-1 rounded-lg">
            <span>📈 Base de Prospecção</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Positivado</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-bold text-green-600">{positivados}</h3>
            <span className="text-green-500 text-sm font-bold mb-1.5 flex items-center gap-0.5">
              ✓ Sucesso
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-3">Clientes que fecharam pedido</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Perca de Vendas</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-bold text-red-500">{perdidos}</h3>
            <span className="text-red-400 text-sm font-bold mb-1.5 flex items-center gap-0.5">
              ⚠ Perdidos
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-3">Oportunidades não convertidas</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Encontrar Novos Clientes na Região</h3>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Ex: Condomínios, Hotéis, Hospitais, Escolas..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <input 
            type="text" 
            placeholder="Sua Cidade/Região"
            className="md:w-64 bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-orange-500/30 text-lg flex items-center justify-center gap-2"
          >
            {loading ? 'Mapeando...' : 'Prospectar'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderCRM = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Carteira de Leads</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            Filtros
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            Exportar CSV
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-semibold text-slate-600">Sua lista de prospecção está vazia</h3>
          <p className="text-slate-400">Busque por estabelecimentos que precisam de materiais de limpeza.</p>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="mt-6 text-blue-600 font-bold hover:underline"
          >
            Começar busca por região →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map(lead => (
            <LeadCard 
              key={lead.id} 
              lead={lead} 
              onAction={handleGenerateScript} 
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
              onUpdate={handleUpdateLead}
            />
          ))}
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-50/50 shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 truncate max-w-[400px]">{selectedLead.name}</h3>
                <p className="text-blue-600 font-medium">Abordagem de Inovação e Qualidade</p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Dados do Cliente</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Tipo</span>
                    <p>{selectedLead.businessType}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Local</span>
                    <p>{selectedLead.location}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Match</span>
                    <p className="text-blue-600 font-bold">{selectedLead.score}%</p>
                  </div>
                  {selectedLead.phone && (
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Telefone</span>
                      <p>{selectedLead.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Mensagem de Abordagem Sugerida</h4>
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl whitespace-pre-wrap text-slate-700 leading-relaxed italic">
                  "{outreachMsg}"
                </div>
              </div>

              <div className="flex gap-4 shrink-0 pb-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(outreachMsg);
                    alert("Copiado com sucesso!");
                  }}
                  className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-900 transition-colors"
                >
                  Copiar Texto
                </button>
                <a 
                  href={`https://wa.me/${selectedLead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(outreachMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-500 text-white font-bold py-4 rounded-2xl hover:bg-green-600 transition-colors text-center"
                >
                  Enviar WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 flex-1 p-10 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'crm' && renderCRM()}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Prospecção de Clientes</h2>
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Tipo de Cliente (Lead)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Academias, Condomínios, Grandes Escritórios..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Região de Atuação</label>
                      <input 
                        type="text" 
                        placeholder="Nome da Cidade ou Bairro"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="mt-7 bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 rounded-xl transition-all disabled:opacity-50"
                    >
                      {loading ? 'Buscando Leads...' : 'Iniciar Busca'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm max-w-2xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Configuração de Vendas</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase">Perfil da Distribuidora (Usado na IA)</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 h-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva suas marcas e diferenciais..."
                    value={businessProfile}
                    onChange={(e) => setBusinessProfile(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-2 italic">Dica: Mencione sempre o foco em inovação e assine como Vital.</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-700">Otimização Geográfica</p>
                    <p className="text-xs text-slate-500">Refina resultados baseado na sua rota de entrega</p>
                  </div>
                  <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center px-1">
                    <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[60] flex flex-col items-center justify-center text-center px-4">
          <div className="w-24 h-24 border-4 border-blue-100 border-t-orange-500 rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold text-slate-800 animate-pulse">Escaneando Região...</h2>
          <p className="text-slate-500 mt-2 max-w-sm">Localizando parceiros que buscam inovação em limpeza.</p>
        </div>
      )}
    </div>
  );
};

export default App;
