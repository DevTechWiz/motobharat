"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const toast = useCallback((message: string, tone: Tone = "success") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
              t.tone === "error" ? "text-danger" : "text-text",
            )}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
