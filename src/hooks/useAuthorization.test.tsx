import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAuthorization } from './useAuthorization';

// ── Fabriques de données de test ────────────────────────────────────────────
// Reproduisent juste assez la forme de `User`/`UserProfile` (authSlice.ts) pour exercer le hook,
// sans dépendre de tous les champs obligatoires du vrai type (non pertinents ici).

function makeModule(nom: string, code = 'XXX') {
  return { module: { id: nom, code, nom, description: '', status: 'ACTIF' } };
}

function makePrivilege(privilege: string) {
  return { privilege: { id: privilege, privilege, fonctionnalite: '', status: 'ACTIF' } };
}

function makeUserProfile(opts: {
  profil: string;
  status?: string;
  modules?: ReturnType<typeof makeModule>[];
  privileges?: ReturnType<typeof makePrivilege>[];
}) {
  return {
    status: opts.status ?? 'ACTIF',
    profile: {
      profil: opts.profil,
      modules: opts.modules ?? [],
      privileges: opts.privileges ?? [],
    },
  };
}

function renderWithUser(user: any) {
  const store = configureStore({
    reducer: {
      auth: (state = { user, token: null, isAuthenticated: true }) => state,
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useAuthorization(), { wrapper }).result;
}

describe('useAuthorization', () => {
  it("n'accorde aucun accès sans utilisateur connecté", () => {
    const result = renderWithUser(null);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.canConsult('ticketing')).toBe(false);
    expect(result.current.canManage('ticketing')).toBe(false);
    expect(result.current.getLevel('ticketing')).toBeNull();
  });

  it('ADMIN a accès complet (Gestion) à tous les modules, même non listés', () => {
    const result = renderWithUser({
      profiles: [makeUserProfile({ profil: 'ADMIN' })],
    });
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canManage('ticketing')).toBe(true);
    expect(result.current.canManage('un-module-qui-nexiste-pas')).toBe(true);
  });

  it('Consultation seule donne la lecture mais pas la gestion', () => {
    const result = renderWithUser({
      profiles: [
        makeUserProfile({
          profil: 'Agent',
          modules: [makeModule('ticketing')],
          privileges: [makePrivilege('Consultation')],
        }),
      ],
    });
    expect(result.current.canConsult('ticketing')).toBe(true);
    expect(result.current.canManage('ticketing')).toBe(false);
  });

  it('Gestion donne aussi la Consultation (hiérarchie Gestion ⊇ Consultation)', () => {
    const result = renderWithUser({
      profiles: [
        makeUserProfile({
          profil: 'Agent',
          modules: [makeModule('hotel')],
          privileges: [makePrivilege('Gestion')],
        }),
      ],
    });
    expect(result.current.canManage('hotel')).toBe(true);
    expect(result.current.canConsult('hotel')).toBe(true);
  });

  it('ignore les profils inactifs', () => {
    const result = renderWithUser({
      profiles: [
        makeUserProfile({
          profil: 'Agent',
          status: 'INACTIF',
          modules: [makeModule('visa')],
          privileges: [makePrivilege('Gestion')],
        }),
      ],
    });
    expect(result.current.canManage('visa')).toBe(false);
    expect(result.current.canConsult('visa')).toBe(false);
  });

  it("identifie un module par `nom`, pas par `code` (régression bug corrigé le 2026-08-26)", () => {
    const result = renderWithUser({
      profiles: [
        makeUserProfile({
          profil: 'Agent',
          modules: [makeModule('hotel', 'HTL')], // code court différent du nom
          privileges: [makePrivilege('Gestion')],
        }),
      ],
    });
    expect(result.current.canManage('hotel')).toBe(true);
  });

  it('le matching des niveaux est insensible à la casse et tolère un texte libre', () => {
    const result = renderWithUser({
      profiles: [
        makeUserProfile({
          profil: 'Agent',
          modules: [makeModule('assurance')],
          privileges: [makePrivilege('GESTION totale')],
        }),
      ],
    });
    expect(result.current.canManage('assurance')).toBe(true);
  });

  it('agrège plusieurs profils avec des niveaux différents par module', () => {
    const result = renderWithUser({
      profiles: [
        makeUserProfile({
          profil: 'Agent ticketing',
          modules: [makeModule('ticketing')],
          privileges: [makePrivilege('Consultation')],
        }),
        makeUserProfile({
          profil: 'Agent hotel',
          modules: [makeModule('hotel')],
          privileges: [makePrivilege('Gestion')],
        }),
      ],
    });
    expect(result.current.canConsult('ticketing')).toBe(true);
    expect(result.current.canManage('ticketing')).toBe(false);
    expect(result.current.canManage('hotel')).toBe(true);
  });

  it('un module absent de tous les profils actifs ne donne aucun accès', () => {
    const result = renderWithUser({
      profiles: [
        makeUserProfile({
          profil: 'Agent',
          modules: [makeModule('ticketing')],
          privileges: [makePrivilege('Gestion')],
        }),
      ],
    });
    expect(result.current.canConsult('attestation')).toBe(false);
    expect(result.current.getLevel('attestation')).toBeNull();
  });
});
