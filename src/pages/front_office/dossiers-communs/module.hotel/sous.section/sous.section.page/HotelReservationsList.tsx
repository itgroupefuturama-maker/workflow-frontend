// src/pages/parametres/hotel/HotelReservationsList.tsx

import { useEffect } from 'react';
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

  // ✅ UNE SEULE déclaration avec déstructuration ET valeur par défaut
  const {
    items: reservations = [],  // ← Ajout de = [] pour éviter undefined
    loading: reservationsLoading,
    error: reservationsError,
  } = useSelector((state: RootState) => state.hotelReservationEntete);

  // ❌ SUPPRIMEZ ces lignes (doublon)
  // const reservations = useSelector(
  //   (state: RootState) => state.hotelReservationEntete.items
  // );

  // const reservationsLoading = useSelector(
  //   (state: RootState) => state.hotelReservationEntete.loading
  // );

  useEffect(() => {
    if (!prestationId) return;
    
    // Maintenant reservations est toujours un tableau grâce à = []
    if (reservations.length > 0 || reservationsLoading) {
      return;
    }

    dispatch(fetchHotelReservations(prestationId));
  }, [dispatch, prestationId, reservations.length, reservationsLoading]);

  const formatMontant = (montant: number) => montant.toLocaleString('fr-FR');

  if (reservationsLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-orange-500 border-b-4 border-neutral-300"></div>
      </div>
    );
  }

  if (reservationsError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg text-red-800">
        {reservationsError}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center my-8">
        <p className="text-neutral-600 text-lg">Aucune réservation hôtel trouvée pour cette prestation</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 ">
      <div className="mb-5">
        <HotelHeader numerohotel={dossierNumero} navigate={navigate} isBenchmarking={false}/>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-800">
          Réservations Hôtel
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          Liste des entêtes de réservation hôtel associées
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                N° Entête
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Fournisseur
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Dossier
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Lignes
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Montant total
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {reservations.map((entete) => (
              <tr
                key={entete.id}
                className="hover:bg-neutral-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/dossiers-communs/hotel/detailsHotel/${entete.id}`)}
              >
                <td className="px-6 py-4 font-medium text-neutral-900">
                  {entete.HotelProspectionEntete.numeroEntete}
                </td>
                <td className="px-6 py-4 uppercase">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      entete.statut === 'FACTURE_EMISE'
                        ? 'bg-green-100 text-green-800'
                        : entete.statut === 'ANNULER'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {entete.statut == 'CREER' ? 'crée' : entete.statut == 'APPORUVER' ? 'approuvé' : entete.statut == 'FACTURE_EMISE' ? 'facture emise' : entete.statut == 'ANNULER' ? 'annulé' : 'en cours'}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-700">
                  {entete.HotelProspectionEntete.fournisseur.libelle}
                  <span className="text-neutral-500 text-xs ml-1.5">
                    ({entete.HotelProspectionEntete.fournisseur.code})
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-600">
                  {entete.HotelProspectionEntete.prestation.numeroDos || '—'}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {entete.hotelLigne.length}
                </td>
                <td className="px-6 py-4 text-right font-medium text-neutral-900">
                  {formatMontant(
                    entete.hotelLigne.reduce((sum, l) => sum + (l.puResaMontantAriary || 0), 0)
                  )}{' '}
                  Ar
                </td>
                <td className="px-6 py-4 text-right font-medium text-emerald-700">
                  {formatMontant(
                    entete.hotelLigne.reduce((sum, l) => sum + (l.commissionUnitaire || 0), 0)
                  )}{' '}
                  Ar
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                    Détail →
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HotelReservationsList;