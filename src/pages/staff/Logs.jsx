import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { PageState } from '../../components/ui';
import { StaffHeader, fmtDate } from './StaffUI';

const ACTION = {
  create: { label: 'criou', cls: 'text-green-400' },
  update: { label: 'editou', cls: 'text-amber-400' },
  delete: { label: 'excluiu', cls: 'text-red-400' },
};

export default function Logs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/api/staff/logs')
      .then((r) => {
        setItems(r.data.itens || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(
          e.response?.status === 403
            ? 'Você não tem permissão para ver os logs.'
            : 'Erro ao carregar os logs.',
        );
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <StaffHeader num="11" title="Logs" desc="Histórico de ações feitas no painel." />
      <PageState
        loading={loading}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyText="Nenhuma ação registrada ainda."
      >
        <ul className="card-cc divide-y divide-border">
          {items.map((l) => {
            const a = ACTION[l.action] || { label: l.action, cls: 'text-muted-foreground' };
            return (
              <li key={l._id} className="flex items-center justify-between gap-4 p-4 text-sm">
                <p>
                  <strong>{l.actorName || 'Alguém'}</strong>{' '}
                  <span className={a.cls}>{a.label}</span> em <strong>{l.category}</strong>
                  {l.target ? (
                    <>
                      : <span className="text-muted-foreground">{l.target}</span>
                    </>
                  ) : null}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(l.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      </PageState>
    </div>
  );
}
