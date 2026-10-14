"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { updateRideItinerary } from "../../../actions";

interface ItineraryItem {
  title: string;
  description?: string;
  activity?: string;
}

export function ItineraryManager({
  rideId,
  initialItinerary = [],
}: {
  rideId: string | null;
  initialItinerary?: ItineraryItem[];
}) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(
    Array.isArray(initialItinerary) ? initialItinerary : []
  );
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const addItineraryStop = () => {
    setItinerary((prev) => [...prev, { title: "", description: "", activity: "" }]);
    setStatus(null);
  };

  const updateItineraryStop = (
    index: number,
    field: "title" | "description" | "activity",
    value: string
  ) => {
    setItinerary((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    setStatus(null);
  };

  const removeItineraryStop = (index: number) => {
    setItinerary((prev) => prev.filter((_, i) => i !== index));
    setStatus(null);
  };

  const handleSave = () => {
    setStatus(null);

    if (!rideId) {
      setStatus({
        type: "error",
        text: "Please save ride details in Section 01 first before saving itinerary stops.",
      });
      return;
    }

    startTransition(async () => {
      const res = await updateRideItinerary(rideId, itinerary);
      if (res.ok) {
        setStatus({
          type: "success",
          text: "Route itinerary and stops saved successfully.",
        });
      } else {
        setStatus({
          type: "error",
          text: res.error || "Failed to save itinerary stops.",
        });
      }
    });
  };

  return (
    <div className="max-w-xl space-y-4">
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

      {status && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            status.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          {status.text}
        </p>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={isPending}
      >
        {isPending ? "Saving..." : "Save Itinerary"}
      </Button>
    </div>
  );
}
