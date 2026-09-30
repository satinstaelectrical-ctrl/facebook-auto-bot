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
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

interface VideoUploaderProps {
  videoUrl: string;
  onVideoUploaded: (url: string, file: File) => void;
  onVideoRemoved: () => void;
  postFormat: "feed" | "reel" | "story" | "video" | "carousel";
  className?: string;
}

export function VideoUploader({
  videoUrl,
  onVideoUploaded,
  onVideoRemoved,
  postFormat,
  className = "",
}: VideoUploaderProps) {
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
      setUploadError("Format non supporté. Veuillez sélectionner un fichier .mp4 ou .mov.");
      return;
    }

    setUploadError(null);
    setLocalFile(file);
    setFileSizeMb((file.size / (1024 * 1024)).toFixed(1));

    // Instant local preview via Blob URL
    if (localPreviewUrl && localPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    const preview = URL.createObjectURL(file);
    setLocalPreviewUrl(preview);

    // Upload with real XHR progress
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
          setUploadError(res.error || `Erreur de téléversement (${xhr.status})`);
        } catch {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onVideoRemoved();
  }

  const activeVideoSrc = localPreviewUrl || videoUrl || null;
  const isVertical = postFormat === "reel" || postFormat === "story";

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Drop Zone / Active Video Display */}
      {!activeVideoSrc ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
              : "border-zinc-800 bg-[#0c101c]/80 hover:border-indigo-500/50 hover:bg-zinc-900/60"
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

          <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 font-mono">.MP4</span>
            <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 font-mono">.MOV</span>
            <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 font-mono">.WEBM</span>
            <span>(Jusqu'à 1 Go)</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-indigo-500/20 bg-zinc-950/80 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Play size={14} weight="fill" />
              </span>
              <div>
                <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {localFile?.name || "Vidéo sélectionnée"}
                </p>
                {fileSizeMb && (
                  <p className="text-[10px] text-zinc-400 font-mono">{fileSizeMb} Mo</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs h-7 px-2.5"
              >
                <ArrowClockwise size={12} className="mr-1" /> Remplacer
              </Button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="p-1.5 text-zinc-400 hover:text-red-400 transition rounded-lg hover:bg-white/[0.04]"
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
                  Téléversement direct vers le serveur…
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
          {!uploading && videoUrl && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
              <CheckCircle size={15} weight="fill" />
              <span>Vidéo téléversée et prête pour la publication Meta Graph API</span>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 pt-1">
              <WarningCircle size={15} weight="fill" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
