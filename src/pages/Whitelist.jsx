import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Ticket,
} from 'lucide-react';
import { api, startDiscordLogin } from '../lib/api';
import { auth } from '../lib/auth';
import { useToast } from '../components/Toast';
import GoogleLogin from '../components/GoogleLogin';
import { Field, Spinner } from '../components/ui';

const DISCORD_ICON = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.2.36-.43.85-.588 1.235a18.27 18.27 0 0 0-3.94 0A9.03 9.03 0 0 0 11.44 3a19.74 19.74 0 0 0-3.76 1.37C3.6 10.24 2.9 15.96 3.25 21.6a19.9 19.9 0 0 0 6.06 3.06c.49-.66.93-1.37 1.3-2.11-.71-.27-1.4-.6-2.05-.99.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.07 0c.17.14.34.27.5.4-.65.39-1.34.72-2.06.99.37.74.81 1.45 1.3 2.11a19.86 19.86 0 0 0 6.06-3.06c.42-6.55-.72-12.22-3.86-17.23ZM9.68 17.34c-1.18 0-2.15-1.08-2.15-2.4 0-1.32.95-2.4 2.15-2.4 1.2 0 2.17 1.08 2.15 2.4 0 1.32-.95 2.4-2.15 2.4Zm7.96 0c-1.18 0-2.15-1.08-2.15-2.4 0-1.32.95-2.4 2.15-2.4 1.2 0 2.17 1.08 2.15 2.4 0 1.32-.94 2.4-2.15 2.4Z" />
  </svg>
);

const wordCount = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;

export default function Whitelist() {
  const nav = useNavigate();
  const { notify } = useToast();

  const [phase, setPhase] = useState('loading'); // loading | google | discord | form | done
  const [user, setUser] = useState(null); // complete auth

  const [form, setForm] = useState({ nome: '', idade: '', narrativa: '' });
  const [step, setStep] = useState(1);
  const [perguntas, setPerguntas] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [startedAt] = useState(Date.now());

  // passcode
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState('');
  const [codeValid, setCodeValid] = useState(false);
  const [codeChecking, setCodeChecking] = useState(false);

  // ---- auth bootstrap ----
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordId = params.get('discordId');

    if (discordId) {
      const token = params.get('token');
      const g = auth.getGoogle();
      if (g) {
        if (token) auth.saveToken(token);
        auth.saveUser({ ...g, discordId, discordUsername: 'Discord User' });
        auth.clearGoogle();
        window.history.replaceState({}, document.title, '/whitelist');
        window.location.reload();
        return;
      }
      notify('Autenticação incompleta. Faça login com o Google primeiro.', 'warning');
      setPhase('google');
      return;
    }

    if (auth.isComplete()) {
      const u = auth.getUser();
      setUser(u);
      setForm((f) => ({ ...f, nome: u.name || '' }));
      setPhase('form');
    } else if (auth.getGoogle()) {
      setPhase('discord');
    } else {
      setPhase('google');
    }
  }, [notify]);

  // ---- load public questions ----
  useEffect(() => {
    if (phase !== 'form') return;
    api
      .get('/api/perguntas/publicas')
      .then((r) => setPerguntas(r.data?.itens || []))
      .catch(() => {});
  }, [phase]);

  function onGoogle(data) {
    auth.saveGoogle(data);
    notify('Login Google concluído! Agora conecte o Discord.', 'success');
    setPhase('discord');
  }

  async function connectDiscord() {
    try {
      await startDiscordLogin('whitelist');
    } catch {
      notify('Erro ao conectar com o Discord.', 'error');
    }
  }

  const missingAnswers = useMemo(
    () => perguntas.some((p) => !respostas[p._id]),
    [perguntas, respostas],
  );

  async function submit(e) {
    e.preventDefault();
    if (!agree) return notify('Você precisa ler e concordar com as regras.', 'warning');
    if (missingAnswers) return notify('Responda todas as perguntas antes de enviar.', 'warning');
    if (form.nome.trim().length < 3) return notify('Informe seu nome completo.', 'warning');
    const idade = parseInt(form.idade, 10);
    if (!idade || idade < 18) return notify('Idade mínima é 18 anos.', 'warning');
    if (wordCount(form.narrativa) < 100)
      return notify('A narrativa precisa ter no mínimo 100 palavras.', 'warning');

    setSending(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        idade,
        narrativa: form.narrativa.trim(),
        respostas,
        email: user.email,
        discordId: user.discordId,
        timeSpent: Math.floor((Date.now() - startedAt) / 1000),
        googleUser: { name: user.name, email: user.email, picture: user.picture },
      };
      const { data } = await api.post('/api/evaluate', payload);
      if (data.approved) {
        notify('✅ Parabéns! Sua whitelist foi aprovada! Redirecionando...', 'success');
        setPhase('done');
        setTimeout(() => nav('/'), 4000);
      } else {
        notify('❌ Sua whitelist foi reprovada. Revise e tente novamente.', 'error');
        setSending(false);
      }
    } catch (err) {
      const s = err.response?.status;
      if (s === 403) notify('O formulário está temporariamente desativado.', 'warning');
      else if (s === 429) notify('Muitas tentativas ou você já possui uma whitelist aprovada.', 'warning');
      else if (s === 400) {
        const det = err.response.data?.details || [];
        notify('Erro nos dados: ' + det.map((d) => d.message).join(' '), 'error');
      } else notify('Erro ao processar. Tente novamente mais tarde.', 'error');
      setSending(false);
    }
  }

  async function validateCode() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setCodeChecking(true);
    try {
      const { data } = await api.post('/api/passcodes/validate', { codigo: c });
      if (data?.valid) {
        setCodeValid(true);
        notify('Código válido! Preencha só nome e idade.', 'success');
      } else {
        const m = { expirado: 'Código expirado.', esgotado: 'Código esgotado.', revogado: 'Código revogado.', inexistente: 'Código inválido.' };
        notify(m[data?.motivo] || 'Código inválido.', 'error');
      }
    } catch {
      notify('Erro ao validar o código.', 'error');
    }
    setCodeChecking(false);
  }

  async function redeem() {
    if (form.nome.trim().length < 3) return notify('Informe seu nome completo.', 'warning');
    const idade = parseInt(form.idade, 10);
    if (!idade || idade < 18) return notify('Idade mínima é 18 anos.', 'warning');
    setSending(true);
    try {
      await api.post('/api/whitelist/redeem', {
        codigo: code.trim().toUpperCase(),
        nome: form.nome.trim(),
        idade,
        email: user.email,
      });
      notify('✅ Liberado! Sua whitelist foi aprovada!', 'success');
      setPhase('done');
      setTimeout(() => nav('/'), 4000);
    } catch (err) {
      notify(err.response?.data?.error || 'Erro ao resgatar o código.', 'error');
      setSending(false);
    }
  }

  // ---------------- render ----------------
  return (
    <div className="container-cc max-w-3xl py-14">
      <span className="eyebrow">— Whitelist</span>
      <h1 className="mt-3 font-display text-4xl font-extrabold">Formulário de whitelist</h1>
      <p className="mt-2 text-muted-foreground">
        Verificamos sua identidade (Google + Discord) e seu conhecimento das regras. Capriche na narrativa
        do personagem.
      </p>

      <div className="mt-8">
        {phase === 'loading' && (
          <div className="card-cc flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Spinner /> Verificando autenticação...
          </div>
        )}

        {phase === 'google' && (
          <AuthCard
            step={1}
            title="Entre com o Google"
            desc="Usamos sua conta Google apenas para verificar sua identidade. Nenhum dado além do e-mail e nome é armazenado."
          >
            <GoogleLogin onSuccess={onGoogle} onError={(m) => notify(m, 'error')} />
          </AuthCard>
        )}

        {phase === 'discord' && (
          <AuthCard
            step={2}
            title="Conecte seu Discord"
            desc="Precisamos do seu Discord para liberar o acesso ao servidor e entregar seu cargo automaticamente."
          >
            <button onClick={connectDiscord} className="btn-primary h-11 px-6">
              {DISCORD_ICON} Conectar com Discord
            </button>
          </AuthCard>
        )}

        {phase === 'done' && (
          <div className="card-cc flex flex-col items-center gap-4 py-20 text-center">
            <CheckCircle2 className="size-14 text-green-400" />
            <h2 className="font-display text-2xl font-extrabold">Whitelist aprovada!</h2>
            <p className="text-muted-foreground">Você já pode entrar na cidade. Redirecionando...</p>
          </div>
        )}

        {phase === 'form' && user && (
          <>
            {/* passcode toggle */}
            <div className="card-cc mb-5 p-4">
              <button
                onClick={() => setShowCode((v) => !v)}
                className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Ticket className="size-4" /> Tenho um código de liberação
              </button>
              {showCode && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setCodeValid(false);
                    }}
                    placeholder="CÓDIGO"
                    className="field max-w-[200px] font-mono uppercase"
                  />
                  <button onClick={validateCode} disabled={codeChecking} className="btn-secondary">
                    {codeChecking ? <Spinner className="size-4" /> : <KeyRound className="size-4" />}
                    Validar
                  </button>
                </div>
              )}
            </div>

            {codeValid ? (
              <div className="card-cc space-y-4 p-6">
                <p className="text-sm text-green-400">
                  Código válido — só preencha nome e idade para liberar.
                </p>
                <Field label="Nome completo do personagem">
                  <input
                    className="field"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </Field>
                <Field label="Idade (mínimo 18)">
                  <input
                    type="number"
                    className="field"
                    value={form.idade}
                    onChange={(e) => setForm({ ...form, idade: e.target.value })}
                  />
                </Field>
                <button onClick={redeem} disabled={sending} className="btn-primary h-11 w-full">
                  {sending ? <Spinner className="size-4" /> : null} Resgatar e liberar
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="card-cc p-6">
                <Stepper step={step} />

                {step === 1 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-display text-xl font-bold">Dados</h3>
                    <Field label="Nome completo do personagem" hint="Nome plausível, registrável em cartório.">
                      <input
                        className="field"
                        value={form.nome}
                        onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      />
                    </Field>
                    <Field label="Idade do jogador (mínimo 18)">
                      <input
                        type="number"
                        className="field"
                        value={form.idade}
                        onChange={(e) => setForm({ ...form, idade: e.target.value })}
                      />
                    </Field>
                    <NavButtons onNext={() => setStep(2)} />
                  </div>
                )}

                {step === 2 && (
                  <div className="mt-6 space-y-5">
                    <h3 className="font-display text-xl font-bold">Conhecimento das regras</h3>
                    {perguntas.length === 0 && (
                      <p className="text-sm text-muted-foreground">Carregando perguntas...</p>
                    )}
                    {perguntas.map((q) => (
                      <div key={q._id} className="rounded-cc border border-white/10 bg-white/[0.02] p-4">
                        <p className="mb-3 text-sm font-medium">{q.label}</p>
                        {q.tipo === 'aberta' ? (
                          <textarea
                            rows={3}
                            className="field h-auto py-2"
                            placeholder="Digite sua resposta..."
                            value={respostas[q._id] || ''}
                            onChange={(e) => setRespostas((r) => ({ ...r, [q._id]: e.target.value }))}
                          />
                        ) : (
                          <div className="space-y-2">
                            {q.opcoes.map((o) => (
                              <label
                                key={o._id}
                                className={`flex cursor-pointer items-center gap-3 rounded-cc border px-3 py-2 text-sm transition-colors ${
                                  respostas[q._id] === o._id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 hover:bg-white/5'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q-${q._id}`}
                                  checked={respostas[q._id] === o._id}
                                  onChange={() => setRespostas((r) => ({ ...r, [q._id]: o._id }))}
                                  className="size-4 accent-primary"
                                />
                                {o.texto}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <label className="flex items-center gap-3 rounded-cc border border-white/10 bg-white/[0.02] p-4 text-sm">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="size-4 accent-primary"
                      />
                      Li e concordo com todas as regras do servidor
                    </label>

                    <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
                  </div>
                )}

                {step === 3 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-display text-xl font-bold">Sua história</h3>
                    <Field
                      label="Conte a história do seu personagem"
                      hint="Descreva história, personalidade e motivações. Mínimo 100 palavras. Textos de IA são reprovados."
                    >
                      <textarea
                        rows={10}
                        className="field h-auto py-2"
                        placeholder="Digite a história do seu personagem..."
                        value={form.narrativa}
                        onChange={(e) => setForm({ ...form, narrativa: e.target.value })}
                      />
                    </Field>
                    <p
                      className={`text-xs ${
                        wordCount(form.narrativa) >= 100 ? 'text-green-400' : 'text-muted-foreground'
                      }`}
                    >
                      {wordCount(form.narrativa)} palavras
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <button type="button" onClick={() => setStep(2)} className="btn-outline">
                        <ArrowLeft className="size-4" /> Voltar
                      </button>
                      <button type="submit" disabled={sending} className="btn-primary h-11 px-6">
                        {sending ? <Spinner className="size-4" /> : <ShieldCheck className="size-4" />}
                        Enviar whitelist
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AuthCard({ step, title, desc, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-cc flex flex-col items-center gap-4 p-8 text-center"
    >
      <span className="grid size-10 place-items-center rounded-cc border border-white/10 bg-primary/10 font-mono text-sm text-primary">
        0{step}
      </span>
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{desc}</p>
      <div className="pt-2">{children}</div>
    </motion.div>
  );
}

function Stepper({ step }) {
  const labels = ['Dados', 'Regras', 'Narrativa'];
  return (
    <div className="flex items-center gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 items-center gap-2">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
              step >= i + 1 ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'
            }`}
          >
            {i + 1}
          </span>
          <span
            className={`text-xs font-semibold uppercase tracking-wide ${
              step === i + 1 ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {l}
          </span>
          {i < 2 && <div className="h-px flex-1 bg-white/10" />}
        </div>
      ))}
    </div>
  );
}

function NavButtons({ onBack, onNext }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      {onBack ? (
        <button type="button" onClick={onBack} className="btn-outline">
          <ArrowLeft className="size-4" /> Voltar
        </button>
      ) : (
        <span />
      )}
      <button type="button" onClick={onNext} className="btn-primary">
        Próxima etapa <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
