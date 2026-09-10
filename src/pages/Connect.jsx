import { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink, Gamepad2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';

const STEPS = [
  { n: 'I', t: 'Instale o FiveM', d: 'Baixe pelo site oficial fivem.net. É necessário ter o GTA V original instalado.' },
  { n: 'II', t: 'Copie o endereço', d: 'Use o botão abaixo para copiar o comando de conexão ou abrir direto no FiveM.' },
  { n: 'III', t: 'Aguarde o download', d: 'Na primeira conexão o servidor baixa os recursos. Pode levar alguns minutos, é normal.' },
  { n: 'IV', t: 'Entre na cidade', d: 'Com a whitelist aprovada, é só entrar e começar a viver seu roleplay.' },
];

export default function Connect() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get('/api/server/status')
        .then((r) => alive && (setStatus(r.data), setLoading(false)))
        .catch(() => alive && (setStatus({ configured: false, online: false }), setLoading(false)));
    load();
    const id = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const addr = (status?.connect || '').replace(/^cfx\.re\/join\//i, '').replace(/^https?:\/\//, '');
  const cmd = addr ? `connect ${addr}` : '';
  const online = !!status?.online;

  function copy() {
    if (!cmd) return;
    navigator.clipboard?.writeText(cmd);
    setCopied(true);
    notify('Comando copiado! Cole no console (F8) do FiveM.', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="container-cc py-14">
      <span className="eyebrow">— Conectar</span>
      <h1 className="mt-3 font-display text-4xl font-extrabold">Entre na cidade</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Veja o status do servidor em tempo real e o passo a passo para conectar.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Status card */}
        <div className="card-cc p-6">
          <div className="flex items-center justify-between">
            <span className="label-cc mb-0">Status do servidor</span>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                loading
                  ? 'border-border text-muted-foreground'
                  : online
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  loading ? 'bg-muted-foreground' : online ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              {loading ? 'Verificando' : online ? 'Online' : 'Offline'}
            </span>
          </div>

          {status?.configured && online && (
            <div className="mt-6">
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-display text-4xl font-extrabold">
                    {status.players ?? 0}
                    <span className="text-lg text-muted-foreground">/{status.maxPlayers ?? '—'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">jogadores conectados</span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${
                      status.maxPlayers
                        ? Math.min(100, Math.round(((status.players || 0) / status.maxPlayers) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {!status?.configured && !loading && (
            <p className="mt-6 text-sm text-muted-foreground">
              Status em tempo real ainda não configurado.
            </p>
          )}

          {addr && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 rounded-cc border border-white/10 bg-background p-2">
                <code className="flex-1 truncate px-2 font-mono text-sm">{cmd}</code>
                <button onClick={copy} className="btn-secondary size-8 shrink-0 p-0">
                  {copied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
                </button>
              </div>
              <a
                href={`fivem://connect/${addr}`}
                className="btn-primary w-full"
              >
                <Gamepad2 className="size-4" /> Abrir no FiveM
              </a>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="card-cc p-6">
          <span className="label-cc">Passo a passo</span>
          <ol className="mt-4 space-y-5">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-cc border border-white/10 bg-white/5 font-mono text-sm text-primary">
                  {s.n}
                </span>
                <div>
                  <p className="font-semibold">{s.t}</p>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <a
            href="https://fivem.net/"
            target="_blank"
            rel="noreferrer"
            className="btn-outline mt-6 w-full"
          >
            Baixar FiveM <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
