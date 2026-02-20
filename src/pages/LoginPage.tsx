import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axiosInstance from '../service/Axios';
import { FiEye, FiEyeOff, FiLoader, FiArrowRight, FiShield, FiGlobe } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const SLIDES = [
  {
    tag: "Gestion de voyages",
    title: "Pilotez vos dossiers en toute simplicité",
    description: "Cette App centralise la gestion de vos réservations hôtel, billets et dossiers clients dans une interface pensée pour vos équipes terrain."
  },
  {
    tag: "Efficacité opérationnelle",
    title: "Moins de saisie, plus de performance",
    description: "Automatisez vos devis, suivez vos commissions en temps réel et générez vos documents PDF en un clic, depuis n'importe quel poste."
  },
  {
    tag: "Collaboration",
    title: "Tous vos collaborateurs, un seul outil",
    description: "Front Office et Back Office travaillent en synchronisation parfaite. Chaque action est tracée, chaque dossier mis à jour instantanément."
  }
];

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedInterface, setSelectedInterface] = useState<'front' | 'back'>('front');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginResponse = await axiosInstance.post('/auth/login', {
        email: email.trim(),
        motDePasse: password.trim(),
      });

      const { access_token, refresh_token } = loginResponse.data.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      const userResponse = await axiosInstance.get('/users/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      const userData = userResponse.data.data;

      const hasAdminProfile = userData.profiles.some(
        (p: any) => p.profile?.profil === 'ADMIN'
      );

      if (selectedInterface === 'back' && !hasAdminProfile) {
        throw new Error("Accès refusé : vous n'avez pas les droits d'administrateur.");
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

      const redirectTo = selectedInterface === 'back' ? '/parametre' : '/';
      login({ token: access_token, user: fullUser });
      navigate(redirectTo, { replace: true });

    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects. Veuillez réessayer.');
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">

      {/* ── Panneau gauche — image + slider ── */}
      <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between p-12 overflow-hidden">

        {/* Image de fond */}
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop"
          alt="Paysage"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/30" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <FiGlobe className="text-black" size={16} />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Al Bouraq</span>
          </div>
        </div>

        {/* Slide content */}
        <div className="relative z-10 max-w-lg">
          <div key={currentSlide} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-white/50 border border-white/20 px-3 py-1 rounded-full mb-5">
              {SLIDES[currentSlide].tag}
            </span>
            <h2 className="text-4xl font-bold text-white leading-snug mb-4">
              {SLIDES[currentSlide].title}
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              {SLIDES[currentSlide].description}
            </p>
          </div>

          {/* Indicateurs */}
          <div className="flex items-center gap-2 mt-10">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-10 bg-white' : 'w-4 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer gauche */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-white/30 text-xs">© 2025 Al Bouraq Voyage</p>
          <div className="flex gap-5">
            <a href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">Confidentialité</a>
            <a href="#" className="text-white/30 hover:text-white/60 text-xs transition-colors">Support</a>
          </div>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">

        {/* Header mobile uniquement */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <FiGlobe className="text-white" size={13} />
            </div>
            <span className="font-bold text-gray-900">Al Bouraq</span>
          </div>
          <a href="#" className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700">
            Site web <FiArrowRight size={12} />
          </a>
        </div>

        {/* Formulaire centré */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Titre */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h1>
              <p className="text-sm text-gray-500">
                Accédez à votre espace de gestion Al Bouraq. Sélectionnez votre interface avant de vous connecter.
              </p>
            </div>

            {/* Choix d'interface */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                {
                  value: 'front' as const,
                  label: 'Front Office',
                  description: 'Dossiers & réservations',
                  icon: <FiGlobe size={18} />,
                },
                {
                  value: 'back' as const,
                  label: 'Back Office',
                  description: 'Administration',
                  icon: <FiShield size={18} />,
                },
              ].map(({ value, label, description, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedInterface(value)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                    selectedInterface === value
                      ? 'border-gray-900 bg-white shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${selectedInterface === value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {icon}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${selectedInterface === value ? 'text-gray-900' : 'text-gray-600'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
                  placeholder="vous@albouraq.com"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                  required
                />
              </div>

              {/* Mot de passe */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Mot de passe
                  </label>
                  <button type="button" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Bouton connexion */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm tracking-wide hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <FiArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">Besoin d'aide ?</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* WhatsApp */}
            <button className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-xl flex items-center justify-center gap-2.5 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium">
              <FaWhatsapp size={18} className="text-green-500" />
              Contacter le support WhatsApp
            </button>

            {/* Footer mobile */}
            <p className="text-center text-xs text-gray-400 mt-8 lg:hidden">
              © 2025 Al Bouraq Voyage • Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;