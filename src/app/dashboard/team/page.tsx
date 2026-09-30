"use client";

import React, { useState } from "react";
import {
  UsersThree,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  Clock,
  Trash,
  DotsThreeVertical,
  Envelope,
  User,
  Crown,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "buyer";
  status: "active" | "invited";
  joinedAt: string;
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    name: "Direction Entreprise",
    email: "contact@fundoral.com",
    role: "owner",
    status: "active",
    joinedAt: "Janvier 2026",
  },
  {
    id: "tm-2",
    name: "Alexandre Dupont",
    email: "alex.marketing@gmail.com",
    role: "buyer",
    status: "active",
    joinedAt: "12 Septembre 2026",
  },
  {
    id: "tm-3",
    name: "Sarah M.",
    email: "sarah.content@fundoral.com",
    role: "editor",
    status: "active",
    joinedAt: "24 Septembre 2026",
  },
];

const AUDIT_LOGS = [
  {
    id: "log-1",
    user: "Alexandre Dupont (Media Buyer)",
    action: "A lancé la campagne de boost Meta Ads sur 'Villa Bastos' ($40, Cameroun)",
    time: "Il y a 2 heures",
  },
  {
    id: "log-2",
    user: "Sarah M. (Rédactrice IA)",
    action: "A généré et programmé 3 Reels pour la semaine prochaine",
    time: "Il y a 5 heures",
  },
  {
    id: "log-3",
    user: "Autopilot IA (Système)",
    action: "A synchronisé automatiquement 1 nouveau produit Shopify vers Facebook & WhatsApp",
    time: "Il y a 8 heures",
  },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "buyer">("editor");

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    const newMember: TeamMember = {
      id: `tm_${Date.now()}`,
      name: inviteName.trim() || inviteEmail.split("@")[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      status: "invited",
      joinedAt: "Aujourd'hui",
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setInviteName("");
    setInviteModalOpen(false);
  }

  function handleRemove(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              Collaboration &amp; Espaces
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Gestion de l&apos;Équipe &amp; Permissions
          </h1>
          <p className="text-xs text-muted-foreground">
            Gérez vos collaborateurs, rédacteurs IA et acheteurs médias (Media Buyers) avec des rôles sur mesure.
          </p>
        </div>

        <Button size="sm" onClick={() => setInviteModalOpen(true)}>
          <UserPlus size={14} className="mr-1" /> Inviter un collaborateur
        </Button>
      </div>

      {/* Members Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-heading text-base font-bold text-foreground">
            Membres actifs ({members.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            Plan Enterprise Multi-Comptes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted-foreground uppercase font-mono">
                <th className="pb-3 pr-4">Collaborateur</th>
                <th className="pb-3 pr-4">Rôle</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 pr-4">Date d&apos;arrivée</th>
                <th className="pb-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-surface-2/40 transition">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-2 font-bold text-foreground text-xs">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground flex items-center gap-1.5">
                          {member.name}
                          {member.role === "owner" && (
                            <Crown size={12} weight="fill" className="text-amber-400" />
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 pr-4">
                    <span
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase",
                        member.role === "owner"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : member.role === "buyer"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : member.role === "admin"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "bg-surface-2 text-muted-foreground"
                      )}
                    >
                      {member.role === "owner"
                        ? "Propriétaire"
                        : member.role === "buyer"
                        ? "Media Buyer"
                        : member.role === "admin"
                        ? "Administrateur"
                        : "Rédacteur IA"}
                    </span>
                  </td>

                  <td className="py-3.5 pr-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-semibold",
                        member.status === "active" ? "text-emerald-400" : "text-amber-400"
                      )}
                    >
                      <CheckCircle size={12} weight="fill" />
                      {member.status === "active" ? "Actif" : "Invitation envoyée"}
                    </span>
                  </td>

                  <td className="py-3.5 pr-4 font-mono text-muted-foreground text-[11px]">
                    {member.joinedAt}
                  </td>

                  <td className="py-3.5 pr-4 text-right">
                    {member.role !== "owner" && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition"
                        title="Retirer le membre"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Activity Audit Log */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-heading text-base font-bold text-foreground">
              Journal d&apos;Audit des Actions Récentes
            </h2>
            <p className="text-xs text-muted-foreground">
              Traçabilité des publications, modifications et campagnes lancées
            </p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">Temps réel</span>
        </div>

        <div className="space-y-3">
          {AUDIT_LOGS.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between rounded-xl bg-surface-2/40 p-3 text-xs border border-border/40"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-foreground block">{log.user}</span>
                <p className="text-muted-foreground leading-relaxed">{log.action}</p>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground shrink-0 ml-4">
                {log.time}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-sm font-bold text-foreground">
                Inviter un collaborateur
              </h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1">Nom complet :</label>
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ex: Sophie Martin"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Adresse email professionnelle :</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sophie@agence.com"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Rôle et permissions :</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-500"
                >
                  <option value="editor">Rédacteur IA (Création &amp; Planification)</option>
                  <option value="buyer">Media Buyer (Gestionnaire Meta Ads &amp; Boosts)</option>
                  <option value="admin">Administrateur (Accès complet aux réglages)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="secondary" size="sm" onClick={() => setInviteModalOpen(false)}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleInvite} disabled={!inviteEmail.trim()}>
                Envoyer l&apos;invitation ➔
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
