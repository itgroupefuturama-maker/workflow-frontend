import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import type { RootState } from "./app/store";
import LoginPage from "./pages/LoginPage";
import ListeParametre from "./pages/ListeParametre";
import ProtectedRoute from "./pages/ProtectedRoute";
import ParametreLayout from "./layouts/ListeParametreLayout";
import { parametresRoutes } from "./routes/Parametres.routes";
import { frontOfficeRoutes } from "./routes/FrontOffice.routes"; // Nouveau import
import FrontOfficeLayout from "./layouts/FrontOfficeLayout";
import SuccesCreateCompte from "./pages/front_office/dossiers-communs/module.calendar/succesCreateCompte";
import SpecificationClientForClient from "./pages/front_office/dossiers-communs/module.dossier.commun/specification.client/specificationClientForClient";


export function App() {
  // const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <BrowserRouter>

      <Routes>
        {/* LOGIN : Ne redirige pas vers "/" ici, laisse le composant LoginPage gérer le succès */}
        <Route path="/login" element={<LoginPage />} />

        <Route path="formulaire/:id" element={<SpecificationClientForClient />} />

        {/* BACK OFFICE : Toujours en premier */}
        <Route path="/parametre" element={<ProtectedRoute adminOnly={true} />}>
          <Route element={<ParametreLayout />}>
            <Route index element={<ListeParametre />} />
            {parametresRoutes()}
          </Route>
        </Route>

        {/* FRONT OFFICE : Ajoute "index" ou assure-toi que les routes internes sont bien mappées */}
        <Route path="/" element={<ProtectedRoute adminOnly={false} />}>
          <Route element={<FrontOfficeLayout />}>
            {frontOfficeRoutes()}
          </Route>
        </Route>

        <Route path="settings/google" element={<SuccesCreateCompte />}/>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}