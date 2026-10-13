"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { CoverCropperModal } from "@/components/admin/cover-cropper-modal";
import { toDatetimeLocalIST } from "@/lib/format";
import type { RideFormState } from "../actions";

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
  action,
  onCreated,
}: {
  ride?: {
    id: string;
    title: string;
    description: string;
    starts_at: string;
    meeting_point: string;
    destination?: string | null;
    itinerary?: { title: string; description?: string; activity?: string }[] | null;
    activities?: string[] | null;
    distance_km: number | null;
    difficulty: string | null;
    status: string;
  };
  action: (prev: RideFormState, formData: FormData) => Promise<RideFormState>;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, {} as RideFormState);
  const [isPending, startTransition] = useTransition();

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [itinerary, setItinerary] = useState<{ title: string; description?: string; activity?: string }[]>(
    ride?.itinerary && Array.isArray(ride.itinerary) ? ride.itinerary : []
  );
  const [activities, setActivities] = useState<string[]>(
    ride?.activities && Array.isArray(ride.activities) ? ride.activities : []
  );
  const [customActivity, setCustomActivity] = useState("");

  const toggleActivity = (act: string) => {
    setActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleAddCustomActivity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customActivity.trim();
    if (trimmed && !activities.includes(trimmed)) {
      setActivities((prev) => [...prev, trimmed]);
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
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setRawFile(f);
      setIsCropperOpen(true);
    }
  };

  const handleCroppedApply = (file: File, url: string) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCroppedFile(file);
    setPreviewUrl(url);
    setIsCropperOpen(false);
  };

  const handleClearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRawFile(null);
    setCroppedFile(null);
    setPreviewUrl(null);
    setIsCropperOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (state?.ok) {
      // New-page flow stays on screen for phase 2; everywhere else navigates only when next is set.
      if (state?.id && onCreated) onCreated(state.id);
      else if (state?.next) router.push(state.next);
    }
  }, [state?.ok, state?.next, state?.id, onCreated, router]);

  const datetimeLocal = ride ? toDatetimeLocalIST(ride.starts_at) : "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (croppedFile) {
          fd.set("cover_file", croppedFile);
        } else {
          fd.delete("cover_file");
        }
        fd.set("itinerary", JSON.stringify(itinerary.filter((s) => s.title.trim())));
        fd.set("activities", JSON.stringify(activities));
        startTransition(() => formAction(fd));
      }}
      className="max-w-xl space-y-5"
    >
      {state.error && (
        <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </div>
      )}

      {state.ok && !state.next && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          Ride details updated successfully.
        </div>
      )}

      <fieldset disabled={isPending} className="min-w-0 space-y-5 border-0 m-0 p-0">
        <Field label="Title" htmlFor="title" required>
          <Input
            id="title"
            name="title"
            required
            defaultValue={ride?.title ?? ""}
            placeholder="Sunday Morning Ride"
          />
        </Field>

        <Field label="Description" htmlFor="description" required>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={ride?.description ?? ""}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Assembly / Start Point"
            htmlFor="meeting_point"
            hint="Where riders assemble in Warangal"
            required
          >
            <Input
              id="meeting_point"
              name="meeting_point"
              defaultValue={ride?.meeting_point ?? ""}
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
              defaultValue={ride?.destination ?? ""}
              placeholder="e.g. Laknavaram Lake or Ladakh"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Distance (km)" htmlFor="distance_km" required>
            <Input
              id="distance_km"
              name="distance_km"
              type="number"
              min={1}
              step="any"
              defaultValue={ride?.distance_km != null ? String(ride.distance_km) : ""}
              placeholder="45"
            />
          </Field>
          <Field label="Difficulty" htmlFor="difficulty" required>
            <Select id="difficulty" name="difficulty" defaultValue={ride?.difficulty ?? ""}>
              <option value="">Select…</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
            </Select>
          </Field>
        </div>

        <Field label="Status" htmlFor="status" required>
          <Select id="status" name="status" defaultValue={ride?.status ?? "draft"}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Upcoming (public)</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>

        {/* Ride Activities & Highlights */}
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" />
            <div>
              <p className="text-xs font-bold tracking-wider text-accent uppercase">
                Ride Highlights & Activities
              </p>
              <p className="text-[11px] text-muted">
                Pick or add activities riders will experience (e.g. Campfire, Off-roading, Photography)
              </p>
            </div>
          </div>

          {/* Active tags */}
          {activities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activities.map((act) => (
                <span
                  key={act}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent"
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
            <p className="text-[10px] uppercase font-mono tracking-wider text-muted">Quick Suggestions</p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_ACTIVITIES.map((act) => {
                const isSelected = activities.includes(act);
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => toggleActivity(act)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                      isSelected
                        ? "border-accent bg-accent text-accent-fg font-semibold"
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
              placeholder="Add custom activity tag (e.g. River Crossing)..."
              value={customActivity}
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
              onClick={() => handleAddCustomActivity()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Route Itinerary / Stops */}
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-accent uppercase">
                Route Itinerary & Stops (Optional)
              </p>
              <p className="text-[11px] text-muted">
                Add route stops, scenic viewpoints, or day-by-day plan with specific activities
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItineraryStop}
            >
              <Plus className="size-3.5" />
              Add Stop / Day
            </Button>
          </div>

          {itinerary.length === 0 ? (
            <p className="text-xs text-muted italic">
              No itinerary stops added yet. (e.g. Stop 1: Breakfast at Highway Dhaba, Stop 2: Laknavaram Boating, etc.)
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              {itinerary.map((item, idx) => (
                <div
                  key={idx}
                  className="relative rounded-lg border border-border bg-surface-2 p-3 space-y-2"
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
        </div>


        {!ride && (
          <div className="space-y-3">
            <Field
              label="Cover photo"
              htmlFor="cover_file"
              hint="JPEG or WebP, max 10 MB · Interactive 16:10 adjustment tool opens automatically"
            >
              {!croppedFile ? (
                <input
                  ref={fileInputRef}
                  id="cover_file"
                  name="cover_file"
                  type="file"
                  accept="image/jpeg,image/webp"
                  onChange={handleFileChange}
                  disabled={isPending}
                  className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-3 file:text-text hover:file:bg-surface-3/80 cursor-pointer disabled:opacity-50"
                />
              ) : (
                <div className="space-y-2">
                  <div className="relative aspect-16/10 w-full max-w-sm overflow-hidden rounded-xl border-2 border-accent/60 bg-black">
                    {previewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="Adjusted cover preview" className="size-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:bg-black transition-colors"
                      aria-label="Clear selection"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsCropperOpen(true)}
                      disabled={isPending}
                    >
                      <SlidersHorizontal className="size-3.5" />
                      Re-adjust
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      disabled={isPending}
                      className="text-muted hover:text-danger hover:border-danger/40"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </Field>

            <CoverCropperModal
              isOpen={isCropperOpen}
              file={rawFile}
              onApply={handleCroppedApply}
              onCancel={() => {
                setIsCropperOpen(false);
                if (!croppedFile) {
                  handleClearSelection();
                }
              }}
            />
          </div>
        )}

        <p className="text-xs text-muted">
          {ride
            ? "Cover photo and gallery are managed in sections 02–03 below."
            : "Gallery photos can be added after the ride is created."}
        </p>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : ride ? "Update Ride" : "Create Ride"}
        </Button>
      </fieldset>
    </form>
  );
}
