"use client";

import React, { useState } from "react";
import {
  ChatsCircle,
  PaperPlaneTilt,
  Sparkle,
  FacebookLogo,
  WhatsappLogo,
  InstagramLogo,
  Phone,
  Envelope,
  User,
  Tag,
  CheckCircle,
  Clock,
  ArrowsClockwise,
  MagnifyingGlass,
  Check,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

interface Message {
  id: string;
  sender: "customer" | "ai" | "agent";
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  customerName: string;
  phone?: string;
  email?: string;
  channel: "whatsapp" | "facebook" | "instagram";
  lastMessage: string;
  time: string;
  unread: boolean;
  leadStatus: "hot" | "warm" | "info";
  interestedProduct?: string;
  messages: Message[];
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    customerName: "Jean-Paul M.",
    phone: "+237 699 12 34 56",
    email: "jp.m@gmail.com",
    channel: "whatsapp",
    lastMessage: "Bonjour, quel est le prix exact avec la livraison à Douala ?",
    time: "10:42",
    unread: true,
    leadStatus: "hot",
    interestedProduct: "Villa Bastos / Produit Premium",
    messages: [
      {
        id: "m1",
        sender: "customer",
        text: "Bonjour ! J'ai vu votre publication sur Facebook, est-ce toujours disponible ?",
        time: "10:40",
      },
      {
        id: "m2",
        sender: "ai",
        text: "Bonjour Jean-Paul 👋 Oui, cet article est disponible en stock immédiat ! Souhaitez-vous le réserver ou obtenir un devis de livraison ?",
        time: "10:41",
      },
      {
        id: "m3",
        sender: "customer",
        text: "Bonjour, quel est le prix exact avec la livraison à Douala ?",
        time: "10:42",
      },
    ],
  },
  {
    id: "conv-2",
    customerName: "Sarah K.",
    email: "sarah.k@yahoo.fr",
    channel: "facebook",
    lastMessage: "Merci pour les précisions, je valide ma commande ce soir !",
    time: "09:15",
    unread: false,
    leadStatus: "hot",
    interestedProduct: "Pack E-commerce Promotionnel",
    messages: [
      {
        id: "m21",
        sender: "customer",
        text: "Bonjour, comment fonctionne la garantie ?",
        time: "09:10",
      },
      {
        id: "m22",
        sender: "ai",
        text: "Bonjour Sarah ! Vous bénéficiez d'une garantie satisfait ou remboursé de 14 jours ainsi que d'un service client prioritaire 7j/7.",
        time: "09:12",
      },
      {
        id: "m23",
        sender: "customer",
        text: "Merci pour les précisions, je valide ma commande ce soir !",
        time: "09:15",
      },
    ],
  },
  {
    id: "conv-3",
    customerName: "Cabinet Conseil Pro",
    phone: "+33 6 12 34 56 78",
    channel: "instagram",
    lastMessage: "Avez-vous des disponibilités pour une démonstration cette semaine ?",
    time: "Hier",
    unread: false,
    leadStatus: "warm",
    interestedProduct: "Abonnement Agence B2B",
    messages: [
      {
        id: "m31",
        sender: "customer",
        text: "Avez-vous des disponibilités pour une démonstration cette semaine ?",
        time: "Hier 16:30",
      },
    ],
  },
];

export default function AIInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string>("conv-1");
  const [inputText, setInputText] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [generatingReply, setGeneratingReply] = useState(false);

  const activeConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  const suggestedReplies: string[] = [
    "Bonjour 👋 Le tarif est de 49€ tout compris avec livraison en 24h à Douala. Voulez-vous recevoir le lien de commande sécurisé ?",
    "Bonjour ! Oui, nous avons une équipe sur place à Douala. Quel quartier vous conviendrait le mieux pour la livraison ?",
    "Bonjour 👋 Souhaitez-vous échanger directement par appel téléphonique ou recevoir la fiche technique PDF ?",
  ];

  function handleSend(textToSend?: string) {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      sender: "agent",
      text: text.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              lastMessage: text.trim(),
              messages: [...c.messages, newMsg],
              unread: false,
            }
          : c
      )
    );

    setInputText("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              Social CRM &amp; Smart Reply
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Inbox AI &amp; Capture de Prospects
          </h1>
          <p className="text-xs text-muted-foreground">
            Boîte de réception unifiée Facebook Messenger, WhatsApp et Instagram avec réponses automatiques intelligentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold border transition",
              autoReplyEnabled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-border bg-surface-2 text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                autoReplyEnabled ? "bg-emerald-400 animate-ping" : "bg-zinc-500"
              )}
            />
            <span>Smart Reply IA : {autoReplyEnabled ? "Actif 24/7" : "Désactivé"}</span>
          </button>
        </div>
      </div>

      {/* 3-Column Inbox Interface */}
      <div className="grid gap-4 lg:grid-cols-12 rounded-3xl border border-border bg-surface overflow-hidden min-h-[620px]">
        {/* Left Column: Conversation List (4 cols) */}
        <div className="border-r border-border p-4 space-y-3 lg:col-span-4 flex flex-col">
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-3 top-3 text-muted-foreground" />
            <input
              placeholder="Rechercher un prospect..."
              className="w-full rounded-xl border border-border bg-surface-2 pl-8 pr-3 py-2 text-xs outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {conversations.map((c) => {
              const isSelected = c.id === selectedId;
              const isWa = c.channel === "whatsapp";
              const isFb = c.channel === "facebook";

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "rounded-2xl p-3 cursor-pointer transition text-xs space-y-1.5 border",
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/[0.08] shadow-sm"
                      : "border-transparent hover:bg-surface-2"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isWa ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                          <WhatsappLogo size={13} weight="fill" />
                        </span>
                      ) : isFb ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
                          <FacebookLogo size={13} weight="fill" />
                        </span>
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-pink-500/10 text-pink-400">
                          <InstagramLogo size={13} weight="fill" />
                        </span>
                      )}
                      <span className="font-bold text-foreground">{c.customerName}</span>
                    </div>

                    <span className="text-[10px] text-muted-foreground font-mono">{c.time}</span>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                    {c.lastMessage}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                        c.leadStatus === "hot"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      )}
                    >
                      {c.leadStatus === "hot" ? "🔥 Lead Chaud" : "💬 Information"}
                    </span>
                    {c.unread && (
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Chat Stream & Smart Reply (5 cols) */}
        <div className="p-4 flex flex-col justify-between lg:col-span-5 border-r border-border">
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-foreground font-bold text-xs">
                {activeConv.customerName.charAt(0)}
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">{activeConv.customerName}</h3>
                <span className="text-[10px] text-emerald-400 font-medium">● En ligne</span>
              </div>
            </div>

            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
              {activeConv.channel}
            </span>
          </div>

          {/* Messages Stream */}
          <div className="py-4 space-y-3 flex-1 overflow-y-auto">
            {activeConv.messages.map((m) => {
              const isCust = m.sender === "customer";
              const isAi = m.sender === "ai";

              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col max-w-[85%] space-y-1 text-xs",
                    isCust ? "mr-auto items-start" : "ml-auto items-end"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl p-3 leading-relaxed",
                      isCust
                        ? "bg-surface-2 text-foreground rounded-tl-sm border border-border"
                        : isAi
                        ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-200 rounded-tr-sm"
                        : "bg-primary text-white rounded-tr-sm shadow-sm"
                    )}
                  >
                    {isAi && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 mb-1">
                        <Sparkle size={10} weight="fill" /> Réponse Auto IA :
                      </span>
                    )}
                    <p>{m.text}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono px-1">
                    {m.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Smart Reply Suggestions */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                <Sparkle size={13} weight="fill" /> Suggestions Smart Reply IA :
              </span>
            </div>

            <div className="space-y-1">
              {suggestedReplies.slice(0, 2).map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="w-full text-left rounded-xl bg-surface-2/60 hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-border p-2 text-[11px] text-muted-foreground hover:text-foreground transition truncate"
                >
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 pt-1">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Rédiger une réponse ou utiliser l'IA..."
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-indigo-500"
              />
              <Button size="sm" onClick={() => handleSend()} disabled={!inputText.trim()}>
                <PaperPlaneTilt size={14} />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: CRM Prospect Profile (3 cols) */}
        <div className="p-4 space-y-4 lg:col-span-3 bg-surface-2/30 text-xs">
          <div className="pb-3 border-b border-border">
            <h3 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
              Fiche Prospect CRM
            </h3>
            <p className="text-[10px] text-muted-foreground">Capture automatique via les publicités</p>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-muted-foreground block">Nom &amp; Identité :</span>
              <p className="font-bold text-foreground text-sm mt-0.5">{activeConv.customerName}</p>
            </div>

            {activeConv.phone && (
              <div>
                <span className="text-[10px] text-muted-foreground block">Numéro WhatsApp :</span>
                <p className="font-mono text-foreground font-semibold flex items-center gap-1 mt-0.5">
                  <Phone size={12} className="text-emerald-400" />
                  {activeConv.phone}
                </p>
              </div>
            )}

            {activeConv.email && (
              <div>
                <span className="text-[10px] text-muted-foreground block">Email :</span>
                <p className="font-mono text-foreground font-semibold flex items-center gap-1 mt-0.5">
                  <Envelope size={12} className="text-indigo-400" />
                  {activeConv.email}
                </p>
              </div>
            )}

            <div>
              <span className="text-[10px] text-muted-foreground block">Intention d&apos;Achat :</span>
              <span className="inline-block mt-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 font-bold text-[10px]">
                {activeConv.interestedProduct || "Demande d'information générale"}
              </span>
            </div>

            <div className="pt-3 border-t border-border">
              <span className="text-[10px] text-muted-foreground block">Statut du Lead :</span>
              <div className="mt-1 flex gap-1">
                <span className="rounded bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold">
                  🔥 Lead Chaud
                </span>
                <span className="rounded bg-surface-2 text-muted-foreground px-2 py-0.5 text-[10px]">
                  À relancer
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
