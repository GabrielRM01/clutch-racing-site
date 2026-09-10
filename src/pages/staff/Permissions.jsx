import { Fragment, useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useAccess } from './access';
import { StaffHeader } from './StaffUI';
import { PageState, Spinner } from '../../components/ui';

export default function Permissions() {
  const { notify } = useToast();
  const access = useAccess();

  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [perms, setPerms] = useState({}); // roleId -> Set
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/api/staff/roles')
      .then((r) => {
        setRoles(r.data.roles || []);
        setCatalog(r.data.catalog || []);
        const p = {};
        (r.data.roles || []).forEach((role) => (p[role.id] = new Set(role.permissions || [])));
        setPerms(p);
        setLoading(false);
      })
      .catch((e) => {
        setError(
          e.response?.status === 403
            ? 'Apenas o cargo master pode gerenciar permissões.'
            : 'Erro ao carregar os cargos do Discord.',
        );
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const seen = [];
    catalog.forEach((c) => {
      if (!seen.find((s) => s.name === c.category)) seen.push({ name: c.category, perms: [] });
      seen.find((s) => s.name === c.category).perms.push(c);
    });
    return seen;
  }, [catalog]);

  const editableRoles = roles.filter((r) => !r.isMaster);

  function toggle(roleId, key) {
    setPerms((p) => {
      const set = new Set(p[roleId]);
      set.has(key) ? set.delete(key) : set.add(key);
      return { ...p, [roleId]: set };
    });
  }

  async function save() {
    setSaving(true);
    const changed = roles.filter((r) => {
      if (r.isMaster) return false;
      const a = [...(perms[r.id] || [])].sort().join(',');
      const b = [...(r.permissions || [])].sort().join(',');
      return a !== b;
    });
    if (!changed.length) {
      notify('Nada para salvar.', 'info');
      setSaving(false);
      return;
    }
    try {
      await Promise.all(
        changed.map((r) =>
          api.put(`/api/staff/roles/${r.id}`, { permissions: [...(perms[r.id] || [])], roleName: r.name }),
        ),
      );
      setRoles((rs) => rs.map((r) => ({ ...r, permissions: [...(perms[r.id] || r.permissions || [])] })));
      notify('Permissões salvas.', 'success');
    } catch (e) {
      notify(e.response?.status === 403 ? 'Sem permissão.' : 'Erro ao salvar.', 'error');
    }
    setSaving(false);
  }

  if (!access.isMaster && !loading)
    return (
      <div>
        <StaffHeader num="10" title="Permissões" />
        <p className="py-16 text-center text-sm text-red-400">Apenas o cargo master pode abrir esta aba.</p>
      </div>
    );

  return (
    <div>
      <StaffHeader
        num="10"
        title="Permissões"
        desc="Defina o que cada cargo do Discord pode acessar no painel."
        action={
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Spinner className="size-4" /> : <Save className="size-4" />} Salvar
          </button>
        }
      />
      <PageState loading={loading} error={error}>
        <div className="card-cc overflow-x-auto thin-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="sticky left-0 bg-card p-3">Permissão</th>
                {editableRoles.map((r) => (
                  <th key={r.id} className="whitespace-nowrap p-3 text-center font-semibold">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <Fragment key={cat.name}>
                  <tr className="bg-white/[0.02]">
                    <td colSpan={editableRoles.length + 1} className="p-2 text-xs font-bold uppercase text-primary">
                      {cat.name}
                    </td>
                  </tr>
                  {cat.perms.map((perm) => (
                    <tr key={perm.key} className="border-b border-border/40">
                      <td className="sticky left-0 bg-card p-3">{perm.label}</td>
                      {editableRoles.map((r) => (
                        <td key={r.id} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={perms[r.id]?.has(perm.key) || false}
                            onChange={() => toggle(r.id, perm.key)}
                            className="size-4 accent-primary"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </PageState>
    </div>
  );
}
