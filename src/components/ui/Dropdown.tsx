"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { LuChevronDown } from "react-icons/lu";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "children"> {
  error?: string;
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ className, error, label, options, value, onChange, disabled, placeholder, ...props }, ref) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const displayText = selectedOption?.label || placeholder || "Select...";

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setDropdownOpen(false);
        }
      };

      if (dropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [dropdownOpen]);

    const handleOptionClick = (optionValue: string) => {
      if (onChange) {
        const syntheticEvent = {
          target: { value: optionValue },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
      setDropdownOpen(false);
    };

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label className="block mb-1.5">
            <span className="text-xs text-muted-foreground">{label}</span>
          </label>
        )}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setDropdownOpen(!dropdownOpen)}
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2.5 text-sm border border-white/20 rounded-lg bg-white/5 text-foreground disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-all duration-200 hover:bg-white/10 hover:border-amber-600/40 flex items-center justify-between gap-2 text-left",
              error && "border-destructive/50 focus:ring-destructive/50 focus:border-destructive",
              className
            )}
            aria-describedby={error ? `${props.id}-error` : undefined}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <span className="truncate flex-1">{displayText}</span>
            <LuChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
                dropdownOpen && "rotate-180"
              )}
            />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    className={cn(
                      "w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-left cursor-pointer group",
                      value === option.value
                        ? "bg-white/5  text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 group-hover:translate-x-1">
                      <span className="flex-1">{option.label}</span>
                      {value === option.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-200 shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-1 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Dropdown.displayName = "Dropdown";

export { Dropdown };
