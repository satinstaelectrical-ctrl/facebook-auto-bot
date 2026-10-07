"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  MusicNotes,
  Play,
  Pause,
  MagnifyingGlass,
  Check,
  X,
  SpeakerHigh,
  Headphones,
  Link as LinkIcon,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import type { ReelMusicTrack } from "@/lib/types";

// Curated authentic collection of Meta-compatible Reels tracks hosted locally in public/audio/reels
const CURATED_REELS_TRACKS: ReelMusicTrack[] = [
  {
    id: "reel-viral-radio",
    title: "Radio Martini (Viral Upbeat Hit)",
    artist: "Meta Creator Sound Lab",
    duration: "2:47",
    category: "🔥 Tendances Virales",
    previewUrl: "/audio/reels/radio_martini.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "reel-hype-rocket",
    title: "Rocket Hype Beat (Fast EDM Energy)",
    artist: "Meta Sound Studio",
    duration: "2:26",
    category: "⚡ Pop & Électro",
    previewUrl: "/audio/reels/rocket_beat.mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "reel-motivational-rising",
    title: "Rising Momentum (Inspiring Rise)",
    artist: "Meta Business Audio",
    duration: "2:31",
    category: "💼 Motivation & Business",
    previewUrl: "/audio/reels/rising_vibe.mp3",
    coverUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "reel-tech-innovation",
    title: "Shiny Tech & Innovation (Commercial Pop)",
    artist: "Meta Sound Collection",
    duration: "3:42",
    category: "🎧 Meta Sound Collection",
    previewUrl: "/audio/reels/shiny_tech.mp3",
    coverUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "reel-lofi-wallpaper",
    title: "Wallpaper Lo-Fi Chill Beats",
    artist: "Lofi Dreamer Meta",
    duration: "3:40",
    category: "🌿 Chill & Lofi",
    previewUrl: "/audio/reels/wallpaper_lofi.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "reel-acoustic-friendly",
    title: "New Friendly Vibe (Acoustic Joy)",
    artist: "Creator Acoustic Project",
    duration: "2:49",
    category: "🔥 Tendances Virales",
    previewUrl: "/audio/reels/new_friendly.mp3",
    coverUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "reel-chill-overcast",
    title: "Overcast Study & Relaxing Piano",
    artist: "Meta Sound Collection",
    duration: "3:48",
    category: "🌿 Chill & Lofi",
    previewUrl: "/audio/reels/overcast_chill.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80",
  },
];

const CATEGORIES = [
  "Toutes",
  "🔥 Tendances Virales",
  "🎧 Meta Sound Collection",
  "⚡ Pop & Électro",
  "🌿 Chill & Lofi",
  "💼 Motivation & Business",
];

interface MusicPickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedTrack: ReelMusicTrack | null;
  onSelectTrack: (track: ReelMusicTrack | null) => void;
  pageId?: string;
}

export function MusicPickerModal({
  open,
  onClose,
  selectedTrack,
  onSelectTrack,
  pageId,
}: MusicPickerModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [apiTracks, setApiTracks] = useState<ReelMusicTrack[]>([]);
  const [, setLoadingApi] = useState(false);

  // Custom audio URL or upload support
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load live Meta tracks if available
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    async function loadMetaTracks() {
      try {
        setLoadingApi(true);
        const queryParam = pageId ? `?pageId=${encodeURIComponent(pageId)}` : "";
        const res = await fetch(`/api/facebook/sound-collection${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.tracks && data.tracks.length > 0) {
            setApiTracks(data.tracks);
          }
        }
      } catch (e) {
        console.warn("Could not load Meta Sound Collection tracks:", e);
      } finally {
        if (isMounted) setLoadingApi(false);
      }
    }
    loadMetaTracks();
    return () => {
      isMounted = false;
    };
  }, [open, pageId]);

  // Clean audio playback on unmount or close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [open]);

  const allTracks = useMemo(() => {
    return [...apiTracks, ...CURATED_REELS_TRACKS];
  }, [apiTracks]);

  const filteredTracks = useMemo(() => {
    return allTracks.filter((track) => {
      const matchesCategory =
        selectedCategory === "Toutes" || track.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        (track.category && track.category.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [allTracks, selectedCategory, search]);

  function handleTogglePlay(track: ReelMusicTrack) {
    setPlaybackError(null);

    if (playingTrackId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingTrackId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (!track.previewUrl) return;

    // Resolve URL safely: if external, proxy through /api/audio-proxy to prevent CORS
    let soundSrc = track.previewUrl;
    if (soundSrc.startsWith("http://") || soundSrc.startsWith("https://")) {
      if (typeof window !== "undefined" && !soundSrc.includes(window.location.host) && !soundSrc.includes("/api/audio-proxy")) {
        soundSrc = `/api/audio-proxy?url=${encodeURIComponent(soundSrc)}`;
      }
    }

    const audio = new Audio(soundSrc);
    audioRef.current = audio;

    audio
      .play()
      .then(() => {
        setPlayingTrackId(track.id);
      })
      .catch((err) => {
        console.warn("Audio playback issue:", err);
        setPlaybackError("Lecture bloquée par le navigateur ou format audio inaccessible.");
        setPlayingTrackId(null);
      });

    audio.onended = () => {
      setPlayingTrackId(null);
    };

    audio.onerror = () => {
      setPlaybackError("Erreur de chargement du flux audio.");
      setPlayingTrackId(null);
    };
  }

  function handleSelect(track: ReelMusicTrack) {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingTrackId(null);
    onSelectTrack(track);
    onClose();
  }

  function handleClearMusic() {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingTrackId(null);
    onSelectTrack(null);
    onClose();
  }

  function handleAddCustomTrack() {
    const url = customUrl.trim();
    if (!url) return;
    const title = customTitle.trim() || "Musique personnalisée";
    const customTrack: ReelMusicTrack = {
      id: `custom-${Date.now()}`,
      title,
      artist: "Piste personnalisée",
      duration: "Audio",
      category: "Personnalisé",
      previewUrl: url,
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    };
    handleSelect(customTrack);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl shadow-indigo-500/10 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <MusicNotes size={18} weight="fill" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Musique Facebook Reels & Sound Collection
                <span className="text-[10px] rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-emerald-300 font-medium">
                  Audio Réel Actif
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Pistes musicales réelles, audibles et libres de droits pour vos Reels 9:16
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Playback Alert if blocked */}
        {playbackError && (
          <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <WarningCircle size={15} />
            <span>{playbackError}</span>
          </div>
        )}

        {/* Search & Custom Toggle */}
        <div className="mt-3.5 flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={15} className="absolute left-3.5 top-3 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une musique, artiste, ambiance (ex: Lo-Fi, Électro)..."
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
              showCustomInput
                ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                : "border-white/10 bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <LinkIcon size={14} />
            <span>Lien URL</span>
          </button>
        </div>

        {/* Custom Audio URL form */}
        {showCustomInput && (
          <div className="mt-2.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
              <span>Utiliser une musique externe (lien direct MP3)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Titre de la musique (ex: Mon Son Tendance)"
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
              />
              <input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://.../musique.mp3"
                className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAddCustomTrack} className="h-7 text-xs bg-indigo-600">
                Appliquer cette musique
              </Button>
            </div>
          </div>
        )}

        {/* Categories Chips */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Audio Tracks List */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px]">
          {filteredTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
              <Headphones size={32} className="mb-2 opacity-50" />
              <p className="text-xs">Aucune piste musicale trouvée pour cette recherche.</p>
            </div>
          ) : (
            filteredTracks.map((track) => {
              const isSelected = selectedTrack?.id === track.id;
              const isPlaying = playingTrackId === track.id;

              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between rounded-2xl p-2.5 transition border ${
                    isSelected
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : isPlaying
                      ? "border-indigo-500/50 bg-indigo-500/5"
                      : "border-white/[0.06] bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail & Play button overlay */}
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800">
                      {track.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-950 text-indigo-400">
                          <MusicNotes size={16} />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleTogglePlay(track)}
                        className={`absolute inset-0 flex items-center justify-center transition ${
                          isPlaying
                            ? "bg-indigo-600/80 text-white"
                            : "bg-black/60 text-white hover:bg-black/40 hover:scale-105"
                        }`}
                        title={isPlaying ? "Mettre en pause" : "Écouter la vraie musique"}
                      >
                        {isPlaying ? (
                          <Pause size={16} weight="fill" className="animate-pulse" />
                        ) : (
                          <Play size={14} weight="fill" />
                        )}
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white truncate">{track.title}</p>
                        {isPlaying && (
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-2" />
                            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_ease-in-out_infinite] h-3" />
                            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.5s_ease-in-out_infinite] h-1.5" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {track.category && (
                          <span className="text-[9px] font-semibold text-zinc-400 bg-white/[0.06] rounded px-1.5 py-0.5">
                            {track.category}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">{track.duration}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(track)}
                      className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition"
                    >
                      <SpeakerHigh size={13} />
                      <span>{isPlaying ? "En cours" : "Tester"}</span>
                    </button>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold">
                        <Check size={13} weight="bold" /> Actif
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSelect(track)}
                        className="h-7 text-xs px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm"
                      >
                        Sélectionner
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={handleClearMusic}
            className="text-xs font-medium text-zinc-400 hover:text-red-400 transition"
          >
            Utiliser le son d&apos;origine de la vidéo
          </button>
          <Button size="sm" variant="secondary" onClick={onClose} className="text-xs h-8">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
