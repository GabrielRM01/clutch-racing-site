import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plus, Trash2, Eye, Pencil, Save } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useAccess } from './access';
import { canEdit } from './nav';
import { StaffHeader } from './StaffUI';
import { PageState, Spinner } from '../../components/ui';

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function RulesEditor() {
  const { notify } = useToast();
  const access = useAccess();
  const editable = canEdit(access, 'rules.edit');

  const [rules, setRules] = useState([]);
  const [slug, setSlug] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  function load(keep) {
    setLoading(true);
    api
      .get('/api/rules')
      .then((r) => {
        const data = [...r.data].sort((a, b) => (a.order || 0) - (b.order || 0));
        setRules(data);
        const sel = keep ? data.find((x) => x.slug === keep) : data[0];
        if (sel) {
          setSlug(sel.slug);
          setTitle(sel.title);
          setContent(sel.content || '');
        }
        setLoading(false);
      })
      .catch(() => {
        notify('Erro ao carregar regras.', 'error');
        setLoading(false);
      });
  }
  useEffect(() => load(), []); // eslint-disable-line

  function pick(r) {
    setSlug(r.slug);
    setTitle(r.title);
    setContent(r.content || '');
    setPreview(false);
  }

  async function save() {
    setSaving(true);
    try {
      await api.put(`/api/rules/${slug}`, { title, content });
      notify('Regra salva.', 'success');
      load(slug);
    } catch (e) {
      notify(e.response?.status === 403 ? 'Sem permissão.' : 'Erro ao salvar.', 'error');
    }
    setSaving(false);
  }

  async function remove() {
    if (!window.confirm('Excluir esta regra? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/api/rules/${slug}`);
      notify('Regra excluída.', 'success');
      load();
    } catch {
      notify('Erro ao excluir.', 'error');
    }
  }

  async function create() {
    const t = newTitle.trim();
    if (!t) return;
    const order = rules.reduce((m, r) => Math.max(m, r.order || 0), 0) + 1;
    try {
      await api.post('/api/rules', { slug: slugify(t), title: t, content: `## ${t}\n\nEscreva o conteúdo aqui.`, order });
      setNewTitle('');
      notify('Regra criada.', 'success');
      load(slugify(t));
    } catch (e) {
      notify(e.response?.status === 409 ? 'Já existe uma regra com esse nome.' : 'Erro ao criar.', 'error');
    }
  }

  return (
    <div>
      <StaffHeader num="03" title="Regras" desc="Crie, edite e organize as regras exibidas no site." />
      <PageState loading={loading}>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-3">
            {editable && (
              <div className="flex gap-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nova regra..."
                  className="field"
                />
                <button onClick={create} className="btn-secondary size-10 shrink-0 p-0">
                  <Plus className="size-4" />
                </button>
              </div>
            )}
            <div className="space-y-1">
              {rules.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => pick(r)}
                  className={`w-full rounded-cc px-3 py-2 text-left text-sm ${
                    r.slug === slug
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-white/5'
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>
          </aside>

          <div className="card-cc p-5">
            {slug && (
              <>
                <input
                  value={title}
                  disabled={!editable}
                  onChange={(e) => setTitle(e.target.value)}
                  className="field mb-3 font-display text-lg font-bold"
                />
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex gap-1 rounded-cc border border-white/10 p-0.5">
                    <button
                      onClick={() => setPreview(false)}
                      className={`btn h-7 px-3 text-xs ${!preview ? 'bg-white/10' : 'bg-transparent'}`}
                    >
                      <Pencil className="size-3" /> Editar
                    </button>
                    <button
                      onClick={() => setPreview(true)}
                      className={`btn h-7 px-3 text-xs ${preview ? 'bg-white/10' : 'bg-transparent'}`}
                    >
                      <Eye className="size-3" /> Preview
                    </button>
                  </div>
                </div>

                {preview ? (
                  <div className="md-body min-h-[300px] rounded-cc border border-white/10 bg-background p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={content}
                    disabled={!editable}
                    onChange={(e) => setContent(e.target.value)}
                    rows={18}
                    className="field h-auto py-2 font-mono text-sm leading-6"
                  />
                )}

                {editable && (
                  <div className="mt-4 flex items-center justify-between">
                    <button onClick={remove} className="btn-danger">
                      <Trash2 className="size-4" /> Excluir
                    </button>
                    <button onClick={save} disabled={saving} className="btn-primary">
                      {saving ? <Spinner className="size-4" /> : <Save className="size-4" />} Salvar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PageState>
    </div>
  );
}
