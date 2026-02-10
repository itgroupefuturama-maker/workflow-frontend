// // CreateAttestationLigneModal.tsx
// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { createAttestationLigne, fetchAttestationEnteteDetail } from '../../../app/front_office/parametre_attestation/attestationEnteteSlice';
// import type { AppDispatch, RootState } from '../../../app/store';

// interface CreateAttestationLigneModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   enteteId: string;
//   destinations: any[]; // ton type Destination[]
// }

// const CreateAttestationLigneModal: React.FC<CreateAttestationLigneModalProps> = ({
//   isOpen,
//   onClose,
//   enteteId,
//   destinations,
// }) => {
//   const dispatch = useDispatch<AppDispatch>();

//   const { list: beneficiaireInfos, loadingList: loadingInfos } = useSelector(
//     (state: RootState) => state.clientBeneficiaireInfos
//   );

//   const [formData, setFormData] = useState({
//     numeroVol: '',
//     avion: '',
//     itineraire: '',
//     departId: '',
//     destinationId: '',
//     classe: 'ECONOMIE',
//     typePassager: 'ADULTE',
//     dateHeureDepart: '',
//     dateHeureArrive: '',
//     dureeVol: '',
//     dureeEscale: '0h00',
//     puAriary: '',
//     numeroReservation: '',
//     passagerIds: [] as string[],
//   });

//   const [formError, setFormError] = useState<string | null>(null);
//   const [submitting, setSubmitting] = useState(false);

//   // Charger les infos de TOUS les bénéficiaires du client facture (une seule fois)
//   useEffect(() => {
//     if (isOpen) {
//       // On suppose que tu as déjà les bénéficiaires dans clientFactureDetail
//       // Ici on charge les infos détaillées pour tous les bénéficiaires
//       // (tu peux optimiser plus tard en ne chargeant que pour les bénéficiaires sélectionnés)
//       // Pour l'instant, on simule en chargeant pour chaque bénéficiaire connu
//       // → à adapter selon comment tu récupères la liste des beneficiaireIds
//     }
//   }, [isOpen]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const togglePassager = (infoId: string) => {
//     setFormData((prev) => ({
//       ...prev,
//       passagerIds: prev.passagerIds.includes(infoId)
//         ? prev.passagerIds.filter((p) => p !== infoId)
//         : [...prev.passagerIds, infoId],
//     }));
//   };

//   const handleSubmit = async () => {
//     if (formData.passagerIds.length === 0) {
//       setFormError('Veuillez sélectionner au moins un passager.');
//       return;
//     }

//     setSubmitting(true);
//     setFormError(null);

//     try {
//       const payload = {
//         attestationEnteteId: enteteId,
//         numeroVol: formData.numeroVol.trim(),
//         avion: formData.avion.trim(),
//         itineraire: formData.itineraire.trim(),
//         departId: formData.departId,
//         destinationId: formData.destinationId,
//         classe: formData.classe,
//         typePassager: formData.typePassager,
//         dateHeureDepart: formData.dateHeureDepart ? new Date(formData.dateHeureDepart).toISOString() : '',
//         dateHeureArrive: formData.dateHeureArrive ? new Date(formData.dateHeureArrive).toISOString() : '',
//         dureeVol: formData.dureeVol.trim(),
//         dureeEscale: formData.dureeEscale.trim(),
//         puAriary: Number(formData.puAriary) || 0,
//         numeroReservation: formData.numeroReservation.trim(),
//         passagerIds: formData.passagerIds,
//       };

//       await dispatch(createAttestationLigne(payload)).unwrap();
//       dispatch(fetchAttestationEnteteDetail(enteteId));
//       onClose();
//     } catch (err: any) {
//       setFormError(err.message || 'Erreur lors de la création de la ligne.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen px-4">
//         {/* Fond semi-transparent */}
//         <div className="fixed inset-0 bg-black opacity-40" onClick={onClose}></div>

//         {/* Modal */}
//         <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
//           <div className="p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-2xl font-bold text-gray-800">Nouvelle ligne d'attestation</h2>
//               <button
//                 onClick={onClose}
//                 className="text-gray-500 hover:text-gray-800 text-2xl"
//               >
//                 ×
//               </button>
//             </div>

//             {formError && (
//               <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
//                 {formError}
//               </div>
//             )}

//             <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 mb-10">
//             <h2 className="text-xl font-bold text-gray-800 mb-6">Ajouter une ligne d'attestation</h2>

//             {formError && (
//               <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
//                 {formError}
//               </div>
//             )}

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">N° Vol</label>
//                 <input
//                   type="text"
//                   name="numeroVol"
//                   value={formData.numeroVol}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                   placeholder="MD123"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Avion</label>
//                 <input
//                   type="text"
//                   name="avion"
//                   value={formData.avion}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                   placeholder="ATR 72"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Itinéraire</label>
//                 <input
//                   type="text"
//                   name="itineraire"
//                   value={formData.itineraire}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                   placeholder="TNR - NOS"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Départ</label>
//                 <select
//                   name="departId"
//                   value={formData.departId}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                 >
//                   <option value="">— Choisir —</option>
//                   {destinations.map(dest => (
//                     <option key={dest.id} value={dest.id}>
//                       {dest.ville} ({dest.paysVoyage?.pays || '—'})
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Destination</label>
//                 <select
//                   name="destinationId"
//                   value={formData.destinationId}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                 >
//                   <option value="">— Choisir —</option>
//                   {destinations.map(dest => (
//                     <option key={dest.id} value={dest.id}>
//                       {dest.ville} ({dest.paysVoyage?.pays || '—'})
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Classe</label>
//                 <select
//                   name="classe"
//                   value={formData.classe}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                 >
//                   <option value="ECONOMIE">Économie</option>
//                   <option value="BUSINESS">Business</option>
//                   <option value="PREMIUM">Premium</option>
//                   <option value="PREMIERE">Première</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Type Passager</label>
//                 <select
//                   name="typePassager"
//                   value={formData.typePassager}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                 >
//                   <option value="ADULTE">Adulte</option>
//                   <option value="ENFANT">Enfant</option>
//                   <option value="BEBE">Bébé</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Date/Heure Départ</label>
//                 <input
//                   type="datetime-local"
//                   name="dateHeureDepart"
//                   value={formData.dateHeureDepart}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Date/Heure Arrivée</label>
//                 <input
//                   type="datetime-local"
//                   name="dateHeureArrive"
//                   value={formData.dateHeureArrive}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Durée Vol</label>
//                 <input
//                   type="text"
//                   name="dureeVol"
//                   value={formData.dureeVol}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                   placeholder="1h30"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">Durée Escale</label>
//                 <input
//                   type="text"
//                   name="dureeEscale"
//                   value={formData.dureeEscale}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                   placeholder="0h00"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">PU Ariary</label>
//                 <input
//                   type="number"
//                   name="puAriary"
//                   value={formData.puAriary}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                   placeholder="500000"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700">N° Réservation</label>
//                 <input
//                   type="text"
//                   name="numeroReservation"
//                   value={formData.numeroReservation}
//                   onChange={handleInputChange}
//                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
//                   placeholder="RES123456"
//                 />
//               </div>
//             </div>

//             <div className="mb-8">
//               <h3 className="text-lg font-semibold text-gray-800 mb-4">Passagers</h3>

//               {loadingInfos ? (
//                 <div className="text-center py-6 text-gray-500">Chargement des informations...</div>
//               ) : beneficiaireInfos.length === 0 ? (
//                 <div className="text-center py-6 text-gray-600 italic">
//                   Aucune information de passager disponible
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {beneficiaireInfos.map((info) => (
//                     <div
//                       key={info.id}
//                       className={`p-4 border rounded-lg cursor-pointer transition-colors ${
//                         formData.passagerIds.includes(info.id)
//                           ? 'border-indigo-500 bg-indigo-50'
//                           : 'border-gray-200 hover:bg-gray-50'
//                       }`}
//                       onClick={() => togglePassager(info.id)}
//                     >
//                       <div className="flex items-start">
//                         <input
//                           type="checkbox"
//                           checked={formData.passagerIds.includes(info.id)}
//                           readOnly
//                           className="mt-1 mr-3"
//                         />
//                         <div>
//                           <p className="font-medium">
//                             {info.prenom} {info.nom}
//                           </p>
//                           <p className="text-sm text-gray-600">
//                             {info.clientType} • {info.nationalite}
//                           </p>
//                           <p className="text-xs text-gray-500 mt-1">
//                             {info.typeDoc}: {info.referenceDoc}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="flex justify-end gap-4">
//               <button
//                 onClick={onClose}
//                 className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
//               >
//                 Annuler
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 disabled={submitting || formData.passagerIds.length === 0}
//                 className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {submitting ? 'Création...' : 'Créer la ligne'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateAttestationLigneModal;