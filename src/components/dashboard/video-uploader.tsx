"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadSimple,
  FilmStrip,
  VideoCamera,
  Trash,
  CheckCircle,
  WarningCircle,
  ArrowClockwise,
  Play,
  Link as LinkIcon,
  ArrowSquareOut,
  Info,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

interface VideoUploaderProps {
  videoUrl: string;
  onVideoUploaded: (url: string, file: File) => void;
  onVideoRemoved: () => void;
  onVideoSelected?: (previewUrl: string, file: File) => void;
  postFormat: "feed" | "reel" | "story" | "video" | "carousel";
  className?: string;
}

export function VideoUploader({
  videoUrl,
  onVideoUploaded,
  onVideoRemoved,
  onVideoSelected,
  postFormat,
  className = "",
}: VideoUploaderProps) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileSizeMb, setFileSizeMb] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  function handleFileSelected(file: File) {
    const validExtensions = [".mp4", ".mov", ".webm", ".avi", ".mkv"];
    const fileName = file.name.toLowerCase();
    const isValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));
    const isValidMime = file.type.startsWith("video/") || file.type === "video/quicktime";

    if (!isValidExtension && !isValidMime) {
      setUploadError("Format non supporté. Veuillez sélectionner un fichier vidéo (.mp4, .mov, .webm).");
      return;
    }

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSizeMb(sizeInMb);
    setLocalFile(file);

    // Instant local preview via Blob URL
    if (localPreviewUrl && localPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setLocalPreviewUrl(preview);
    onVideoSelected?.(preview, file);

    setUploadError(null);

    // Direct upload without any arbitrary file size limit
    uploadFile(file);
  }

  function uploadFile(file: File) {
    setUploading(true);
    setProgress(5);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          setProgress(100);
          setUploading(false);
          if (res.url) {
            onVideoUploaded(res.url, file);
          } else {
            setUploadError("Le serveur n'a pas renvoyé d'URL valide.");
          }
        } catch {
          setUploadError("Erreur d'analyse de la réponse serveur.");
          setUploading(false);
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          const errMsg = res.error || `Erreur de téléversement (${xhr.status})`;
          setUploadError(errMsg);
        } catch {
          setUploadError(`Échec de téléversement (${xhr.status})`);
        }
        setUploading(false);
      }
    };
          setUploadError(`Échec de téléversement (${xhr.status})`);
        }
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setUploadError("Erreur de connexion réseau lors du téléversement de la vidéo.");
      setUploading(false);
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  }

  function handleDirectUrlSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      setUploadError("Veuillez saisir une URL valide commençant par https://");
      return;
    }

    setUploadError(null);
    setIsOversized(false);
    setLocalPreviewUrl(cleanUrl);

    // Create synthetic file for handlers requiring File type
    const syntheticName = cleanUrl.split("/").pop()?.split("?")[0] || "video-externe.mp4";
    const syntheticFile = new File([], syntheticName, { type: "video/mp4" });
    setLocalFile(syntheticFile);
    setFileSizeMb("URL distante");

    onVideoUploaded(cleanUrl, syntheticFile);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleRemove() {
    if (localPreviewUrl && localPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalFile(null);
    setLocalPreviewUrl(null);
    setProgress(0);
    setUploading(false);
    setUploadError(null);
    setFileSizeMb(null);
    setIsOversized(false);
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onVideoRemoved();
  }

  const activeVideoSrc = localPreviewUrl || videoUrl || null;
  const isVertical = postFormat === "reel" || postFormat === "story";

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Mode Switcher (File upload vs Direct URL) */}
      {!activeVideoSrc && (
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/60 w-fit">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "file"
                ? "bg-background text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UploadSimple size={14} weight="bold" />
            Fichier local (max 50 Mo)
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === "url"
                ? "bg-background text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LinkIcon size={14} weight="bold" />
            URL directe (illimité / externe)
          </button>
        </div>
      )}

      {/* Upload Drop Zone / Active Video Display */}
      {!activeVideoSrc ? (
        mode === "file" ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
                : "border-zinc-700/80 bg-zinc-900/40 hover:border-indigo-500/50 hover:bg-zinc-900/60 dark:bg-[#0c101c]/80"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              {isVertical ? (
                <FilmStrip size={28} weight="duotone" />
              ) : (
                <VideoCamera size={28} weight="duotone" />
              )}
            </div>

            <h3 className="mt-3 text-sm font-bold text-foreground">
              {isVertical
                ? "Téléverser votre Reel / Story (9:16)"
                : "Téléverser votre Vidéo Facebook"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Glissez-déposez directement votre fichier vidéo ici, ou{" "}
              <span className="font-semibold text-indigo-400 underline underline-offset-2">
                Parcourir vos fichiers
              </span>
            </p>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px]">.MP4</span>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px]">.MOV</span>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px]">.WEBM</span>
              <span className="font-medium text-amber-500 dark:text-amber-400">
                (Max 50 Mo par vidéo)
              </span>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleDirectUrlSubmit}
            className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <LinkIcon size={16} weight="bold" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  URL directe de la vidéo (hébergée en ligne)
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Si votre vidéo est hébergée sur votre site, CDN, Cloudinary ou AWS S3 (sans limite de taille).
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://votre-site.com/videos/mon-reel.mp4"
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!urlInput.trim()}
                className="text-xs font-semibold px-4"
              >
                Appliquer
              </Button>
            </div>
          </form>
        )
      ) : (
        <div className="rounded-2xl border border-indigo-500/20 bg-zinc-950/90 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Play size={14} weight="fill" />
              </span>
              <div>
                <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {localFile?.name || "Vidéo sélectionnée"}
                </p>
                {fileSizeMb && (
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {fileSizeMb.includes("URL") ? fileSizeMb : `${fileSizeMb} Mo`}
                    <span className="ml-2 font-medium text-emerald-400">
                      ✓ Prêt pour publication directe
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (mode === "file") {
                    fileInputRef.current?.click();
                  } else {
                    handleRemove();
                  }
                }}
                disabled={uploading}
                className="text-xs h-7 px-2.5"
              >
                <ArrowClockwise size={12} className="mr-1" /> Remplacer
              </Button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="p-1.5 text-zinc-400 hover:text-red-400 transition rounded-lg hover:bg-white/[0.06]"
                title="Supprimer la vidéo"
              >
                <Trash size={15} />
              </button>
            </div>
          </div>

          {/* Hidden File Input for Replace */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelected(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {/* Native Video Player Preview */}
          <div className="relative mx-auto flex items-center justify-center overflow-hidden rounded-xl border border-white/[0.08] bg-black">
            <video
              src={activeVideoSrc}
              controls
              playsInline
              className={`w-full object-contain ${
                isVertical ? "max-h-80 aspect-[9/16]" : "max-h-72 aspect-video"
              }`}
            />
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                  <ArrowClockwise size={13} className="animate-spin text-indigo-400" />
                  Téléversement direct vers le serveur sécurisé…
                </span>
                <span className="font-mono font-bold text-indigo-400">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success state */}
          {!uploading && (videoUrl || (localPreviewUrl && !localPreviewUrl.startsWith("blob:"))) && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
              <CheckCircle size={15} weight="fill" />
              <span>Vidéo validée et prête pour la publication Meta Graph API (Reel / Vidéo)</span>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="flex items-start gap-2 text-xs text-red-400 pt-1 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
              <WarningCircle size={16} weight="fill" className="shrink-0 mt-0.5 text-red-400" />
              <div className="space-y-1">
                <span className="font-semibold text-red-300">{uploadError}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
