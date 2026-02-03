"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface Category {
  id: string;
  label: string;
  icon: React.ReactNode | null;
}

interface CategoryDropdownProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  placeholder?: string;
}

export function CategoryDropdown({
  categories,
  activeCategory,
  onCategoryChange,
  placeholder = "Select category",
}: CategoryDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((cat) => cat.id === activeCategory);

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

  return (
    <div className="relative w-[95%] mx-auto" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full py-3 px-6 rounded-full overflow-hidden flex items-center justify-between gap-3 transition-all duration-300 group cursor-pointer relative border border-amber-600/30"
      >
        {/* Gradient Background */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300 group-hover:brightness-110"
          style={{
            background:
              "linear-gradient(90deg, #f97316 0%, #fb923c 50%, #f97316 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
          {selectedCategory?.icon && (
            <span className="shrink-0 w-5 h-5 text-white transition-all duration-300 group-hover:scale-105">
              {selectedCategory.icon}
            </span>
          )}
          <span className="truncate text-sm font-medium text-white transition-all duration-300 group-hover:font-semibold group-hover:scale-105 group-hover:translate-x-1">
            {selectedCategory?.label || placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-white shrink-0 transition-all duration-300 relative z-10 ${dropdownOpen ? "rotate-180" : "group-hover:rotate-90"
            }`}
        />
      </button>
      {dropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="max-h-125 overflow-y-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  onCategoryChange(category.id);
                  setDropdownOpen(false);
                }}
                className={`w-full px-5 py-4 flex items-center gap-3 text-sm font-medium transition-all duration-200 text-left cursor-pointer group ${activeCategory === category.id
                  ? "bg-amber-800/5  text-white"
                  : "text-white/70 hover:text-white hover:bg-amber-800/10 hover:translate-x-1"
                  }`}
              >
                {category.icon && (
                  <span
                    className={`shrink-0 w-5 h-5 transition-colors ${activeCategory === category.id
                      ? "text-amber-600"
                      : "text-white/60 group-hover:text-white"
                      }`}
                  >
                    {category.icon}
                  </span>
                )}
                <span className="flex-1">{category.label}</span>
                {activeCategory === category.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
