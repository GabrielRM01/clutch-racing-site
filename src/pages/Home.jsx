import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Scale,
  Headset,
  ClipboardCheck,
  BookText,
  Wifi,
  ShoppingBag,
  MessagesSquare,
  Circle,
} from 'lucide-react';
import Emblem from '../components/Emblem';
import { SectionHeader } from '../components/ui';
import { LINKS } from '../lib/links';
import { api } from '../lib/api';

const CARDS = [
  { icon: ClipboardCheck, title: 'Whitelist', desc: 'Faça sua aplicação e entre na cidade. Verificação por Google + Discord.', to: '/whitelist', cta: 'Aplicar' },
  { icon: BookText, title: 'Regras', desc: 'Tudo o que você precisa saber para um roleplay de qualidade.', to: '/regras', cta: 'Ler regras' },
  { icon: Wifi, title: 'Conectar', desc: 'Veja como entrar no servidor e o status de conexão em tempo real.', to: '/conectar', cta: 'Como entrar' },
  { icon: ShoppingBag, title: 'Loja', desc: 'Apoie o servidor com pacotes VIP e vantagens exclusivas.', href: LINKS.store, cta: 'Abrir loja' },
  { icon: MessagesSquare, title: 'Discord', desc: 'Entre na comunidade e fique por dentro de tudo que acontece.', href: LINKS.discord, cta: 'Entrar' },
];

const FEATURES = [
  { n: '01', icon: ShieldCheck, title: 'Roleplay automotivo', desc: 'Experiência de jogo realista focada em cultura automotiva, com regras bem definidas e comunidade dedicada ao roleplay de qualidade.' },
  { n: '02', icon: Users, title: 'Comunidade ativa', desc: 'Junte-se a jogadores apaixonados por criar histórias memoráveis e interações únicas dentro da cidade.' },
  { n: '03', icon: Scale, title: 'Sistema justo', desc: 'Processo de whitelist transparente, com avaliação cuidadosa de cada aplicação recebida.' },
  { n: '04', icon: Headset, title: 'Suporte dedicado', desc: 'Equipe de staff presente para ajudar e garantir a melhor experiência para todos os jogadores.' },
];

export default function Home() {
  const [status, setStatus] = useState(null);
  useEffect(() => {
    api
      .get('/api/server/status')
      .then((r) => setStatus(r.data))
      .catch(() => setStatus(null));
  }, []);

  const online = !!status?.online;

  return (
    <div>
      {/* HERO */}
      <section className="container-cc grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <span className="eyebrow">— Servidor de GTA RP automotivo</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            O melhor lugar pra você que tem uma <span className="text-primary">embreagem</span> no lugar do coração
          </h1>
          <p className="mt-5 max-w-xl text-muted-foreground">
            O servidor de GTA RP automotivo mais imersivo do Brasil, com diversos recursos únicos e a
            sensação de estar na vida real dentro do FiveM.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/whitelist" className="btn-primary h-11 px-6">
              Fazer whitelist <ArrowRight className="size-4" />
            </Link>
            <Link to="/regras" className="btn-secondary h-11 px-6">
              Ler as regras
            </Link>
          </div>

          <div className="mt-8 inline-flex items-center gap-2.5 rounded-cc border border-border bg-white/5 px-3.5 py-2 text-sm">
            <span className="relative flex size-2.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  online ? 'animate-ping bg-green-400/70' : ''
                }`}
              />
              <span
                className={`relative inline-flex size-2.5 rounded-full ${
                  online ? 'bg-green-400' : status ? 'bg-red-400' : 'bg-muted-foreground'
                }`}
              />
            </span>
            {status == null
              ? 'Verificando servidor...'
              : online
                ? `Servidor online — ${status.players ?? 0}/${status.maxPlayers ?? '—'} jogadores`
                : 'Servidor offline no momento'}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-[420px] text-primary"
        >
          <Emblem />
        </motion.div>
      </section>

      {/* QUICK LINKS */}
      <section className="container-cc py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => {
            const inner = (
              <>
                <div className="flex size-11 items-center justify-center rounded-cc border border-white/10 bg-primary/10 text-primary">
                  <c.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">{c.title}</h3>
                <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{c.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {c.cta} <ArrowRight className="size-4" />
                </span>
              </>
            );
            const cls =
              'card-cc group flex flex-col p-5 transition-all hover:-translate-y-1 hover:border-primary';
            return c.href ? (
              <a key={c.title} href={c.href} target="_blank" rel="noreferrer" className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={c.title} to={c.to} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      {/* SOBRE / FEATURES */}
      <section className="container-cc py-16">
        <SectionHeader
          eyebrow="— Sobre o servidor"
          title="Construído para roleplay automotivo autêntico"
          desc="Um ambiente único onde cada jogador pode viver sua paixão por carros e criar a própria história."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.n} className="card-cc flex gap-4 p-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-cc border border-white/10 bg-white/5 text-primary">
                <f.icon className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{f.n}</span>
                  <h3 className="font-display text-lg font-bold">{f.title}</h3>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-cc pb-8">
        <div className="card-cc relative overflow-hidden p-8 text-center sm:p-14">
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Pronto pra entrar na cidade?</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Leia as regras, capriche na narrativa do seu personagem e faça sua aplicação de whitelist.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/whitelist" className="btn-primary h-11 px-6">
                Começar whitelist <ArrowRight className="size-4" />
              </Link>
              <a href={LINKS.discord} target="_blank" rel="noreferrer" className="btn-outline h-11 px-6">
                <Circle className="size-4" /> Entrar no Discord
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
