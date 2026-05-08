import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import {
  createAssuranceDevis,
  fetchAssuranceProspections,
  type AssuranceProspectionLigne,
} from '../../../../../app/front_office/parametre_assurance/assuranceProspectionSlice';
import { Modal, Spinner } from '../components/atoms';
import { Calendar, Globe, Info, ClipboardCheck, Wallet, ArrowRight } from 'lucide-react';

export interface DevisModalData {
  enteteId: string;
  numeroDos: string;
  lignes: AssuranceProspectionLigne[];
}

interface Props {
  data: DevisModalData;
  prestationId: string;
  onClose: () => void;
}

const ModalCreationDevis = ({ data, prestationId, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { creating, createError } = useSelector((s: RootState) => s.assuranceProspection);
  const [selectedLigneIds, setSelectedLigneIds] = useState<string[]>(data.lignes.map(l => l.id));

  const toggle = (id: string) => setSelectedLigneIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const calcTotal = () =>
    data.lignes
      .filter(l => selectedLigneIds.includes(l.id))
      .reduce((sum, l) => sum + (l.assuranceTarifPlein?.prixClientAriary ?? 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLigneIds.length === 0) return;
    const res = await dispatch(createAssuranceDevis({
      assuranceProspectionEnteteId: data.enteteId,
      assuranceProspectionLigneIds: selectedLigneIds,
      totalGeneral: calcTotal(),
    }));
    if (createAssuranceDevis.fulfilled.match(res)) {
      onClose();
      dispatch(fetchAssuranceProspections(prestationId));
    }
  };

  return (
    <Modal title={`Génération du Devis — ${data.numeroDos}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        
        {/* En-tête informatif */}
        <div className="flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
          <Info size={18} className="shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium leading-relaxed">
            Sélectionnez les lignes de calcul à consolider dans ce devis. 
            Le montant total sera automatiquement calculé en Ariary selon les tarifs en vigueur.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Wallet size={12} /> Détail des prestations
          </label>

          {data.lignes.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-xs text-slate-400 italic">Aucune ligne de calcul disponible.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {data.lignes.map(ligne => {
                const checked = selectedLigneIds.includes(ligne.id);
                const t = ligne.assuranceTarifPlein;
                
                return (
                  <div
                    key={ligne.id}
                    onClick={() => toggle(ligne.id)}
                    className={`group relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
                      checked 
                        ? 'bg-white border-blue-600 shadow-md shadow-blue-50 ring-1 ring-blue-600' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Checkbox cachée mais accessible */}
                    <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                    }`}>
                      {checked && <div className="h-2 w-2 bg-white rounded-full" />}
                    </div>

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${checked ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400'}`}>
                          <Globe size={14} />
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{ligne.assuranceParams.zoneDestination}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={13} />
                        <span className="text-[10px] font-medium">
                          {new Date(ligne.dateDepart).toLocaleDateString()} <ArrowRight size={10} className="inline mx-1" /> {new Date(ligne.dateRetour).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                         <span className="px-2 py-0.5 bg-slate-200/50 rounded text-[9px] font-bold text-slate-600">
                           {ligne.duree} JOURS
                         </span>
                      </div>
                    </div>

                    {/* Détail Financier de la ligne */}
                    <div className={`flex items-center justify-between pt-3 border-t ${checked ? 'border-indigo-100' : 'border-slate-200/60'}`}>
                      <div className="flex gap-3 text-[9px] font-semibold uppercase tracking-tighter">
                        <div className="flex flex-col">
                          <span className="text-slate-400">Net Assureur</span>
                          <span className="text-slate-700">{t?.prixAssureurDevise} {t?.devise}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400">Com.</span>
                          <span className="text-emerald-600">{t?.commissionDevise} {t?.devise}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 leading-none">PRIX CLIENT</p>
                        <p className={`text-sm font-black ${checked ? 'text-blue-700' : 'text-slate-900'}`}>
                          {t?.prixClientAriary.toLocaleString()} Ar
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pied de modale : Total Général */}
        <div className="relative overflow-hidden p-5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-slate-200">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-100">Total Consolidation</p>
              <p className="text-xs text-slate-200">{selectedLigneIds.length} ligne(s) sélectionnée(s)</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white tabular-nums">
                {calcTotal().toLocaleString()} <span className="text-sm font-medium text-slate-200">Ar</span>
              </span>
            </div>
          </div>
          {/* Décoration en arrière-plan */}
          <div className="absolute -right-4 -bottom-4 opacity-10">
             <ClipboardCheck size={100} />
          </div>
        </div>

        {createError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[11px] font-bold flex items-center gap-2">
            ⚠️ {createError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={creating || selectedLigneIds.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            {creating ? <Spinner /> : <ClipboardCheck size={14} />}
            {creating ? 'Génération...' : 'Confirmer et Créer le Devis'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalCreationDevis;