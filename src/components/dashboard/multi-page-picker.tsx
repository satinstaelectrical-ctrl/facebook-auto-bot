"use client";

import { useState, useMemo } from "react";
import {
  MagnifyingGlass,
  Check,
  CheckSquare,
  Square,
  UsersThree,
  Plus,
  Trash,
  FacebookLogo,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import type { PageCache, PageGroup } from "@/lib/types";

interface MultiPagePickerProps {
  pages: PageCache[];
  selectedPageIds: string[];
  onChange: (ids: string[]) => void;
  pageGroups: PageGroup[];
  onSaveGroup: (name: string, pageIds: string[]) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

export function MultiPagePicker({
  pages,
  selectedPageIds,
  onChange,
  pageGroups,
  onSaveGroup,
  onDeleteGroup,
}: MultiPagePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages;
    const q = search.toLowerCase();
    return pages.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))
    );
  }, [pages, search]);

  const togglePage = (id: string) => {
    if (selectedPageIds.includes(id)) {
      onChange(selectedPageIds.filter((p) => p !== id));
    } else {
      onChange([...selectedPageIds, id]);
    }
  };

  const selectAll = () => {
    onChange(pages.map((p) => p.page_id));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const applyGroup = (group: PageGroup) => {
    onChange(group.page_ids);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedPageIds.length === 0) return;
    setSavingGroup(true);
    try {
      await onSaveGroup(newGroupName.trim(), selectedPageIds);
      setNewGroupName("");
      setShowNewGroup(false);
    } finally {
      setSavingGroup(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <FacebookLogo size={15} weight="fill" className="text-blue-500" />
          Pages Facebook de destination ({selectedPageIds.length}/{pages.length})
        </label>
        <div className="flex items-center gap-2">
          {pages.length > 1 && (
            <button
              type="button"
              onClick={selectedPageIds.length === pages.length ? deselectAll : selectAll}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition"
            >
              {selectedPageIds.length === pages.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          )}
        </div>
      </div>

      {/* Selected badges bar */}
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer flex min-h-[42px] items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm transition hover:border-[#6366F1]"
      >
        <div className="flex flex-wrap items-center gap-1.5 overflow-hidden">
          {selectedPageIds.length === 0 ? (
            <span className="text-xs text-muted-foreground">Sélectionnez une ou plusieurs Pages...</span>
          ) : (
            pages
              .filter((p) => selectedPageIds.includes(p.page_id))
              .map((p) => (
                <span
                  key={p.page_id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#6366F1] bg-[#E0E7FF] text-[#312E81] dark:border-[#818CF8] dark:bg-[#312E81] dark:text-[#E0E7FF] px-2.5 py-1 text-xs font-semibold shadow-sm"
                >
                  <FacebookLogo size={13} weight="fill" className="text-[#4338CA] dark:text-[#818CF8]" />
                  {p.name}
                </span>
              ))
          )}
        </div>
        <CaretDown size={14} className={`text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown Card */}
      {open && (
        <div className="rounded-2xl border border-border bg-surface p-3.5 shadow-xl animate-in fade-in slide-in-from-top-2">
          {/* Page Groups bar */}
          {pageGroups.length > 0 && (
            <div className="mb-3 pb-2.5 border-b border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span className="font-semibold flex items-center gap-1">
                  <UsersThree size={14} className="text-[#4338CA] dark:text-[#818CF8]" /> Groupes de Pages :
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {pageGroups.map((g) => (
                  <div
                    key={g.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground hover:bg-surface-3 transition"
                  >
                    <button
                      type="button"
                      onClick={() => applyGroup(g)}
                      className="cursor-pointer font-medium hover:text-[#4338CA] dark:hover:text-[#818CF8]"
                    >
                      {g.name} ({g.page_ids.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGroup(g.id)}
                      className="text-muted-foreground hover:text-red-500 ml-1 font-bold"
                      title="Supprimer ce groupe"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search box */}
          <div className="relative mb-2.5">
            <MagnifyingGlass size={14} className="absolute left-3 top-3 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une Page Facebook..."
              className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-2 text-xs text-foreground outline-none focus:border-[#6366F1]"
            />
          </div>

          {/* Page list with checkboxes */}
          <div className="max-h-56 overflow-y-auto space-y-1 divide-y divide-border/40">
            {filteredPages.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Aucune Page trouvée.</p>
            ) : (
              filteredPages.map((page) => {
                const selected = selectedPageIds.includes(page.page_id);
                return (
                  <div
                    key={page.page_id}
                    onClick={() => togglePage(page.page_id)}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 hover:bg-surface-2 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-[#4338CA] dark:text-[#818CF8] shrink-0">
                        {selected ? (
                          <CheckSquare size={18} weight="fill" />
                        ) : (
                          <Square size={18} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{page.name}</p>
                        {page.category && (
                          <p className="text-[10px] text-muted-foreground truncate">{page.category}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Save current selection as a Group */}
          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
            {showNewGroup ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nom du groupe (ex: E-commerce)"
                  className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs outline-none focus:border-[#6366F1]"
                />
                <Button
                  size="sm"
                  onClick={handleCreateGroup}
                  loading={savingGroup}
                  disabled={!newGroupName.trim() || selectedPageIds.length === 0}
                >
                  Créer
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowNewGroup(false)}>
                  Annuler
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewGroup(true)}
                disabled={selectedPageIds.length === 0}
                className="text-[11px] font-semibold text-[#4338CA] dark:text-[#818CF8] hover:underline flex items-center gap-1 disabled:opacity-40"
              >
                <Plus size={12} /> Sauvegarder la sélection actuelle en Groupe
              </button>
            )}

            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
