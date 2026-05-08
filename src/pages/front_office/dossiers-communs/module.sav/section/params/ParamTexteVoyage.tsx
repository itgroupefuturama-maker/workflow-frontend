import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import { createTexteVoyage } from '../../../../../../app/front_office/parametre_sav/savParamsSlice';

export default function ParamTexteVoyage() {
  const dispatch = useDispatch<AppDispatch>();
  const { textesVoyage, loading, creating } = useSelector((s: RootState) => s.savParams);
  const { items: destinations } = useSelector((s: RootState) => s.destination);

  const [showForm, setShowForm] = useState(false);
  const [texte, setTexte] = useState('');
  const [destinationId, setDestinationId] = useState('');

  // useEffect(() => {
  //   dispatch(fetchTextesVoyage());
  //   dispatch(fetchDestinations());
  // }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texte.trim() || !destinationId) return;
    await dispatch(createTexteVoyage({ texte, destinationId }));
    setTexte('');
    setDestinationId('');
    setShowForm(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500">Textes voyage</p>
          <p className="text-xs text-gray-400 mt-0.5">Message affiché selon la destination</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          {showForm ? 'Annuler' : '+ Nouveau'}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={handleSubmit} className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-col gap-2">
          <select
            value={destinationId}
            onChange={e => setDestinationId(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white"
            required
          >
            <option value="">-- Choisir une destination --</option>
            {destinations.map(d => (
              <option key={d.id} value={d.id}>
                {d.ville} ({d.code})
              </option>
            ))}
          </select>
          <textarea
            value={texte}
            onChange={e => setTexte(e.target.value)}
            placeholder="Texte du message voyage..."
            rows={3}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none"
            required
          />
          <button
            type="submit"
            disabled={creating.texteVoyage}
            className="self-end text-xs px-4 py-1.5 bg-yellow-400 text-yellow-900 rounded-lg font-medium hover:bg-yellow-300 disabled:opacity-50"
          >
            {creating.texteVoyage ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      )}

      {/* Liste */}
      {loading.textesVoyage ? (
        <div className="text-xs text-gray-400 text-center py-6">Chargement...</div>
      ) : textesVoyage.length === 0 ? (
        <div className="text-xs text-gray-400 text-center py-6">Aucun texte voyage configuré</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {textesVoyage.map(item => (
            <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {item.destination.ville}
                  <span className="ml-1 text-gray-400">— {item.destination.pays.pays}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.texte}</p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}