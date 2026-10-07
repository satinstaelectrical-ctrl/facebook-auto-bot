"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  MusicNotes,
  Play,
  Pause,
  MagnifyingGlass,
  Check,
  X,
  Sparkle,
  SpeakerHigh,
  Flame,
  Waveform,
  Headphones,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import type { ReelMusicTrack } from "@/lib/types";

// Curated collection of Meta-style Reels tracks & royalty-free audio streams
const CURATED_REELS_TRACKS: ReelMusicTrack[] = [
  {
    id: "meta-viral-01",
    title: "Neon Horizon (Trending Beat)",
    artist: "Meta Sound Studio",
    duration: "0:30",
    category: "🔥 Tendances Virales",
    previewUrl: "https://cdn.freesound.org/previews/612/612613_5674468-lq.mp3",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "meta-viral-02",
    title: "Summer Vibes & Sunsets",
    artist: "Facebook Reels Creator Lab",
    duration: "0:25",
    category: "🔥 Tendances Virales",
    previewUrl: "https://cdn.freesound.org/previews/573/573381_11861866-lq.mp3",
    coverUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "meta-sound-01",
    title: "Cosmic Flow · Lo-Fi Beats",
    artist: "Meta Sound Collection",
    duration: "0:32",
    category: "🎧 Meta Sound Collection",
    previewUrl: "https://cdn.freesound.org/previews/684/684042_11861866-lq.mp3",
    coverUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "meta-sound-02",
    title: "Corporate Growth & Momentum",
    artist: "Meta Sound Collection",
    duration: "0:28",
    category: "🎧 Meta Sound Collection",
    previewUrl: "https://cdn.freesound.org/previews/530/530415_11861866-lq.mp3",
    coverUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-electro-01",
    title: "Deep House Midnight Energy",
    artist: "Groove Lab Tokyo",
    duration: "0:30",
    category: "⚡ Pop & Électro",
    previewUrl: "https://cdn.freesound.org/previews/675/675402_11861866-lq.mp3",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "chill-lofi-01",
    title: "Morning Coffee & Soft Rain",
    artist: "Lofi Dreamer",
    duration: "0:35",
    category: "🌿 Chill & Lofi",
    previewUrl: "https://cdn.freesound.org/previews/557/557812_11861866-lq.mp3",
    coverUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "business-01",
    title: "Inspiring Brand Story",
    artist: "Modern Pulse Media",
    duration: "0:26",
    category: "💼 Motivation & Business",
    previewUrl: "https://cdn.freesound.org/previews/612/612613_5674468-lq.mp3",
    coverUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "acoustic-01",
    title: "Golden Hour Guitar Strum",
    artist: "Sunset Acoustic Project",
    duration: "0:29",
    category: "🌿 Chill & Lofi",
    previewUrl: "https://cdn.freesound.org/previews/573/573381_11861866-lq.mp3",
    coverUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=300&auto=format&fit=crop&q=80",
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
  const [apiTracks, setApiTracks] = useState<ReelMusicTrack[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);
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
  }, []);

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

    const audio = new Audio(track.previewUrl);
    audioRef.current = audio;
    audio.play().catch((err) => console.warn("Audio playback interrupted:", err));
    setPlayingTrackId(track.id);

    audio.onended = () => {
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
                <span className="text-[10px] rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-indigo-300 font-medium">
                  Meta Pro
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Ajoutez un fond sonore musical officiel libre de droits à votre Reel 9:16
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

        {/* Search bar */}
        <div className="mt-3.5 relative">
          <MagnifyingGlass size={15} className="absolute left-3.5 top-3 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une musique, artiste, ambiance (ex: Lo-Fi, Électro)..."
            className="w-full rounded-2xl border border-white/10 bg-zinc-900/90 pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
          />
        </div>

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
                      ? "border-indigo-500/60 bg-indigo-500/10"
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
                        className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-90 hover:opacity-100 hover:scale-110 transition"
                        title={isPlaying ? "Mettre en pause" : "Écouter l'extrait"}
                      >
                        {isPlaying ? (
                          <Pause size={16} weight="fill" className="text-indigo-400 animate-pulse" />
                        ) : (
                          <Play size={14} weight="fill" />
                        )}
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white truncate">{track.title}</p>
                        {isPlaying && (
                          <span className="flex items-center gap-0.5 text-indigo-400">
                            <span className="h-2 w-0.5 rounded-full bg-indigo-400 animate-bounce" />
                            <span className="h-3 w-0.5 rounded-full bg-indigo-400 animate-bounce delay-75" />
                            <span className="h-1.5 w-0.5 rounded-full bg-indigo-400 animate-bounce delay-150" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {track.category && (
                          <span className="text-[9px] font-semibold text-zinc-400 bg-white/[0.06] rounded px-1.5 py-0.2">
                            {track.category}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">{track.duration}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold">
                        <Check size={13} weight="bold" /> Sélectionné
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSelect(track)}
                        className="h-7 text-xs px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm"
                      >
                        Choisir
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
            Utiliser le son d&apos;origine (Aucune musique)
          </button>
          <Button size="sm" variant="secondary" onClick={onClose} className="text-xs h-8">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
