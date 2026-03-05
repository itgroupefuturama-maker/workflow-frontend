import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import TabContainer from '../../../../../layouts/TabContainer';
import type { AppDispatch, RootState } from '../../../../../app/store';

import { fetchVisaTypes } from '../../../../../app/front_office/parametre_visa/visaTypeSlice';
import { fetchVisaDurees } from '../../../../../app/front_office/parametre_visa/visaDureeSlice';
import { fetchVisaEntrees } from '../../../../../app/front_office/parametre_visa/visaEntreeSlice';
import { fetchVisaParams } from '../../../../../app/front_office/parametre_visa/visaParamSlice';
import { fetchVisaDocParams } from '../../../../../app/front_office/parametre_visa/visaDocParamsSlice';
import { fetchVisaDocs } from '../../../../../app/front_office/parametre_visa/visaDocSlice';
import { fetchVisaConsultats } from '../../../../../app/front_office/parametre_visa/visaConsultatSlice';
import RaisonAnnulationListe from '../../module.ticketing/ticketing.sous.module/SousMenuPrestation/RaisonAnnulationListe';
import { fetchRaisonsAnnulation } from '../../../../../app/front_office/parametre_ticketing/raisonAnnulationSlice';
import CreateVisaTypeModal from '../components/CreateVisaTypeModal';
import CreateVisaDureeModal from '../components/CreateVisaDureeModal';
import CreateVisaEntreeModal from '../components/CreateVisaEntreeModal';
import CreateVisaDocParamsModal from '../components/CreateVisaDocParamsModal';
import CreateVisaDocModal from '../components/CreateVisaDocModal';
import CreateVisaConsultatModal from '../components/CreateVisaConsultatModal';
import { fetchPays } from '../../../../../app/front_office/parametre_ticketing/paysSlice';
import CreateVisaParamModal from '../components/CreateVisaParamModal';

const useAppDispatch = () => useDispatch<AppDispatch>();

const SectionHeader = ({ label, onAdd }: { label: string; onAdd: () => void }) => (
  <div className="flex justify-end mb-4">
    <button onClick={onAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
      + {label}
    </button>
  </div>
);

const TableWrapper = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-xl shadow border border-gray-100">
    <table className="min-w-full bg-white text-sm">
      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
        <tr>
          {headers.map(h => (
            <th key={h} className="px-4 py-3 text-left font-semibold tracking-wide">{h}</th>
          ))}
          <th className="px-4 py-3 text-left font-semibold tracking-wide">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">{children}</tbody>
    </table>
  </div>
);

const ActionButtons = () => (
  <div className="flex gap-2">
    <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️ Modifier</button>
    <button className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">🗑️ Supprimer</button>
  </div>
);

const LoadingRow = () => (
  <tr><td colSpan={99} className="text-center py-6 text-gray-400">Chargement...</td></tr>
);

const EmptyRow = ({ colSpan = 4 }: { colSpan?: number }) => (
  <tr><td colSpan={colSpan} className="text-center py-6 text-gray-400">Aucune donnée</td></tr>
);

const ParametreViewVisa = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState(location.state?.targetTab || 'type');

  const visaTypes    = useSelector((s: RootState) => s.visaType);
  const visaDurees   = useSelector((s: RootState) => s.visaDuree);
  const visaEntrees  = useSelector((s: RootState) => s.visaEntree);
  const visaParams   = useSelector((s: RootState) => s.visaParam);
  const visaDocParams = useSelector((s: RootState) => s.visaDocParams);
  const visaDocs     = useSelector((s: RootState) => s.visaDoc);
  const visaConsultats = useSelector((s: RootState) => s.visaConsultat);

  const [showParamModal, setShowParamModal] = useState(false);

  const paysState = useSelector((state: RootState) => state.pays);

  // États des modales
  const [showTypeModal,      setShowTypeModal]      = useState(false);
  const [showDureeModal,     setShowDureeModal]     = useState(false);
  const [showEntreeModal,    setShowEntreeModal]    = useState(false);
  const [showDocParamsModal, setShowDocParamsModal] = useState(false);
  const [showDocModal,       setShowDocModal]       = useState(false);
  const [showConsultatModal, setShowConsultatModal] = useState(false);

  const tabs = [
    { id: 'type',                  label: 'Type de Visa' },
    { id: 'duree',                 label: 'Durée de Visa' },
    { id: 'entree',                label: 'Visa Entrée' },
    { id: 'params',                label: 'Paramétre de Visa' },
    { id: 'docsparams',            label: 'Paramétre de documents' },
    { id: 'docs',                  label: 'Document Visa' },
    { id: 'consulat',              label: 'Visa Consulat' },
    { id: 'listeRaisonAnnulation', label: 'Raison Annulation' },
  ];

  useEffect(() => {
    dispatch(fetchVisaTypes());
    dispatch(fetchVisaDurees());
    dispatch(fetchVisaEntrees());
    dispatch(fetchPays());
    dispatch(fetchVisaParams());
    dispatch(fetchVisaDocParams());
    dispatch(fetchVisaDocs());
    dispatch(fetchVisaConsultats());
    dispatch(fetchRaisonsAnnulation());
  }, [dispatch]);

  useEffect(() => {
    if (location.state?.targetTab) {
      const timer = setTimeout(() => setActiveTab(location.state.targetTab), 0);
      return () => clearTimeout(timer);
    }
  }, [location.state?.targetTab]);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
      status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {status}
    </span>
  );
  // ─── View ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 p-6">
      <TabContainer tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres Visa</h1>

        <div className="space-y-8">

          {/* ── Type de Visa ── */}
          {activeTab === 'type' && (
            <>
              <SectionHeader label="Ajouter un type de visa" onAdd={() => setShowTypeModal(true)} />
              <TableWrapper headers={['Nom', 'Description', 'Créé le']}>
                {visaTypes.loading ? <LoadingRow /> : visaTypes.data.length === 0 ? <EmptyRow colSpan={4} /> :
                  visaTypes.data.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium capitalize">{item.nom}</td>
                      <td className="px-4 py-3 text-gray-500">{item.description}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3"><ActionButtons /></td>
                    </tr>
                  ))
                }
              </TableWrapper>
            </>
          )}

          {/* ── Durée de Visa ── */}
          {activeTab === 'duree' && (
            <>
              <SectionHeader label="Ajouter une Durée de Visa" onAdd={() => setShowDureeModal(true)} />
              <TableWrapper headers={['Durée (jours)', 'Créé le']}>
                {visaDurees.loading ? <LoadingRow /> : visaDurees.data.length === 0 ? <EmptyRow colSpan={3} /> :
                  visaDurees.data.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.duree} jours</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3"><ActionButtons /></td>
                    </tr>
                  ))
                }
              </TableWrapper>
            </>
          )}

          {/* ── Visa Entrée ── */}
          {activeTab === 'entree' && (
            <>
              <SectionHeader label="Ajouter un Entrée Visa" onAdd={() => setShowEntreeModal(true)}/>
              <TableWrapper headers={['Type d\'entrée', 'Créé le']}>
                {visaEntrees.loading ? <LoadingRow /> : visaEntrees.data.length === 0 ? <EmptyRow colSpan={3} /> :
                  visaEntrees.data.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.entree}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3"><ActionButtons /></td>
                    </tr>
                  ))
                }
              </TableWrapper>
            </>
          )}

          {/* ── Paramètre de Visa ── */}
          {activeTab === 'params' && (
            <>
              <SectionHeader label="Ajouter un Paramètre Visa" onAdd={() => setShowParamModal(true)} />
              <TableWrapper headers={['Code', 'Description', 'Pays', 'Type', 'Durée', 'Entrée', 'Traitement', 'Prix vente', 'Achat devise', 'Statut']}>
                {visaParams.loading ? <LoadingRow /> : visaParams.data.length === 0 ? <EmptyRow colSpan={11} /> :
                  visaParams.data.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-indigo-600">{item.code}</td>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3">{item.pays?.pays ?? '—'}</td>
                      <td className="px-4 py-3 capitalize">{item.visaType?.nom ?? '—'}</td>
                      <td className="px-4 py-3">{item.visaDuree?.duree ?? '—'} j</td>
                      <td className="px-4 py-3">{item.visaEntree?.entree ?? '—'}</td>
                      <td className="px-4 py-3">{item.dureeTraitement} j</td>
                      <td className="px-4 py-3">{item.pVenteAriary.toLocaleString('fr-FR')} Ar</td>
                      <td className="px-4 py-3">{item.puAchatDevise}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3"><ActionButtons /></td>
                    </tr>
                  ))
                }
              </TableWrapper>
            </>
          )}

          {/* ── Paramètre de Documents ── */}
          {activeTab === 'docsparams' && (
            <>
              <SectionHeader label="Ajouter un Paramètre Document" onAdd={() => setShowDocParamsModal(true)} />
              <TableWrapper headers={['Code', 'Document', 'Statut', 'Créé le']}>
                {visaDocParams.loading ? <LoadingRow /> : visaDocParams.data.length === 0 ? <EmptyRow colSpan={5} /> :
                  visaDocParams.data.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-indigo-600">{item.code}</td>
                      <td className="px-4 py-3">{item.document}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3 text-gray-400">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3"><ActionButtons /></td>
                    </tr>
                  ))
                }
              </TableWrapper>
            </>
          )}

          {/* ── Document Visa ── */}
          {activeTab === 'docs' && (
            <>
              <SectionHeader label="Ajouter un Document Visa" onAdd={() => setShowDocModal(true)} />
              <TableWrapper headers={['Document', 'Code doc', 'Statut doc', 'Visa Param', 'Créé le']}>
                {visaDocs.loading ? <LoadingRow /> : visaDocs.data.length === 0 ? <EmptyRow colSpan={6} /> :
                  visaDocs.data.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.visaDocParams?.document ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-indigo-600">{item.visaDocParams?.code ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.visaDocParams?.status ?? '—'} /></td>
                      <td className="px-4 py-3">{item.visaParams?.description ?? '—'} <span className="text-xs text-gray-400">({item.visaParams?.code})</span></td>
                      <td className="px-4 py-3 text-gray-400">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3"><ActionButtons /></td>
                    </tr>
                  ))
                }
              </TableWrapper>
            </>
          )}

          {/* ── Consulat ── */}
          {activeTab === 'consulat' && (
            <>
              <SectionHeader label="Ajouter un Consulat Visa" onAdd={() => setShowConsultatModal(true)} />
              <TableWrapper headers={['Nom du consulat', 'Créé le']}>
                {visaConsultats.loading ? <LoadingRow /> : visaConsultats.data.length === 0 ? <EmptyRow colSpan={3} /> :
                  visaConsultats.data.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium capitalize">{item.nom}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3"><ActionButtons /></td>
                    </tr>
                  ))
                }
              </TableWrapper>
            </>
          )}

          {/* ── Raison Annulation ── */}
          {activeTab === 'listeRaisonAnnulation' && <RaisonAnnulationListe />}

        </div>

        {showTypeModal      && <CreateVisaTypeModal      onClose={() => setShowTypeModal(false)} />}
        {showDureeModal     && <CreateVisaDureeModal     onClose={() => setShowDureeModal(false)} />}
        {showEntreeModal    && <CreateVisaEntreeModal    onClose={() => setShowEntreeModal(false)} />}
        {showDocParamsModal && <CreateVisaDocParamsModal onClose={() => setShowDocParamsModal(false)} />}
        {showDocModal       && <CreateVisaDocModal       onClose={() => setShowDocModal(false)} />}
        {showConsultatModal && <CreateVisaConsultatModal onClose={() => setShowConsultatModal(false)} />}
        {showParamModal && <CreateVisaParamModal onClose={() => setShowParamModal(false)} />}
      </TabContainer>
    </div>
  );
};

export default ParametreViewVisa;