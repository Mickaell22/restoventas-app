import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

const TOKEN_KEY = 'restoventas_token';
const USER_KEY = 'restoventas_user';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  /** Carga la sesion persistida al arrancar la app. */
  hydrate: () => Promise<void>;
  /** Guarda sesion (token + user) tras login/register. */
  setSession: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  hydrate: async () => {
    const [token, userRaw] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    set({
      token: token ?? null,
      user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
      hydrated: true,
    });
  },

  setSession: async (token, user) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
    ]);
    set({ token, user });
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    set({ token: null, user: null });
  },
}));
