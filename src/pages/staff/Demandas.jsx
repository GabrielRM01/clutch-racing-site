import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Save, Settings2, GripVertical } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useAccess } from './access';
import { canEdit } from './nav';
import { StaffHeader, fmtDate } from './StaffUI';
import { PageState } from '../../components/ui';

const TIPOS = [
  { v: 'demanda', l: 'Demanda' },
  { v: 'reporte', l: 'Reporte' },
];
const PRIORIDADES = [
  { v: 'baixa', l: 'Baixa', c: 'text-muted-foreground' },
  { v: 'media', l: 'Média', c: 'text-amber-400' },
  { v: 'alta', l: 'Alta', c: 'text-red-400' },
];

export default function Demandas() {
  const { notify } = useToast();
  const access = useAccess();
  const editable = canEdit(access, 'demandas.edit');

  const [demandas, setDemandas] = useState([]);
  const [fases, setFases] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // demanda object or {} for new
  const [manageFases, setManageFases] = useState(false);
  const [drag, setDrag] = useState(null);

  function loadAll() {
    setLoading(true);
    Promise.all([
      api.get('/api/demandas').then((r) => r.data?.itens || []),
      api.get('/api/fases').then((r) => r.data?.itens || []),
      api.get('/api/staff/members').then((r) => r.data?.itens || []).catch(() => []),
    ])
      .then(([d, f, m]) => {
        setDemandas(d);
        setFases([...f].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
        setMembers(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(loadAll, []);

  async function moveTo(demanda, faseId) {
    if (demanda.faseId === faseId) return;
    setDemandas((ds) => ds.map((d) => (d._id === demanda._id ? { ...d, faseId } : d)));
    try {
      await api.put(`/api/demandas/${demanda._id}`, { ...demanda, faseId });
    } catch {
      notify('Erro ao mover.', 'error');
      loadAll();
    }
  }

  async function del(id) {
    if (!window.confirm('Excluir este item?')) return;
    try {
      await api.delete(`/api/demandas/${id}`);
      notify('Excluído.', 'success');
      setEditing(null);
      loadAll();
    } catch {
      notify('Erro ao excluir.', 'error');
    }
  }

  return (
    <div>
      <StaffHeader
        num="02"
        title="Demandas"
        desc="Quadro de tarefas e reportes da equipe. Arraste os cartões entre as fases."
        action={
          editable && (
            <div className="flex gap-2">
              <button onClick={() => setManageFases(true)} className="btn-outline">
                <Settings2 className="size-4" /> Fases
              </button>
              <button
                onClick={() => setEditing({ tipo: 'demanda', prioridade: 'media', faseId: fases[0]?._id })}
                className="btn-primary"
              >
                <Plus className="size-4" /> Nova
              </button>
            </div>
          )
        }
      />

      <PageState loading={loading} empty={!loading && fases.length === 0} emptyText="Crie uma fase para começar.">
        <div className="flex gap-4 overflow-x-auto pb-4 thin-scroll">
          {fases.map((fase) => {
            const cards = demandas.filter((d) => String(d.faseId) === String(fase._id));
            return (
              <div
                key={fase._id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => drag && moveTo(drag, fase._id)}
                className="w-72 shrink-0"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-sm font-bold uppercase tracking-wide">{fase.nome}</span>
                  <span className="rounded-full bg-white/10 px-2 text-xs text-muted-foreground">
                    {cards.length}
                  </span>
                </div>
                <div className="space-y-2 rounded-cc border border-border bg-white/[0.02] p-2">
                  {cards.map((d) => {
                    const prio = PRIORIDADES.find((p) => p.v === d.prioridade);
                    return (
                      <button
                        key={d._id}
                        draggable={editable}
                        onDragStart={() => setDrag(d)}
                        onDragEnd={() => setDrag(null)}
                        onClick={() => setEditing(d)}
                        className="card-cc block w-full p-3 text-left hover:border-primary"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            {d.tipo}
                          </span>
                          <span className={`text-[10px] font-bold uppercase ${prio?.c}`}>{prio?.l}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium">{d.titulo}</p>
                        {d.responsavelNome && (
                          <p className="mt-1 text-xs text-muted-foreground">→ {d.responsavelNome}</p>
                        )}
                      </button>
                    );
                  })}
                  {cards.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">Vazio</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PageState>

      {editing && (
        <DemandaModal
          demanda={editing}
          fases={fases}
          members={members}
          editable={editable}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadAll();
          }}
          onDelete={del}
        />
      )}

      {manageFases && (
        <FasesModal
          fases={fases}
          editable={editable}
          onClose={() => setManageFases(false)}
          onChanged={loadAll}
        />
      )}
    </div>
  );
}

function DemandaModal({ demanda, fases, members, editable, onClose, onSaved, onDelete }) {
  const { notify } = useToast();
  const isNew = !demanda._id;
  const [f, setF] = useState({
    tipo: demanda.tipo || 'demanda',
    titulo: demanda.titulo || '',
    descricao: demanda.descricao || '',
    prioridade: demanda.prioridade || 'media',
    faseId: demanda.faseId || fases[0]?._id,
    responsavel: demanda.responsavel || '',
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!f.titulo.trim()) return notify('Dê um título.', 'warning');
    setSaving(true);
    const resp = members.find((m) => m.discordId === f.responsavel);
    const body = { ...f, responsavelNome: resp?.name || null };
    try {
      if (isNew) await api.post('/api/demandas', body);
      else await api.put(`/api/demandas/${demanda._id}`, body);
      notify('Salvo.', 'success');
      onSaved();
    } catch (e) {
      notify(e.response?.status === 403 ? 'Sem permissão.' : 'Erro ao salvar.', 'error');
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={isNew ? 'Nova demanda' : 'Editar demanda'}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label-cc">Tipo</span>
          <select disabled={!editable} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} className="field">
            {TIPOS.map((t) => (
              <option key={t.v} value={t.v}>
                {t.l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label-cc">Prioridade</span>
          <select
            disabled={!editable}
            value={f.prioridade}
            onChange={(e) => setF({ ...f, prioridade: e.target.value })}
            className="field"
          >
            {PRIORIDADES.map((p) => (
              <option key={p.v} value={p.v}>
                {p.l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label-cc">Fase</span>
          <select disabled={!editable} value={f.faseId} onChange={(e) => setF({ ...f, faseId: e.target.value })} className="field">
            {fases.map((fa) => (
              <option key={fa._id} value={fa._id}>
                {fa.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label-cc">Responsável</span>
          <select
            disabled={!editable}
            value={f.responsavel}
            onChange={(e) => setF({ ...f, responsavel: e.target.value })}
            className="field"
          >
            <option value="">—</option>
            {members.map((m) => (
              <option key={m.discordId} value={m.discordId}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 block">
        <span className="label-cc">Título</span>
        <input disabled={!editable} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} className="field" />
      </label>
      <label className="mt-3 block">
        <span className="label-cc">Descrição</span>
        <textarea
          disabled={!editable}
          value={f.descricao}
          onChange={(e) => setF({ ...f, descricao: e.target.value })}
          rows={4}
          className="field h-auto py-2"
        />
      </label>

      {demanda.historico?.length > 0 && (
        <div className="mt-4">
          <span className="label-cc">Histórico</span>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {demanda.historico.map((h, i) => (
              <li key={i}>
                {h.acao} — {h.por} — {h.em ? fmtDate(h.em) : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {editable && (
        <div className="mt-5 flex items-center justify-between">
          {!isNew ? (
            <button onClick={() => onDelete(demanda._id)} className="btn-danger">
              <Trash2 className="size-4" /> Excluir
            </button>
          ) : (
            <span />
          )}
          <button onClick={save} disabled={saving} className="btn-primary">
            <Save className="size-4" /> Salvar
          </button>
        </div>
      )}
    </Modal>
  );
}

function FasesModal({ fases, editable, onClose, onChanged }) {
  const { notify } = useToast();
  const [list, setList] = useState(fases);
  const [nome, setNome] = useState('');

  async function add() {
    if (!nome.trim()) return;
    try {
      await api.post('/api/fases', { nome: nome.trim() });
      setNome('');
      onChanged();
      const r = await api.get('/api/fases');
      setList([...(r.data?.itens || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
    } catch {
      notify('Erro ao criar fase.', 'error');
    }
  }
  async function rename(fa, novo) {
    setList((l) => l.map((x) => (x._id === fa._id ? { ...x, nome: novo } : x)));
  }
  async function saveName(fa) {
    try {
      await api.put(`/api/fases/${fa._id}`, { nome: fa.nome });
      onChanged();
    } catch {
      notify('Erro ao renomear.', 'error');
    }
  }
  async function del(fa) {
    if (!window.confirm(`Excluir a fase "${fa.nome}"? As demandas nela vão para a primeira fase.`)) return;
    try {
      await api.delete(`/api/fases/${fa._id}`);
      setList((l) => l.filter((x) => x._id !== fa._id));
      onChanged();
    } catch (e) {
      notify(e.response?.data?.error || 'Erro ao excluir.', 'error');
    }
  }
  async function move(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const arr = [...list];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setList(arr);
    try {
      await api.put('/api/fases/ordenar/lote', { ids: arr.map((x) => x._id) });
      onChanged();
    } catch {
      /* noop */
    }
  }

  return (
    <Modal onClose={onClose} title="Gerenciar fases">
      {editable && (
        <div className="mb-4 flex gap-2">
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nova fase..." className="field" />
          <button onClick={add} className="btn-secondary size-10 shrink-0 p-0">
            <Plus className="size-4" />
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {list.map((fa, idx) => (
          <li key={fa._id} className="flex items-center gap-2 rounded-cc border border-white/10 p-2">
            <div className="flex flex-col text-muted-foreground">
              <button onClick={() => move(idx, -1)} className="text-xs hover:text-foreground">
                ▲
              </button>
              <button onClick={() => move(idx, 1)} className="text-xs hover:text-foreground">
                ▼
              </button>
            </div>
            <input
              value={fa.nome}
              disabled={!editable}
              onChange={(e) => rename(fa, e.target.value)}
              onBlur={() => saveName(fa)}
              className="h-8 flex-1 border-0 bg-transparent px-1 text-sm focus-visible:bg-white/5"
            />
            {editable && (
              <button onClick={() => del(fa)} className="text-muted-foreground hover:text-red-400">
                <Trash2 className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-cc border border-border bg-card p-5 thin-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="btn-ghost size-8 p-0">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
