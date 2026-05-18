import React, { useEffect, useRef, useState } from 'react';
import axios from '../../../../../service/Axios';
import { FiEdit2, FiPlus, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi';
import { Spinner, inputClass, Field } from '../../module.parametre/components/Spinner';
import CommentairesList from '../../module.parametre/components/CommentairesList';
import type { CommentaireFournisseur, Fournisseur } from '../../module.parametre/components/CommentaireCard';

interface Props {
  fournisseurs: Fournisseur[];
  loadingFournisseurs: boolean;
}

// Génère des initiales à partir du libellé
const initiales = (libelle: string) =>
  libelle
    .split(/[\s\-_]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

// Couleurs déterministes selon l'index
const AVATAR_COLORS = [
  '#7F77DD', '#1D9E75', '#D85A30', '#378ADD',
  '#BA7517', '#D4537E', '#639922', '#534AB7',
];

const OngletParFournisseur: React.FC<Props> = ({ fournisseurs, loadingFournisseurs }) => {
  const [selectedId, setSelectedId]   = useState('');
  const [commentaires, setCommentaires] = useState<CommentaireFournisseur[]>([]);
  const [loading, setLoading]           = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [showForm, setShowForm]         = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

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
    if (!selectedId) { setCommentaires([]); return; }
    fetchCommentaires(selectedId);
    resetForm();
  }, [selectedId]);

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm({
      commentaire:     '',
      alerte:          'NORMAL',
      status:          'ACTIF',
      date_activation: new Date().toISOString().slice(0, 16),
    });
  };

  const startEdit = (c: CommentaireFournisseur) => {
    setEditingId(c.id);
    setShowForm(true);
    setForm({
      commentaire:     c.commentaire,
      alerte:          c.alerte,
      status:          c.status,
      date_activation: new Date(c.date_activation).toISOString().slice(0, 16),
    });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const startCreate = () => {
    setEditingId(null);
    setShowForm(true);
    setForm({
      commentaire:     '',
      alerte:          'NORMAL',
      status:          'ACTIF',
      date_activation: new Date().toISOString().slice(0, 16),
    });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
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
        : await axios.post('/commentaires-fournisseur', { ...payload, fournisseurId: selectedId });
      if (res.data.success) {
        await fetchCommentaires(selectedId);
        resetForm();
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const selectedFournisseur = fournisseurs.find((f) => f.id === selectedId);

  return (
    <div className="space-y-4">

      {/* ── Chips fournisseurs ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Sélectionner un fournisseur
        </p>

        {loadingFournisseurs ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
            <Spinner className="w-4 h-4" /> Chargement...
          </div>
        ) : fournisseurs.length === 0 ? (
          <p className="text-sm text-gray-400 py-1">Aucun fournisseur disponible.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {fournisseurs.map((f, i) => {
              const isActive  = selectedId === f.id;
              const avatarBg  = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(isActive ? '' : f.id)}
                  className={`flex-shrink-0 inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gray-900 text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                  }`}
                >
                  {/* Avatar initiales */}
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : avatarBg }}
                  >
                    {initiales(f.libelle)}
                  </span>
                  {f.code}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedId && (
        <>
          {/* ── Barre fournisseur sélectionné + bouton créer ── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                {selectedFournisseur?.code}
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {selectedFournisseur?.libelle}
              </p>
            </div>
            <button
              onClick={startCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <FiPlus size={12} /> Nouveau commentaire
            </button>
          </div>

          {/* ── Formulaire (création ou édition) ── */}
          {showForm && (
            <div
              ref={formRef}
              className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 ring-2 ring-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {editingId ? 'Édition' : 'Création'}
                  </p>
                  <h3 className="text-base font-semibold text-gray-800 mt-0.5 flex items-center gap-2">
                    <FiEdit2 size={14} />
                    {editingId ? 'Modifier le commentaire' : 'Nouveau commentaire'}
                  </h3>
                </div>
                <button
                  onClick={resetForm}
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
                  {editingId && (
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
                        <span className={`text-xs font-medium ${
                          form.status === 'ACTIF' ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
                          {form.status === 'ACTIF' ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </Field>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving && <Spinner className="w-3.5 h-3.5" />}
                    {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Grille de commentaires ── */}
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