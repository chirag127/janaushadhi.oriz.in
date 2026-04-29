/**
 * Search functionality using Fuse.js
 * Provides fuzzy search across medicines and categories
 */

import Fuse from 'fuse.js';
import { medicines } from '../data';

// Fuse.js options optimized for medicine search
const fuseOptions = {
  keys: [
    { name: 'genericName', weight: 0.5 },
    { name: 'drugCode', weight: 0.3 },
    { name: 'groupName', weight: 0.2 }
  ],
  threshold: 0.3,              // Lower = more strict, Higher = more fuzzy
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: true,
  ignoreFieldNorm: true,
};

// Initialize Fuse with medicine data
let fuse: Fuse<any> | null = null;

function initializeFuse() {
  if (!fuse) {
    fuse = new Fuse(medicines, fuseOptions);
  }
  return fuse;
}

/**
 * Search medicines with fuzzy matching
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of matching medicines with score
 */
export function searchMedicines(query: string, limit: number = 20): typeof medicines {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const fuseInstance = initializeFuse();
  const results = fuseInstance.search(query, { limit });

  return results.map(result => ({
    ...result.item,
    _score: result.score,
    _matches: result.matches
  }));
}

/**
 * Get medicine suggestions for autocomplete
 * @param query - Search query
 * @param limit - Number of suggestions
 */
export function getSuggestions(query: string, limit: number = 8): string[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const fuseInstance = initializeFuse();
  const results = fuseInstance.search(query, { limit });

  // Return unique medicine names
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const result of results) {
    const name = result.item.genericName;
    if (!seen.has(name)) {
      seen.add(name);
      suggestions.push(name);
    }
    if (suggestions.length >= limit) break;
  }

  return suggestions;
}

/**
 * Advanced search with filters
 */
export interface SearchFilters {
  category?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  priceOnRequest?: boolean;
  sortBy?: 'name' | 'price-asc' | 'price-desc' | 'drugCode' | 'category';
}

export function advancedSearch(
  query: string,
  filters?: SearchFilters
): typeof medicines {
  let results = searchMedicines(query, 1000);

  // Apply filters
  if (filters) {
    if (filters.category && filters.category.length > 0) {
      results = results.filter(med =>
        filters.category!.includes(med.groupName)
      );
    }

    if (filters.minPrice !== undefined) {
      results = results.filter(med => med.mrp >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter(med => med.mrp <= filters.maxPrice!);
    }

    if (filters.priceOnRequest !== undefined) {
      results = results.filter(med => med.isPriceOnRequest === filters.priceOnRequest);
    }
  }

  // Apply sorting
  if (filters?.sortBy) {
    switch (filters.sortBy) {
      case 'name':
        results.sort((a, b) => a.genericName.localeCompare(b.genericName));
        break;
      case 'price-asc':
        results.sort((a, b) => a.mrp - b.mrp);
        break;
      case 'price-desc':
        results.sort((a, b) => b.mrp - a.mrp);
        break;
      case 'drugCode':
        results.sort((a, b) => parseInt(a.drugCode) - parseInt(b.drugCode));
        break;
      case 'category':
        results.sort((a, b) => a.groupName.localeCompare(b.groupName));
        break;
    }
  }

  return results;
}

/**
 * Get medicine by slug
 */
export function getMedicineBySlug(slug: string): typeof medicines[0] | undefined {
  return medicines.find(med => med.slug === slug);
}

/**
 * Get medicines by category
 */
export function getMedicinesByCategory(categorySlug: string): typeof medicines {
  // First get category name from slug
  // This would need categories mapping - simplified here
  return medicines.filter(med =>
    med.groupName.toLowerCase().replace(/\s+/g, '-') === categorySlug
  );
}

/**
 * Get all unique categories with counts
 */
export function getCategories() {
  const categoryMap = new Map<string, number>();

  for (const med of medicines) {
    categoryMap.set(med.groupName, (categoryMap.get(med.groupName) || 0) + 1);
  }

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      count
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Debounced search for real-time search
 */
export function createDebouncedSearcher(
  callback: (results: any[]) => void,
  delay: number = 300
) {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (query: string) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const results = searchMedicines(query, 10);
      callback(results);
    }, delay);
  };
}
