import { useEffect, useState } from 'react';
import { Copy, Trash2, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useAccess } from './access';
import { canEdit } from './nav';
import { StaffHeader } from './StaffUI';
import { PageState, Spinner } from '../../components/ui';

const STATUS = {
  ativo: 'bg-green-500/10 text-green-400',
  expirado: 'bg-amber-500/10 text-amber-400',
  esgotado: 'bg-amber-500/10 text-amber-400',
  revogado: 'bg-red-500/10 text-red-400',
};

export default function Codes() {
  const { notify } = useToast();
  const access = useAccess();
  const editable = canEdit(access, 'codes.edit');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ codigo: '', descricao: '', validadeDias: '7', maxUsos: '' });

  function load() {
    setLoading(true);
    api
      .get('/api/passcodes')
      .then((r) => setItems(r.data?.itens || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function create() {
    setCreating(true);
    try {
      await api.post('/api/passcodes', {
        codigo: form.codigo.trim(),
        descricao: form.descricao,
        validadeDias: form.validadeDias ? Number(form.validadeDias) : 0,
        maxUsos: form.maxUsos ? Number(form.maxUsos) : 0,
      });
      notify('Código criado!', 'success');
      setForm({ codigo: '', descricao: '', validadeDias: '7', maxUsos: '' });
      load();
    } catch (e) {
      notify(e.response?.data?.error || 'Erro ao gerar código.', 'error');
    }
    setCreating(false);
  }

  async function toggle(c) {
    try {
      await api.put(`/api/passcodes/${c._id}`, { ativo: !c.ativo });
      load();
    } catch {
      notify('Erro.', 'error');
    }
  }
  async function remove(c) {
    if (!window.confirm(`Excluir o código ${c.codigo}?`)) return;
    try {
      await api.delete(`/api/passcodes/${c._id}`);
      load();
    } catch {
      notify('Erro.', 'error');
    }
  }

  return (
    <div>
      <StaffHeader
        num="07"
        title="Códigos"
        desc="Códigos de liberação: quem usa um código válido pula a avaliação (só nome + idade)."
      />

      {editable && (
        <div className="card-cc mb-6 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="label-cc">Código</span>
              <input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                placeholder="vazio = aleatório"
                className="field font-mono uppercase"
              />
            </label>
            <label className="block">
              <span className="label-cc">Descrição</span>
              <input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex.: streamer X"
                className="field"
              />
            </label>
            <label className="block">
              <span className="label-cc">Validade (dias)</span>
              <input
                type="number"
                value={form.validadeDias}
                onChange={(e) => setForm({ ...form, validadeDias: e.target.value })}
                placeholder="0 = sem expiração"
                className="field"
              />
            </label>
            <label className="block">
              <span className="label-cc">Máx. usos</span>
              <input
                type="number"
                value={form.maxUsos}
                onChange={(e) => setForm({ ...form, maxUsos: e.target.value })}
                placeholder="0 = ilimitado"
                className="field"
              />
            </label>
          </div>
          <button onClick={create} disabled={creating} className="btn-primary mt-3">
            {creating ? <Spinner className="size-4" /> : <Plus className="size-4" />} Criar código
          </button>
        </div>
      )}

      <PageState loading={loading} empty={!loading && items.length === 0} emptyText="Nenhum código ainda.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div key={c._id} className="card-cc p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(c.codigo);
                    notify('Código copiado!', 'success');
                  }}
                  className="flex items-center gap-2 font-mono text-lg font-bold hover:text-primary"
                >
                  {c.codigo} <Copy className="size-3.5" />
                </button>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[c.status] || ''}`}>
                  {c.status}
                </span>
              </div>
              {c.descricao && <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p>}
              <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <p>Usos: {c.usos}{c.maxUsos > 0 ? ` / ${c.maxUsos}` : ' (ilimitado)'}</p>
                <p>Expira: {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : 'nunca'}</p>
                {c.criadoPorNome && <p>Por: {c.criadoPorNome}</p>}
              </div>
              {editable && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => toggle(c)} className="btn-outline h-8 flex-1 text-xs">
                    {c.ativo ? 'Revogar' : 'Reativar'}
                  </button>
                  <button onClick={() => remove(c)} className="btn-danger h-8 px-3 text-xs">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </PageState>
    </div>
  );
}
