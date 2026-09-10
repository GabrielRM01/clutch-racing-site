import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/auth';
import { useToast } from '../../components/Toast';
import { Spinner } from '../../components/ui';

export default function StaffCallback() {
  const nav = useNavigate();
  const { notify } = useToast();
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      notify('Falha no login. Tente novamente.', 'error');
      nav('/', { replace: true });
      return;
    }
    auth.saveToken(token);
    const payload = auth.decodeJwt(token);
    const staff = payload?.staff || { isStaff: false };
    auth.saveStaff(staff);
    window.history.replaceState({}, '', '/staff');

    if (staff.isStaff) {
      nav('/staff', { replace: true });
    } else {
      notify('Acesso negado: sua conta não possui cargo de staff.', 'warning');
      nav('/', { replace: true });
    }
  }, [nav, notify]);

  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Spinner className="size-8" />
        <span className="text-sm font-semibold uppercase tracking-widest">Verificando acesso...</span>
      </div>
    </div>
  );
}
