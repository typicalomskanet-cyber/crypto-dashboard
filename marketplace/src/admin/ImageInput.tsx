import { useRef, useState } from "react";
import { useCatalog } from "../lib/catalog";

interface Props {
  value: string;
  onChange(url: string): void;
  placeholder?: string;
}

/** Hybrid URL/upload input. Falls back to URL-only if upload endpoint is not
 *  configured in site settings. Returned URL gets resolved against the
 *  endpoint host so it works from both PWA and main hosting deployments. */
export function ImageInput({ value, onChange, placeholder }: Props) {
  const { settings } = useCatalog();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpload = !!settings.uploadEndpoint;

  async function handleFile(file: File) {
    if (!canUpload) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(settings.uploadEndpoint, {
        method: "POST",
        headers: { "X-Upload-Token": settings.uploadToken },
        body: fd,
      });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      // Resolve relative URLs against the endpoint host so the picture works
      // even when the admin runs on a different origin (e.g. devinapps preview).
      let url = data.url;
      if (url.startsWith("/")) {
        try {
          const ep = new URL(settings.uploadEndpoint);
          url = `${ep.protocol}//${ep.host}${url}`;
        } catch {
          /* leave as-is */
        }
      }
      onChange(url);
    } catch (e) {
      setError((e as Error).message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? "https://… или загрузите файл"}
          className="h-10 flex-1 rounded-lg border border-line bg-paper px-3 text-[13px] outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand-light"
        />
        {canUpload && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-10 shrink-0 items-center gap-1 rounded-lg bg-brand px-3 text-[12px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            title="Загрузить с компьютера"
          >
            {uploading ? "…" : "📁 Загрузить"}
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-2 hover:border-discount hover:text-discount"
            title="Очистить"
          >
            ×
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {error && <div className="mt-1 text-[11px] text-discount">Ошибка: {error}</div>}

      {value && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-paper p-2">
          <img src={value} alt="" className="h-14 w-14 rounded object-cover" />
          <div className="min-w-0 flex-1 break-all text-[11px] text-ink-2">{value}</div>
        </div>
      )}
    </div>
  );
}
