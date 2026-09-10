import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'size-5' }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function PageState({ loading, error, children, empty, emptyText = 'Nada por aqui ainda.' }) {
  if (loading)
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground">
        <Spinner /> Carregando...
      </div>
    );
  if (error)
    return (
      <div className="py-24 text-center text-sm text-red-400">{error}</div>
    );
  if (empty)
    return <div className="py-24 text-center text-sm text-muted-foreground">{emptyText}</div>;
  return children;
}

export function SectionHeader({ eyebrow, title, desc, center }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-muted-foreground">{desc}</p>}
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="label-cc">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
