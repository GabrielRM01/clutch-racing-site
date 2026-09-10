import {
  LayoutDashboard,
  KanbanSquare,
  BookText,
  Car,
  Package,
  Terminal,
  Ticket,
  ListChecks,
  Gauge,
  ShieldHalf,
  ScrollText,
} from 'lucide-react';

export const STAFF_NAV = [
  { to: '', end: true, num: '01', label: 'Dashboard', perm: 'dashboard.view', icon: LayoutDashboard },
  { to: 'demandas', num: '02', label: 'Demandas', perm: 'demandas.view', icon: KanbanSquare },
  { to: 'regras', num: '03', label: 'Regras', perm: 'rules.edit', icon: BookText },
  { to: 'veiculos', num: '04', label: 'Veículos', perm: 'vehicles.view', icon: Car },
  { to: 'itens', num: '05', label: 'Itens', perm: 'items.view', icon: Package },
  { to: 'comandos', num: '06', label: 'Comandos', perm: 'commands.view', icon: Terminal },
  { to: 'codigos', num: '07', label: 'Códigos', perm: 'codes.view', icon: Ticket },
  { to: 'formulario', num: '08', label: 'Formulário', perm: 'form.view', icon: ListChecks },
  { to: 'avaliacao', num: '09', label: 'Avaliação', perm: 'eval.view', icon: Gauge },
  { to: 'permissoes', num: '10', label: 'Permissões', perm: 'permissoes', master: true, icon: ShieldHalf },
  { to: 'logs', num: '11', label: 'Logs', perm: 'logs.view', icon: ScrollText },
];

export function canSee(item, access) {
  if (!access) return false;
  if (access.isMaster) return true;
  if (item.master) return false;
  return (access.permissions || []).includes(item.perm);
}

export function canEdit(access, perm) {
  if (!access) return false;
  return access.isMaster || (access.permissions || []).includes(perm);
}
