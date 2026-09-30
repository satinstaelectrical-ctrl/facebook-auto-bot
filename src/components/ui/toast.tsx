"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, message }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev.slice(-3), { id, type, title, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => toast({ type: "success", title, message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ type: "error", title, message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ type: "info", title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5",
              t.type === "success" &&
                "border-emerald-500/30 bg-[#0c1f17]/90 text-emerald-200 shadow-emerald-950/40",
              t.type === "error" &&
                "border-red-500/30 bg-[#250d0d]/90 text-red-200 shadow-red-950/40",
              t.type === "info" &&
                "border-indigo-500/30 bg-[#0e1329]/90 text-indigo-200 shadow-indigo-950/40"
            )}
          >
            <div className="shrink-0 pt-0.5">
              {t.type === "success" && <CheckCircle size={18} weight="fill" className="text-emerald-400" />}
              {t.type === "error" && <WarningCircle size={18} weight="fill" className="text-red-400" />}
              {t.type === "info" && <Info size={18} weight="fill" className="text-indigo-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-semibold text-white">{t.title}</h5>
              {t.message && <p className="mt-0.5 text-xs text-zinc-300 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-zinc-400 hover:text-white transition"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
