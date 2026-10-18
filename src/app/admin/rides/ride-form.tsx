"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { X, Sparkles, Trash2, Loader2, Camera, Plus, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { CoverCropperModal } from "@/components/admin/cover-cropper-modal";
import { toDatetimeLocalIST } from "@/lib/format";
import type { RideImport } from "@/lib/ride-import";
import { uploadRideCover, removeRideCover, fetchRemoteImageDataUrl, type RideFormState, type MediaFormState } from "../actions";
import { dataUrlToFile, friendlyUploadError, ACCEPTED_IMAGE_TYPES, IMAGE_UPLOAD_HINT } from "@/lib/client-image";

const POPULAR_ACTIVITIES = [
  "Breakfast / Chai",
  "Off-roading",
  "Campfire",
  "Ghat Roads",
  "Scenic Highway",
  "Photography",
  "Waterfalls / Lake",
  "Night Ride",
  "Heritage / Forts",
];

export function RideForm({
  ride,
  imported,
  action,
  onCreated,
}: {
  ride?: {
    id: string;
    title?: string;
    description?: string;
    starts_at?: string;
    meeting_point?: string;
    destination?: string | null;
    itinerary?: { title: string; description?: string; activity?: string }[] | null;
    activities?: string[] | null;
    distance_km?: number | null;
    max_riders?: number | null;
    joining_paused?: boolean;
    difficulty?: string | null;
    status?: string;
    cover_url?: string | null;
    whatsapp_group_url?: string | null;
  };
  action: (prev: RideFormState, formData: FormData) => Promise<RideFormState>;
  onCreated?: (id: string) => void;
  /** Values pasted via the Add-JSON dialog (new-ride mode only). Applied as
      initial values — the admin reviews and saves normally. */
  imported?: RideImport | null;
}) {
  const [state, formAction] = useActionState(action, {} as RideFormState);
  const [isPending, startTransition] = useTransition();

  // Cover photo state
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(ride?.cover_url ?? null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverState, setCoverState] = useState<MediaFormState>({});
  const [isUploadingCover, startCoverTransition] = useTransition();
  const [isRemovingCover, startRemoveCoverTransition] = useTransition();
  const [rawCoverFile, setRawCoverFile] = useState<File | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activities, setActivities] = useState<string[]>(
    ride?.activities && Array.isArray(ride.activities) ? ride.activities : (imported?.activities ?? [])
  );
  const [customActivity, setCustomActivity] = useState("");

  const [itinerary, setItinerary] = useState<{ title: string; description?: string; activity?: string }[]>(
    ride?.itinerary && Array.isArray(ride.itinerary) ? ride.itinerary : (imported?.itinerary ?? [])
  );

  const [prevCoverUrl, setPrevCoverUrl] = useState(ride?.cover_url);
  if (ride?.cover_url !== prevCoverUrl) {
    setPrevCoverUrl(ride?.cover_url);
    if (ride?.cover_url) {
      setCurrentCoverUrl(ride.cover_url);
    }
  }

  const [prevItinerary, setPrevItinerary] = useState(ride?.itinerary);
  if (ride?.itinerary !== prevItinerary) {
    setPrevItinerary(ride?.itinerary);
    if (ride?.itinerary && Array.isArray(ride.itinerary)) {
      setItinerary(ride.itinerary);
    }
  }

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setRawCoverFile(f);
      setIsCropperOpen(true);
      setCoverState({});
    }
  };

  const [isPreparingCrop, setIsPreparingCrop] = useState(false);

  const handleCroppedCoverUpload = (file: File) => {
    setIsCropperOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const preview = URL.createObjectURL(file);
    setCurrentCoverUrl(preview);
    setCoverFile(file);

    if (ride?.id) {
      const fd = new FormData();
      fd.append("cover", file);
      startCoverTransition(async () => {
        try {
          const res = await uploadRideCover(ride.id, {}, fd);
          setCoverState(res);
          if (res.ok) {
            setCurrentCoverUrl(preview);
          }
        } catch (err: unknown) {
          setCoverState({ error: friendlyUploadError(err, "Failed to upload cover.") });
        }
      });
    } else {
      setCoverState({});
    }
  };

  const handleReadjustCover = async () => {
    if (rawCoverFile) {
      setIsCropperOpen(true);
      return;
    }
    if (!currentCoverUrl) return;

    setIsPreparingCrop(true);
    try {
      if (currentCoverUrl.startsWith("blob:")) {
        const res = await fetch(currentCoverUrl);
        const blob = await res.blob();
        const f = new File([blob], "cover-readjust.jpg", { type: blob.type || "image/jpeg" });
        setRawCoverFile(f);
        setIsCropperOpen(true);
      } else if (currentCoverUrl.startsWith("data:")) {
        const f = dataUrlToFile(currentCoverUrl);
        setRawCoverFile(f);
        setIsCropperOpen(true);
      } else {
        const { dataUrl, error } = await fetchRemoteImageDataUrl(currentCoverUrl);
        if (dataUrl) {
          const f = dataUrlToFile(dataUrl);
          setRawCoverFile(f);
          setIsCropperOpen(true);
        } else {
          setCoverState({ error: error || "Could not load image for readjusting. You can upload a new photo." });
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load image for readjusting.";
      setCoverState({ error: message });
    } finally {
      setIsPreparingCrop(false);
    }
  };

  const handleRemoveCurrentCover = () => {
    if (ride?.id) {
      if (!window.confirm("Remove this ride's cover photo?")) return;
      startRemoveCoverTransition(async () => {
        try {
          const res = await removeRideCover(ride.id);
          setCoverState(res);
          if (res.ok) {
            setCurrentCoverUrl(null);
            setCoverFile(null);
            setRawCoverFile(null);
          }
        } catch (err: unknown) {
          setCoverState({ error: friendlyUploadError(err, "Failed to remove cover.") });
        }
      });
    } else {
      setCurrentCoverUrl(null);
      setCoverFile(null);
      setRawCoverFile(null);
      setCoverState({});
    }
  };

  const toggleActivity = (act: string) => {
    setActivities((prev) => {
      if (prev.includes(act)) {
        return prev.filter((a) => a !== act);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, act];
    });
  };

  const handleAddCustomActivity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customActivity.trim();
    if (trimmed && !activities.includes(trimmed)) {
      if (activities.length >= 5) return;
      setActivities((prev) => {
        if (prev.length >= 5) return prev;
        return [...prev, trimmed];
      });
      setCustomActivity("");
    }
  };

  const addItineraryStop = () => {
    setItinerary((prev) => [...prev, { title: "", description: "", activity: "" }]);
  };

  const updateItineraryStop = (
    index: number,
    field: "title" | "description" | "activity",
    value: string
  ) => {
    setItinerary((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeItineraryStop = (index: number) => {
    setItinerary((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (state?.ok && state?.id && onCreated) {
      onCreated(state.id);
    }
  }, [state?.ok, state?.id, onCreated]);

  const datetimeLocal = ride?.starts_at ? toDatetimeLocalIST(ride.starts_at) : (imported?.starts_at ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("itinerary", JSON.stringify(itinerary.filter((s) => s.title.trim())));
        fd.set("activities", JSON.stringify(activities));
        if (coverFile) {
          fd.set("cover_file", coverFile);
        }
        startTransition(() => formAction(fd));
      }}
      className="max-w-xl space-y-3.5 sm:space-y-5"
    >
      <fieldset disabled={isPending} className="min-w-0 space-y-3.5 sm:space-y-5 border-0 m-0 p-0">
        <Field label="Title" htmlFor="title" required>
          <Input
            id="title"
            name="title"
            required
            defaultValue={ride?.title ?? imported?.title ?? ""}
            placeholder="Sunday Morning Ride"
          />
        </Field>

        <Field label="Description" htmlFor="description" required>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={ride?.description ?? imported?.description ?? ""}
            placeholder="Route highlights, pace, stops..."
          />
        </Field>

        <Field label="Starts At (IST)" htmlFor="starts_at" required>
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={datetimeLocal}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          <Field
            label="Assembly / Start Point"
            htmlFor="meeting_point"
            hint="Where riders assemble in Warangal"
            required
          >
            <Input
              id="meeting_point"
              name="meeting_point"
              defaultValue={ride?.meeting_point ?? imported?.meeting_point ?? ""}
              placeholder="e.g. Hanamkonda Fuel Station"
            />
          </Field>

          <Field
            label="Destination"
            htmlFor="destination"
            hint="Where the ride goes"
          >
            <Input
              id="destination"
              name="destination"
              defaultValue={ride?.destination ?? imported?.destination ?? ""}
              placeholder="e.g. Laknavaram Lake or Ladakh"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <Field label="Distance (km)" htmlFor="distance_km" required>
            <Input
              id="distance_km"
              name="distance_km"
              type="number"
              min={1}
              step="any"
              defaultValue={ride?.distance_km != null ? String(ride.distance_km) : (imported?.distance_km != null ? String(imported.distance_km) : "")}
              placeholder="45"
            />
          </Field>
          <Field label="Difficulty" htmlFor="difficulty" required>
            <Select id="difficulty" name="difficulty" defaultValue={ride?.difficulty ?? imported?.difficulty ?? ""}>
              <option value="">Select…</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <Field
            label="Rider Limit (Optional)"
            htmlFor="max_riders"
            hint="Leave empty for unlimited riders"
          >
            <Input
              id="max_riders"
              name="max_riders"
              type="number"
              min={1}
              step={1}
              defaultValue={ride?.max_riders != null ? String(ride.max_riders) : ""}
              placeholder="Unlimited"
            />
          </Field>
          <Field label="Joining" htmlFor="joining_paused" hint="Paused rides show “Registrations Closed” to riders">
            <label
              htmlFor="joining_paused"
              className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs text-secondary sm:h-10"
            >
              <input
                id="joining_paused"
                name="joining_paused"
                type="checkbox"
                value="true"
                defaultChecked={ride?.joining_paused ?? false}
                className="size-4 accent-accent"
              />
              Pause joining
            </label>
          </Field>
        </div>

        <Field
          label="WhatsApp Group Link (Optional)"
          htmlFor="whatsapp_group_url"
          hint="Dedicated convoy chat — unlocked only for approved KYC riders who join this ride"
        >
          <Input
            id="whatsapp_group_url"
            name="whatsapp_group_url"
            type="url"
            defaultValue={ride?.whatsapp_group_url ?? imported?.whatsapp_group_url ?? ""}
            placeholder="https://chat.whatsapp.com/..."
          />
        </Field>

        {/* Cover photo wrapped like Ride Highlights & Activities */}
        <div className="space-y-2.5 sm:space-y-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Camera className="size-4 text-accent" />
            <div>
              <p className="text-xs font-bold tracking-wider text-accent uppercase">
                Cover Photo
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted">
                The face of this ride across the site (16:10 landscape)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-4 sm:gap-6 pt-1">
            {/* Current cover display */}
            <div className="w-full sm:w-56 space-y-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-surface-2">
                {currentCoverUrl ? (
                  <Image
                    src={currentCoverUrl}
                    alt="Current ride cover"
                    fill
                    sizes="(max-width: 640px) 100vw, 224px"
                    className="object-cover"
                  />
                ) : (
                  <p className="flex size-full items-center justify-center text-xs text-muted">No cover</p>
                )}
              </div>
              {currentCoverUrl && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleReadjustCover}
                    disabled={isPreparingCrop || isRemovingCover || isPending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover disabled:opacity-50 transition-colors"
                  >
                    {isPreparingCrop ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Crop className="size-3.5" />
                    )}
                    <span>{isPreparingCrop ? "Loading..." : "Readjust Crop"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveCurrentCover}
                    disabled={isRemovingCover || isPending || isPreparingCrop}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-danger-hover disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    <span>{isRemovingCover ? "Removing..." : "Remove Cover"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Upload form */}
            <div className="flex-1 max-w-md space-y-4">
              {isUploadingCover ? (
                <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
                  <Loader2 className="size-4 animate-spin" />
                  Uploading cover photo...
                </div>
              ) : (
                <div className="space-y-3">
                  <Field
                    label="Choose image file"
                    htmlFor="cover"
                    required
                    hint={`${IMAGE_UPLOAD_HINT} · Adjust and fit in 16:9 directly before upload`}
                  >
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        id="cover"
                        name="cover"
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES}
                        disabled={isPending || isUploadingCover}
                        onChange={handleCoverFileChange}
                        className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-3 file:text-text hover:file:bg-surface-3/80 cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  </Field>

                  {/* Status alerts below input */}
                  {coverState.error && (
                    <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                      {coverState.error}
                    </p>
                  )}
                  {coverState.ok && <p className="text-sm font-semibold text-success">Cover updated successfully.</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        <CoverCropperModal
          isOpen={isCropperOpen}
          file={rawCoverFile}
          applyLabel={ride?.id ? "Upload Cover" : "Apply Cover"}
          onApply={handleCroppedCoverUpload}
          onCancel={() => {
            setIsCropperOpen(false);
            setRawCoverFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        {/* Ride Activities & Highlights */}
        <div className="space-y-2.5 sm:space-y-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold tracking-wider text-accent uppercase">
                  Ride Highlights & Activities
                </p>
                <span className="text-[10px] font-mono text-muted">
                  ({activities.length}/5)
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted">
                Pick up to 5 activities riders will experience (e.g. Campfire, Off-roading, Photography)
              </p>
            </div>
          </div>

          {/* Active tags */}
          {activities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activities.map((act) => (
                <span
                  key={act}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold text-accent"
                >
                  <span>{act}</span>
                  <button
                    type="button"
                    onClick={() => toggleActivity(act)}
                    className="hover:text-white transition-colors"
                    aria-label={`Remove ${act}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-1.5 pt-1 border-t border-border/60">
            <p className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-muted">Quick Suggestions</p>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {POPULAR_ACTIVITIES.map((act) => {
                const isSelected = activities.includes(act);
                const isLimitReached = !isSelected && activities.length >= 5;
                return (
                  <button
                    key={act}
                    type="button"
                    disabled={isLimitReached}
                    onClick={() => toggleActivity(act)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] font-medium transition-all ${
                      isSelected
                        ? "border-accent bg-accent text-accent-fg font-semibold"
                        : isLimitReached
                          ? "border-border/40 bg-surface-2 text-muted/50 cursor-not-allowed opacity-50"
                          : "border-border bg-surface-2 text-secondary hover:border-accent/40 hover:text-white"
                    }`}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{act}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom tag input */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder={
                activities.length >= 5
                  ? "Maximum 5 activities reached"
                  : "Add custom activity tag (e.g. River Crossing)..."
              }
              value={customActivity}
              disabled={activities.length >= 5}
              onChange={(e) => setCustomActivity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomActivity();
                }
              }}
              className="text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={activities.length >= 5 || !customActivity.trim()}
              onClick={() => handleAddCustomActivity()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Route Itinerary / Stops */}
        <div className="space-y-2.5 sm:space-y-3 rounded-xl border border-border bg-surface p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold tracking-wider text-accent uppercase">
                Route Itinerary & Stops
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted">
                Add route stops, scenic viewpoints, or day-by-day plan with specific activities
              </p>
            </div>
          </div>

          {itinerary.length === 0 ? (
            <p className="text-[11px] sm:text-xs text-muted italic">
              No itinerary stops added yet. (e.g. Stop 1: Breakfast at Highway Dhaba, Stop 2: Laknavaram Boating, etc.)
            </p>
          ) : (
            <div className="space-y-2.5 sm:space-y-3 pt-1">
              {itinerary.map((item, idx) => (
                <div
                  key={idx}
                  className="relative rounded-lg border border-border bg-surface-2 p-2.5 sm:p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                      Stop {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItineraryStop(idx)}
                      className="text-muted hover:text-danger p-1 transition-colors"
                      aria-label="Remove stop"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Milestone title (e.g. Day 1: Warangal to Nirmal)"
                      value={item.title}
                      onChange={(e) => updateItineraryStop(idx, "title", e.target.value)}
                    />
                    <Input
                      placeholder="Activity / Type (e.g. Breakfast, Camp, Viewpoint)"
                      value={item.activity ?? ""}
                      onChange={(e) => updateItineraryStop(idx, "activity", e.target.value)}
                    />
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Kilometers mark, scenic highlights, packing tips, or overnight notes..."
                    value={item.description ?? ""}
                    onChange={(e) => updateItineraryStop(idx, "description", e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add Stop button at bottom */}
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItineraryStop}
              className="w-full sm:w-auto"
            >
              <Plus className="size-3.5" />
              <span>Add Stop</span>
            </Button>
          </div>
        </div>

        <Field label="Status" htmlFor="status" required>
          <Select
            id="status"
            name="status"
            defaultValue={ride?.status ?? imported?.status ?? "draft"}
          >
            <option value="draft">Draft (hidden)</option>
            <option value="published">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>

        <p className="text-xs text-muted">
          Gallery and members are managed in sections 02–03 below after the ride creation.
        </p>

        {/* Errors & success alerts displayed directly above submit button */}
        {state.error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-danger">
            {state.error}
          </div>
        )}

        {state.ok && (
          <div className="rounded-lg border border-success/30 bg-success/10 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-success">
            {ride?.id ? "Ride details updated successfully." : "Ride created successfully."}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Saving..." : ride?.id ? "Update Ride" : "Create Ride"}
        </Button>
      </fieldset>
    </form>
  );
}
