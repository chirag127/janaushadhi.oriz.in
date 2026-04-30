// src/components/SearchBar.tsx
//
// React Island: Search bar with Fuse.js fuzzy search
// Used in header and dedicated search page

import { useState, useEffect, useRef } from 'react';
import { searchMedicines, getSuggestions } from '../lib/search';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  variant?: 'inline' | 'modal' | 'full';
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search medicines...',
  autoFocus = false,
  className = '',
  variant = 'inline'
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        const sug = getSuggestions(query, 8);
        setSuggestions(sug);

        if (variant === 'full') {
          const searchResults = searchMedicines(query, 20);
          setResults(searchResults);
        }
      } else {
        setSuggestions([]);
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, variant]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(false);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      window.location.href = `/search?q=${encodeURIComponent(suggestion)}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = suggestions.length > 0 ? suggestions : results.map(r => r.genericName);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(items[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && (query.trim().length >= 2 || suggestions.length > 0 || results.length > 0);

  return (
    <div
      ref={containerRef}
      className={`search-bar search-bar--${variant} ${className}`}
      style={{ position: 'relative' }}
    >
      <div className="search-input-wrapper">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="search-input"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
        />

        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setResults([]);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="search-dropdown" id="search-suggestions" role="listbox">
          {suggestions.length > 0 && (
            <div className="suggestion-section">
              <h3 className="suggestion-title">Suggestions</h3>
              <ul className="suggestion-list">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={`suggestion-${suggestion}`}
                    id={`suggestion-${index}`}
                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {variant === 'full' && results.length > 0 && (
            <div className="results-section">
              <h3 className="suggestion-title">Results ({results.length})</h3>
              <ul className="suggestion-list">
                {results.slice(0, 10).map((result, index) => (
                  <li
                    key={`result-${result.slug}`}
                    id={`result-${index}`}
                    className={`suggestion-item suggestion-item--result ${suggestions.length + index === selectedIndex ? 'selected' : ''}`}
                    role="option"
                    aria-selected={suggestions.length + index === selectedIndex}
                    onClick={() => {
                      window.location.href = `/medicines/${result.slug}`;
                    }}
                  >
                    <div className="result-info">
                      <span className="result-name">{result.genericName}</span>
                      <span className="result-meta">
                        {result.drugCode} • {result.unitSize}
                        {result.isPriceOnRequest && <span className="badge-price-on-request"> POR </span>}
                        {!result.isPriceOnRequest && <span className="result-price">₹{result.mrp.toFixed(2)}</span>}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showDropdown && suggestions.length === 0 && results.length === 0 && (
            <div className="no-results">
              <p>No medicines found for "{query}"</p>
              <a href={`/medicines`} className="browse-link">
                Browse all medicines
              </a>
            </div>
          )}

          {variant === 'full' && results.length > 0 && (
            <div className="view-all-container">
              <a href={`/search?q=${encodeURIComponent(query)}`} className="view-all-link">
                View all {results.length} results →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
