import { useState, useEffect } from 'react';
import axios from '../../../../service/Axios';
import {
  FiArrowLeft, FiBell, FiEdit2, FiSearch,
  FiSettings, FiUsers, FiClock, FiToggleLeft,
  FiToggleRight, FiList, FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
}

interface CommentaireFournisseur {
  id: string;
  commentaire: string;
  dateEnregistrement: string;
  date_activation: string;
  date_desactivation: string | null;
  status: 'ACTIF' | 'INACTIF';
  alerte: 'FAIBLE' | 'NORMAL' | 'ELEVE' | 'TRES_ELEVE';
  fournisseurId: string;
  fournisseur?: Fournisseur;
}

/* ── Helpers UI ─────────────────────────────────────────────── */

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition';

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1.5">
      {label}
      {required && <span className="text-gray-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const alerteConfig = {
  TRES_ELEVE: { label: 'Très élevé', class: 'bg-red-50 text-red-600 border-red-200' },
  ELEVE:      { label: 'Élevé',      class: 'bg-orange-50 text-orange-600 border-orange-200' },
  NORMAL:     { label: 'Normal',     class: 'bg-amber-50 text-amber-600 border-amber-200' },
  FAIBLE:     { label: 'Faible',     class: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

const Spinner = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
  </svg>
);

/* ── Carte commentaire réutilisable ─────────────────────────── */
const CommentaireCard = ({
  c,
  editingId,
  onEdit,
  showFournisseur = false,
}: {
  c: CommentaireFournisseur;
  editingId?: string | null;
  onEdit?: (c: CommentaireFournisseur) => void;
  showFournisseur?: boolean;
}) => {
  const alerte = alerteConfig[c.alerte];
  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        c.status === 'ACTIF'
          ? 'bg-white border-gray-200 hover:border-gray-300'
          : 'bg-gray-50 border-gray-100 opacity-50'
      } ${editingId === c.id ? 'ring-2 ring-gray-300 border-transparent' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Nom du fournisseur (onglet global uniquement) */}
          {showFournisseur && c.fournisseur && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <FiUser size={11} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500">
                {c.fournisseur.code} — {c.fournisseur.libelle}
              </span>
            </div>
          )}
          <p className="text-sm text-gray-700 leading-relaxed">{c.commentaire}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <FiClock size={11} />
              {new Date(c.dateEnregistrement).toLocaleString('fr-FR')}
            </span>
            {c.date_desactivation && (
              <span className="text-red-400">
                Désactivé le {new Date(c.date_desactivation).toLocaleString('fr-FR')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${alerte.class}`}>
            {alerte.label}
          </span>
          {c.status === 'ACTIF' ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-600 border-emerald-200">
              Actif
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-400 border-gray-200">
              Inactif
            </span>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(c)}
              className={`p-1.5 rounded-lg transition-colors ${
                editingId === c.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Modifier"
            >
              <FiEdit2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════ */

export default function CommentairesFournisseurs() {
  const navigate = useNavigate();

  // ── Données ──
  const [fournisseurs, setFournisseurs]               = useState<Fournisseur[]>([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(true);
  const [selectedFournisseurId, setSelectedFournisseurId] = useState('');
  const [commentaires, setCommentaires]               = useState<CommentaireFournisseur[]>([]);
  const [loadingCommentaires, setLoadingCommentaires] = useState(false);

  // ── Onglet global ──
  const [tousCommentaires, setTousCommentaires]       = useState<CommentaireFournisseur[]>([]);
  const [loadingTous, setLoadingTous]                 = useState(false);
  const [filtreAlerte, setFiltreAlerte]               = useState<string>('TOUS');
  const [filtreStatut, setFiltreStatut]               = useState<string>('TOUS');
  const [recherche, setRecherche]                     = useState('');

  // ── Navigation ──
  const [activeSection, setActiveSection] = useState('commentaires');
  const [activeTab, setActiveTab]         = useState<'par_fournisseur' | 'tous'>('tous');

  // ── Formulaire ──
  const [form, setForm] = useState({
    commentaire:    '',
    alerte:         'NORMAL' as CommentaireFournisseur['alerte'],
    status:         'ACTIF'  as CommentaireFournisseur['status'],
    date_activation: new Date().toISOString().slice(0, 16),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);

  /* ── Fetch fournisseurs ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/fournisseurs');
        setFournisseurs(res.data.data || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFournisseurs(false);
      }
    })();
  }, []);

  /* ── Fetch commentaires par fournisseur ── */
  const fetchCommentaires = async (id: string) => {
    setLoadingCommentaires(true);
    try {
      const res = await axios.get(`/commentaires-fournisseur/fournisseur/${id}`);
      if (res.data.success) setCommentaires(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCommentaires(false);
    }
  };

  useEffect(() => {
    if (!selectedFournisseurId) { setCommentaires([]); return; }
    fetchCommentaires(selectedFournisseurId);
  }, [selectedFournisseurId]);

  /* ── Fetch tous les commentaires ── */
  const fetchTousCommentaires = async () => {
    setLoadingTous(true);
    try {
      const res = await axios.get('/commentaires-fournisseur');
      if (res.data.success) setTousCommentaires(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTous(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tous') fetchTousCommentaires();
  }, [activeTab]);

  /* ── Filtrage onglet global ── */
  const commentairesFiltres = tousCommentaires.filter((c) => {
    const matchAlerte  = filtreAlerte === 'TOUS' || c.alerte === filtreAlerte;
    const matchStatut  = filtreStatut === 'TOUS' || c.status === filtreStatut;
    const matchRecherche =
      recherche === '' ||
      c.commentaire.toLowerCase().includes(recherche.toLowerCase()) ||
      c.fournisseur?.libelle.toLowerCase().includes(recherche.toLowerCase()) ||
      c.fournisseur?.code.toLowerCase().includes(recherche.toLowerCase());
    return matchAlerte && matchStatut && matchRecherche;
  });

  /* ── Submit ── */
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

      if (res.data.success) {
        await fetchCommentaires(selectedFournisseurId);
        resetForm();
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ commentaire: '', alerte: 'NORMAL', status: 'ACTIF', date_activation: new Date().toISOString().slice(0, 16) });
  };

  const startEdit = (c: CommentaireFournisseur) => {
    setEditingId(c.id);
    setForm({
      commentaire:    c.commentaire,
      alerte:         c.alerte,
      status:         c.status,
      date_activation: new Date(c.date_activation).toISOString().slice(0, 16),
    });
    document.getElementById('form-commentaire')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── Sidebar ── */
  const sidebarItems = [
    { key: 'commentaires',  label: 'Commentaires fournisseurs', icon: <FiBell size={15} /> },
    { key: 'notifications', label: 'Notifications',             icon: <FiBell size={15} /> },
    { key: 'utilisateurs',  label: 'Utilisateurs',              icon: <FiUsers size={15} /> },
    { key: 'general',       label: 'Général',                   icon: <FiSettings size={15} /> },
  ];

  const placeholders: Record<string, { icon: React.ReactNode; title: string }> = {
    notifications: { icon: <FiBell size={28} />,     title: 'Notifications' },
    utilisateurs:  { icon: <FiUsers size={28} />,    title: 'Gestion des utilisateurs' },
    general:       { icon: <FiSettings size={28} />, title: 'Paramètres généraux' },
  };

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft size={18} />
              </button>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Système</p>
                <h1 className="text-base font-semibold text-gray-800 mt-0.5">Paramètres</h1>
              </div>
            </div>
            <div className="flex-1 max-w-sm mx-8">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
                <input
                  type="text"
                  placeholder="Rechercher un paramètre..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">

          {/* ── Sidebar ── */}
          <aside className="col-span-3">
            <nav className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sticky top-20">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Sections</p>
              <ul className="space-y-0.5">
                {sidebarItems.map((item) => (
                  <li key={item.key}>
                    <button
                      onClick={() => setActiveSection(item.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2.5 ${
                        activeSection === item.key
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ── Contenu ── */}
          <main className="col-span-9 space-y-5">

            {activeSection === 'commentaires' && (
              <>
                {/* ── Titre de section ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Paramètres</p>
                  <h2 className="text-base font-semibold text-gray-800 mt-0.5">Commentaires fournisseurs</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Gérez les commentaires et alertes associés aux fournisseurs
                  </p>

                  {/* ── Onglets ── */}
                  <div className="flex gap-1 mt-4 border-b border-gray-100">
                    <TabButton
                      active={activeTab === 'tous'}
                      onClick={() => setActiveTab('tous')}
                      icon={<FiList size={13} />}
                      label="Tous les commentaires"
                      badge={tousCommentaires.length > 0 ? tousCommentaires.length : undefined}
                    />
                    <TabButton
                      active={activeTab === 'par_fournisseur'}
                      onClick={() => setActiveTab('par_fournisseur')}
                      icon={<FiUser size={13} />}
                      label="Par fournisseur"
                    />
                  </div>
                </div>

                {/* ══ Onglet : Par fournisseur ══ */}
                {activeTab === 'par_fournisseur' && (
                  <>
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

                            {/* Toggle statut — mode édition uniquement */}
                            {editingId && (
                              <Field label="Statut">
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        status: prev.status === 'ACTIF' ? 'INACTIF' : 'ACTIF',
                                      }))
                                    }
                                    className="flex-shrink-0 transition-colors"
                                  >
                                    {form.status === 'ACTIF'
                                      ? <FiToggleRight size={28} className="text-emerald-500" />
                                      : <FiToggleLeft  size={28} className="text-gray-300" />
                                    }
                                  </button>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">
                                      {form.status === 'ACTIF' ? 'Actif' : 'Inactif'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {form.status === 'ACTIF'
                                        ? 'Le commentaire est visible et actif'
                                        : 'Le commentaire est désactivé'}
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

                        {/* Liste par fournisseur */}
                        <CommentairesList
                          commentaires={commentaires}
                          loading={loadingCommentaires}
                          editingId={editingId}
                          onEdit={startEdit}
                          showFournisseur={false}
                          emptyMessage="Ce fournisseur n'a pas encore de commentaire"
                        />
                      </>
                    )}
                  </>
                )}

                {/* ══ Onglet : Tous les commentaires ══ */}
                {activeTab === 'tous' && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

                    {/* Filtres */}
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                      {/* Recherche */}
                      <div className="relative flex-1 min-w-[200px]">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={recherche}
                          onChange={(e) => setRecherche(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition"
                        />
                      </div>

                      {/* Filtre alerte */}
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

                      {/* Filtre statut */}
                      <select
                        value={filtreStatut}
                        onChange={(e) => setFiltreStatut(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
                      >
                        <option value="TOUS">Tous les statuts</option>
                        <option value="ACTIF">Actif</option>
                        <option value="INACTIF">Inactif</option>
                      </select>

                      {/* Bouton rafraichir */}
                      <button
                        onClick={fetchTousCommentaires}
                        disabled={loadingTous}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loadingTous
                          ? <Spinner className="w-3 h-3" />
                          : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )
                        }
                        Actualiser
                      </button>

                      {/* Compteur résultats */}
                      {!loadingTous && (
                        <span className="ml-auto text-xs text-gray-400">
                          {commentairesFiltres.length} résultat{commentairesFiltres.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Liste globale */}
                    <div className="p-5">
                      <CommentairesList
                        commentaires={commentairesFiltres}
                        loading={loadingTous}
                        showFournisseur={true}
                        emptyMessage="Aucun commentaire ne correspond aux filtres"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══ Sections placeholder ══ */}
            {Object.entries(placeholders).map(([key, { icon, title }]) =>
              activeSection === key ? (
                <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="text-center py-14">
                    <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      {icon}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
                    <p className="text-xs text-gray-400 mt-1">Cette section sera disponible prochainement</p>
                  </div>
                </div>
              ) : null
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ── Composant onglet ───────────────────────────────────────── */
const TabButton = ({
  active, onClick, icon, label, badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
      active
        ? 'border-gray-800 text-gray-800'
        : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
    }`}
  >
    {icon}
    {label}
    {badge !== undefined && (
      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
        active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        {badge}
      </span>
    )}
  </button>
);

/* ── Liste de commentaires réutilisable ─────────────────────── */
const CommentairesList = ({
  commentaires,
  loading,
  editingId,
  onEdit,
  showFournisseur,
  emptyMessage,
}: {
  commentaires: CommentaireFournisseur[];
  loading: boolean;
  editingId?: string | null;
  onEdit?: (c: CommentaireFournisseur) => void;
  showFournisseur: boolean;
  emptyMessage: string;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-12">
        <Spinner className="w-4 h-4" /> Chargement...
      </div>
    );
  }
  if (commentaires.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-gray-300 uppercase tracking-wider">Aucun commentaire</p>
        <p className="text-sm text-gray-400 mt-1">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {commentaires.map((c) => (
        <CommentaireCard
          key={c.id}
          c={c}
          editingId={editingId}
          onEdit={onEdit}
          showFournisseur={showFournisseur}
        />
      ))}
    </div>
  );
};