import { useEffect, useRef, useState } from 'react';
import { auth } from '../lib/auth';
import { Spinner } from './ui';

const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '479015388083-cdk5ua96is9jb4b0plvp0vfrpjobqj4v.apps.googleusercontent.com';

let scriptPromise = null;
function loadGis() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Falha ao carregar o Google'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export default function GoogleLogin({ onSuccess, onError }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadGis()
      .then(() => {
        if (!alive) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => {
            try {
              const payload = auth.decodeJwt(resp.credential);
              if (!payload?.email_verified) throw new Error('E-mail não verificado pelo Google.');
              onSuccess({
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                googleId: payload.sub,
                emailVerified: payload.email_verified,
              });
            } catch (e) {
              onError?.(e.message || 'Erro ao validar login do Google.');
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        if (ref.current) {
          window.google.accounts.id.renderButton(ref.current, {
            theme: 'filled_black',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 280,
          });
        }
        setReady(true);
      })
      .catch((e) => onError?.(e.message));
    return () => {
      alive = false;
    };
  }, [onSuccess, onError]);

  return (
    <div className="flex min-h-[44px] items-center justify-center">
      {!ready && <Spinner />}
      <div ref={ref} />
    </div>
  );
}
