import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const ICON = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};
const COLOR = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-primary',
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const remove = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (message, type = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setItems((l) => [...l, { id, message, type }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  return (
    <ToastCtx.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = ICON[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                className="pointer-events-auto flex items-start gap-3 rounded-cc border border-border bg-background/95 p-3 shadow-2xl backdrop-blur"
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${COLOR[t.type]}`} />
                <p className="flex-1 text-sm leading-snug">{t.message}</p>
                <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
