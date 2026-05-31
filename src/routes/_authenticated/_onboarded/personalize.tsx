import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_onboarded/personalize")({
  head: () => ({ meta: [{ title: "Personalize — VVCLab" }] }),
  component: PersonalizePage,
});

const STORAGE_KEY = "vvclab.personalPhoto.v1";

function PersonalizePage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v) setPhoto(v);
    } catch {
      /* ignore */
    }
  }, []);

  function handleFile(file: File) {
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result);
      setPhoto(url);
    };
    r.readAsDataURL(file);
  }

  function handleSave() {
    if (!photo) return;
    try {
      localStorage.setItem(STORAGE_KEY, photo);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 lg:px-10 lg:py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-[28px]">Personalize</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your photo for AI thumbnail generation.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 lg:p-8">
        <div className="flex flex-col items-center gap-4">
          <label
            htmlFor="photo-upload"
            className="flex h-48 w-full max-w-xs cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-surface transition-colors hover:border-accent-red hover:bg-surface-red-soft lg:h-64 lg:w-64 lg:max-w-none"
          >
            {photo ? (
              <img src={photo} alt="Your photo" className="h-full w-full object-cover" />
            ) : (
              <>
                <Camera className="mb-2 h-8 w-8 text-text-tertiary" />
                <span className="text-sm font-medium text-foreground">Upload your photo</span>
                <span className="mt-1 text-[11px] text-text-tertiary">Click to browse</span>
              </>
            )}
          </label>
          <input
            id="photo-upload"
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <p className="text-center text-xs text-muted-foreground">
            Use a clear, front-facing photo with good lighting.
            <br />
            Accepted formats: JPG, PNG
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {photo && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface sm:w-auto"
              >
                <Upload className="h-3.5 w-3.5" />
                Change photo
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!photo}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-md bg-accent-red px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}