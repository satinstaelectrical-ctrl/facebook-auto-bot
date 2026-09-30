"use client";

import React, { useState, useEffect } from "react";
import {
  UsersThree,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  Clock,
  Trash,
  Crown,
  Envelope,
  User,
  WarningCircle,
  ArrowsClockwise,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "buyer";
  status: "active" | "invited";
  joinedAt: string;
  isPrimaryOwner?: boolean;
}

export interface RealAuditLog {
  id: string;
  event_type: string;
  source: string;
  title: string | null;
  status: string;
  details?: string | null;
  created_at: string;
}

export default function TeamPage() {
  const toast = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<RealAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "buyer">("editor");
  const [inviting, setInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadTeamData();
  }, []);

  async function loadTeamData() {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setAuditLogs(data.logs || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.show("Veuillez saisir une adresse email valide.", "error");
      return;
    }

    setInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.show(data.error || "Impossible d'envoyer l'invitation.", "error");
        return;
      }

      setMembers(data.members || []);
      toast.show(`Invitation envoyée à ${inviteEmail}`, "success");
      setInviteEmail("");
      setInviteName("");
      setInviteModalOpen(false);
      loadTeamData();
    } catch {
      toast.show("Erreur réseau lors de l'envoi de l'invitation.", "error");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(member: TeamMember) {
    if (member.isPrimaryOwner || member.role === "owner") {
      toast.show("Le propriétaire principal de l'espace ne peut pas être supprimé.", "error");
      return;
    }

    if (!confirm(`Voulez-vous révoquer l'accès de ${member.name || member.email} ?`)) {
      return;
    }

    setDeletingId(member.id);
    try {
      const res = await fetch(`/api/team/members?id=${encodeURIComponent(member.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.show(data.error || "Impossible de révoquer ce membre.", "error");
        return;
      }

      setMembers(data.members || []);
      toast.show("Accès révoqué avec succès.", "success");
      loadTeamData();
    } catch {
      toast.show("Erreur réseau lors de la suppression.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const roleLabels: Record<string, { label: string; color: string }> = {
    owner: { label: "PROPRIÉTAIRE", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    admin: { label: "ADMINISTRATEUR", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    editor: { label: "RÉDACTEUR IA", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    buyer: { label: "MEDIA BUYER", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              Collaboration &amp; Espaces
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Gestion de l&apos;Équipe &amp; Permissions
          </h1>
          <p className="text-xs text-muted-foreground">
            Gérez vos collaborateurs, rédacteurs IA et acheteurs médias (Media Buyers) avec des rôles et autorisations stricts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setInviteModalOpen(true)}>
            <UserPlus size={14} className="mr-1.5" /> Inviter un collaborateur
          </Button>
        </div>
      </div>

      {/* Members Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-heading text-base font-bold text-foreground">
            Membres de l&apos;organisation ({members.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            Gestion des accès sécurisée
          </span>
        </div>

        {loading ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            Chargement des collaborateurs…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[11px] text-muted-foreground uppercase font-mono">
                  <th className="pb-3 pr-4 font-semibold">Collaborateur</th>
                  <th className="pb-3 pr-4 font-semibold">Rôle</th>
                  <th className="pb-3 pr-4 font-semibold">Statut</th>
                  <th className="pb-3 pr-4 font-semibold">Date d&apos;arrivée</th>
                  <th className="pb-3 pr-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {members.map((m) => {
                  const roleBadge = roleLabels[m.role] || roleLabels.editor;
                  const isOwner = m.role === "owner" || m.isPrimaryOwner;

                  return (
                    <tr key={m.id} className="hover:bg-surface-2/40 transition">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-bold text-foreground text-xs uppercase border border-border">
                            {m.name ? m.name.charAt(0) : m.email.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                              {m.name}
                              {isOwner && <Crown size={12} weight="fill" className="text-amber-500" />}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{m.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider",
                            roleBadge.color
                          )}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4">
                        {m.status === "active" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-500 text-[11px]">
                            <CheckCircle size={12} weight="fill" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-500 text-[11px]">
                            <Clock size={12} weight="bold" /> En attente
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 pr-4 text-muted-foreground text-[11px]">
                        {m.joinedAt}
                      </td>

                      <td className="py-3.5 pr-4 text-right">
                        {isOwner ? (
                          <span className="text-[11px] text-muted-foreground italic">
                            Propriétaire protégé
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemove(m)}
                            disabled={deletingId === m.id}
                            title="Révoquer l'accès de ce collaborateur"
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition cursor-pointer"
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Real Audit Trail */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Journal d&apos;Audit des Actions Récentes
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Traçabilité vérifiée des publications, modifications de règles et invitations d&apos;équipe.
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Temps réel</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Clock size={24} className="mx-auto text-muted-foreground/60" />
            <p className="text-xs font-medium text-foreground">Aucune action enregistrée pour le moment</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Les publications automatisées, les synchronisations de flux et les modifications d&apos;équipe apparaîtront ici avec horodatage certifié.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {log.source || "Système"}
                    </span>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                      {log.event_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate">
                    {log.title || log.details || "Événement de synchronisation"}
                  </p>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setInviteModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">
              Inviter un collaborateur
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Envoyez une invitation par email avec des privilèges adaptés à son profil.
            </p>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Nom ou pseudonyme (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex : Marie Dupont"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Adresse email professionnelle *
                </label>
                <input
                  type="email"
                  required
                  placeholder="collaborateur@entreprise.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Rôle &amp; Permissions
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="editor">Rédacteur IA (Création, édition de posts, aperçus)</option>
                  <option value="buyer">Media Buyer (Gestion des campagnes Meta Ads et budgets)</option>
                  <option value="admin">Administrateur (Configuration complète, connexions réseaux)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setInviteModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={inviting}>
                  {inviting ? "Envoi…" : "Envoyer l'invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
