import axios from 'axios';
import { auth } from './auth';

export const API_URL =
  import.meta.env.VITE_API_URL || 'https://clutch-racing-backend-production.up.railway.app';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const hadToken = !!localStorage.getItem('cr_token');
      auth.clearAll();
      if (hadToken && window.location.pathname.startsWith('/staff')) {
        window.location.href = '/staff';
      }
    }
    return Promise.reject(err);
  },
);

/** Inicia o OAuth do Discord. dest: "staff" | "whitelist" */
export async function startDiscordLogin(dest) {
  const { data } = await axios.get(
    `${API_URL}/api/discord-auth/authorize${dest === 'staff' ? '?redirect=staff' : ''}`,
    { withCredentials: true },
  );
  if (data?.url) window.location.href = data.url;
  else throw new Error('Resposta inválida do servidor.');
}
