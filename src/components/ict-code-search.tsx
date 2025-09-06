
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { searchIctCodes } from "@/app/dashboard/patients/actions";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface IctCodeSearchProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
}

export function IctCodeSearch({ name, defaultValue = "", required = false }: IctCodeSearchProps) {
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [results, setResults] = useState<{ shortcode: string; description: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectionMade = useRef(false);

  const handleSearch = useCallback(async () => {
    if (debouncedSearchQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const codes = await searchIctCodes(debouncedSearchQuery);
    setResults(codes);
    setIsLoading(false);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If user clicks outside without making a selection, reset to last valid selection
        if (!isSelectionMade.current) {
            setSearchQuery(selectedValue);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedValue]);

  const handleSelect = (code: { shortcode: string; description: string }) => {
    const fullValue = `${code.shortcode} - ${code.description}`;
    setSelectedValue(fullValue);
    setSearchQuery(fullValue);
    setIsOpen(false);
    isSelectionMade.current = true;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      if(!isOpen) setIsOpen(true);
      isSelectionMade.current = false;
  }

  const handleBlur = () => {
      // Small timeout to allow click event on dropdown to register
      setTimeout(() => {
          if (!isSelectionMade.current) {
              setSearchQuery(selectedValue);
          }
      }, 150);
  }

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" name={name} value={selectedValue} />
      <Input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        required={required}
        placeholder="Search ICD-10 codes..."
        autoComplete="off"
      />
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && <div className="p-2 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          {!isLoading && debouncedSearchQuery.length > 1 && results.length === 0 && <div className="p-2 text-sm text-muted-foreground">No results found.</div>}
          <ul>
            {results.map((code) => (
              <li
                key={code.shortcode}
                className="p-2 hover:bg-accent cursor-pointer"
                onMouseDown={() => handleSelect(code)}
              >
                <div className="font-semibold">{code.shortcode}</div>
                <div className="text-sm text-muted-foreground">{code.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
