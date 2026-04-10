import React, {useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../../../app/store';
import { fetchCurrentUser, fetchGoogleCalendarAuthUrl } from '../../../../../app/front_office/parametre_utilisateur/userSlice';
import { FiUser, FiGrid, FiShield, FiCalendar } from 'react-icons/fi';
import { Spinner } from '../components/Spinner';

// ── Helpers UI ───────────────────────────────────────────────

const statusColors: Record<string, string> = {
  ACTIF:   'bg-emerald-50 text-emerald-600 border-emerald-200',
  INACTIF: 'bg-gray-100 text-gray-400 border-gray-200',
  CREER:   'bg-blue-50 text-blue-600 border-blue-200',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
    {status}
  </span>
);

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-400 w-36 flex-shrink-0">{label}</span>
    <span className="text-xs text-gray-700 text-right flex-1">{value}</span>
  </div>
);

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="text-gray-400">{icon}</span>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
  </div>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 ${className}`}>
    {children}
  </div>
);

// ── Composant principal ──────────────────────────────────────

const Utilisateurs: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: user, loading, error } = useSelector((state: RootState) => state.user);
  const [loadingAuth, setLoadingAuth] = useState(false);

  const handleConnectGoogle = async () => {
    if (!user) return;
    setLoadingAuth(true);
    try {
      const url = await dispatch(fetchGoogleCalendarAuthUrl(user.id)).unwrap();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert('Impossible de récupérer le lien Google Calendar');
    } finally {
      setLoadingAuth(false);
    }
  };

  // ── Loading ──
  if (loading) return (
    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-20">
      <Spinner className="w-5 h-5" /> Chargement du profil...
    </div>
  );

  // ── Erreur ──
  if (error) return (
    <Card>
      <div className="text-center py-10">
        <p className="text-xs text-red-400 font-medium uppercase tracking-wider">Erreur</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button
          onClick={() => dispatch(fetchCurrentUser())}
          className="mt-4 px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Réessayer
        </button>
      </div>
    </Card>
  );

  if (!user) return null;

  // Données dérivées
  const activeProfile = user.profiles.find((p) => p.status === 'ACTIF') ?? user.profiles[0];
  const modules       = activeProfile?.profile.modules.filter((m) => m.status === 'ACTIF') ?? [];
  const privileges    = activeProfile?.profile.privileges ?? [];
  const googleAccount = user.googleAccount[0] ?? null;

  return (
    <div className="space-y-5">

      {/* ── En-tête ── */}
      <Card>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Paramètres</p>
        <h2 className="text-base font-semibold text-gray-800 mt-0.5">Mon profil</h2>
        <p className="text-xs text-gray-400 mt-1">Informations du compte connecté</p>
      </Card>

      {/* ── Identité ── */}
      <Card>
        <SectionTitle icon={<FiUser size={14} />} title="Identité" />
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-50">
          {/* Avatar initiales */}
          <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-base font-medium">
              {user.prenom[0]}{user.nom[0]}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{user.prenom} {user.nom}</p>
            <p className="text-xs text-gray-400 mt-0.5">@{user.pseudo}</p>
            <div className="mt-1">
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>
        <InfoRow label="Email"       value={user.email} />
        <InfoRow label="Département" value={user.departement || '—'} />
        <InfoRow label="Pseudo"      value={`@${user.pseudo}`} />
        <InfoRow
          label="Créé le"
          value={new Date(user.dateCreation).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        />
        {user.dateActivation && (
          <InfoRow
            label="Activé le"
            value={new Date(user.dateActivation).toLocaleDateString('fr-FR')}
          />
        )}
      </Card>

      {/* ── Google Account ── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle icon={<FiCalendar size={14} />} title="Compte Google" />
          {/* Bouton visible seulement si aucun compte connecté */}
          {!googleAccount && (
            <button
              onClick={handleConnectGoogle}
              disabled={loadingAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAuth ? (
                <Spinner className="w-3.5 h-3.5" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {loadingAuth ? 'Chargement...' : 'Connecter Google Calendar'}
            </button>
          )}
        </div>

        {googleAccount ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icône Google SVG */}
              <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center bg-white flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{googleAccount.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calendar ID : <span className="font-medium">{googleAccount.calendarId}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Connecté le {new Date(googleAccount.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-600 border-emerald-200">
                Connecté
              </span>
              {/* Bouton reconnecter si déjà connecté */}
              <button
                onClick={handleConnectGoogle}
                disabled={loadingAuth}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                title="Reconnecter le compte Google"
              >
                {loadingAuth ? <Spinner className="w-3 h-3" /> : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Reconnecter
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-dashed border-gray-200">
            <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center bg-white flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-30">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Aucun compte Google connecté</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Connectez votre compte pour activer la synchronisation avec Google Calendar
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Profil & Privilèges ── */}
      {activeProfile && (
        <Card>
          <SectionTitle icon={<FiShield size={14} />} title="Profil & Privilèges" />
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-semibold text-gray-800">{activeProfile.profile.profil}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Affecté le {new Date(activeProfile.dateAffectation).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <StatusBadge status={activeProfile.status} />
          </div>

          {privileges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {privileges.map((p) => (
                <span
                  key={p.privilegeId}
                  className="inline-flex flex-col px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <span className="text-xs font-medium text-gray-700">{p.privilege.privilege}</span>
                  <span className="text-xs text-gray-400">{p.privilege.fonctionnalite}</span>
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Modules accessibles ── */}
      {modules.length > 0 && (
        <Card>
          <SectionTitle icon={<FiGrid size={14} />} title={`Modules accessibles (${modules.length})`} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {modules.map((m) => (
              <div
                key={m.moduleId}
                className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{m.module.nom}</p>
                  <p className="text-xs text-gray-400 uppercase">{m.module.code}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Utilisateurs;