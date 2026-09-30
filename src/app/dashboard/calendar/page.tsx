"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarBlank,
  Clock,
  CheckCircle,
  Plus,
  Sparkle,
  FacebookLogo,
  WhatsappLogo,
  InstagramLogo,
  FilmStrip,
  ArrowRight,
  Funnel,
  Check,
  Eye,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { Post } from "@/lib/types";

interface ScheduledItem {
  id: string;
  dayIndex: number; // 0 = Mon, 6 = Sun
  time: string;
  title: string;
  channel: "facebook" | "whatsapp" | "instagram";
  format: "feed" | "reel" | "story";
  status: "published" | "scheduled" | "needs_approval";
  engagementPreview?: string;
}

const SAMPLE_SCHEDULE: ScheduledItem[] = [
  {
    id: "sc-1",
    dayIndex: 0, // Lundi
    time: "09:00",
    title: "Article Immobilier : Top 5 des quartiers en plein essor",
    channel: "facebook",
    format: "feed",
    status: "published",
    engagementPreview: "1.8K vues · 142 likes",
  },
  {
    id: "sc-2",
    dayIndex: 0,
    time: "18:30",
    title: "Alerte WhatsApp VIP : Villa Bastos avec piscine",
    channel: "whatsapp",
    format: "feed",
    status: "published",
    engagementPreview: "48 clics directs",
  },
  {
    id: "sc-3",
    dayIndex: 1, // Mardi
    time: "12:15",
    title: "Reel 9:16 : Visite guidée penthouse vue panoramique",
    channel: "instagram",
    format: "reel",
    status: "scheduled",
  },
  {
    id: "sc-4",
    dayIndex: 2, // Mercredi
    time: "09:30",
    title: "Produit E-commerce : Nouvelle collection été en promotion",
    channel: "facebook",
    format: "feed",
    status: "scheduled",
  },
  {
    id: "sc-5",
    dayIndex: 2,
    time: "19:00",
    title: "Flash Promo WhatsApp : Code promo exclusif -25%",
    channel: "whatsapp",
    format: "feed",
    status: "needs_approval",
  },
  {
    id: "sc-6",
    dayIndex: 3, // Jeudi
    time: "14:00",
    title: "Reel TikTok/Insta : 3 erreurs à éviter lors de l'achat d'un terrain",
    channel: "instagram",
    format: "reel",
    status: "scheduled",
  },
  {
    id: "sc-7",
    dayIndex: 4, // Vendredi
    time: "17:00",
    title: "Post Recrutement & Partenariats B2B",
    channel: "facebook",
    format: "feed",
    status: "needs_approval",
  },
  {
    id: "sc-8",
    dayIndex: 5, // Samedi
    time: "11:00",
    title: "Week-end Vente Flash : Meilleurs deals vérifiés",
    channel: "whatsapp",
    format: "feed",
    status: "scheduled",
  },
];

const DAYS_OF_WEEK = [
  { name: "Lundi", short: "Lun" },
  { name: "Mardi", short: "Mar" },
  { name: "Mercredi", short: "Mer" },
  { name: "Jeudi", short: "Jeu" },
  { name: "Vendredi", short: "Ven" },
  { name: "Samedi", short: "Sam" },
  { name: "Dimanche", short: "Dim" },
];

export default function ContentCalendarPage() {
  const [schedule, setSchedule] = useState<ScheduledItem[]>(SAMPLE_SCHEDULE);
  const [filterChannel, setFilterChannel] = useState<"all" | "facebook" | "whatsapp" | "instagram">("all");
  const [selectedItem, setSelectedItem] = useState<ScheduledItem | null>(null);

  const filteredSchedule = schedule.filter(
    (item) => filterChannel === "all" || item.channel === filterChannel
  );

  function handleApprove(id: string) {
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "scheduled" } : item))
    );
    if (selectedItem?.id === id) {
      setSelectedItem({ ...selectedItem, status: "scheduled" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              Planification Multicanale
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Calendrier de Publication IA
          </h1>
          <p className="text-xs text-muted-foreground">
            Visualisez et validez les publications programmées par votre assistant IA sur Facebook, Instagram et WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Channel Filters */}
          <div className="flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-border">
            <button
              onClick={() => setFilterChannel("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                filterChannel === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterChannel("facebook")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                filterChannel === "facebook"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Facebook
            </button>
            <button
              onClick={() => setFilterChannel("whatsapp")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                filterChannel === "whatsapp"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setFilterChannel("instagram")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                filterChannel === "instagram"
                  ? "bg-pink-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Instagram
            </button>
          </div>

          <Link href="/dashboard/studio">
            <Button size="sm">
              <Plus size={14} className="mr-1" /> Programmer avec l&apos;IA
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Publié avec succès</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span>Programmé en autopilote</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Validation humaine requise</span>
        </span>
      </div>

      {/* 7-Day Responsive Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {DAYS_OF_WEEK.map((day, idx) => {
          const dayItems = filteredSchedule.filter((item) => item.dayIndex === idx);
          const isToday = idx === 0;

          return (
            <div
              key={day.name}
              className={cn(
                "rounded-2xl border p-3 flex flex-col min-h-[380px] transition",
                isToday
                  ? "border-indigo-500/40 bg-indigo-500/[0.04] ring-1 ring-indigo-500/20"
                  : "border-border bg-surface-2/30"
              )}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                <span className="text-xs font-bold text-foreground">
                  {day.name}
                </span>
                {isToday && (
                  <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 font-mono">
                    Aujourd&apos;hui
                  </span>
                )}
              </div>

              {/* Day Scheduled Items */}
              <div className="space-y-2 flex-1">
                {dayItems.length > 0 ? (
                  dayItems.map((item) => {
                    const isFb = item.channel === "facebook";
                    const isWa = item.channel === "whatsapp";
                    const isInsta = item.channel === "instagram";

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={cn(
                          "rounded-xl border p-2.5 text-xs cursor-pointer transition space-y-1.5 shadow-sm group",
                          item.status === "published"
                            ? "border-emerald-500/30 bg-emerald-500/[0.06] hover:border-emerald-500"
                            : item.status === "needs_approval"
                            ? "border-amber-500/40 bg-amber-500/[0.08] hover:border-amber-500"
                            : "border-border bg-surface hover:border-indigo-500/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground font-semibold">
                            <Clock size={11} /> {item.time}
                          </span>

                          <div className="flex items-center gap-1">
                            {isFb && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
                                <FacebookLogo size={12} weight="fill" />
                              </span>
                            )}
                            {isWa && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                                <WhatsappLogo size={12} weight="fill" />
                              </span>
                            )}
                            {isInsta && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-pink-500/10 text-pink-400">
                                <FilmStrip size={12} weight="fill" />
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-indigo-400 transition text-[11px]">
                          {item.title}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px]">
                          <span
                            className={cn(
                              "font-bold",
                              item.status === "published"
                                ? "text-emerald-400"
                                : item.status === "needs_approval"
                                ? "text-amber-400"
                                : "text-indigo-400"
                            )}
                          >
                            {item.status === "published"
                              ? "● Publié"
                              : item.status === "needs_approval"
                              ? "⚠ À valider"
                              : "○ Programmé"}
                          </span>

                          {item.format === "reel" && (
                            <span className="rounded bg-purple-500/20 px-1 py-0.2 text-[9px] font-mono text-purple-300 font-bold">
                              Reel 9:16
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-center p-4 text-[11px] text-muted-foreground/60 border border-dashed rounded-xl">
                    Aucun post
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Item Modal / Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                  Détail de la publication
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    selectedItem.status === "published"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : selectedItem.status === "needs_approval"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-indigo-500/10 text-indigo-400"
                  )}
                >
                  {selectedItem.status === "published"
                    ? "Publié"
                    : selectedItem.status === "needs_approval"
                    ? "Validation requise"
                    : "Programmé"}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="font-heading text-sm font-bold text-foreground">
                {selectedItem.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-surface-2 p-2.5">
                  <span className="text-muted-foreground block">Canal de diffusion :</span>
                  <span className="font-bold text-foreground capitalize mt-0.5 block">
                    {selectedItem.channel}
                  </span>
                </div>
                <div className="rounded-xl bg-surface-2 p-2.5">
                  <span className="text-muted-foreground block">Format :</span>
                  <span className="font-bold text-foreground uppercase mt-0.5 block">
                    {selectedItem.format}
                  </span>
                </div>
              </div>

              {selectedItem.engagementPreview && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300">
                  <span className="font-bold block">Performances enregistrées :</span>
                  <p className="mt-0.5">{selectedItem.engagementPreview}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="secondary" size="sm" onClick={() => setSelectedItem(null)}>
                Fermer
              </Button>
              {selectedItem.status === "needs_approval" && (
                <Button size="sm" onClick={() => handleApprove(selectedItem.id)}>
                  <Check size={14} className="mr-1" /> Valider &amp; Programmer
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
