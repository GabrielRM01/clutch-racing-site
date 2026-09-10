import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { PageState } from '../../components/ui';
import { StaffHeader, fmtDate } from './StaffUI';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/api/staff/dashboard')
      .then((r) => {
        setData(r.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(
          e.response?.status === 403
            ? 'Acesso negado — você não tem permissão.'
            : 'Não foi possível carregar o dashboard.',
        );
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <StaffHeader num="01" title="Dashboard" desc="Visão geral das aplicações de whitelist." />
      <PageState loading={loading} error={error}>
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Total de aplicações" value={data.stats.total} />
              <Stat label="Aprovadas" value={data.stats.aprovadas} accent="text-green-400" />
              <Stat label="Reprovadas" value={data.stats.reprovadas} accent="text-red-400" />
              <Stat label="Taxa de aprovação" value={`${data.stats.taxaAprovacao}%`} />
            </div>

            <div className="mt-6 card-cc p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Últimos 30 dias
                </span>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <i className="size-2 rounded-full bg-primary" /> Total
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="size-2 rounded-full bg-green-400" /> Aprovadas
                  </span>
                </div>
              </div>
              {data.serie.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sem submissões nos últimos 30 dias.
                </p>
              ) : (
                <Chart serie={data.serie} />
              )}
            </div>

            <div className="mt-6 card-cc overflow-hidden">
              <div className="border-b border-border p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Submissões recentes
                </span>
              </div>
              {data.recentes.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma submissão ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="p-3">Discord ID</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentes.map((r) => (
                        <tr key={r._id} className="border-b border-border/50">
                          <td className="p-3 font-mono text-xs">{r.discordId}</td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                r.approved
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}
                            >
                              {r.approved ? 'Aprovada' : 'Reprovada'}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{fmtDate(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </PageState>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="card-cc p-5">
      <div className={`font-display text-3xl font-extrabold ${accent || ''}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Chart({ serie }) {
  const max = Math.max(1, ...serie.map((d) => d.total));
  return (
    <div className="flex h-40 items-end gap-1">
      {serie.map((d) => (
        <div
          key={d.data}
          className="group relative flex-1"
          title={`${d.data} — ${d.total} aplicações (${d.aprovadas} aprovadas)`}
        >
          <div
            className="w-full rounded-t bg-primary/30"
            style={{ height: `${(d.total / max) * 100}%`, minHeight: '2px' }}
          >
            <div
              className="w-full rounded-t bg-green-400"
              style={{ height: `${d.total ? (d.aprovadas / d.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
