import React, { useEffect, useState } from 'react';
import axios from '../../../../../service/Axios';
import { FiSearch, FiX, FiEdit2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { Spinner, inputClass, Field } from '../../module.parametre/components/Spinner';
import CommentairesList from '../../module.parametre/components/CommentairesList';
import type { CommentaireFournisseur } from '../../module.parametre/components/CommentaireCard';

const OngletTousCommentaires: React.FC = () => {
  const [tousCommentaires, setTousCommentaires] = useState<CommentaireFournisseur[]>([]);
  const [loading, setLoading]                   = useState(false);
  const [filtreAlerte, setFiltreAlerte]          = useState('TOUS');
  const [filtreStatut, setFiltreStatut]          = useState('TOUS');
  const [recherche, setRecherche]               = useState('');

  // — Édition —
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({
    commentaire:     '',
    alerte:          'NORMAL' as CommentaireFournisseur['alerte'],
    status:          'ACTIF'  as CommentaireFournisseur['status'],
    date_activation: new Date().toISOString().slice(0, 16),
  });

  const fetchTous = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/commentaires-fournisseur');
      if (res.data.success) setTousCommentaires(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTous(); }, []);

  const filtres = tousCommentaires.filter((c) => {
    const matchAlerte    = filtreAlerte === 'TOUS' || c.alerte === filtreAlerte;
    const matchStatut    = filtreStatut === 'TOUS' || c.status === filtreStatut;
    const matchRecherche = recherche === '' ||
      c.commentaire.toLowerCase().includes(recherche.toLowerCase()) ||
      c.fournisseur?.libelle.toLowerCase().includes(recherche.toLowerCase()) ||
      c.fournisseur?.code.toLowerCase().includes(recherche.toLowerCase());
    return matchAlerte && matchStatut && matchRecherche;
  });

  const startEdit = (c: CommentaireFournisseur) => {
    setEditingId(c.id);
    setForm({
      commentaire:     c.commentaire,
      alerte:          c.alerte,
      status:          c.status,
      date_activation: new Date(c.date_activation).toISOString().slice(0, 16),
    });
    // Scroll vers le formulaire
    setTimeout(() => document.getElementById('edit-panel-tous')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const resetEdit = () => { setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      const payload = {
        commentaire:     form.commentaire.trim(),
        alerte:          form.alerte,
        date_activation: new Date(form.date_activation).toISOString(),
        status:          form.status,
      };
      const res = await axios.put(`/commentaires-fournisseur/${editingId}`, payload);
      if (res.data.success) { await fetchTous(); resetEdit(); }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Panneau d'édition (visible seulement si un commentaire est sélectionné) ── */}
      {editingId && (
        <div
          id="edit-panel-tous"
          className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 ring-2 ring-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Édition</p>
              <h3 className="text-base font-semibold text-gray-800 mt-0.5 flex items-center gap-2">
                <FiEdit2 size={15} /> Modifier le commentaire
              </h3>
            </div>
            <button
              onClick={resetEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Fermer"
            >
              <FiX size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Commentaire" required>
              <textarea
                value={form.commentaire}
                onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
                className={`${inputClass} min-h-[90px] resize-none`}
                placeholder="Saisissez le commentaire..."
                required
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Niveau d'alerte">
                <select
                  value={form.alerte}
                  onChange={(e) => setForm({ ...form, alerte: e.target.value as CommentaireFournisseur['alerte'] })}
                  className={inputClass}
                >
                  <option value="FAIBLE">Faible</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ELEVE">Élevé</option>
                  <option value="TRES_ELEVE">Très élevé</option>
                </select>
              </Field>
              <Field label="Date d'activation">
                <input
                  type="datetime-local"
                  value={form.date_activation}
                  onChange={(e) => setForm({ ...form, date_activation: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Statut">
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-gray-50 h-full">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({
                      ...prev,
                      status: prev.status === 'ACTIF' ? 'INACTIF' : 'ACTIF',
                    }))}
                    className="flex-shrink-0"
                  >
                    {form.status === 'ACTIF'
                      ? <FiToggleRight size={26} className="text-emerald-500" />
                      : <FiToggleLeft  size={26} className="text-gray-300" />}
                  </button>
                  <span className={`text-xs font-medium ${form.status === 'ACTIF' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {form.status === 'ACTIF' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </Field>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving && <Spinner className="w-3.5 h-3.5" />}
                {saving ? 'Enregistrement...' : 'Mettre à jour'}
              </button>
              <button
                type="button"
                onClick={resetEdit}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filtres ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
            <input
              type="text"
              placeholder="Rechercher par commentaire, fournisseur..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition"
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          <select
            value={filtreAlerte}
            onChange={(e) => setFiltreAlerte(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
          >
            <option value="TOUS">Toutes les alertes</option>
            <option value="FAIBLE">Faible</option>
            <option value="NORMAL">Normal</option>
            <option value="ELEVE">Élevé</option>
            <option value="TRES_ELEVE">Très élevé</option>
          </select>

          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
          </select>

          <button
            onClick={fetchTous}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Spinner className="w-3 h-3" /> : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Actualiser
          </button>

          {!loading && (
            <span className="ml-auto text-xs text-gray-400">
              {filtres.length} résultat{filtres.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Grille de cards ── */}
      <CommentairesList
        commentaires={filtres}
        loading={loading}
        editingId={editingId}
        onEdit={startEdit}
        showFournisseur={true}
        emptyMessage="Aucun commentaire ne correspond aux filtres"
      />
    </div>
  );
};

export default OngletTousCommentaires;