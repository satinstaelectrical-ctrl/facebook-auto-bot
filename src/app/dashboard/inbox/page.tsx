"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChatsCircle,
  PaperPlaneTilt,
  Sparkle,
  FacebookLogo,
  WhatsappLogo,
  User,
  CheckCircle,
  Clock,
  ArrowsClockwise,
  MagnifyingGlass,
  ArrowLeft,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export interface Message {
  id: string;
  sender: "customer" | "ai" | "agent";
  text: string;
  time: string;
  delivered?: boolean;
}

export interface Conversation {
  id: string;
  customerName: string;
  phone?: string;
  email?: string;
  channel: "whatsapp" | "facebook";
  lastMessage: string;
  time: string;
  unread: boolean;
  leadStatus: "hot" | "warm" | "info";
  interestedProduct?: string;
  messages: Message[];
}

export default function AIInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const activeConv = conversations.find((c) => c.id === selectedId) || null;

  // Factual, safe reply suggestions (never hallucinating prices or inventory)
  const safeSuggestedReplies: string[] = [
    "Bonjour 👋 Merci pour votre intérêt ! Je consulte les détails et reviens vers vous immédiatement.",
    "Bonjour ! Pourriez-vous nous préciser vos disponibilités ou le lieu souhaité afin de vous renseigner précisément ?",
    "Bonjour 👋 Souhaitez-vous échanger directement par appel téléphonique ou recevoir la documentation complète ?",
  ];

  function handleSend(textToSend?: string) {
    const text = textToSend || inputText;
    if (!text.trim() || !activeConv) return;

    const newMsg: Message = {
      id: `m_${Date.now()}`,
      sender: "agent",
      text: text.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      delivered: true,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
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

  const filteredConversations = conversations.filter((c) =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              Messages &amp; CRM Prospects
            </span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Messagerie Unifiée &amp; Prospects
          </h1>
          <p className="text-xs text-muted-foreground">
            Centralisez vos échanges prospects issus de vos Pages Facebook et WhatsApp Business avec assistance IA sécurisée et reprise manuelle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/connections">
            <Button size="sm" variant="secondary">
              Vérifier les comptes de messagerie
            </Button>
          </Link>
        </div>
      </div>

      {conversations.length === 0 ? (
        /* Truthful Empty State */
        <Card className="py-16 text-center space-y-4 max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ChatsCircle size={28} weight="fill" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading text-base font-bold text-foreground">
              Aucune conversation pour le moment
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Vos messages entrants Facebook Messenger et WhatsApp Business apparaîtront automatiquement ici dès qu&apos;un prospect interagit avec vos publications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left p-4 rounded-2xl border border-border bg-surface-2/60 text-xs">
            <div className="flex items-start gap-2.5">
              <FacebookLogo size={20} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Facebook Messenger</p>
                <p className="text-[11px] text-muted-foreground">
                  Connecté via l&apos;API Pages Facebook autorisée.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <WhatsappLogo size={20} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">WhatsApp Business</p>
                <p className="text-[11px] text-muted-foreground">
                  Connecté via Meta Cloud API ou passerelle officielle.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-2">
            <Link href="/dashboard/connections">
              <Button size="sm">Configurer mes comptes de messagerie</Button>
            </Link>
            <Link href="/dashboard/studio">
              <Button size="sm" variant="secondary">Diffuser une annonce</Button>
            </Link>
          </div>
        </Card>
      ) : (
        /* Conversation layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
          {/* List panel */}
          <Card
            className={cn(
              "lg:col-span-4 p-0 overflow-hidden flex flex-col",
              mobileShowChat ? "hidden lg:flex" : "flex"
            )}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un prospect…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedId(conv.id);
                      setMobileShowChat(true);
                    }}
                    className={cn(
                      "p-3.5 transition cursor-pointer hover:bg-surface-2/60",
                      isSelected ? "bg-surface-2 border-l-2 border-primary" : ""
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {conv.channel === "whatsapp" ? (
                          <WhatsappLogo size={15} weight="fill" className="text-emerald-500" />
                        ) : (
                          <FacebookLogo size={15} weight="fill" className="text-blue-500" />
                        )}
                        <span className="font-semibold text-xs text-foreground truncate max-w-[130px]">
                          {conv.customerName}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{conv.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Conversation view panel */}
          <Card
            className={cn(
              "lg:col-span-8 p-0 flex flex-col",
              !mobileShowChat ? "hidden lg:flex" : "flex"
            )}
          >
            {activeConv ? (
              <>
                {/* Chat header */}
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMobileShowChat(false)}
                      className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-surface-2"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        {activeConv.customerName}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {activeConv.phone || activeConv.email}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Canal : {activeConv.channel === "whatsapp" ? "WhatsApp Business" : "Facebook Messenger"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                      className={cn(
                        "rounded-xl px-2.5 py-1 text-[11px] font-semibold border transition",
                        autoReplyEnabled
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-surface-2 text-muted-foreground border-border"
                      )}
                    >
                      {autoReplyEnabled ? "Assistant IA activé" : "Reprise humaine (Manuel)"}
                    </button>
                  </div>
                </div>

                {/* Messages stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {activeConv.messages.map((m) => {
                    const isMe = m.sender === "agent" || m.sender === "ai";
                    return (
                      <div
                        key={m.id}
                        className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl p-3 text-xs",
                            isMe
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-surface-2 text-foreground rounded-bl-none border border-border"
                          )}
                        >
                          <p className="leading-relaxed">{m.text}</p>
                          <div
                            className={cn(
                              "mt-1 text-[9px] flex items-center justify-end gap-1 font-mono",
                              isMe ? "text-white/70" : "text-muted-foreground"
                            )}
                          >
                            <span>{m.time}</span>
                            {m.delivered && <CheckCircle size={10} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Suggested safe replies */}
                <div className="p-2 border-t border-border bg-surface-2/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  <span className="text-[10px] font-semibold text-muted-foreground shrink-0 px-1">
                    Réponses sûres :
                  </span>
                  {safeSuggestedReplies.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(r)}
                      className="rounded-lg bg-surface border border-border px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-primary/40 truncate max-w-xs transition shrink-0"
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Input area */}
                <div className="p-3 border-t border-border flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Écrire une réponse au prospect…"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                    className="flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  <Button size="sm" onClick={() => handleSend()}>
                    <PaperPlaneTilt size={14} className="mr-1" /> Envoyer
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-xs text-muted-foreground">
                Sélectionnez une conversation pour afficher l&apos;historique.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
