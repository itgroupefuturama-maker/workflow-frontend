import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../../app/store';
import {
  fetchItineraires,
  deleteItineraire,
  updateItineraire,
  type Itineraire,
} from '../../../../../../app/front_office/parametre_ticketing/itineraireSlice';
import ItineraireModal from '../../../../../../components/modals/ItineraireModal';
import Pagination from '../../../../../../components/Pagination';
import Button from '../../../../../../components/ui/Button';
import { useDebouncedValue } from '../../../../../../hooks/useDebouncedValue';
import { toast } from '../../../../../../components/Toast/toast';

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function ItineraireListe() {
  const dispatch = useAppDispatch();
  const { items, meta, loading, error } = useSelector((state: RootState) => state.itineraire);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statutFilter, setStatutFilter] = useState<'' | 'ACTIF' | 'INACTIF'>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItineraire, setEditingItineraire] = useState<Itineraire | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statutFilter]);

  const loadList = () => {
    dispatch(fetchItineraires({
      page,
      limit,
      search: debouncedSearch || undefined,
      statut: statutFilter || undefined,
    }));
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, limit, debouncedSearch, statutFilter]);

  const openCreate = () => {
    setEditingItineraire(null);
    setModalOpen(true);
  };

  const openEdit = (itineraire: Itineraire) => {
    setEditingItineraire(itineraire);
    setModalOpen(true);
  };

  const handleToggleStatut = async (itineraire: Itineraire) => {
    setLoadingId(itineraire.id);
    const nextStatut = itineraire.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    const result = await dispatch(updateItineraire({ id: itineraire.id, statut: nextStatut }));
    if (updateItineraire.fulfilled.match(result)) {
      loadList();
    } else {
      toast.error((result.payload as string) || 'Erreur lors du changement de statut');
    }
    setLoadingId(null);
  };

  const handleDelete = async (itineraire: Itineraire) => {
    if (!window.confirm(`Supprimer l'itinéraire "${itineraire.libelle}" ?`)) return;
    setLoadingId(itineraire.id);
    const result = await dispatch(deleteItineraire(itineraire.id));
    if (deleteItineraire.fulfilled.match(result)) {
      toast.success('Itinéraire supprimé.');
      loadList();
    } else {
      // 409 si déjà utilisé — le backend propose de désactiver à la place.
      toast.error((result.payload as string) || 'Erreur lors de la suppression', 'Suppression impossible');
    }
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      {/* ══ HEADER ══ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Itinéraires</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Référentiel des combinaisons ville de départ → ville d'arrivée
          </p>
        </div>
        {/* <Button variant="primary" size="sm" onClick={openCreate}>
          <span className="text-sm leading-none">+</span>
          Nouvel itinéraire
        </Button> */}
      </div>

      {/* ══ FILTRES ══ */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          placeholder="Rechercher par code, libellé, ville ou pays..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
        />
        <div className="h-6 w-px bg-slate-100 hidden sm:block" />
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value as '' | 'ACTIF' | 'INACTIF')}
          className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 bg-white border border-slate-100 rounded-lg outline-none cursor-pointer"
        >
          <option value="">Tous statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* ══ TABLE ══ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {['Code', 'Libellé', 'Départ', 'Arrivée', 'Odoo', 'Statut', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-slate-400 animate-pulse">
                  Chargement des itinéraires...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <p className="text-sm font-semibold text-slate-500">Aucun itinéraire trouvé</p>
                  <p className="text-xs text-slate-400 mt-1">Commencez par en créer un</p>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                // const isProcessing = loadingId === item.id;
                const isActif = item.statut === 'ACTIF';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 text-sm font-mono font-bold text-indigo-600">{item.code}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-800">{item.libelle}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {item.villeDepart?.ville}
                      <span className="text-slate-400"> · {item.paysDepart?.pays}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {item.villeArrivee?.ville}
                      <span className="text-slate-400"> · {item.paysArrivee?.pays}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {item.odooId ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-xs">✔</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase ${
                        isActif ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {item.statut}
                      </span>
                    </td>
                    {/* <td className="px-5 py-3 text-right">
                      {isProcessing ? (
                        <div className="inline-flex items-center justify-end">
                          <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                          <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline">
                            Modifier
                          </button>
                          <button
                            onClick={() => handleToggleStatut(item)}
                            className={isActif ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'}
                          >
                            {isActif ? 'Désactiver' : 'Activer'}
                          </button>
                          <button onClick={() => handleDelete(item)} className="text-red-500 hover:underline">
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td> */}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <Pagination
          meta={meta}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
          itemLabel="itinéraire"
        />
      </div>

      <ItineraireModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadList}
        editingItineraire={editingItineraire}
      />
    </div>
  );
}
