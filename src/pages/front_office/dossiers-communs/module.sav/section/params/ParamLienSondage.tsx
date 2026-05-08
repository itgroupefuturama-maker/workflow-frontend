import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { createLienSondage } from '../../../../../../app/front_office/parametre_sav/savParamsSlice';

export default function ParamLienSondage() {
  const dispatch = useDispatch<AppDispatch>();
  const { liensSondage, loading, creating } = useSelector((s: RootState) => s.savParams);

  const [showForm, setShowForm] = useState(false);
  const [lien, setLien] = useState('');
  const [texte, setTexte] = useState('');
  const [dateApplication, setDateApplication] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lien.trim() || !texte.trim() || !dateApplication) return;
    await dispatch(createLienSondage({
      lienSondage: lien,
      texte,
      dateApplication: new Date(dateApplication).toISOString(),
    }));
    setLien('');
    setTexte('');
    setDateApplication('');
    setShowForm(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500">Liens sondage</p>
          <p className="text-xs text-gray-400 mt-0.5">Formulaires de satisfaction envoyés aux clients</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          {showForm ? 'Annuler' : '+ Nouveau'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-col gap-2">
          <input
            type="url"
            value={lien}
            onChange={e => setLien(e.target.value)}
            placeholder="https://forms.google.com/..."
            className="text-xs border border-gray-200 rounded-lg px-3 py-2"
            required
          />
          <input
            type="text"
            value={texte}
            onChange={e => setTexte(e.target.value)}
            placeholder="Texte d'accompagnement du sondage"
            className="text-xs border border-gray-200 rounded-lg px-3 py-2"
            required
          />
          <input
            type="date"
            value={dateApplication}
            onChange={e => setDateApplication(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2"
            required
          />
          <button
            type="submit"
            disabled={creating.lienSondage}
            className="self-end text-xs px-4 py-1.5 bg-yellow-400 text-yellow-900 rounded-lg font-medium hover:bg-yellow-300 disabled:opacity-50"
          >
            {creating.lienSondage ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      )}

      {/* Liste */}
      {loading.liensSondage ? (
        <div className="text-xs text-gray-400 text-center py-6">Chargement...</div>
      ) : liensSondage.length === 0 ? (
        <div className="text-xs text-gray-400 text-center py-6">Aucun lien sondage configuré</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {liensSondage.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <a
                  href={item.lienSondage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 truncate block"
                >
                  {item.lienSondage}
                </a>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.texte}</p>
              </div>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                item.statut === 'ACTIF'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {item.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}