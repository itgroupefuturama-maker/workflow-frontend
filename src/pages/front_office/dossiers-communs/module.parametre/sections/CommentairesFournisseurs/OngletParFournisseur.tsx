import React, { useEffect, useState } from 'react';
import axios from '../../../../../../service/Axios';
import { FiEdit2, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { Spinner, inputClass, Field } from '../../components/Spinner';
import CommentairesList from '../../components/CommentairesList';
import type { CommentaireFournisseur, Fournisseur } from '../../components/CommentaireCard';

interface Props {
  fournisseurs: Fournisseur[];
  loadingFournisseurs: boolean;
}

const OngletParFournisseur: React.FC<Props> = ({ fournisseurs, loadingFournisseurs }) => {
  const [selectedFournisseurId, setSelectedFournisseurId] = useState('');
  const [commentaires, setCommentaires]                   = useState<CommentaireFournisseur[]>([]);
  const [loading, setLoading]                             = useState(false);
  const [editingId, setEditingId]                         = useState<string | null>(null);
  const [saving, setSaving]                               = useState(false);

  const [form, setForm] = useState({
    commentaire:     '',
    alerte:          'NORMAL' as CommentaireFournisseur['alerte'],
    status:          'ACTIF'  as CommentaireFournisseur['status'],
    date_activation: new Date().toISOString().slice(0, 16),
  });

  const fetchCommentaires = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`/commentaires-fournisseur/fournisseur/${id}`);
      if (res.data.success) setCommentaires(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedFournisseurId) { setCommentaires([]); return; }
    fetchCommentaires(selectedFournisseurId);
  }, [selectedFournisseurId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ commentaire: '', alerte: 'NORMAL', status: 'ACTIF', date_activation: new Date().toISOString().slice(0, 16) });
  };

  const startEdit = (c: CommentaireFournisseur) => {
    setEditingId(c.id);
    setForm({
      commentaire:     c.commentaire,
      alerte:          c.alerte,
      status:          c.status,
      date_activation: new Date(c.date_activation).toISOString().slice(0, 16),
    });
    document.getElementById('form-commentaire')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFournisseurId) return;
    setSaving(true);
    try {
      const payload = {
        commentaire:     form.commentaire.trim(),
        alerte:          form.alerte,
        date_activation: new Date(form.date_activation).toISOString(),
        status:          form.status,
      };
      const res = editingId
        ? await axios.put(`/commentaires-fournisseur/${editingId}`, payload)
        : await axios.post('/commentaires-fournisseur', { ...payload, fournisseurId: selectedFournisseurId });
      if (res.data.success) { await fetchCommentaires(selectedFournisseurId); resetForm(); }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sélection fournisseur */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Fournisseur</p>
        {loadingFournisseurs ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
            <Spinner className="w-4 h-4" /> Chargement...
          </div>
        ) : (
          <select
            value={selectedFournisseurId}
            onChange={(e) => { setSelectedFournisseurId(e.target.value); resetForm(); }}
            className={inputClass}
          >
            <option value="">— Choisir un fournisseur —</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>{f.code} — {f.libelle}</option>
            ))}
          </select>
        )}
      </div>

      {selectedFournisseurId && (
        <>
          {/* Formulaire */}
          <div id="form-commentaire" className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {editingId ? 'Modification' : 'Création'}
                </p>
                <h3 className="text-base font-semibold text-gray-800 mt-0.5">
                  {editingId ? 'Modifier le commentaire' : 'Nouveau commentaire'}
                </h3>
              </div>
              {editingId && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-200 text-amber-600">
                  <FiEdit2 size={11} /> Mode édition
                </span>
              )}
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

              <div className="grid grid-cols-2 gap-4">
                <Field label="Niveau d'alerte">
                  <select
                    value={form.alerte}
                    onChange={(e) => setForm({ ...form, alerte: e.target.value as CommentaireFournisseur['alerte'] })}
                    className={inputClass}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="FAIBLE">Faible</option>
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
              </div>

              {editingId && (
                <Field label="Statut">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, status: prev.status === 'ACTIF' ? 'INACTIF' : 'ACTIF' }))}
                      className="flex-shrink-0 transition-colors"
                    >
                      {form.status === 'ACTIF'
                        ? <FiToggleRight size={28} className="text-emerald-500" />
                        : <FiToggleLeft  size={28} className="text-gray-300" />}
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {form.status === 'ACTIF' ? 'Actif' : 'Inactif'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {form.status === 'ACTIF' ? 'Le commentaire est visible et actif' : 'Le commentaire est désactivé'}
                      </p>
                    </div>
                  </div>
                </Field>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Spinner className="w-3.5 h-3.5" />}
                  {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Liste */}
          <CommentairesList
            commentaires={commentaires}
            loading={loading}
            editingId={editingId}
            onEdit={startEdit}
            showFournisseur={false}
            emptyMessage="Ce fournisseur n'a pas encore de commentaire"
          />
        </>
      )}
    </div>
  );
};

export default OngletParFournisseur;