"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { POPULAR_MOTORCYCLES } from "@/lib/motorcycles";
import { Bike, Check, ChevronsUpDown } from "lucide-react";

interface MotorcycleComboboxProps {
  id?: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}

export function MotorcycleCombobox({
  id = "bike_model",
  name = "bike_model",
  defaultValue = "",
  required = false,
  placeholder = "e.g. Royal Enfield Himalayan 450",
}: MotorcycleComboboxProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevDefault, setPrevDefault] = useState(defaultValue);
  if (defaultValue !== prevDefault) {
    setPrevDefault(defaultValue);
    setValue(defaultValue);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) {
      return POPULAR_MOTORCYCLES.slice(0, 35);
    }
    return POPULAR_MOTORCYCLES.filter((bike) => bike.toLowerCase().includes(q));
  }, [value]);

  const selectBike = (bike: string) => {
    setValue(bike);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          required={required}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 pr-10 text-sm text-text placeholder:text-white/20 focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-text transition-colors"
          aria-label="Toggle motorcycle suggestions"
        >
          <ChevronsUpDown className="size-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-surface-2 p-1.5 shadow-2xl backdrop-blur-md">
          <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Popular Motorcycle Models ({filtered.length})
          </div>

          {filtered.length > 0 ? (
            <div className="space-y-0.5 mt-1">
              {filtered.map((bike) => {
                const isSelected = value.trim().toLowerCase() === bike.toLowerCase();
                return (
                  <button
                    key={bike}
                    type="button"
                    onClick={() => selectBike(bike)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-accent/15 text-accent font-medium"
                        : "text-text hover:bg-surface-3 hover:text-accent"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Bike className="size-3.5 text-muted shrink-0" />
                      <span className="truncate">{bike}</span>
                    </span>
                    {isSelected && <Check className="size-3.5 text-accent shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-3 text-xs text-muted">
              No matching preset found. Custom bike{" "}
              <span className="font-semibold text-text">&ldquo;{value}&rdquo;</span> will be saved.
            </div>
          )}

          {value.trim() && !POPULAR_MOTORCYCLES.includes(value.trim()) && filtered.length > 0 && (
            <div className="mt-1 border-t border-border/60 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-md px-3 py-1.5 text-left text-xs text-secondary hover:bg-surface-3 hover:text-text transition-colors"
              >
                Use custom entry: <strong className="text-text font-medium">&ldquo;{value}&rdquo;</strong>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
