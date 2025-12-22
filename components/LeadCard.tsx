
import React, { useState } from 'react';
import { Lead } from '../types';

interface LeadCardProps {
  lead: Lead;
  onAction: (lead: Lead) => void;
  onStatusChange: (id: string, newStatus: Lead['status']) => void;
  onNotesChange: (id: string, notes: string) => void;
  onUpdate: (updatedLead: Lead) => void;
  onDelete: (id: string) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onAction, onStatusChange, onNotesChange, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editForm, setEditForm] = useState({
    name: lead.name,
    title: lead.title || '',
    businessType: lead.businessType,
    location: lead.location,
    phone: lead.phone || ''
  });
  
  const [localNotes, setLocalNotes] = useState(lead.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showSuccessNotes, setShowSuccessNotes] = useState(false);

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
    setIsSavingNotes(true);
    onNotesChange(lead.id, localNotes);
    setTimeout(() => {
      setIsSavingNotes(false);
      setShowSuccessNotes(true);
      setTimeout(() => setShowSuccessNotes(false), 2000);
    }, 400);
  };

  const handleSaveEdit = () => {
    onUpdate({ ...lead, ...editForm });
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(lead.id);
    setIsConfirmingDelete(false);
  };

  const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}` : '';

  if (isConfirmingDelete) {
    return (
      <div className="bg-red-50 rounded-2xl shadow-md border border-red-200 p-6 flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4">🗑️</div>
        <h3 className="text-lg font-bold text-red-800 mb-2">Excluir Lead?</h3>
        <p className="text-red-600 text-sm mb-6">Esta ação não pode ser desfeita. Remover "{lead.name}"?</p>
        <div className="flex gap-3 w-full">
          <button onClick={() => setIsConfirmingDelete(false)} className="flex-1 bg-white border border-red-200 text-red-700 font-bold py-3 rounded-xl hover:bg-red-50 transition-colors">Cancelar</button>
          <button onClick={handleDelete} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg">Sim, Excluir</button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-blue-200 p-5 flex flex-col h-full animate-in fade-in duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="text-blue-600">✏️</span> Editar Lead</h3>
        <div className="space-y-3 mb-6 flex-grow overflow-y-auto pr-1 custom-scrollbar">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Título do Lead</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} placeholder="Título chamativo..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nome</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Localização</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">WhatsApp</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl transition-colors">Cancelar</button>
          <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors">Salvar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${showSuccessNotes ? 'border-green-400' : 'border-slate-100'} p-5 hover:shadow-md transition-all group flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 mr-2 overflow-hidden">
          {lead.title && <span className="inline-block bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 uppercase tracking-wider">{lead.title}</span>}
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{lead.name}</h3>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-blue-50 rounded-md text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
              <button onClick={() => setIsConfirmingDelete(true)} className="p-1 hover:bg-red-50 rounded-md text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium uppercase truncate">{lead.businessType}</p>
        </div>
        <select value={lead.status} onChange={(e) => onStatusChange(lead.id, e.target.value as Lead['status'])} className={`text-xs px-2 py-1 rounded-full font-semibold border focus:outline-none ${getStatusStyles(lead.status)}`}>
          {statusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
      <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{lead.description}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
        <span>📍 {lead.location}</span>
        <span>⭐ {lead.score}% Match</span>
        {lead.phone && <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">📞 {lead.phone}</span>}
      </div>
      <div className="mb-4 relative">
        <textarea value={localNotes} onChange={(e) => setLocalNotes(e.target.value)} placeholder="Notas..." className="w-full border rounded-xl p-3 text-sm bg-slate-50 focus:bg-white h-20 resize-none" />
        <button onClick={handleSaveNotes} disabled={localNotes === (lead.notes || '') || isSavingNotes} className="absolute bottom-2 right-2 px-3 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-lg hover:bg-orange-600 disabled:opacity-0">Salvar</button>
      </div>
      <div className="flex gap-2 mt-auto">
        <button onClick={() => onAction(lead)} className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-xl text-sm">Ver Detalhes</button>
        {lead.phone && <a href={waUrl} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 text-white font-semibold py-2 rounded-xl text-sm text-center">WhatsApp</a>}
      </div>
    </div>
  );
};

export default LeadCard;
