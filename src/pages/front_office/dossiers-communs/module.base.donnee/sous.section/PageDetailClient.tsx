import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../../../../../app/store";
import { Loader2, AlertCircle, ArrowLeft, ChevronRight } from "lucide-react";
import { fetchClientBeneficiaireDetail } from "../../../../../app/front_office/parametre_baseDonnee/clientBeneficiaireDetailSlice";
import { Tab } from "./atoms";
import TabProfil     from "./TabProfil";
import TabVisa       from "./TabVisa";
import TabAssurance  from "./TabAssurance";

type MainTab = "profil" | "visa" | "assurance";

const PageDetailClient = () => {
  const { clientId } = useParams();
  const navigate     = useNavigate();
  const dispatch     = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((s: RootState) => s.clientBeneficiaireDetail);

  const [mainTab, setMainTab] = useState<MainTab>("profil");

  useEffect(() => {
    if (clientId) dispatch(fetchClientBeneficiaireDetail(clientId));
  }, [clientId, dispatch]);

  if (loading) return (
    <div className="flex items-center justify-center h-96 gap-3 text-gray-400">
      <Loader2 size={20} className="animate-spin text-indigo-500" />
      <span className="text-sm">Chargement...</span>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center h-96 gap-3 text-red-400">
      <AlertCircle size={20} />
      <span className="text-sm">{error || "Données introuvables."}</span>
    </div>
  );

  const infos          = data.clientbeneficiaireInfo;
  const assuranceForms = data.clientAssuranceForm ?? [];
  const allPersons     = infos.flatMap(i => i.clientBeneficiaireForm?.clientBeneficiairePerson ?? []);

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="hover:text-gray-600 cursor-pointer" onClick={() => navigate(-1)}>
                Base de données
              </span>
              <ChevronRight size={12} />
              <span className="text-gray-700 font-semibold">{data.libelle}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{data.code}</span>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              data.statut === "ACTIF"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}>
              {data.statut}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-6 space-y-5">

          {/* Bannière */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 text-lg font-bold flex items-center justify-center shrink-0">
              {data.libelle?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">{data.libelle}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-gray-400">
                  Créé le {new Date(data.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-xs text-gray-400">
                  Application : {new Date(data.dateApplication).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center px-4 py-2 bg-indigo-50 rounded-xl">
                <p className="text-lg font-bold text-indigo-700">{infos.length}</p>
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">Dossier(s) visa</p>
              </div>
              <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl">
                <p className="text-lg font-bold text-emerald-700">{assuranceForms.length}</p>
                <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Dossier(s) assurance</p>
              </div>
              <div className="text-center px-4 py-2 bg-purple-50 rounded-xl">
                <p className="text-lg font-bold text-purple-700">{allPersons.length}</p>
                <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide">Personne(s) liée(s)</p>
              </div>
            </div>
          </div>

          {/* Onglets */}
          <div>
            <div className="flex items-center gap-1">
              <Tab label="Profil"     active={mainTab === "profil"}     onClick={() => setMainTab("profil")} />
              <Tab label="Visa"       active={mainTab === "visa"}       onClick={() => setMainTab("visa")}    />
              <Tab label="Assurance"  active={mainTab === "assurance"}  onClick={() => setMainTab("assurance")}  />
            </div>

            {mainTab === "profil"    && clientId && <TabProfil    clientId={clientId} />}
            {mainTab === "visa"      && <TabVisa       infos={infos} />}
            {mainTab === "assurance" && <TabAssurance  assuranceForms={assuranceForms} />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PageDetailClient;