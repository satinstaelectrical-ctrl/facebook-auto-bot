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
  Sparkle,
  Info,
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
}

export function GroupDestinationPicker({
  groups,
  selectedGroupIds,
  onChange,
  loading = false,
  onRefresh,
  pageName = "Page officielle",
}: GroupDestinationPickerProps) {
  const [manualGroupId, setManualGroupId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [customGroups, setCustomGroups] = useState<FacebookGroup[]>([]);

  const combinedGroups = [...groups, ...customGroups];

  const toggleGroup = (id: string) => {
    if (selectedGroupIds.includes(id)) {
      onChange(selectedGroupIds.filter((gid) => gid !== id));
    } else {
      onChange([...selectedGroupIds, id]);
    }
  };

  const selectAll = () => {
    onChange(combinedGroups.map((g) => g.id));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const handleAddManualGroup = () => {
    const raw = manualGroupId.trim();
    if (!raw) return;

    // Extract ID if full URL pasted
    let id = raw;
    const match = raw.match(/facebook\.com\/groups\/([^/?]+)/i);
    if (match && match[1]) {
      id = match[1];
    }

    if (!combinedGroups.some((g) => g.id === id)) {
      const newGroup: FacebookGroup = {
        id,
        name: `Groupe Facebook (${id})`,
        privacy: "PUBLIC",
      };
      setCustomGroups((prev) => [...prev, newGroup]);
      onChange([...selectedGroupIds, id]);
    }
    setManualGroupId("");
    setShowManualInput(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 space-y-3.5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
            Publication simultanée en temps réel sur <strong>{pageName}</strong> et diffusion dans vos groupes cibles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {combinedGroups.length > 0 && (
            <button
              type="button"
              onClick={selectedGroupIds.length === combinedGroups.length ? deselectAll : selectAll}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              {selectedGroupIds.length === combinedGroups.length
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Rafraîchir la liste des groupes"
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"
            >
              <ArrowClockwise size={13} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Real-time synchronization badge */}
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
          <span>Chargement des communautés et groupes Facebook…</span>
        </div>
      ) : combinedGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-background/50 p-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Aucun groupe Facebook lié détecté automatiquement pour cette Page.
          </p>
          <button
            type="button"
            onClick={() => setShowManualInput(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:underline"
          >
            <Plus size={12} /> Ajouter un groupe par son ID ou lien
          </button>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 max-h-52 overflow-y-auto pr-1">
          {combinedGroups.map((group) => {
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

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{group.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      {isPublic ? (
                        <span className="flex items-center gap-0.5 text-emerald-400">
                          <Globe size={10} /> Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-zinc-400">
                          <LockKey size={10} /> Privé
                        </span>
                      )}
                      {group.member_count && (
                        <span>• {group.member_count.toLocaleString()} membres</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Group Input Bar */}
      {showManualInput ? (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <input
            value={manualGroupId}
            onChange={(e) => setManualGroupId(e.target.value)}
            placeholder="ID du groupe ou URL (ex: https://facebook.com/groups/12345678)"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-indigo-500"
          />
          <Button
            size="sm"
            onClick={handleAddManualGroup}
            disabled={!manualGroupId.trim()}
            className="text-xs h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Ajouter
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowManualInput(false)}
            className="text-xs h-8 text-muted-foreground"
          >
            Annuler
          </Button>
        </div>
      ) : (
        combinedGroups.length > 0 && (
          <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="font-semibold text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus size={11} /> Ajouter un autre groupe par ID/URL
            </button>
            <span>{selectedGroupIds.length} groupe(s) actif(s)</span>
          </div>
        )
      )}
    </div>
  );
}
