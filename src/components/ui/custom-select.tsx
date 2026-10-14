"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  group?: string;
}

export interface CustomSelectProps {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  options?: readonly (string | CustomSelectOption)[];
  groups?: Record<string, readonly (string | CustomSelectOption)[]>;
  searchable?: boolean;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

export function CustomSelect({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  placeholder = "Select an option…",
  options = [],
  groups,
  searchable = false,
  required = false,
  disabled = false,
  onChange,
  className,
}: CustomSelectProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    controlledValue !== undefined ? controlledValue : defaultValue
  );
  const currentValue = isControlled ? controlledValue : internalValue;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, searchable]);

  // Normalize options into CustomSelectOption array
  const normalizedOptions: CustomSelectOption[] = useMemo(() => {
    const list: CustomSelectOption[] = [];
    if (groups) {
      for (const [groupName, items] of Object.entries(groups)) {
        for (const item of items) {
          if (typeof item === "string") {
            list.push({
              value: item,
              label: item,
              group: groupName,
            });
          } else {
            list.push({
              ...item,
              group: item.group || groupName,
            });
          }
        }
      }
    }

    if (options && options.length > 0) {
      for (const opt of options) {
        if (typeof opt === "string") {
          list.push({ value: opt, label: opt });
        } else {
          list.push(opt);
        }
      }
    }

    return list;
  }, [options, groups]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        (opt.group && opt.group.toLowerCase().includes(q))
    );
  }, [normalizedOptions, search]);

  // Group filtered options if grouping exists
  const groupedFilteredOptions = useMemo(() => {
    const hasGroups = filteredOptions.some((opt) => opt.group);
    if (!hasGroups) return null;

    const map: Record<string, CustomSelectOption[]> = {};
    for (const opt of filteredOptions) {
      const g = opt.group || "Other";
      if (!map[g]) map[g] = [];
      map[g].push(opt);
    }
    return map;
  }, [filteredOptions]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === currentValue);
  }, [normalizedOptions, currentValue]);

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    setIsOpen(false);
    setSearch("");
    onChange?.(val);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full scroll-mt-28", className)}>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        id={id}
        value={currentValue}
        required={required}
      />

      {/* Trigger Button */}
      <button
        type="button"
        id={id ? `${id}-trigger` : undefined}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => {
            if (prev) setSearch("");
            return !prev;
          });
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 sm:px-3.5 sm:py-2.5 text-left text-xs sm:text-sm text-text transition-all scroll-mt-28",
          "hover:border-border-strong hover:bg-surface-2",
          "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40",
          isOpen && "border-accent ring-1 ring-accent/40 bg-surface-2",
          disabled && "cursor-not-allowed opacity-50 hover:border-border hover:bg-surface"
        )}
      >
        <div className="flex flex-col min-w-0 pr-2">
          {selectedOption ? (
            <span className="truncate font-medium text-text">
              {selectedOption.label}
            </span>
          ) : (
            <span className="truncate text-muted">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-200",
            isOpen && "rotate-180 text-accent"
          )}
          aria-hidden
        />
      </button>

      {/* Custom Dropdown Sheet / Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-hidden rounded-xl border border-border-strong bg-surface-2 p-1.5 shadow-2xl backdrop-blur-md animate-dropdown origin-top"
        >
          {/* Optional Search Input */}
          {searchable && (
            <div className="relative mb-1.5 border-b border-border/80 pb-1.5">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search options…"
                className="w-full rounded-lg bg-surface px-8 py-1.5 text-xs text-text placeholder:text-muted focus:border-accent focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-muted hover:text-text"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Options Scrollable List */}
          <div className="max-h-56 overflow-y-auto overscroll-contain space-y-0.5 pr-0.5">
            {groupedFilteredOptions ? (
              Object.entries(groupedFilteredOptions).map(([groupTitle, items]) => (
                <div key={groupTitle} className="pt-1 first:pt-0">
                  <div className="px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent/80">
                    {groupTitle}
                  </div>
                  {items.map((opt) => {
                    const isSelected = currentValue === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                          isSelected
                            ? "bg-accent/15 text-accent font-semibold"
                            : "text-text hover:bg-surface-3 hover:text-accent"
                        )}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="text-[11px] text-muted leading-tight mt-0.5">
                              {opt.sublabel}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="size-3.5 shrink-0 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = currentValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "flex w-full items-start justify-between rounded-lg px-3 py-2 text-left text-xs sm:text-sm transition-colors",
                      isSelected
                        ? "bg-accent/15 text-accent font-semibold"
                        : "text-text hover:bg-surface-3 hover:text-accent"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="leading-snug">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-xs text-muted leading-normal mt-0.5">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="size-4 shrink-0 text-accent mt-0.5" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-muted">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
