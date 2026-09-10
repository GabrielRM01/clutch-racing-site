// Autenticacao no navegador (porta do objeto `De` do site antigo).
// - cr_google : dados do login Google (email, name, picture, googleId, emailVerified)
// - cr_user   : auth completa (google + discord)
// - cr_token  : JWT de sessao emitido pelo backend
// - cr_staff  : { isStaff, isMaster, permissions } (so apos /staff/callback)

const K = {
  google: 'cr_google',
  user: 'cr_user',
  token: 'cr_token',
  staff: 'cr_staff',
};

function read(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function decodeJwt(token) {
  try {
    const p = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(
      decodeURIComponent(
        atob(p)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      ),
    );
  } catch {
    return null;
  }
}

export const auth = {
  decodeJwt,

  saveGoogle: (d) => localStorage.setItem(K.google, JSON.stringify(d)),
  getGoogle: () => read(K.google),
  clearGoogle: () => localStorage.removeItem(K.google),

  saveUser: (d) => localStorage.setItem(K.user, JSON.stringify(d)),
  getUser: () => read(K.user),

  saveToken: (t) => localStorage.setItem(K.token, t),
  getToken: () => {
    const t = localStorage.getItem(K.token);
    if (!t) return null;
    const p = decodeJwt(t);
    if (p?.exp && Date.now() >= p.exp * 1000) {
      auth.clearAll();
      return null;
    }
    return t;
  },

  saveStaff: (d) => localStorage.setItem(K.staff, JSON.stringify(d || { isStaff: false })),
  getStaff: () => read(K.staff),
  isStaff: () => !!auth.getStaff()?.isStaff,
  isMaster: () => !!auth.getStaff()?.isMaster,

  clearAll: () => Object.values(K).forEach((k) => localStorage.removeItem(k)),

  /** login Google + Discord completos? */
  isComplete: () => {
    const u = auth.getUser();
    return !!(u && u.googleId && u.emailVerified && u.discordId);
  },

  /** dados do usuario logado para exibir (nome + avatar) */
  currentUser: () => {
    const u = auth.getUser();
    if (u && (u.picture || u.name)) {
      return { name: u.name || u.discordUsername || 'Usuário', avatarUrl: u.picture || null };
    }
    const t = auth.getToken();
    if (t) {
      const p = decodeJwt(t);
      if (p) {
        return {
          name: p.globalName || p.username || 'Staff',
          avatarUrl: p.avatar
            ? `https://cdn.discordapp.com/avatars/${p.discordId}/${p.avatar}.png?size=64`
            : null,
        };
      }
    }
    return null;
  },
};
