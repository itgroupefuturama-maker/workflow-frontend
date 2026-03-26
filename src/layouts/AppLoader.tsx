// layouts/AppLoader.tsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";

// Back office
import { fetchDossiersCommuns }     from "../app/front_office/dossierCommunSlice";
import { fetchPrivileges }          from "../app/back_office/privilegesSlice";
import { fetchProfiles }            from "../app/back_office/profilesSlice";
import { fetchAutorisations }       from "../app/back_office/autorisationsSlice";
import { fetchUsers }               from "../app/back_office/usersSlice";
import { fetchTransactionTypes }    from "../app/back_office/transactionTypesSlice";
import { fetchTransactions }        from "../app/back_office/transactionsSlice";
import { fetchModules }             from "../app/back_office/modulesSlice";
import { fetchModeles }             from "../app/back_office/modelesSlice";
import { fetchCommissions }         from "../app/back_office/commissionsSlice";
import { fetchDossiers }            from "../app/back_office/numerotationSlice";
import { fetchMiles }               from "../app/back_office/milesSlice";
import { fetchPieces }              from "../app/back_office/piecesSlice";
import { fetchClientBeneficiaires } from "../app/back_office/clientBeneficiairesSlice";
import { fetchDevisTransactions }   from "../app/back_office/devisTransactionsSlice";
import { fetchClientFactures }      from "../app/back_office/clientFacturesSlice";
import { fetchArticles }            from "../app/back_office/articlesSlice";
import { fetchFournisseurs }        from "../app/back_office/fournisseursSlice";

// Front office — référentiels visa
import { fetchVisaTypes }       from "../app/front_office/parametre_visa/visaTypeSlice";
import { fetchVisaDurees }      from "../app/front_office/parametre_visa/visaDureeSlice";
import { fetchVisaEntrees }     from "../app/front_office/parametre_visa/visaEntreeSlice";
import { fetchVisaParams }      from "../app/front_office/parametre_visa/visaParamSlice";
import { fetchVisaDocParams }   from "../app/front_office/parametre_visa/visaDocParamsSlice";
import { fetchVisaDocs }        from "../app/front_office/parametre_visa/visaDocSlice";
import { fetchVisaConsultats }  from "../app/front_office/parametre_visa/visaConsultatSlice";

// Front office — référentiels communs
import { fetchPays }              from "../app/front_office/parametre_ticketing/paysSlice";
import { fetchRaisonsAnnulation } from "../app/front_office/parametre_ticketing/raisonAnnulationSlice";
import { fetchAssuranceDocs, fetchAssuranceParams, fetchAssuranceTarifsPlein, fetchAssuranceTarifsReduit } from "../app/front_office/parametre_assurance/assuranceParamsSlice";
import { fetchServicesByType } from "../app/front_office/parametre_ticketing/serviceSpecifiqueSlice";
import { fetchExigences } from "../app/front_office/parametre_ticketing/exigenceSlice";
import { fetchDestinations } from "../app/front_office/parametre_ticketing/destinationSlice";
import { fetchPlateformes } from "../app/front_office/parametre_hotel/plateformeSlice";
import { fetchTypesChambre } from "../app/front_office/parametre_hotel/typeChambreSlice";
// import { fetchServicesHotel } from "../app/front_office/parametre_hotel/serviceHotelSlice";
import { fetchAttestationParams } from "../app/front_office/parametre_attestation/attestationParamsSlice";

const useAppDispatch = () => useDispatch<AppDispatch>();

export default function AppLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  
  // ← La clé : on attend que le token soit là
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    if (!token) return; // ← rien ne part sans token

    // Back office
    dispatch(fetchDossiersCommuns());
    dispatch(fetchPrivileges());
    dispatch(fetchProfiles());
    dispatch(fetchAutorisations());
    dispatch(fetchUsers());
    dispatch(fetchTransactionTypes());
    dispatch(fetchTransactions());
    dispatch(fetchModules());
    dispatch(fetchModeles());
    dispatch(fetchCommissions());
    dispatch(fetchDossiers());
    dispatch(fetchMiles());
    dispatch(fetchPieces());
    dispatch(fetchClientBeneficiaires());
    dispatch(fetchDevisTransactions());
    dispatch(fetchClientFactures());
    dispatch(fetchArticles());
    dispatch(fetchFournisseurs());

    // Front office — visa
    dispatch(fetchVisaTypes());
    dispatch(fetchVisaDurees());
    dispatch(fetchVisaEntrees());
    dispatch(fetchVisaParams());
    dispatch(fetchVisaDocParams());
    dispatch(fetchVisaDocs());
    dispatch(fetchVisaConsultats());

    // Front office — assurance
    dispatch(fetchAssuranceParams());
    dispatch(fetchAssuranceDocs());
    dispatch(fetchAssuranceTarifsPlein());
    dispatch(fetchAssuranceTarifsReduit());

    // Front office — Ticketing
    dispatch(fetchDestinations());

    // Front office — hotel
    dispatch(fetchPlateformes());
    dispatch(fetchTypesChambre());
    // dispatch(fetchServicesHotel());

    // Front office — attestation
    dispatch(fetchAttestationParams());

    // Front office — communs
    dispatch(fetchPays());
    dispatch(fetchRaisonsAnnulation());
    dispatch(fetchExigences());
    dispatch(fetchServicesByType("TICKET"));
    // dispatch(fetchServicesByType("HOTEL"));

  }, [dispatch, token]); // ← token en dépendance : refetch si reconnexion

  return <>{children}</>;
}