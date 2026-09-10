import { Link } from 'react-router-dom';
import { LINKS } from '../lib/links';

export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-border bg-background/70 backdrop-blur-md">
      <div className="container-cc flex flex-wrap items-start justify-between gap-8 py-10">
        <div className="max-w-md">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" className="size-10 rounded-md object-contain" alt="" />
            <span className="font-display text-lg font-extrabold">CLUTCH RACING RP</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            O servidor de GTA RP automotivo mais imersivo do Brasil. O melhor lugar pra você que tem uma
            embreagem no lugar do coração.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <span className="col-span-2 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navegação
          </span>
          <Link to="/whitelist" className="text-muted-foreground hover:text-foreground">
            Whitelist
          </Link>
          <Link to="/regras" className="text-muted-foreground hover:text-foreground">
            Regras
          </Link>
          <Link to="/conectar" className="text-muted-foreground hover:text-foreground">
            Conectar
          </Link>
          <a href={LINKS.store} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
            Loja
          </a>
          <a href={LINKS.discord} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
            Discord
          </a>
          <Link to="/staff" className="text-muted-foreground hover:text-foreground">
            Painel Staff
          </Link>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-cc flex items-center justify-between py-5 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Clutch Racing RP. Todos os direitos reservados.</p>
          <p>Feito para a comunidade.</p>
        </div>
      </div>
    </footer>
  );
}
