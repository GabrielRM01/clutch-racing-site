import { useEffect, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useAccess } from './access';
import { canEdit } from './nav';
import { StaffHeader } from './StaffUI';
import { PageState } from '../../components/ui';

const MODES = [
  { v: 'completo', label: 'Completo — heurística + IA (mais rigoroso)' },
  { v: 'heuristica', label: 'Sem IA — só análise automática (sem custo)' },
  { v: 'simples', label: 'Simples — só conta palavras' },
];

const NUM_FIELDS = {
  minPalavras: 'Mínimo de palavras',
  notaCorte: 'Nota mínima para aprovar (0–100)',
  pesoIa: 'Peso da IA na nota (0–100)',
  heurCorteLixo: "Corte de 'lixo óbvio' (0–100)",
  iaConfiancaMin: "IA: confiança mín. p/ reprovar como 'feito por IA'",
  iaOriginalidadeMax: "IA: originalidade máx. p/ reprovar como 'feito por IA'",
};

export default function Evaluation() {
  const { notify } = useToast();
  const access = useAccess();
  const editable = canEdit(access, 'eval.edit');

  const [config, setConfig] = useState(null);
  const [iaOk, setIaOk] = useState(false);
  const [recentes, setRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  function loadRecentes() {
    api
      .get('/api/eval-config/recentes')
      .then((r) => setRecentes(r.data?.itens || []))
      .catch(() => {});
  }

  useEffect(() => {
    Promise.all([api.get('/api/eval-config'), api.get('/api/eval-config/recentes')])
      .then(([a, b]) => {
        setConfig(a.data.config);
        setIaOk(a.data.iaConfigurada);
        setRecentes(b.data?.itens || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    try {
      const { data } = await api.put('/api/eval-config', config);
      setConfig(data.config);
      notify('Configuração salva — já vale para as próximas avaliações.', 'success');
    } catch {
      notify('Erro ao salvar.', 'error');
    }
  }

  const showIaFields = config && config.modo === 'completo';
  const showCorte = config && config.modo !== 'simples';

  return (
    <div>
      <StaffHeader
        num="09"
        title="Avaliação"
        desc="Ajuste o quão exigente o sistema é ao corrigir as narrativas e acompanhe quem foi aprovado."
      />
      <PageState loading={loading}>
        {config && (
          <>
            <div className="card-cc p-6">
              <h3 className="font-display text-lg font-bold">Modo de avaliação da narrativa</h3>
              <div className="mt-3 space-y-2">
                {MODES.map((m) => (
                  <label
                    key={m.v}
                    className={`flex cursor-pointer items-center gap-3 rounded-cc border px-3 py-2 text-sm ${
                      config.modo === m.v ? 'border-primary bg-primary/10' : 'border-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modo"
                      disabled={!editable}
                      checked={config.modo === m.v}
                      onChange={() => setConfig({ ...config, modo: m.v })}
                      className="accent-primary"
                    />
                    {m.label}
                  </label>
                ))}
              </div>

              {showIaFields && !iaOk && (
                <p className="mt-3 rounded-cc bg-amber-500/10 p-3 text-xs text-amber-400">
                  ⚠️ O modo Completo usa a IA, mas não há chave de IA configurada no servidor — ele cai na
                  heurística automaticamente.
                </p>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {Object.entries(NUM_FIELDS).map(([key, label]) => {
                  if (key === 'notaCorte' && !showCorte) return null;
                  if (['pesoIa', 'heurCorteLixo', 'iaConfiancaMin', 'iaOriginalidadeMax'].includes(key) && !showIaFields)
                    return null;
                  return (
                    <label key={key} className="block">
                      <span className="label-cc">{label}</span>
                      <input
                        type="number"
                        disabled={!editable}
                        value={config[key]}
                        onChange={(e) => setConfig({ ...config, [key]: Number(e.target.value) })}
                        className="field"
                      />
                    </label>
                  );
                })}
              </div>

              {editable && (
                <button onClick={save} className="btn-primary mt-4">
                  <Save className="size-4" /> Salvar configuração
                </button>
              )}
            </div>

            <div className="mt-6 card-cc p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">Últimas avaliações</h3>
                <button onClick={loadRecentes} className="btn-ghost h-8 px-3 text-xs">
                  <RefreshCw className="size-3.5" /> Atualizar
                </button>
              </div>
              {recentes.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma submissão ainda.</p>
              )}
              <div className="mt-3 space-y-2">
                {recentes.map((it) => {
                  const e = it.evaluation || {};
                  const isOpen = open === it._id;
                  return (
                    <div
                      key={it._id}
                      className={`rounded-cc border ${it.approved ? 'border-green-500/20' : 'border-red-500/20'}`}
                    >
                      <button
                        onClick={() => setOpen(isOpen ? null : it._id)}
                        className="flex w-full flex-wrap items-center gap-2 p-3 text-left text-sm"
                      >
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            it.approved ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {it.approved ? '✅ Aprovado' : '❌ Reprovado'}
                        </span>
                        <span className="font-medium">{it.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          {typeof e.finalNarrativeScore === 'number' && `nota ${e.finalNarrativeScore} · `}
                          {typeof e.wordCount === 'number' && `${e.wordCount} palavras`}
                          {e.questionsTotal ? ` · ${e.questionsCorrect}/${e.questionsTotal} questões` : ''}
                        </span>
                        <span className="ml-auto text-muted-foreground">{isOpen ? '−' : '+'}</span>
                      </button>
                      {isOpen && (
                        <div className="space-y-3 border-t border-border p-3 text-sm">
                          {it.reasons?.length > 0 && (
                            <p className="text-red-400">Motivos: {it.reasons.join(', ')}</p>
                          )}
                          {(it.respostasAbertas || []).length > 0 && (
                            <div className="space-y-2">
                              {it.respostasAbertas.map((r, k) => (
                                <div key={k} className="rounded border border-white/10 bg-white/[0.02] p-2">
                                  <p className="font-semibold">{r.pergunta}</p>
                                  <p className="text-muted-foreground">{r.resposta || '(sem resposta)'}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {it.narrativa && (
                            <p className="whitespace-pre-wrap text-muted-foreground">
                              {it.narrativa}
                              {it.narrativa.length >= 600 ? '…' : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </PageState>
    </div>
  );
}
