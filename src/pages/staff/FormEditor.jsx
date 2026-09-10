import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useAccess } from './access';
import { canEdit } from './nav';
import { StaffHeader } from './StaffUI';
import { PageState } from '../../components/ui';

export default function FormEditor() {
  const { notify } = useToast();
  const access = useAccess();
  const editable = canEdit(access, 'form.edit');

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get('/api/perguntas')
      .then((r) => setList(r.data?.itens || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const patch = (i, data) => setList((l) => l.map((q, idx) => (idx === i ? { ...q, ...data } : q)));
  const patchOpt = (i, oi, data) =>
    setList((l) =>
      l.map((q, idx) =>
        idx === i ? { ...q, opcoes: q.opcoes.map((o, k) => (k === oi ? { ...o, ...data } : o)) } : q,
      ),
    );
  const setCorrect = (i, oi) =>
    setList((l) =>
      l.map((q, idx) =>
        idx === i ? { ...q, opcoes: q.opcoes.map((o, k) => ({ ...o, correta: k === oi })) } : q,
      ),
    );
  const addOpt = (i) =>
    setList((l) => l.map((q, idx) => (idx === i ? { ...q, opcoes: [...q.opcoes, { texto: '', correta: false }] } : q)));
  const rmOpt = (i, oi) =>
    setList((l) => l.map((q, idx) => (idx === i ? { ...q, opcoes: q.opcoes.filter((_, k) => k !== oi) } : q)));

  const addQuestion = () =>
    setList((l) => [
      ...l,
      { label: '', ativo: true, tipo: 'multipla', opcoes: [{ texto: '', correta: true }, { texto: '', correta: false }] },
    ]);

  async function save(q) {
    if (!q.label.trim()) return notify('Dê um texto à pergunta.', 'warning');
    const aberta = q.tipo === 'aberta';
    if (!aberta) {
      if (!q.opcoes.some((o) => o.correta)) return notify('Marque a opção correta.', 'warning');
      if (q.opcoes.filter((o) => o.texto.trim()).length < 2)
        return notify('Precisa de ao menos 2 opções.', 'warning');
    }
    const body = {
      label: q.label,
      ativo: q.ativo,
      tipo: q.tipo || 'multipla',
      opcoes: aberta ? [] : q.opcoes.map((o) => ({ texto: o.texto, correta: o.correta })),
    };
    try {
      if (q._id) await api.put(`/api/perguntas/${q._id}`, body);
      else await api.post('/api/perguntas', body);
      notify('Pergunta salva.', 'success');
      load();
    } catch {
      notify('Erro ao salvar.', 'error');
    }
  }

  async function remove(q) {
    if (!q._id) return load();
    if (!window.confirm('Excluir esta pergunta?')) return;
    try {
      await api.delete(`/api/perguntas/${q._id}`);
      notify('Excluída.', 'success');
      load();
    } catch {
      notify('Erro ao excluir.', 'error');
    }
  }

  return (
    <div>
      <StaffHeader
        num="08"
        title="Formulário"
        desc="Perguntas da prova de whitelist. Múltipla escolha (marque a correta) ou resposta aberta (revisão manual)."
        action={
          editable && (
            <button onClick={addQuestion} className="btn-primary">
              <Plus className="size-4" /> Nova pergunta
            </button>
          )
        }
      />

      <PageState loading={loading} empty={!loading && list.length === 0} emptyText="Nenhuma pergunta cadastrada.">
        <div className="space-y-4">
          {list.map((q, i) => (
            <div
              key={q._id || `new-${i}`}
              className={`card-cc p-4 ${q.ativo ? '' : 'opacity-60'}`}
            >
              <input
                value={q.label}
                disabled={!editable}
                onChange={(e) => patch(i, { label: e.target.value })}
                placeholder="Texto da pergunta"
                className="field mb-3 font-medium"
              />

              <div className="mb-3 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    disabled={!editable}
                    checked={q.tipo !== 'aberta'}
                    onChange={() => patch(i, { tipo: 'multipla' })}
                    className="accent-primary"
                  />
                  Múltipla escolha
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    disabled={!editable}
                    checked={q.tipo === 'aberta'}
                    onChange={() => patch(i, { tipo: 'aberta' })}
                    className="accent-primary"
                  />
                  Resposta aberta
                </label>
              </div>

              {q.tipo === 'aberta' ? (
                <p className="rounded-cc border border-white/10 bg-white/[0.02] p-3 text-xs text-muted-foreground">
                  Resposta em texto livre — não é corrigida automaticamente; aparece na aba Avaliação para
                  revisão manual da staff.
                </p>
              ) : (
                <div className="space-y-2">
                  {q.opcoes.map((o, oi) => (
                    <div
                      key={oi}
                      className={`flex items-center gap-2 rounded-cc border px-2 py-1 ${
                        o.correta ? 'border-green-500/40 bg-green-500/5' : 'border-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        disabled={!editable}
                        name={`correct-${q._id || i}`}
                        checked={!!o.correta}
                        onChange={() => setCorrect(i, oi)}
                        title="Marcar como correta"
                        className="accent-green-500"
                      />
                      <input
                        value={o.texto}
                        disabled={!editable}
                        onChange={(e) => patchOpt(i, oi, { texto: e.target.value })}
                        placeholder="Texto da opção"
                        className="h-8 flex-1 border-0 bg-transparent px-1 text-sm focus-visible:bg-white/5"
                      />
                      {editable && q.opcoes.length > 2 && (
                        <button onClick={() => rmOpt(i, oi)} className="text-muted-foreground hover:text-red-400">
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <button onClick={() => addOpt(i)} className="text-xs font-semibold text-primary">
                      + opção
                    </button>
                  )}
                </div>
              )}

              {editable && (
                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={q.ativo}
                      onChange={(e) => patch(i, { ativo: e.target.checked })}
                      className="accent-primary"
                    />
                    Ativa
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => remove(q)} className="btn-danger h-8 px-3 text-xs">
                      <Trash2 className="size-3.5" /> Excluir
                    </button>
                    <button onClick={() => save(q)} className="btn-primary h-8 px-3 text-xs">
                      <Save className="size-3.5" /> Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </PageState>
    </div>
  );
}
