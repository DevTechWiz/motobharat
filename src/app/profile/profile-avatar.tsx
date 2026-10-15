"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Expand, Pencil, Upload, Link as LinkIcon, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { normalizeImageUrl } from "@/lib/image-link";
import { compressImageFile, friendlyUploadError } from "@/lib/client-image";
import { updateAvatar } from "./actions";

interface ProfileAvatarProps {
  displayName: string;
  avatarUrl?: string | null;
}

export function ProfileAvatar({ displayName, avatarUrl }: ProfileAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { refreshProfile } = useAuth();
  const router = useRouter();

  const activeAvatar = customAvatarUrl !== undefined ? customAvatarUrl : avatarUrl;

  const handleClose = useCallback(() => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setUrlInput("");
    setPreviewUrl(null);
    setPreviewBroken(false);
    setIsRemoving(false);
    setError(null);
    setIsOpen(false);
  }, [previewUrl]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle escape key to close viewer first, then modal
  useEffect(() => {
    if (!isOpen && !viewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (viewOpen) setViewOpen(false);
        else handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, viewOpen, handleClose]);

  const handleOpen = () => {
    setError(null);
    setSelectedFile(null);
    setUrlInput("");
    setIsRemoving(false);
    setPreviewUrl(null);
    setPreviewBroken(false);
    setIsOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }

    let uploadable = file;
    try {
      uploadable = await compressImageFile(file);
    } catch {
      // keep the original — server validation reports the specific cause
    }

    if (uploadable.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    setError(null);
    setIsRemoving(false);
    setSelectedFile(uploadable);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    const blobUrl = URL.createObjectURL(uploadable);
    setPreviewUrl(blobUrl);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    setError(null);
    setPreviewBroken(false);
    setIsRemoving(false);
    if (val.trim().startsWith("http://") || val.trim().startsWith("https://")) {
      setPreviewUrl(val.trim());
    } else if (!val.trim()) {
      setPreviewUrl(null);
    }
  };

  const handleRemoveChoice = () => {
    setIsRemoving(true);
    setSelectedFile(null);
    setUrlInput("");
    setPreviewUrl(null);
    setError(null);
  };

  const handleSave = () => {
    setError(null);

    const formData = new FormData();
    if (isRemoving) {
      formData.set("remove", "true");
    } else if (activeTab === "file") {
      if (!selectedFile) {
        setError("Please choose an image file to upload.");
        return;
      }
      formData.set("avatar_file", selectedFile);
    } else {
      const trimmed = urlInput.trim();
      if (!trimmed) {
        setError("Please enter a valid image URL.");
        return;
      }
      formData.set("avatar_url", trimmed);
    }

    startTransition(async () => {
      try {
        const res = await updateAvatar({}, formData);
        if (res.error) {
          setError(res.error);
          return;
        }

        setCustomAvatarUrl(res.avatar_url ?? null);
        toast(isRemoving ? "Profile picture removed." : "Profile picture updated.", "success");
        handleClose();
        await refreshProfile();
        router.refresh();
      } catch (err: unknown) {
        setError(friendlyUploadError(err, "Could not save the profile picture."));
      }
    });
  };

  const effectiveAvatar = isRemoving ? null : (previewUrl ?? activeAvatar);

  return (
    <>
      {/* Profile Avatar trigger with ring and pinned edit icon */}
      <div className="relative inline-flex shrink-0 items-center justify-center">
        {/* Concentric outer ring hugging the avatar */}
        <button
          type="button"
          onClick={() => activeAvatar && setViewOpen(true)}
          className="group relative flex rounded-full p-1 ring-2 ring-accent/40 bg-surface transition-all duration-200 hover:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          aria-label="View profile picture"
          title="Click to view profile picture"
        >
          <Avatar name={displayName} src={activeAvatar} size="xl" />
          {activeAvatar && (
            <span
              className="absolute inset-1 flex items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden="true"
            >
              <Expand className="size-6 text-white drop-shadow-md" />
            </span>
          )}
        </button>

        {/* Pinned edit button at top right */}
        <button
          type="button"
          onClick={handleOpen}
          className="absolute top-0 right-0 z-10 flex size-7 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-secondary shadow-md transition-all duration-150 hover:border-accent hover:bg-surface-3 hover:text-accent hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          aria-label="Upload profile picture"
          title="Upload profile picture"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      {/* Full-image viewer */}
      {viewOpen && activeAvatar && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Profile picture viewer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewOpen(false);
          }}
        >
          <button
            type="button"
            onClick={() => setViewOpen(false)}
            className="fixed top-4 right-4 z-10 flex size-9 items-center justify-center rounded-lg border border-border bg-bg/80 text-muted backdrop-blur transition-colors hover:text-white hover:border-border-strong cursor-pointer"
            aria-label="Close viewer"
          >
            <X className="size-4" />
          </button>
          <div className="max-h-[85vh] overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob/data URLs can't go through next/image */}
            <img
              src={activeAvatar}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="avatar-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border-strong bg-surface p-6 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 id="avatar-modal-title" className="text-lg font-extrabold text-white">
                  Profile Picture
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  Update your community profile photo
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted transition-colors hover:text-white hover:border-border-strong cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-xs text-danger">
                {error}
              </div>
            )}

            <fieldset disabled={isPending} className="min-w-0 border-0 m-0 p-0">
            {/* Live Preview Section */}
            <div className="my-6 flex flex-col items-center justify-center gap-3">
              <div className="relative inline-flex shrink-0 items-center justify-center">
                <button
                  type="button"
                  onClick={() => effectiveAvatar && setViewOpen(true)}
                  className="group relative flex rounded-full p-1 ring-2 ring-accent/60 bg-surface shadow-md transition-all duration-200 hover:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                  title="Click to view image"
                  aria-label="Click to view image"
                >
                  <Avatar name={displayName} src={effectiveAvatar} size="xl" />
                  {effectiveAvatar && (
                    <span
                      className="absolute inset-1 flex items-center justify-center rounded-full bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                      aria-hidden="true"
                    >
                      <Expand className="size-6 text-white drop-shadow-md" />
                    </span>
                  )}
                </button>
              </div>

              <span className="font-mono text-[11px] text-muted tracking-wider uppercase">
                {isRemoving
                  ? "Initials fallback"
                  : previewUrl
                  ? "Live Preview"
                  : activeAvatar
                  ? "Current Photo"
                  : "No photo set"}
              </span>
              {/* Probe: remote URLs that refuse hotlinking (401/403, expired CDN
                  links) fail here immediately instead of only at Save. */}
              {previewUrl && !previewUrl.startsWith("blob:") && (
                // eslint-disable-next-line @next/next/no-img-element -- error probe only, never displayed
                <img
                  key={previewUrl}
                  src={normalizeImageUrl(previewUrl)}
                  alt=""
                  aria-hidden
                  referrerPolicy="no-referrer"
                  className="hidden"
                  onLoad={() => setPreviewBroken(false)}
                  onError={() => setPreviewBroken(true)}
                />
              )}
              {previewBroken && (
                <span className="text-xs font-semibold text-danger">
                  That link won&apos;t load here — use a direct public image link (https, ends in .jpg/.png/.webp).
                </span>
              )}
            </div>

            {/* Tabs for choosing method */}
            <div className="mb-4 flex rounded-lg border border-border-strong bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("file");
                  setIsRemoving(false);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "file" && !isRemoving
                    ? "bg-accent text-accent-fg shadow-sm"
                    : "text-secondary hover:text-white"
                }`}
              >
                <Upload className="size-3.5" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("url");
                  setIsRemoving(false);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "url" && !isRemoving
                    ? "bg-accent text-accent-fg shadow-sm"
                    : "text-secondary hover:text-white"
                }`}
              >
                <LinkIcon className="size-3.5" />
                Image Link
              </button>
            </div>

            {/* Tab: Upload File */}
            {activeTab === "file" && !isRemoving && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-2/60 p-5 text-center transition-all hover:border-accent hover:bg-surface-2"
                >
                  <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-surface-3 text-secondary group-hover:text-accent transition-colors">
                    <Upload className="size-5" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-accent transition-colors">
                    {selectedFile ? "Choose a different photo" : "Click to select a photo"}
                  </span>
                  <span className="mt-1 font-mono text-[10px] text-muted">
                    JPEG, PNG, or WebP (max 10 MB)
                  </span>
                </button>

                {selectedFile && (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs">
                    <span className="truncate max-w-[240px] text-text font-mono text-[11px]">
                      {selectedFile.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Image Link */}
            {activeTab === "url" && !isRemoving && (
              <div className="space-y-3">
                <Field label="Image Web Address (HTTPS)" htmlFor="avatar-url-input">
                  <Input
                    id="avatar-url-input"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={urlInput}
                    onChange={handleUrlChange}
                    disabled={isPending}
                  />
                </Field>
                <p className="text-[11px] text-muted">
                  Direct link to an image file (Unsplash, Google Photos, Cloudflare) — Google Drive
                  share links work too.
                </p>
              </div>
            )}

            {/* Remove photo option if user currently has one */}
            {activeAvatar && !isRemoving && (
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-xs text-secondary">Prefer not having a photo?</span>
                <button
                  type="button"
                  onClick={handleRemoveChoice}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:underline transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  Remove photo
                </button>
              </div>
            )}

            {/* Notice when removing */}
            {isRemoving && (
              <div className="rounded-xl border border-border bg-surface-2 p-4 text-xs text-secondary">
                <p>
                  Your custom profile photo will be removed. Your profile will display your initials instead.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRemoving(false)}
                  className="mt-2 text-accent font-semibold hover:underline cursor-pointer"
                >
                  Keep my current photo
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant={isRemoving ? "danger" : "primary"}
                size="sm"
                onClick={handleSave}
                disabled={isPending || (!isRemoving && !selectedFile && !urlInput.trim())}
                loading={isPending}
              >
                {isRemoving ? "Remove Photo" : "Save Picture"}
              </Button>
            </div>
            </fieldset>
          </div>
        </div>
      )}
    </>
  );
}
