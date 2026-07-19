"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Upload01Icon } from "@hugeicons/core-free-icons";

// ---------- Upload utility ----------
export async function uploadLogo(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("prefix", "partnership");
  try {
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

// ---------- Helpers ----------
const ALLOWED_TYPES = ["image/webp", "image/png", "image/jpeg"];
const MAX_SIZE = 2 * 1024 * 1024;

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Format harus WebP, PNG, atau JPG";
  if (file.size > MAX_SIZE) return "Ukuran maksimal 2 MB";
  return null;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatType(mime: string): string {
  const ext = mime.split("/")[1];
  if (!ext) return "";
  return ext.toUpperCase();
}

type FileInfo = { name: string; size: string; type: string };

export function LogoField({
  currentUrl,
  onFileChange,
}: {
  currentUrl?: string | null;
  onFileChange?: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showUrl = deleted ? null : (preview ?? currentUrl);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const err = validateFile(file);
    if (err) {
      setError(err);
      toast.error(err);
      return;
    }

    setDeleted(false);
    onFileChange?.(file);
    setFileInfo({ name: file.name, size: formatSize(file.size), type: formatType(file.type) });

    const url = URL.createObjectURL(file);
    setPreview((old) => {
      if (old && old !== url) URL.revokeObjectURL(old);
      return url;
    });
  }

  function handleDelete() {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setFileInfo(null);
    setError(null);
    setDeleted(true);
    onFileChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Logo
      </label>

      {/* Preview card (image + file info) */}
      {showUrl ? (
        <div className="flex items-center gap-3 rounded-lg border p-2.5">
          {fileInfo ? (
            // Newly uploaded — show preview + file details
            <>
              <Image
                src={showUrl}
                alt=""
                width={48}
                height={48}
                className="size-12 shrink-0 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileInfo.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fileInfo.size} &middot; {fileInfo.type}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
              >
                <HugeiconsIcon icon={Cancel01Icon} size="16" color="currentColor" strokeWidth={1.5} />
              </button>
            </>
          ) : (
            // Existing logo from DB — show image only
            <>
              <Image
                src={showUrl}
                alt=""
                width={48}
                height={48}
                className="size-12 shrink-0 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Logo saat ini</p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-muted"
              >
                <HugeiconsIcon icon={Cancel01Icon} size="16" color="currentColor" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      ) : (
        /* Drop zone */
        <label
          className={`flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition-all duration-200 ${
            dragOver
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/20"
          } ${error ? "border-destructive" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <HugeiconsIcon icon={Upload01Icon} size="24" color="currentColor" strokeWidth={1.5} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Klik atau drag &amp; drop logo
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".webp,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {!showUrl && (
        <p className="text-[11px] text-muted-foreground">
          Maks 2 MB &bull; WebP / PNG / JPG
        </p>
      )}
      {deleted && <input type="hidden" name="logo_delete" value="1" />}
    </div>
  );
}
