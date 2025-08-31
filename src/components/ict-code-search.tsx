
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
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<{ shortcode: string; description: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async () => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const codes = await searchIctCodes(debouncedQuery);
    setResults(codes);
    setIsLoading(false);
  }, [debouncedQuery]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (shortcode: string) => {
    setQuery(shortcode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        type="text"
        name={name}
        value={query}
        onChange={(e) => {
            setQuery(e.target.value);
            if(!isOpen) setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        required={required}
        placeholder="Search ICD-10 codes..."
        autoComplete="off"
      />
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading && <div className="p-2 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          {!isLoading && debouncedQuery.length > 1 && results.length === 0 && <div className="p-2 text-sm text-muted-foreground">No results found.</div>}
          <ul>
            {results.map((code) => (
              <li
                key={code.shortcode}
                className="p-2 hover:bg-accent cursor-pointer"
                onClick={() => handleSelect(code.shortcode)}
              >
                <div className="text-sm">{code.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
