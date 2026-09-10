import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useAccess } from './access';
import { canEdit } from './nav';
import { StaffHeader } from './StaffUI';
import { PageState, Spinner } from '../../components/ui';

const CONFIG = {
  veiculos: {
    num: '04',
    title: 'Veículos',
    desc: 'Cadastro de veículos. Marcas, concessionárias, motores e atualizações alimentam os seletores.',
    perm: 'vehicles.edit',
    tabs: [
      {
        id: 'veiculos',
        label: 'Veículos',
        endpoint: '/api/vehicles',
        cols: [
          { key: 'hash', label: 'Hash' },
          { key: 'marca', label: 'Marca' },
          { key: 'modelo', label: 'Modelo' },
          { key: 'ano', label: 'Ano', num: true },
          { key: 'categoria', label: 'Categoria', num: true },
          { key: 'concessionaria', label: 'Concessionária' },
          { key: 'preco', label: 'Preço', num: true },
          { key: 'fipe', label: 'FIPE', num: true },
          { key: 'motor', label: 'Motor' },
          { key: 'turbo', label: 'Turbo' },
          { key: 'att', label: 'ATT' },
        ],
      },
      { id: 'marcas', label: 'Marcas', endpoint: '/api/marcas', cols: [{ key: 'real', label: 'Marca real' }, { key: 'ficticia', label: 'Marca no jogo' }] },
      { id: 'concessionarias', label: 'Concessionárias', endpoint: '/api/concessionarias', cols: [{ key: 'nome', label: 'Concessionária' }] },
      { id: 'motores', label: 'Motores', endpoint: '/api/motores', cols: [{ key: 'codigo', label: 'Código' }, { key: 'nome', label: 'Motor' }] },
      { id: 'atualizacoes', label: 'Atualizações', endpoint: '/api/atualizacoes', cols: [{ key: 'nome', label: 'Nome' }, { key: 'data', label: 'Data' }] },
    ],
  },
  itens: {
    num: '05',
    title: 'Itens',
    desc: 'Catálogo de itens do servidor.',
    perm: 'items.edit',
    tabs: [
      {
        id: 'itens',
        label: 'Itens',
        endpoint: '/api/items',
        cols: [
          { key: 'hash', label: 'Hash' },
          { key: 'nome', label: 'Nome' },
          { key: 'peso', label: 'Peso', num: true },
        ],
      },
    ],
  },
  comandos: {
    num: '06',
    title: 'Comandos',
    desc: 'Comandos do servidor.',
    perm: 'commands.edit',
    tabs: [
      {
        id: 'comandos',
        label: 'Comandos',
        endpoint: '/api/commands',
        cols: [
          { key: 'comando', label: 'Comando' },
          { key: 'descricao', label: 'Descrição' },
          { key: 'nivel', label: 'Nível' },
        ],
      },
    ],
  },
};

let keySeq = 0;
const newKey = () => `r${++keySeq}`;

export default function Sheets({ section }) {
  const cfg = CONFIG[section];
  const [tab, setTab] = useState(cfg.tabs[0].id);
  const current = cfg.tabs.find((t) => t.id === tab);

  return (
    <div>
      <StaffHeader num={cfg.num} title={cfg.title} desc={cfg.desc} />
      {cfg.tabs.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {cfg.tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`btn h-8 px-3 text-xs ${
                tab === t.id ? 'bg-primary text-white' : 'border border-white/10 bg-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <SheetTable key={current.id} endpoint={current.endpoint} cols={current.cols} perm={cfg.perm} />
    </div>
  );
}

function SheetTable({ endpoint, cols, perm }) {
  const { notify } = useToast();
  const access = useAccess();
  const editable = canEdit(access, perm);

  const [rows, setRows] = useState([]);
  const [original, setOriginal] = useState({});
  const [deleted, setDeleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .get(endpoint)
      .then((r) => {
        const data = r.data?.itens || r.data || [];
        setRows(data.map((d) => ({ ...d, _key: newKey() })));
        const map = {};
        data.forEach((d) => (map[d._id] = d));
        setOriginal(map);
        setDeleted([]);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.response?.status === 403 ? 'Você não tem permissão para ver isto.' : 'Erro ao carregar.');
        setLoading(false);
      });
  }
  useEffect(load, [endpoint]); // eslint-disable-line

  function setCell(key, col, value) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, [col]: value } : r)));
  }
  function addRow() {
    const r = { _key: newKey() };
    cols.forEach((c) => (r[c.key] = ''));
    setRows((rs) => [...rs, r]);
  }
  function removeRow(key) {
    setRows((rs) => {
      const row = rs.find((r) => r._key === key);
      if (row?._id) setDeleted((d) => [...d, row._id]);
      return rs.filter((r) => r._key !== key);
    });
  }

  function payload(r) {
    const o = {};
    cols.forEach((c) => (o[c.key] = c.num ? Number(r[c.key]) || 0 : r[c.key] ?? ''));
    return o;
  }

  async function save() {
    setSaving(true);
    const calls = [];
    deleted.forEach((id) => calls.push(api.delete(`${endpoint}/${id}`)));
    rows.forEach((r) => {
      if (!r._id) calls.push(api.post(endpoint, payload(r)));
      else {
        const orig = original[r._id];
        const changed = cols.some((c) => String(r[c.key] ?? '') !== String(orig?.[c.key] ?? ''));
        if (changed) calls.push(api.put(`${endpoint}/${r._id}`, payload(r)));
      }
    });
    if (!calls.length) {
      notify('Nada para salvar.', 'info');
      setSaving(false);
      return;
    }
    try {
      await Promise.all(calls);
      notify('Salvo com sucesso.', 'success');
      load();
    } catch (e) {
      notify(e.response?.status === 403 ? 'Sem permissão para editar.' : 'Erro ao salvar.', 'error');
    }
    setSaving(false);
  }

  return (
    <PageState loading={loading} error={error}>
      <div className="card-cc overflow-hidden">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                {cols.map((c) => (
                  <th key={c.key} className="p-2 font-semibold">
                    {c.label}
                  </th>
                ))}
                {editable && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._key} className="border-b border-border/40">
                  {cols.map((c) => (
                    <td key={c.key} className="p-1">
                      <input
                        disabled={!editable}
                        type={c.num ? 'number' : 'text'}
                        value={r[c.key] ?? ''}
                        onChange={(e) => setCell(r._key, c.key, e.target.value)}
                        className="h-8 w-full min-w-[90px] rounded border-0 bg-transparent px-2 focus-visible:bg-white/5"
                      />
                    </td>
                  ))}
                  {editable && (
                    <td className="p-1 text-center">
                      <button
                        onClick={() => removeRow(r._key)}
                        className="text-muted-foreground hover:text-red-400"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 1} className="p-6 text-center text-muted-foreground">
                    Nenhum registro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {editable && (
          <div className="flex items-center justify-between border-t border-border p-3">
            <button onClick={addRow} className="btn-outline">
              <Plus className="size-4" /> Adicionar linha
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? <Spinner className="size-4" /> : <Save className="size-4" />} Salvar alterações
            </button>
          </div>
        )}
      </div>
    </PageState>
  );
}
