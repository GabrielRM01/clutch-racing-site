import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Menu } from 'lucide-react';
import { api } from '../lib/api';
import { PageState } from '../components/ui';

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    api
      .get('/api/rules')
      .then((r) => {
        const data = Array.isArray(r.data) ? [...r.data].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
        setRules(data);
        setActive(data[0]?.slug || null);
        setLoading(false);
      })
      .catch(() => {
        setError('Não foi possível carregar as regras. Tente novamente mais tarde.');
        setLoading(false);
      });
  }, []);

  const current = rules.find((r) => r.slug === active);

  return (
    <div className="container-cc py-14">
      <span className="eyebrow">— Regras</span>
      <h1 className="mt-3 font-display text-4xl font-extrabold">Regras do servidor</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Leia com atenção. Ao fazer a whitelist você concorda com todas as diretrizes abaixo.
      </p>

      <PageState loading={loading} error={error} empty={!loading && !error && rules.length === 0} emptyText="Nenhuma regra cadastrada ainda.">
        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside>
            <button
              onClick={() => setNavOpen((v) => !v)}
              className="btn-outline mb-3 w-full justify-between lg:hidden"
            >
              Categorias <Menu className="size-4" />
            </button>
            <nav
              className={`${navOpen ? 'flex' : 'hidden'} flex-col gap-1 lg:sticky lg:top-20 lg:flex`}
            >
              {rules.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => {
                    setActive(r.slug);
                    setNavOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-3 rounded-cc px-3 py-2 text-left text-sm transition-colors ${
                    r.slug === active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  <span className="font-mono text-xs opacity-60">
                    {String(r.order || 0).padStart(2, '0')}
                  </span>
                  {r.title}
                </button>
              ))}
            </nav>
          </aside>

          <article className="card-cc min-w-0 p-6 sm:p-8">
            {current && (
              <>
                <span className="font-mono text-sm text-muted-foreground">
                  {String(current.order || 0).padStart(2, '0')}
                </span>
                <h2 className="mt-1 font-display text-3xl font-extrabold">{current.title}</h2>
                <div className="md-body mt-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.content || ''}</ReactMarkdown>
                </div>
              </>
            )}
          </article>
        </div>
      </PageState>
    </div>
  );
}
