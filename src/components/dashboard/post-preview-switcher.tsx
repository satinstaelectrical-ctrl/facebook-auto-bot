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
  SpeakerHigh,
  SpeakerSlash,
  Play,
  Pause,
} from "@phosphor-icons/react/dist/ssr";
import type { PostFormat, PageCache, ReelMusicTrack } from "@/lib/types";

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
  selectedMusic?: ReelMusicTrack | null;
  onOpenMusicPicker?: () => void;
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
  selectedMusic,
  onOpenMusicPicker,
}: PostPreviewSwitcherProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [reelLiked, setReelLiked] = useState(false);
  const [reelLikesCount, setReelLikesCount] = useState(2450);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

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
          <div className="relative h-full w-full group">
            {videoUrl ? (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="h-full w-full object-cover cursor-pointer"
                onClick={(e) => {
                  const v = e.currentTarget;
                  if (v.paused) {
                    v.play();
                    setIsPlaying(true);
                  } else {
                    v.pause();
                    setIsPlaying(false);
                  }
                }}
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

            {/* Top Bar with Reels Header & Audio / Mute Controls */}
            <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between text-white">
              <span className="font-heading text-xs font-bold tracking-wider uppercase drop-shadow flex items-center gap-1.5">
                <FilmStrip size={14} className="text-red-400" /> Reels
              </span>
              <div className="flex items-center gap-2">
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition"
                    title={isMuted ? "Activer le son" : "Couper le son"}
                  >
                    {isMuted ? <SpeakerSlash size={14} /> : <SpeakerHigh size={14} />}
                  </button>
                )}
                <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded shadow">
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
              <button
                type="button"
                onClick={onOpenMusicPicker}
                className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/60 bg-zinc-900 animate-spin overflow-hidden shadow-lg cursor-pointer hover:scale-110 transition"
                title="Changer la musique du Reel"
              >
                {selectedMusic?.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedMusic.coverUrl} alt="Music cover" className="h-full w-full object-cover" />
                ) : (
                  <MusicNotes size={15} className="text-white" />
                )}
              </button>
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
              <div
                onClick={onOpenMusicPicker}
                className="flex items-center gap-1.5 text-[10px] text-zinc-300 drop-shadow cursor-pointer hover:text-white transition"
              >
                <MusicNotes size={11} className={selectedMusic ? "text-indigo-400" : ""} />
                <span className="truncate">
                  {selectedMusic ? (
                    <strong className="text-indigo-300">
                      {selectedMusic.title} · {selectedMusic.artist}
                    </strong>
                  ) : (
                    `Son d'origine · ${pageName}`
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground font-medium flex items-center gap-2">
          <span className="flex items-center gap-1">
            <FilmStrip size={13} className="text-indigo-400" />
            {videoUrl ? "🎥 Vidéo Reel 9:16 interactive" : "📷 Visuel Reel 9:16"}
          </span>
          {onOpenMusicPicker && (
            <button
              type="button"
              onClick={onOpenMusicPicker}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
            >
              {selectedMusic ? "🎵 Modifier musique" : "🎵 Ajouter musique"}
            </button>
          )}
        </div>
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
      <div className="mb-3 flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => setDevice("desktop")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            !isMobile ? "bg-[#4338CA] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Desktop size={14} /> Desktop
        </button>
        <button
          type="button"
          onClick={() => setDevice("mobile")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            isMobile ? "bg-[#4338CA] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DeviceMobile size={14} /> Mobile
        </button>
      </div>

      {/* Facebook Post Frame (Explicit High Contrast on White Surface) */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isMobile
            ? "w-[360px] rounded-[28px] border-[5px] border-[#CBD5E1] dark:border-[#374151] bg-[#FFFFFF] shadow-2xl"
            : "w-full max-w-[500px] rounded-2xl border border-[#D1D5DB] bg-[#FFFFFF] shadow-lg"
        }`}
      >
        {isMobile && (
          <div className="flex items-center justify-center py-1.5 bg-[#F3F4F6] border-b border-[#E5E7EB]">
            <span className="h-1.5 w-16 rounded-full bg-[#CBD5E1]" />
          </div>
        )}

        {/* Post Header */}
        <div className="flex items-center justify-between p-3.5 bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={pageName}
                className="h-10 w-10 rounded-full border border-[#E5E7EB] object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4338CA] text-xs font-bold text-white shadow-sm">
                {pageName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h4 className="font-heading text-sm font-semibold text-[#111827] leading-tight">
                {pageName}
              </h4>
              <p className="text-[11px] text-[#4B5563] flex items-center gap-1 mt-0.5">
                À l&apos;instant · <span>🌐</span>
              </p>
            </div>
          </div>
          <DotsThree size={20} className="text-[#4B5563]" />
        </div>

        {/* Text Content */}
        <div className="px-3.5 pb-3 space-y-2 text-xs leading-relaxed bg-[#FFFFFF]">
          {title && <p className="font-bold text-[#111827] text-sm">{title}</p>}
          <p className="whitespace-pre-line text-[#111827] text-xs leading-relaxed">
            {description}
          </p>
          {linkUrl && (
            <p className="text-[#1D4ED8] font-medium hover:underline truncate">
              {linkUrl}
            </p>
          )}
          {formattedHashtags && (
            <p className="text-[#1D4ED8] font-semibold">{formattedHashtags}</p>
          )}
        </div>

        {/* Visual / Carousel (Only rendered if images exist, removing the ugly gray box) */}
        {images.length > 0 ? (
          <div className="relative aspect-[16/9] w-full bg-[#111827] overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeImageIndex]?.url || images[0].url}
              alt="Post preview"
              className="h-full w-full object-cover"
            />

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
        ) : (
          /* Clean compact indicator instead of huge gray box */
          <div className="mx-3.5 mb-2.5 rounded-lg border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-2.5 text-center text-[11px] text-[#4B5563]">
            <span>📷 Publication sans image (aperçu textuel optimisé)</span>
          </div>
        )}

        {/* Reactions Counter */}
        <div className="flex items-center justify-between px-3.5 py-2 text-[11px] text-[#4B5563] border-t border-[#F3F4F6] bg-[#FFFFFF]">
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white text-[9px]">
              👍
            </span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] -ml-2">
              ❤️
            </span>
            <span className="ml-1 font-semibold text-[#111827]">142</span>
          </span>
          <div className="flex items-center gap-3">
            <span>18 commentaires</span>
            <span>7 partages</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 divide-x divide-[#F3F4F6] border-t border-[#E5E7EB] p-1 text-xs font-semibold text-[#4B5563] bg-[#FFFFFF]">
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-[#F3F4F6] hover:text-[#111827] transition rounded-lg">
            <ThumbsUp size={15} /> J&apos;aime
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-[#F3F4F6] hover:text-[#111827] transition rounded-lg">
            <ChatCircle size={15} /> Commenter
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 hover:bg-[#F3F4F6] hover:text-[#111827] transition rounded-lg">
            <ShareFat size={15} /> Partager
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground font-medium">
        Aperçu réel Facebook (fond blanc, texte #111827, liens #1D4ED8)
      </p>
    </div>
  );
}
