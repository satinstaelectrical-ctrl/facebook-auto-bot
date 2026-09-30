"use client";

import { useState } from "react";
import {
  ThumbsUp,
  ChatCircle,
  ShareFat,
  Heart,
  PaperPlaneRight,
  MusicNotes,
  DotsThree,
  CaretLeft,
  CaretRight,
  DeviceMobile,
  Desktop,
  FilmStrip,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import type { PostFormat, PageCache } from "@/lib/types";

interface PostPreviewSwitcherProps {
  format: PostFormat;
  title: string;
  description: string;
  hashtags: string[];
  linkUrl?: string;
  images: Array<{ url: string }>;
  activeImageIndex: number;
  setActiveImageIndex: (idx: number) => void;
  videoUrl?: string | null;
  selectedPage?: PageCache | null;
}

export function PostPreviewSwitcher({
  format,
  title,
  description,
  hashtags,
  linkUrl,
  images,
  activeImageIndex,
  setActiveImageIndex,
  videoUrl,
  selectedPage,
}: PostPreviewSwitcherProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [reelLiked, setReelLiked] = useState(false);
  const [reelLikesCount, setReelLikesCount] = useState(2450);

  const pageName = selectedPage?.name || "Page Facebook";
  const avatarUrl =
    selectedPage?.avatar_url ||
    (selectedPage?.page_id
      ? `https://graph.facebook.com/${selectedPage.page_id}/picture?type=large`
      : null);

  const formattedHashtags = hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");

  // 1. REEL MOBILE PREVIEW (9:16)
  if (format === "reel") {
    return (
      <div className="flex flex-col items-center">
        <div className="relative mx-auto h-[580px] w-[326px] overflow-hidden rounded-[40px] border-[6px] border-zinc-800 bg-black shadow-2xl shadow-black/80">
          {/* Top Speaker / Camera Notch */}
          <div className="absolute top-2 left-1/2 z-30 h-4 w-28 -translate-x-1/2 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-zinc-800" />
          </div>

          {/* Background Media (Video or Image) */}
          <div className="relative h-full w-full">
            {videoUrl ? (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[0].url}
                alt="Reel visual"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-600 text-xs">
                Aucun média vertical
              </div>
            )}

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

            {/* Top Bar */}
            <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between text-white">
              <span className="font-heading text-xs font-bold tracking-wider uppercase drop-shadow">
                Reels
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">
                  EN DIRECT
                </span>
              </div>
            </div>

            {/* Right Action Icons (Like, Comment, Share, Music) */}
            <div className="absolute bottom-16 right-3 z-20 flex flex-col items-center gap-4 text-white">
              <button
                type="button"
                onClick={() => {
                  setReelLiked(!reelLiked);
                  setReelLikesCount((prev) => (reelLiked ? prev - 1 : prev + 1));
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition group-active:scale-90 ${
                    reelLiked ? "text-red-500" : "text-white"
                  }`}
                >
                  <Heart size={22} weight={reelLiked ? "fill" : "bold"} />
                </div>
                <span className="text-[11px] font-bold drop-shadow">{reelLikesCount}</span>
              </button>

              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                  <ChatCircle size={22} weight="bold" />
                </div>
                <span className="text-[11px] font-bold drop-shadow">128</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
                  <ShareFat size={22} weight="bold" />
                </div>
                <span className="text-[11px] font-bold drop-shadow">480</span>
              </div>

              {/* Music spinning disc */}
              <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/60 bg-zinc-900 animate-spin">
                <MusicNotes size={14} className="text-white" />
              </div>
            </div>

            {/* Bottom Caption & Account Overlay */}
            <div className="absolute bottom-6 left-4 right-16 z-20 space-y-2 text-white">
              {/* Creator info */}
              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={pageName}
                    className="h-8 w-8 rounded-full border border-white/60 object-cover shadow"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                    {pageName.slice(0, 2)}
                  </div>
                )}
                <span className="font-heading text-xs font-bold drop-shadow">{pageName}</span>
                <span className="rounded-full border border-white/40 bg-white/10 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                  Suivre
                </span>
              </div>

              {/* Caption */}
              <p className="text-xs text-zinc-100 font-medium leading-relaxed drop-shadow line-clamp-2">
                <span className="font-bold text-white">{title}</span> — {description}
              </p>

              {/* Hashtags */}
              {formattedHashtags && (
                <p className="text-[11px] font-bold text-indigo-300 drop-shadow line-clamp-1">
                  {formattedHashtags}
                </p>
              )}

              {/* Audio Track bar */}
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 drop-shadow">
                <MusicNotes size={11} />
                <span className="truncate">Son d&apos;origine · {pageName}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground font-medium flex items-center gap-1">
          <FilmStrip size={13} /> Aperçu interactif Facebook Reel (Format 9:16)
        </p>
      </div>
    );
  }

  // 2. STORY PREVIEW (9:16)
  if (format === "story") {
    return (
      <div className="flex flex-col items-center">
        <div className="relative mx-auto h-[580px] w-[326px] overflow-hidden rounded-[40px] border-[6px] border-zinc-800 bg-black shadow-2xl shadow-black/80">
          {/* Top Story Progress Bars */}
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center gap-1">
            <div className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden">
              <div className="h-full w-2/3 bg-white rounded-full" />
            </div>
            <div className="h-1 flex-1 rounded-full bg-white/30" />
            <div className="h-1 flex-1 rounded-full bg-white/30" />
          </div>

          {/* Story Header */}
          <div className="absolute top-7 left-4 right-4 z-30 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={pageName}
                  className="h-8 w-8 rounded-full border border-white/60 object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                  {pageName.slice(0, 2)}
                </div>
              )}
              <div>
                <span className="font-heading text-xs font-bold drop-shadow">{pageName}</span>
                <span className="ml-2 text-[10px] text-white/70">À l&apos;instant</span>
              </div>
            </div>
            <DotsThree size={20} weight="bold" />
          </div>

          {/* Visual */}
          <div className="relative h-full w-full flex items-center justify-center bg-zinc-950">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[0].url}
                alt="Story visual"
                className="h-full w-full object-cover"
              />
            ) : (
              <p className="text-xs text-zinc-600">Aucun visuel</p>
            )}

            {/* Sticker / Story Text Card */}
            {(title || description) && (
              <div className="absolute bottom-20 left-4 right-4 z-20 rounded-2xl bg-black/60 p-3.5 backdrop-blur-md text-white border border-white/10 shadow-lg">
                <p className="text-xs font-bold text-white">{title}</p>
                <p className="text-[11px] text-zinc-200 mt-1 line-clamp-3">{description}</p>
                {formattedHashtags && (
                  <p className="text-[10px] font-bold text-indigo-400 mt-1.5">{formattedHashtags}</p>
                )}
              </div>
            )}
          </div>

          {/* Bottom Story Interaction Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-2">
            <div className="flex-1 rounded-full border border-white/30 bg-black/40 px-3.5 py-2 text-xs text-white/70 backdrop-blur-md">
              Envoyer un message…
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md"
            >
              <Heart size={18} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md"
            >
              <PaperPlaneRight size={16} />
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground font-medium">
          Aperçu Story Facebook Éphémère (Format 9:16)
        </p>
      </div>
    );
  }

  // 3. CLASSIC FEED POST PREVIEW (DESKTOP OR MOBILE)
  const isMobile = device === "mobile";

  return (
    <div className="flex flex-col items-center">
      {/* Device Toggle */}
      <div className="mb-3 flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#0c101c] p-1">
        <button
          type="button"
          onClick={() => setDevice("desktop")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            !isMobile ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Desktop size={14} /> Desktop
        </button>
        <button
          type="button"
          onClick={() => setDevice("mobile")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
            isMobile ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DeviceMobile size={14} /> Mobile
        </button>
      </div>

      {/* Facebook Post Frame */}
      <div
        className={`overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111624] text-foreground shadow-xl transition-all duration-200 ${
          isMobile ? "w-[360px]" : "w-full max-w-[520px]"
        }`}
      >
        {/* Post Header */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={pageName}
                className="h-10 w-10 rounded-full border border-white/[0.1] object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-bold text-white shadow">
                {pageName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h4 className="font-heading text-sm font-semibold text-white leading-tight">{pageName}</h4>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                À l&apos;instant · <span>🌐</span>
              </p>
            </div>
          </div>
          <DotsThree size={20} className="text-muted-foreground" />
        </div>

        {/* Text Content */}
        <div className="px-3.5 pb-3 space-y-2 text-xs leading-relaxed text-zinc-200">
          <p className="font-semibold text-white text-sm">{title}</p>
          <p className="whitespace-pre-line text-zinc-300">{description}</p>
          {linkUrl && (
            <p className="text-indigo-400 font-medium hover:underline truncate">
              {linkUrl}
            </p>
          )}
          {formattedHashtags && (
            <p className="text-indigo-400 font-semibold">{formattedHashtags}</p>
          )}
        </div>

        {/* Visual / Carousel */}
        <div className="relative aspect-[16/9] w-full bg-black/40 overflow-hidden flex items-center justify-center">
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[activeImageIndex]?.url || images[0].url}
              alt="Post preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <p className="text-xs text-muted-foreground">Aucune image sélectionnée</p>
          )}

          {/* Carousel Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((activeImageIndex - 1 + images.length) % images.length)
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
              >
                <CaretLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setActiveImageIndex((activeImageIndex + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80 transition"
              >
                <CaretRight size={16} />
              </button>
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                {activeImageIndex + 1}/{images.length} photos
              </span>
            </>
          )}
        </div>

        {/* Reactions Counter */}
        <div className="flex items-center justify-between px-3.5 py-2 text-[11px] text-muted-foreground border-b border-white/[0.06]">
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[9px]">
              👍
            </span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] -ml-2">
              ❤️
            </span>
            <span className="ml-1 font-semibold text-zinc-300">142</span>
          </span>
          <div className="flex items-center gap-3">
            <span>18 commentaires</span>
            <span>7 partages</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 divide-x divide-white/[0.04] p-1 text-xs font-semibold text-zinc-400">
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-white/[0.04] hover:text-white transition rounded-lg">
            <ThumbsUp size={15} /> J&apos;aime
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-white/[0.04] hover:text-white transition rounded-lg">
            <ChatCircle size={15} /> Commenter
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-white/[0.04] hover:text-white transition rounded-lg">
            <ShareFat size={15} /> Partager
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground font-medium">
        Aperçu interactif Publication Feed Facebook
      </p>
    </div>
  );
}
