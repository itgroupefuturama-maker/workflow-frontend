import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../../../../../app/store';
import { fetchHotelReservations } from '../../../../../../app/front_office/parametre_hotel/hotelReservationEnteteSlice';
import { useNavigate } from 'react-router-dom';
import { HotelHeader } from '../../components/HotelHeader';

interface Props {
  prestationId: string;
  dossierNumero?: string;
}

const HotelReservationsList = ({ prestationId, dossierNumero }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const {
    items: reservations = [],
    loading: reservationsLoading,
    error: reservationsError,
  } = useSelector((state: RootState) => state.hotelReservationEntete);

  useEffect(() => {
    if (!prestationId || hasFetched.current) return;
    hasFetched.current = true;
    dispatch(fetchHotelReservations(prestationId));
  }, [dispatch, prestationId]);

  // Reset si la prestation change
  useEffect(() => {
    hasFetched.current = false;
  }, [prestationId]);

  const formatMontant = (montant: number) => montant.toLocaleString('fr-FR');

  const statutLabel: Record<string, string> = {
    CREER: 'Créé',
    APPORUVER: 'Approuvé',
    FACTURE_EMISE: 'Facture émise',
    ANNULER: 'Annulé',
  };

  const statutStyle: Record<string, string> = {
    FACTURE_EMISE: 'bg-green-100 text-green-800',
    ANNULER: 'bg-red-100 text-red-800',
    APPORUVER: 'bg-blue-100 text-blue-800',
    CREER: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mb-5">
        <HotelHeader numerohotel={dossierNumero} navigate={navigate} isBenchmarking={false} />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-800">Réservations Hôtel</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Liste des entêtes de réservation hôtel associées
        </p>
      </div>

      {/* ── États ── */}
      {reservationsLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Chargement des réservations...</p>
          </div>
        </div>
      ) : reservationsError ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm">
          {reservationsError}
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-neutral-500">Aucune réservation trouvée</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                {['N° Entête', 'Statut', 'Fournisseur', 'Dossier'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
                {['Lignes', 'Montant total', 'Commission', ''].map((h) => (
                  <th key={h} className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {reservations.map((entete) => {
                const montantTotal = entete.hotelLigne.reduce((sum, l) => sum + (l.puResaMontantAriary || 0), 0);
                const commission = entete.hotelLigne.reduce((sum, l) => sum + (l.commissionUnitaire || 0), 0);

                return (
                  <tr
                    key={entete.id}
                    onClick={() => navigate(`/dossiers-communs/hotel/detailsHotel/${entete.id}`)}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-medium text-neutral-900">
                      {entete.HotelProspectionEntete.numeroEntete}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statutStyle[entete.statut] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {statutLabel[entete.statut] ?? entete.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {entete.HotelProspectionEntete.fournisseur.libelle}
                      <span className="text-neutral-400 text-xs ml-1.5">
                        ({entete.HotelProspectionEntete.fournisseur.code})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {entete.HotelProspectionEntete.prestation.numeroDos || '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-neutral-800">
                      {entete.hotelLigne.length}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-medium text-neutral-900">
                      {formatMontant(montantTotal)} Ar
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-medium text-emerald-700">
                      {formatMontant(commission)} Ar
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
                      Détail →
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HotelReservationsList;