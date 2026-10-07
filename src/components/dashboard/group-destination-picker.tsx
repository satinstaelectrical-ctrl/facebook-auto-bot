"use client";

import React, { useState } from "react";
import {
  UsersThree,
  CheckSquare,
  Square,
  LockKey,
  Globe,
  Plus,
  ArrowClockwise,
  ShareFat,
  Trash,
  MagnifyingGlass,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import type { FacebookGroup } from "@/lib/types";

interface GroupDestinationPickerProps {
  groups: FacebookGroup[];
  selectedGroupIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  onRefresh?: () => void;
  pageName?: string;
  pageId?: string;
}

export function GroupDestinationPicker({
  groups,
  selectedGroupIds,
  onChange,
  loading = false,
  onRefresh,
  pageName = "Page officielle",
  pageId,
}: GroupDestinationPickerProps) {
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleGroup = (id: string) => {
    if (selectedGroupIds.includes(id)) {
      onChange(selectedGroupIds.filter((gid) => gid !== id));
    } else {
      onChange([...selectedGroupIds, id]);
    }
  };

  const selectAll = () => {
    onChange(groups.map((g) => g.id));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const handleAddGroups = async () => {
    const raw = manualInput.trim();
    if (!raw) return;

    setSavingManual(true);
    try {
      const res = await fetch("/api/facebook/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          raw,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newIds = (data.groups ?? []).map((g: FacebookGroup) => g.id);
        if (newIds.length > 0) {
          onChange(Array.from(new Set([...selectedGroupIds, ...newIds])));
        }
        setManualInput("");
        setShowManualInput(false);
        onRefresh?.();
      }
    } catch (err) {
      console.warn("Failed to save groups:", err);
    } finally {
      setSavingManual(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(groupId);
    try {
      const res = await fetch("/api/facebook/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, id: groupId }),
      });
      if (res.ok) {
        onChange(selectedGroupIds.filter((id) => id !== groupId));
        onRefresh?.();
      }
    } catch (err) {
      console.warn("Failed to delete group:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
      {/* Header */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <UsersThree size={13} weight="fill" />
            </span>
            Partage dans les Communautés & Groupes Facebook
            <span className="text-[10px] rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-indigo-400 font-semibold">
              {selectedGroupIds.length} sélectionné(s)
            </span>
          </label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Diffusion simultanée en direct sur <strong>{pageName}</strong> et les groupes cibles cochés.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {groups.length > 0 && (
            <button
              type="button"
              onClick={selectedGroupIds.length === groups.length ? deselectAll : selectAll}
              className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 hover:bg-indigo-500/20 transition cursor-pointer"
            >
              {selectedGroupIds.length === groups.length
                ? "Tout désélectionner"
                : `Tout sélectionner (${groups.length})`}
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Détecter et actualiser les groupes"
              className="flex items-center gap-1 p-1 px-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 transition border border-border cursor-pointer"
            >
              <ArrowClockwise size={13} className={loading ? "animate-spin text-indigo-400" : ""} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time synchronization active badge */}
      {selectedGroupIds.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-2.5 text-xs text-indigo-300">
          <ShareFat size={15} weight="fill" className="shrink-0 text-indigo-400" />
          <span>
            <strong>Partage en direct activé :</strong> dès la publication sur <strong>{pageName}</strong>, ce contenu sera partagé automatiquement dans les <strong>{selectedGroupIds.length}</strong> groupe(s) sélectionné(s).
          </span>
        </div>
      )}

      {/* Groups List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <ArrowClockwise size={14} className="animate-spin text-indigo-400" />
          <span>Détection automatique des groupes et communautés de la page…</span>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-background/50 p-4 text-center space-y-2.5">
          <p className="text-xs text-muted-foreground">
            Aucun groupe Facebook lié détecté automatiquement pour cette Page.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {onRefresh && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onRefresh}
                className="text-xs h-8"
              >
                <MagnifyingGlass size={13} className="mr-1" />
                Détecter mes groupes Facebook
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => setShowManualInput(true)}
              className="text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              <Plus size={13} className="mr-1" />
              Ajouter des groupes cibles
            </Button>
          </div>
          <p className="text-[10px] text-zinc-500">
            Astuce : vous pouvez ajouter un ou plusieurs liens de groupes une seule fois. Ils seront mémorisés pour toujours pour cette Page.
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
          {groups.map((group) => {
            const isSelected = selectedGroupIds.includes(group.id);
            const isPublic = group.privacy?.toUpperCase() === "PUBLIC" || group.privacy?.toUpperCase() === "OPEN";

            return (
              <div
                key={group.id}
                onClick={() => toggleGroup(group.id)}
                className={`flex cursor-pointer items-center justify-between rounded-xl p-2.5 transition border ${
                  isSelected
                    ? "border-indigo-500/50 bg-indigo-500/10 shadow-sm"
                    : "border-border bg-background hover:bg-surface-2"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-indigo-400 shrink-0">
                    {isSelected ? (
                      <CheckSquare size={17} weight="fill" />
                    ) : (
                      <Square size={17} className="text-muted-foreground" />
                    )}
                  </div>

                  {group.cover || group.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={group.cover || group.picture}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover shrink-0 border border-white/10"
                    />
                  ) : null}

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{group.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      {isPublic ? (
                        <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                          <Globe size={10} /> Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-zinc-400 font-medium">
                          <LockKey size={10} /> Privé
                        </span>
                      )}
                      {group.member_count && (
                        <span>• {group.member_count.toLocaleString()} membres</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteGroup(group.id, e)}
                  disabled={deletingId === group.id}
                  title="Retirer ce groupe de la liste"
                  className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-surface-2 transition shrink-0 ml-1 cursor-pointer"
                >
                  <Trash size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual / Batch Group Input Bar */}
      {showManualInput ? (
        <div className="rounded-xl border border-indigo-500/30 bg-surface-2 p-3 space-y-2.5">
          <div>
            <label className="text-xs font-bold text-foreground">
              Ajouter des groupes Facebook cibles (mémorisation automatique)
            </label>
            <p className="text-[11px] text-muted-foreground">
              Collez un ou plusieurs liens ou identifiants de groupes (ex: https://facebook.com/groups/12345678). Séparez par des sauts de ligne ou virgules.
            </p>
          </div>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            rows={2}
            placeholder="https://facebook.com/groups/votre-groupe-1&#10;https://facebook.com/groups/votre-groupe-2"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-500 placeholder-zinc-500 font-mono"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowManualInput(false);
                setManualInput("");
              }}
              className="text-xs h-8 text-muted-foreground"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleAddGroups}
              loading={savingManual}
              disabled={!manualInput.trim()}
              className="text-xs h-8 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              Enregistrer pour cette page
            </Button>
          </div>
        </div>
      ) : (
        groups.length > 0 && (
          <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="font-semibold text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus size={11} /> Ajouter d&apos;autres groupes cibles (par ID ou URL)
            </button>
            <span>{groups.length} groupe(s) enregistré(s) pour cette page</span>
          </div>
        )
      )}
    </div>
  );
}
