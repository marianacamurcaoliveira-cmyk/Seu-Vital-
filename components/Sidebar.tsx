
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: '📊' },
    { id: 'search', label: 'Captar Leads', icon: '🔍' },
    { id: 'crm', label: 'Gestão (CRM)', icon: '🤝' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-blue-900 h-screen text-white flex flex-col fixed left-0 top-0 shadow-xl z-20">
      <div className="p-6 border-b border-blue-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-xl shadow-lg shrink-0">
          🚀
        </div>
        <h1 className="text-lg font-bold tracking-tight leading-tight">Vendas Seu Vital</h1>
      </div>
      
      <nav className="flex-1 mt-6 px-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                : 'hover:bg-blue-800 text-blue-200'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-blue-800">
        <div className="bg-blue-800/50 p-4 rounded-xl text-sm">
          <p className="text-blue-300 mb-1">Status da IA</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Gemini Pro Ativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
