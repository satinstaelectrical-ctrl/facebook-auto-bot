"use client";

import React, { useState } from "react";
import { Copy, Check, Eye, EyeSlash, Broadcast } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

export interface WebhookEndpointSnippetProps {
  endpointUrl: string;
  secretKey?: string;
  title?: string;
  className?: string;
}

export function WebhookEndpointSnippet({
  endpointUrl,
  secretKey,
  title = "Point de terminaison Webhook de Publication",
  className,
}: WebhookEndpointSnippetProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(endpointUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopySecret = async () => {
    if (!secretKey) return;
    try {
      await navigator.clipboard.writeText(secretKey);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-surface-2/40 p-4 sm:p-5 space-y-3.5 backdrop-blur-sm shadow-sm transition-all",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Broadcast size={15} weight="duotone" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">{title}</h4>
            <p className="text-[11px] text-muted-foreground">
              Envoyez vos annonces depuis Yamoura CMS, WordPress ou votre backend via requête POST.
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Écouteur actif
        </span>
      </div>

      {/* URL Endpoint Bar */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          URL de réception (HTTP POST) :
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2 shadow-inner">
          <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-500 shrink-0">
            POST
          </span>
          <code className="text-xs font-mono text-foreground truncate flex-1 select-all">
            {endpointUrl}
          </code>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground transition cursor-pointer"
            title="Copier l'URL"
          >
            {copiedUrl ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-[11px] text-emerald-500 font-bold">Copié</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span className="text-[11px]">Copier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Secret Key Bar (if available) */}
      {secretKey && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Clé secrète d&apos;authentification (X-Webhook-Secret) :
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2 shadow-inner">
            <code className="text-xs font-mono text-foreground truncate flex-1 select-all">
              {showSecret ? secretKey : "••••••••••••••••••••••••••••••••"}
            </code>
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="p-1 text-muted-foreground hover:text-foreground transition cursor-pointer"
              title={showSecret ? "Masquer" : "Afficher"}
            >
              {showSecret ? <EyeSlash size={15} /> : <Eye size={15} />}
            </button>
            <button
              type="button"
              onClick={handleCopySecret}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground transition cursor-pointer"
              title="Copier la clé"
            >
              {copiedSecret ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-[11px] text-emerald-500 font-bold">Copié</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span className="text-[11px]">Copier</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebhookEndpointSnippet;
