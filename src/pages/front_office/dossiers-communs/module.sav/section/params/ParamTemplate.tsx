import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  createTemplate,
  createTemplateRerappel,
} from '../../../../../../app/front_office/parametre_sav/savParamsSlice';

const VARIABLES = [
  '${nomComplet}', '${day}', '${compagnie}', '${destination}',
  '${aeroport}', '${hourStr}', '${registrationCloseStr}',
  '${recommandation}', '${texteVoyageBase}', '${services}',
];

type TabType = 'rappel' | 'rerappel';

export default function ParamTemplate() {
  const dispatch = useDispatch<AppDispatch>();
  const { templates, templatesRerappel, loading, creating } = useSelector(
    (s: RootState) => s.savParams
  );

  const [activeTab, setActiveTab] = useState<TabType>('rappel');
  const [showForm, setShowForm] = useState(false);
  const [texte, setTexte] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texte.trim()) return;
    if (activeTab === 'rappel') {
      await dispatch(createTemplate({ texte }));
    } else {
      await dispatch(createTemplateRerappel({ texte }));
    }
    setTexte('');
    setShowForm(false);
  };

  // Fermer le form lors du changement de tab
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setShowForm(false);
    setTexte('');
  };

  const insertVariable = (v: string) => setTexte(prev => prev + v);

  const isCreating = activeTab === 'rappel' ? creating.template : creating.templateRerappel;
  const isLoading = activeTab === 'rappel' ? loading.templates : loading.templatesRerappel;
  const list = activeTab === 'rappel' ? templates : templatesRerappel;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
            Templates de rappel
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configurez les messages automatiques envoyés avant le départ.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
            showForm
              ? 'bg-slate-100 text-slate-600'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {showForm ? 'Fermer' : '+ Créer un template'}
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-2">
        <button
          onClick={() => handleTabChange('rappel')}
          className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all border ${
            activeTab === 'rappel'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
          }`}
        >
          Template Rappel
          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'rappel' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            {templates.length}
          </span>
        </button>
        <button
          onClick={() => handleTabChange('rerappel')}
          className={`text-xs px-4 py-2 rounded-lg font-semibold transition-all border ${
            activeTab === 'rerappel'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
          }`}
        >
          Template Rerappel
          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'rerappel' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            {templatesRerappel.length}
          </span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mx-6 mt-4 p-6 bg-slate-50/50 border border-slate-100 rounded-xl animate-in slide-in-from-top-2"
        >
          <label className="text-[11px] font-bold text-slate-400 uppercase mb-2 block">
            Variables disponibles
          </label>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {VARIABLES.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="text-[10px] px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-md hover:border-slate-400 font-mono transition-colors shadow-sm"
              >
                {v}
              </button>
            ))}
          </div>

          <textarea
            value={texte}
            onChange={e => setTexte(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 min-h-[200px] font-mono focus:ring-4 focus:ring-slate-900/5 outline-none transition-all shadow-inner"
            placeholder={`Écrivez votre template ${activeTab === 'rappel' ? 'rappel' : 'rerappel'} ici...`}
          />

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className={`text-white text-xs px-6 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'rappel'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              {isCreating ? 'Enregistrement...' : 'Enregistrer le Template'}
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      <div className="divide-y divide-slate-100 mt-4">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-slate-400">Chargement...</div>
        ) : list.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Aucun template {activeTab === 'rappel' ? 'rappel' : 'rerappel'} configuré.
          </div>
        ) : (
          list.map(item => (
            <div key={item.id} className="p-6 hover:bg-slate-50/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-slate-400">
                  Mis à jour le {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                  activeTab === 'rappel'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  ACTIF
                </span>
              </div>
              <div className="bg-slate-900 rounded-xl p-5 shadow-2xl">
                <code className="text-[13px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {item.texte}
                </code>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}