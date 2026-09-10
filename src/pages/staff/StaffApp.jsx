import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert, ArrowLeft, Menu, X } from 'lucide-react';
import { api, startDiscordLogin } from '../../lib/api';
import { auth } from '../../lib/auth';
import Background from '../../components/Background';
import { STAFF_NAV, canSee } from './nav';
import { AccessCtx } from './access';

import Dashboard from './Dashboard';
import Demandas from './Demandas';
import RulesEditor from './RulesEditor';
import Sheets from './Sheets';
import Codes from './Codes';
import FormEditor from './FormEditor';
import Evaluation from './Evaluation';
import Permissions from './Permissions';
import Logs from './Logs';

const DISCORD_ICON = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.2.36-.43.85-.588 1.235a18.27 18.27 0 0 0-3.94 0A9.03 9.03 0 0 0 11.44 3a19.74 19.74 0 0 0-3.76 1.37C3.6 10.24 2.9 15.96 3.25 21.6a19.9 19.9 0 0 0 6.06 3.06c.49-.66.93-1.37 1.3-2.11-.71-.27-1.4-.6-2.05-.99.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.07 0c.17.14.34.27.5.4-.65.39-1.34.72-2.06.99.37.74.81 1.45 1.3 2.11a19.86 19.86 0 0 0 6.06-3.06c.42-6.55-.72-12.22-3.86-17.23Z" />
  </svg>
);

export default function StaffApp() {
  const token = auth.getToken();
  const isStaff = auth.isStaff();

  if (!token) return <Gate variant="login" />;
  if (!isStaff) return <Gate variant="denied" />;
  return <StaffShell />;
}

function Gate({ variant }) {
  const nav = useNavigate();
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <Background />
      <div className="card-cc relative max-w-md p-8 text-center">
        <span className="grid mx-auto size-12 place-items-center rounded-cc border border-white/10 bg-primary/10 text-primary">
          <ShieldAlert className="size-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">
          {variant === 'login' ? 'Portal da Staff' : 'Acesso negado'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {variant === 'login'
            ? 'Acesso restrito à equipe. Entre com sua conta do Discord para continuar.'
            : 'Sua conta não possui cargo de staff no servidor. Verifique seus cargos no Discord e tente novamente.'}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {variant === 'login' ? (
            <button onClick={() => startDiscordLogin('staff')} className="btn-primary h-11">
              {DISCORD_ICON} Entrar com Discord
            </button>
          ) : (
            <button
              onClick={() => {
                auth.clearAll();
                startDiscordLogin('staff');
              }}
              className="btn-secondary h-11"
            >
              Tentar com outra conta
            </button>
          )}
          <button onClick={() => nav('/')} className="btn-ghost">
            <ArrowLeft className="size-4" /> Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffShell() {
  const [access, setAccess] = useState({
    isMaster: auth.isMaster(),
    permissions: auth.getStaff()?.permissions || [],
  });
  const [me, setMe] = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api
      .get('/api/staff/me')
      .then((r) => {
        setMe(r.data);
        setAccess({ isMaster: !!r.data.isMaster, permissions: r.data.permissions || [] });
      })
      .catch(() => {});
  }, []);

  const user = auth.currentUser();
  const items = STAFF_NAV.filter((i) => canSee(i, access));

  function logout() {
    auth.clearAll();
    window.location.href = '/';
  }

  return (
    <AccessCtx.Provider value={access}>
      <div className="min-h-screen bg-background">
        <Background />
        <div className="relative flex">
          {/* Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-background/95 backdrop-blur transition-transform lg:static lg:translate-x-0 ${
              sidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.png" className="size-8 rounded object-contain" alt="" />
                <span className="font-display text-sm font-extrabold">STAFF</span>
              </Link>
              <button onClick={() => setSidebar(false)} className="btn-ghost size-8 p-0 lg:hidden">
                <X className="size-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3 thin-scroll">
              {items.map((i) => (
                <NavLink
                  key={i.to || 'home'}
                  to={i.to}
                  end={i.end}
                  onClick={() => setSidebar(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-cc px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }`
                  }
                >
                  <i.icon className="size-4" />
                  {i.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-border p-3">
              <div className="mb-2 flex items-center gap-2 px-1">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} className="size-8 rounded-full" alt="" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                    {(user?.name || '?')[0].toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {access.isMaster ? 'Master' : 'Staff'}
                  </p>
                </div>
              </div>
              <button onClick={logout} className="btn-outline w-full">
                <LogOut className="size-4" /> Sair
              </button>
            </div>
          </aside>

          {sidebar && (
            <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebar(false)} />
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
              <button onClick={() => setSidebar(true)} className="btn-outline size-9 p-0">
                <Menu className="size-4" />
              </button>
              <span className="font-display font-bold">Painel Staff</span>
            </header>

            <main className="p-4 sm:p-8">
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="demandas" element={<Demandas />} />
                <Route path="regras" element={<RulesEditor />} />
                <Route path="veiculos" element={<Sheets section="veiculos" />} />
                <Route path="itens" element={<Sheets section="itens" />} />
                <Route path="comandos" element={<Sheets section="comandos" />} />
                <Route path="codigos" element={<Codes />} />
                <Route path="formulario" element={<FormEditor />} />
                <Route path="avaliacao" element={<Evaluation />} />
                <Route path="permissoes" element={<Permissions />} />
                <Route path="logs" element={<Logs />} />
                <Route path="*" element={<Navigate to="/staff" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </div>
    </AccessCtx.Provider>
  );
}
