import { useRef, useState } from "react";
import { Image as ImageIcon, Link2, Upload, X } from "lucide-react";
import { Input } from "./Field";
import { readLocalImage } from "../../lib";

export function ImageProofField({
  value,
  onChange,
  placeholder = "Paste direct image link (e.g. https://i.imgur.com/abc123.png)",
  compact = false,
  applyClass = "btn-primary",
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  compact?: boolean;
  applyClass?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(value.startsWith("http") ? value : "");
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const data = await readLocalImage(file);
      onChange(data);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload that image.");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input
            className="pl-10"
            placeholder={placeholder}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className={compact ? `btn h-11 px-3 text-xs text-white ${applyClass}` : applyClass}
            onClick={() => {
              if (!url.trim()) {
                setError("Paste an image link or upload a file from this computer.");
                return;
              }
              onChange(url.trim());
              setError("");
            }}
          >
            <ImageIcon size={15} /> Apply
          </button>
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Upload
          </button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void onFile(file);
        }}
      />
      <p className="mt-1 text-[11px] text-ink-faint">
        {compact
          ? "Paste a link and Apply, or upload from this computer."
          : "Paste a direct image link and click Apply, or upload a PNG, JPG, GIF, or WEBP from this computer."}
      </p>
      {error ? <p className="mt-1 text-xs text-loss">{error}</p> : null}
      {value ? (
        <div className="relative mt-2 inline-block">
          <img src={value} alt="Proof" className={`rounded-xl ${compact ? "max-h-28" : "max-h-40"}`} />
          <button
            type="button"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-loss text-white shadow-soft"
            onClick={() => {
              onChange("");
              setUrl("");
            }}
          >
            <X size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
