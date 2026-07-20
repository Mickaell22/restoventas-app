import { api } from './client';
import type { AuthUser } from '../store/auth.store';

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function register(email: string, password: string, name: string) {
  const { data } = await api.post<AuthResponse>('/auth/register', {
    email,
    password,
    name,
  });
  return data;
}
