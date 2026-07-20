import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  // Falla ruidoso en dev en vez de pegarle a una URL undefined.
  console.warn(
    'EXPO_PUBLIC_API_URL no esta definida. Copia .env.example a .env.',
  );
}

export const api = axios.create({ baseURL });

// Interceptor: adjunta el JWT (si hay) en cada request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401, la sesion expiro/invalido: limpiar auth.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && useAuthStore.getState().token) {
      void useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
