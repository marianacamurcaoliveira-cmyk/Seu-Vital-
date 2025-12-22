
import React, { useState } from 'react';
import { Lead } from '../types';

interface LeadCardProps {
  lead: Lead;
  onAction: (lead: Lead) => void;
  onStatusChange: (id: string, newStatus: Lead['status']) => void;
  onNotesChange: (id: string, notes: string) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onAction, onStatusChange, onNotesChange }) => {
  const [localNotes, setLocalNotes] = useState(lead.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Novo': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Em Contato': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Negociando': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Fechado': return 'bg-green-100 text-green-700 border-green-200';
      case 'Perdido': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const statusOptions: Lead['status'][] = ['Novo', 'Em Contato', 'Negociando', 'Fechado', 'Perdido'];

  const handleSaveNotes = () => {
    setIsSaving(true);
    onNotesChange(lead.id, localNotes);
    
    // Simulate API delay and show success
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      // Hide success after 2 seconds
      setTimeout(() => setShowSuccess(false), 2000);
    }, 400);
  };

  const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}` : '';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${showSuccess ? 'border-green-400' : 'border-slate-100'} p-5 hover:shadow-md transition-all group relative flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-2">
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
            {lead.name}
          </h3>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{lead.businessType}</p>
        </div>
        
        <div className="relative shrink-0">
          <select
            value={lead.status}
            onChange={(e) => onStatusChange(lead.id, e.target.value as Lead['status'])}
            className={`text-xs px-2 py-1 pr-6 rounded-full font-semibold border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors ${getStatusStyles(lead.status)}`}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option} className="bg-white text-slate-800">
                {option}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-current opacity-50">
            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
        {lead.description}
      </p>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
        <span className="flex items-center gap-1">📍 {lead.location}</span>
        <span className="flex items-center gap-1">⭐ {lead.score}% Match</span>
        {lead.phone && (
          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-700">
            📞 {lead.phone}
          </span>
        )}
      </div>

      <div className="mb-4 flex-grow relative">
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notas do Lead</label>
          {showSuccess && (
            <span className="text-[10px] font-bold text-green-600 animate-bounce flex items-center gap-1">
              ✓ Notas salvas!
            </span>
          )}
        </div>
        <div className="relative">
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="Adicione observações importantes..."
            className={`w-full border rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 transition-all h-24 resize-none ${
              showSuccess 
                ? 'bg-green-50 border-green-300 ring-green-100' 
                : 'bg-slate-50 border-slate-200 focus:ring-blue-500 focus:bg-white'
            }`}
          />
          <button
            onClick={handleSaveNotes}
            disabled={localNotes === (lead.notes || '') || isSaving}
            className={`absolute bottom-2 right-2 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all transform active:scale-95 ${
              isSaving 
                ? 'bg-green-500 text-white cursor-wait' 
                : localNotes !== (lead.notes || '') 
                  ? 'bg-orange-500 text-white shadow-lg hover:bg-orange-600' 
                  : 'bg-slate-200 text-slate-400 opacity-0 pointer-events-none'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando...
              </span>
            ) : 'Salvar Nota'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <div className="flex gap-2">
          <button 
            onClick={() => onAction(lead)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-md"
          >
            Ver Detalhes
          </button>
          {lead.phone && (
            <a 
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-md text-center flex items-center justify-center gap-1"
            >
              <span>WhatsApp</span>
            </a>
          )}
        </div>
        <div className="flex gap-2">
          {lead.phone && (
            <a 
              href={`tel:${cleanPhone}`}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl transition-colors text-xs text-center border border-slate-200"
            >
              Ligar Agora
            </a>
          )}
          {lead.website && (
            <a 
              href={lead.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200 flex items-center justify-center ${!lead.phone ? 'flex-1' : 'w-12'}`}
              title="Visitar Website"
            >
              🌐 {!lead.phone && <span className="ml-2 text-xs">Website</span>}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
