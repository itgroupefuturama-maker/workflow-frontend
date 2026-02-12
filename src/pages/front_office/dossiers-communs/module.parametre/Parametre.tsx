// Exemple : src/pages/parametres/CommentairesFournisseurs.tsx
// ou intégrée dans une page Parametres existante

import { useState, useEffect } from 'react';
import axios from '../../../../service/Axios'; // ton instance axios
import { FiArrowLeft, FiBell, FiCalendar, FiClock, FiEdit2, FiGrid, FiList, FiSearch, FiSettings, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Types (à adapter selon ton projet)
interface Fournisseur {
  id: string;
  code: string;
  libelle: string;
  // ...
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

export default function CommentairesFournisseurs() {
    const navigate = useNavigate();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loadingFournisseurs, setLoadingFournisseurs] = useState(true);

  const [selectedFournisseurId, setSelectedFournisseurId] = useState<string>('');
  const [commentaires, setCommentaires] = useState<CommentaireFournisseur[]>([]);
  const [loadingCommentaires, setLoadingCommentaires] = useState(false);
  const [activeSection, setActiveSection] = useState('commentaires');

  // Formulaire ajout/modif
  const [form, setForm] = useState({
    commentaire: '',
    alerte: 'NORMAL' as 'FAIBLE' | 'NORMAL' | 'ELEVE' | 'TRES_ELEVE',
    date_activation: new Date().toISOString().slice(0, 16),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── Chargement liste fournisseurs ─────────────────────────────
  useEffect(() => {
    const fetchFournisseurs = async () => {
      try {
        // Adaptez l'URL selon votre API réelle
        const res = await axios.get('/fournisseurs'); 
        setFournisseurs(res.data.data || res.data);
      } catch (err) {
        console.error('Erreur chargement fournisseurs', err);
      } finally {
        setLoadingFournisseurs(false);
      }
    };
    fetchFournisseurs();
  }, []);

  // ─── Chargement commentaires quand fournisseur sélectionné ────
  useEffect(() => {
    if (!selectedFournisseurId) {
      setCommentaires([]);
      return;
    }

    const fetchCommentaires = async () => {
      setLoadingCommentaires(true);
      try {
        const res = await axios.get(
          `/commentaires-fournisseur/fournisseur/${selectedFournisseurId}`
        );
        if (res.data.success) {
          setCommentaires(res.data.data || []);
        }
      } catch (err) {
        console.error('Erreur chargement commentaires', err);
      } finally {
        setLoadingCommentaires(false);
      }
    };

    fetchCommentaires();
  }, [selectedFournisseurId]);

  // ─── Soumission formulaire (ajout ou update) ───────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFournisseurId) return;

    setSaving(true);
    try {
      const payload = {
        commentaire: form.commentaire.trim(),
        alerte: form.alerte,
        date_activation: new Date(form.date_activation).toISOString(),
      };

      let res;
      if (editingId) {
        // Mise à jour
        res = await axios.put(`/commentaires-fournisseur/${editingId}`, {
          ...payload,
          status: 'ACTIF', // ou laisser l'utilisateur choisir si besoin
        });
      } else {
        // Création
        res = await axios.post('/commentaires-fournisseur', {
          ...payload,
          fournisseurId: selectedFournisseurId,
        });
      }

      if (res.data.success) {
        // Recharger la liste
        setSelectedFournisseurId(selectedFournisseurId); // trigger useEffect
        // Reset form
        setForm({
          commentaire: '',
          alerte: 'NORMAL',
          date_activation: new Date().toISOString().slice(0, 16),
        });
        setEditingId(null);
      }
    } catch (err) {
      console.error('Erreur sauvegarde commentaire', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ─── Édition d'un commentaire ──────────────────────────────────
  const startEdit = (c: CommentaireFournisseur) => {
    setEditingId(c.id);
    setForm({
      commentaire: c.commentaire,
      alerte: c.alerte as any,
      date_activation: new Date(c.date_activation).toISOString().slice(0, 16),
    });
  };

  // ─── JSX ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
            {/* Navigation gauche */}
            <div className="flex items-center gap-4">
                <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Retour"
                >
                <FiArrowLeft size={20} />
                </button>
                <div>
                <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>
                <p className="text-sm text-gray-500">Configuration du système</p>
                </div>
            </div>

            {/* Barre de recherche */}
            <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher un paramètre..." 
                    className="w-full bg-gray-100 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                />
                </div>
            </div>
            </div>
        </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Menu latéral des sections */}
        <div className="grid grid-cols-12 gap-6">
            {/* Sidebar navigation */}
            <aside className="col-span-3">
            <nav className="bg-white rounded-lg border border-slate-200 p-4 sticky top-24">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Sections
                </h2>
                <ul className="space-y-1">
                <li>
                    <button
                    onClick={() => setActiveSection('commentaires')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === 'commentaires'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    >
                    Commentaires fournisseurs
                    </button>
                </li>
                <li>
                    <button
                    onClick={() => setActiveSection('notifications')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === 'notifications'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    >
                    Notifications
                    </button>
                </li>
                <li>
                    <button
                    onClick={() => setActiveSection('utilisateurs')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === 'utilisateurs'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    >
                    Utilisateurs
                    </button>
                </li>
                <li>
                    <button
                    onClick={() => setActiveSection('general')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeSection === 'general'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    >
                    Général
                    </button>
                </li>
                </ul>
            </nav>
            </aside>

            {/* Contenu principal */}
            <main className="col-span-9">
            {/* Section Commentaires fournisseurs */}
            {activeSection === 'commentaires' && (
                <div className="space-y-6">
                {/* Header de section */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Commentaires fournisseurs</h2>
                        <p className="text-sm text-gray-500 mt-1">
                        Gérez les commentaires et alertes associés aux fournisseurs
                        </p>
                    </div>
                    </div>
                </div>

                {/* Sélection fournisseur */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Sélectionner un fournisseur
                    </label>
                    {loadingFournisseurs ? (
                    <div className="flex items-center gap-2 text-gray-500 py-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        Chargement des fournisseurs...
                    </div>
                    ) : (
                    <select
                        value={selectedFournisseurId}
                        onChange={(e) => {
                        setSelectedFournisseurId(e.target.value);
                        setEditingId(null);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    >
                        <option value="">— Choisir un fournisseur —</option>
                        {fournisseurs.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.code} — {f.libelle}
                        </option>
                        ))}
                    </select>
                    )}
                </div>

                {selectedFournisseurId && (
                    <>
                    {/* Formulaire ajout / édition */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">
                        {editingId ? 'Modifier le commentaire' : 'Nouveau commentaire'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                            Commentaire <span className="text-red-600">*</span>
                            </label>
                            <textarea
                            value={form.commentaire}
                            onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm min-h-[100px] focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                            placeholder="Saisissez le commentaire..."
                            required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                                Niveau d'alerte
                            </label>
                            <select
                                value={form.alerte}
                                onChange={(e) => setForm({ ...form, alerte: e.target.value as any })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                            >
                                <option value="FAIBLE">Faible</option>
                                <option value="NORMAL">Normal</option>
                                <option value="ELEVE">Élevé</option>
                                <option value="TRES_ELEVE">Très élevé</option>
                            </select>
                            </div>

                            <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                                Date d'activation
                            </label>
                            <input
                                type="datetime-local"
                                value={form.date_activation}
                                onChange={(e) => setForm({ ...form, date_activation: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                            />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                            {saving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}
                            </button>

                            {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                setEditingId(null);
                                setForm({ 
                                    commentaire: '', 
                                    alerte: 'NORMAL', 
                                    date_activation: new Date().toISOString().slice(0, 16) 
                                });
                                }}
                                className="px-5 py-2 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            )}
                        </div>
                        </form>
                    </div>

                    {/* Liste des commentaires */}
                    <div className="bg-white rounded-lg border border-slate-200 ">
                        <div className="border-b border-slate-200  px-6 py-4">
                        <h3 className="text-sm font-bold text-gray-900">
                            Historique des commentaires
                        </h3>
                        </div>

                        <div className="p-6">
                        {loadingCommentaires ? (
                            <div className="flex items-center justify-center gap-2 text-gray-500 py-8">
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            Chargement des commentaires...
                            </div>
                        ) : commentaires.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                            <p className="text-sm">Aucun commentaire pour ce fournisseur</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                            {commentaires.map((c) => (
                                <div
                                key={c.id}
                                className={`p-4 rounded-lg border transition-all ${
                                    c.status === 'ACTIF' 
                                    ? 'bg-white border-gray-200 hover:border-gray-300' 
                                    : 'bg-gray-50 border-gray-200 opacity-60'
                                }`}
                                >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 mb-2">
                                        {c.commentaire}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                        <FiClock size={12} />
                                        {new Date(c.dateEnregistrement).toLocaleString('fr-FR')}
                                        </span>
                                        {c.date_desactivation && (
                                        <span className="text-red-600">
                                            Désactivé le {new Date(c.date_desactivation).toLocaleString('fr-FR')}
                                        </span>
                                        )}
                                    </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                        c.alerte === 'TRES_ELEVE' ? 'bg-red-100 text-red-700' :
                                        c.alerte === 'ELEVE'     ? 'bg-orange-100 text-orange-700' :
                                        c.alerte === 'NORMAL'    ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {c.alerte.replace('_', ' ')}
                                    </span>

                                    {c.status === 'ACTIF' ? (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                        Actif
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                                        Inactif
                                        </span>
                                    )}

                                    <button
                                        onClick={() => startEdit(c)}
                                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Modifier"
                                    >
                                        <FiEdit2 size={16} />
                                    </button>
                                    </div>
                                </div>
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
                    </div>
                    </>
                )}
                </div>
            )}

            {/* Section Notifications (placeholder) */}
            {activeSection === 'notifications' && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiBell className="text-gray-400" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                    Cette section sera disponible prochainement
                    </p>
                </div>
                </div>
            )}

            {/* Section Utilisateurs (placeholder) */}
            {activeSection === 'utilisateurs' && (
                <div className="bg-white rounded-lg border border-slate-200  p-6">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiUsers className="text-gray-400" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Gestion des utilisateurs
                    </h3>
                    <p className="text-sm text-gray-500">
                    Cette section sera disponible prochainement
                    </p>
                </div>
                </div>
            )}

            {/* Section Général (placeholder) */}
            {activeSection === 'general' && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiSettings className="text-gray-400" size={28} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Paramètres généraux
                    </h3>
                    <p className="text-sm text-gray-500">
                    Cette section sera disponible prochainement
                    </p>
                </div>
                </div>
            )}
            </main>
        </div>
        </div>
    </div>
    );
}