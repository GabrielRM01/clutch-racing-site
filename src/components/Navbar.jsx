import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, BadgeCheck, LogOut, ExternalLink } from 'lucide-react';
import { NAV } from '../lib/links';
import { auth } from '../lib/auth';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const user = auth.currentUser();

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on);
    return () => window.removeEventListener('scroll', on);
  }, []);

  function logout() {
    auth.clearAll();
    window.location.href = '/';
  }

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled ? 'border-border bg-background/80 backdrop-blur-md' : 'border-transparent'
      }`}
    >
      <div className="container-cc flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" className="size-9 rounded-md object-contain" alt="" />
          <span className="font-display text-lg font-extrabold tracking-tight">CLUTCH RACING</span>
          <span className="relative inline-flex">
            <BadgeCheck className="size-5 fill-primary text-background" />
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) =>
            n.external ? (
              <a
                key={n.label}
                href={n.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <NavLink key={n.label} to={n.to} className={linkCls}>
                {n.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <div className="flex items-center gap-2 rounded-cc border border-border bg-white/5 py-1 pl-1 pr-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} className="size-7 rounded-full" alt="" />
                ) : (
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                    {(user.name || '?')[0].toUpperCase()}
                  </span>
                )}
                <span className="max-w-[120px] truncate text-sm font-medium">{user.name}</span>
              </div>
              <button onClick={logout} className="btn-ghost size-9 p-0" title="Sair">
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link to="/whitelist" className="btn-primary hidden md:inline-flex">
              Fazer whitelist
            </Link>
          )}

          <button onClick={() => setOpen((v) => !v)} className="btn-outline size-9 p-0 md:hidden">
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur md:hidden">
          <div className="container-cc flex flex-col py-4">
            {NAV.map((n) =>
              n.external ? (
                <a
                  key={n.label}
                  href={n.href}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 text-base font-medium text-muted-foreground"
                >
                  {n.label}
                </a>
              ) : (
                <NavLink
                  key={n.label}
                  to={n.to}
                  className="py-3 text-base font-medium text-muted-foreground [&.active]:text-foreground"
                >
                  {n.label}
                </NavLink>
              ),
            )}
            {user ? (
              <button onClick={logout} className="mt-2 btn-outline">
                Sair ({user.name})
              </button>
            ) : (
              <Link to="/whitelist" className="mt-2 btn-primary">
                Fazer whitelist
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
