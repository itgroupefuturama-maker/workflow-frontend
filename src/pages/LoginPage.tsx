
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../service/Axios';
import {
  FiEye,
  FiEyeOff,
  FiLoader,
  FiArrowRight,
  FiShield,
  FiGlobe,
  FiUsers,
  FiLock,
  FiAlertCircle,
} from 'react-icons/fi';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState<
    'front' | 'back'
  >('front');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      const loginResponse = await axiosInstance.post('/auth/login', {
        email: email.trim(),
        motDePasse: password,
      });

      const { access_token } = loginResponse.data.data;

      const userResponse = await axiosInstance.get('/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userData = userResponse.data.data;

      const hasAdminProfile = userData.profiles.some(
        (p: any) => p.profile?.profil === 'ADMIN'
      );

      if (selectedInterface === 'back' && !hasAdminProfile) {
        throw new Error(
          "Accès refusé : vous n'avez pas les droits d'administrateur."
        );
      }

      const fullUser = {
        id: userData.id,
        email: userData.email,
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        profiles: userData.profiles,
        pseudo: userData.pseudo || '',
        departement: userData.departement || '',
        dateCreation: userData.dateCreation || '',
        dateActivation: userData.dateActivation || null,
        dateDesactivation: userData.dateDesactivation || null,
        status: userData.status || '',
        autorisation: userData.autorisation || [],
      };

      const redirectTo =
        selectedInterface === 'back' ? '/parametre' : '/';

      login({
        token: access_token,
        user: fullUser,
      });

      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(
        err.message || 'Identifiants incorrects. Veuillez réessayer.'
      );

      // Ne pas effacer tout le localStorage :
      // cela pourrait supprimer des données sans rapport avec la connexion.
    } finally {
      setIsLoading(false);
    }
  };

  const interfaces = [
    {
      value: 'front' as const,
      label: 'Front Office',
      description: 'Dossiers et réservations',
      icon: FiUsers,
    },
    {
      value: 'back' as const,
      label: 'Back Office',
      description: 'Administration',
      icon: FiShield,
    },
  ];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 font-sans text-slate-900 sm:px-6">
      {/* Décoration légère, sans image de fond */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl"
      />

      {/* En-tête */}
      <header className="relative mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <FiGlobe size={22} />
        </div>

        <div>
          <p className="text-xl font-bold tracking-tight text-slate-900">
            Al Bouraq Travel
          </p>
          <p className="text-xs font-medium tracking-wide text-slate-500">
            VOYAGE · ESPACE PROFESSIONNEL
          </p>
        </div>
      </header>

      {/* Formulaire */}
      <section className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
          {/* Introduction */}
          <div className="mb-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
              <FiLock size={22} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Connexion
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Connectez-vous pour accéder à votre espace de travail.
            </p>
          </div>

          {/* Sélection de l'interface */}
          <div className="mb-7">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Choisissez votre espace
            </p>

            <div className="grid grid-cols-2 gap-3">
              {interfaces.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedInterface === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedInterface(item.value);
                      setError('');
                    }}
                    className={`group relative flex min-h-[106px] flex-col items-start rounded-xl border p-3.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'border-blue-800 bg-blue-50/70'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      <Icon size={17} />
                    </div>

                    <span
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-blue-950' : 'text-slate-700'
                      }`}
                    >
                      {item.label}
                    </span>

                    <span className="mt-1 text-xs leading-4 text-slate-500">
                      {item.description}
                    </span>

                    {isSelected && (
                      <span
                        aria-hidden="true"
                        className="absolute right-3 top-3 h-2 w-2 rounded-full bg-blue-800"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulaire de connexion */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Adresse email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@albouraq.com"
                required
                disabled={isLoading}
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Mot de passe
                </label>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Saisissez votre mot de passe"
                  required
                  disabled={isLoading}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-800 focus:ring-4 focus:ring-blue-800/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={
                    showPassword
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                >
                  {showPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
              >
                <FiAlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />
                <p className="leading-5">{error}</p>
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-900/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <FiLoader size={17} className="animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <FiArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Aide */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs leading-5 text-slate-500">
              Un problème de connexion ?
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Contactez votre administrateur pour obtenir de l'aide.
            </p>
          </div>
        </div>

        {/* Pied de page */}
        <footer className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Al Bouraq Voyage. Tous droits réservés.
          </p>
        </footer>
      </section>
    </main>
  );
};

export default LoginPage;
