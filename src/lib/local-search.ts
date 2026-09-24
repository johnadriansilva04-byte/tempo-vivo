// Sistema de Busca Indexada Local 100% Local
// Sem dependências externas

type SearchableItem = {
  id: string;
  type: 'log' | 'project' | 'milestone' | 'achievement' | 'note';
  title: string;
  content: string;
  tags: string[];
  date: string;
  metadata?: Record<string, any>;
};

type SearchResult = {
  item: SearchableItem;
  score: number;
  highlights: string[];
};

class LocalSearch {
  private index: Map<string, SearchableItem> = new Map();
  private searchableFields: string[] = ['title', 'content', 'tags'];
  private readonly STORAGE_KEY = 'perfil-vivo:search-index';

  constructor() {
    this.loadIndex();
  }

  private loadIndex() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const indexObj = JSON.parse(stored);
        Object.entries(indexObj).forEach(([id, item]) => {
          this.index.set(id, item as SearchableItem);
        });
      }
    } catch (e) {
      console.error('Error loading search index:', e);
    }
  }

  private saveIndex() {
    try {
      const indexObj = Object.fromEntries(this.index);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(indexObj));
    } catch (e) {
      console.error('Error saving search index:', e);
    }
  }

  // Add item to index
  indexItem(item: SearchableItem): void {
    this.index.set(item.id, item);
    this.saveIndex();
  }

  // Remove item from index
  removeItem(id: string): void {
    this.index.delete(id);
    this.saveIndex();
  }

  // Update item in index
  updateItem(item: SearchableItem): void {
    this.index.set(item.id, item);
    this.saveIndex();
  }

  // Bulk index items
  bulkIndex(items: SearchableItem[]): void {
    items.forEach(item => {
      this.index.set(item.id, item);
    });
    this.saveIndex();
  }

  // Clear index
  clearIndex(): void {
    this.index.clear();
    this.saveIndex();
  }

  // Search with scoring
  search(query: string, options?: {
    limit?: number;
    filters?: {
      type?: SearchableItem['type'];
      dateFrom?: string;
      dateTo?: string;
      tags?: string[];
    };
  }): SearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase();
    const queryTerms = normalizedQuery.split(/\s+/);
    const results: SearchResult[] = [];

    for (const [id, item] of this.index) {
      // Apply filters
      if (options?.filters) {
        if (options.filters.type && item.type !== options.filters.type) continue;
        if (options.filters.dateFrom && new Date(item.date) < new Date(options.filters.dateFrom)) continue;
        if (options.filters.dateTo && new Date(item.date) > new Date(options.filters.dateTo)) continue;
        if (options.filters.tags && !options.filters.tags.some(tag => item.tags.includes(tag))) continue;
      }

      const result = this.calculateScore(item, queryTerms);
      if (result.score > 0) {
        results.push(result);
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    if (options?.limit) {
      return results.slice(0, options.limit);
    }

    return results;
  }

  private calculateScore(item: SearchableItem, queryTerms: string[]): SearchResult {
    let score = 0;
    const highlights: string[] = [];

    for (const term of queryTerms) {
      // Title match (highest weight)
      if (item.title.toLowerCase().includes(term)) {
        score += 10;
        if (!highlights.includes(item.title)) {
          highlights.push(item.title);
        }
      }

      // Content match (medium weight)
      if (item.content.toLowerCase().includes(term)) {
        score += 5;
        const contentMatch = this.extractHighlight(item.content, term);
        if (contentMatch && !highlights.includes(contentMatch)) {
          highlights.push(contentMatch);
        }
      }

      // Tags match (high weight)
      if (item.tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 8;
        const matchingTag = item.tags.find(tag => tag.toLowerCase().includes(term));
        if (matchingTag && !highlights.includes(matchingTag)) {
          highlights.push(matchingTag);
        }
      }

      // Exact phrase match (bonus)
      if (item.title.toLowerCase() === term) {
        score += 15;
      }
    }

    // Boost recent items
    const daysSinceItem = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceItem < 7) {
      score += 2;
    } else if (daysSinceItem < 30) {
      score += 1;
    }

    return {
      item,
      score,
      highlights: highlights.slice(0, 3),
    };
  }

  private extractHighlight(content: string, term: string): string | null {
    const index = content.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return null;

    const start = Math.max(0, index - 20);
    const end = Math.min(content.length, index + term.length + 20);
    let highlight = content.substring(start, end);

    if (start > 0) highlight = '...' + highlight;
    if (end < content.length) highlight = highlight + '...';

    return highlight;
  }

  // Search by type
  searchByType(type: SearchableItem['type'], query: string): SearchResult[] {
    return this.search(query, { filters: { type } });
  }

  // Search by tags
  searchByTags(tags: string[], query: string = ''): SearchResult[] {
    const results = this.search(query, { filters: { tags } });
    return results;
  }

  // Search by date range
  searchByDateRange(dateFrom: string, dateTo: string, query: string = ''): SearchResult[] {
    return this.search(query, { filters: { dateFrom, dateTo } });
  }

  // Get suggestions
  getSuggestions(query: string, limit: number = 5): string[] {
    const results = this.search(query, { limit: limit * 2 });
    const suggestions = new Set<string>();

    results.forEach(result => {
      suggestions.add(result.item.title);
      result.item.tags.forEach(tag => suggestions.add(tag));
    });

    return Array.from(suggestions).slice(0, limit);
  }

  // Get all items by type
  getItemsByType(type: SearchableItem['type']): SearchableItem[] {
    return Array.from(this.index.values()).filter(item => item.type === type);
  }

  // Get all tags
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.index.forEach(item => {
      item.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  // Get index stats
  getIndexStats(): {
    totalItems: number;
    itemsByType: Record<string, number>;
    totalTags: number;
  } {
    const itemsByType: Record<string, number> = {};
    const tags = new Set<string>();

    this.index.forEach(item => {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
      item.tags.forEach(tag => tags.add(tag));
    });

    return {
      totalItems: this.index.size,
      itemsByType,
      totalTags: tags.size,
    };
  }

  // Rebuild index from data
  rebuildIndex(items: SearchableItem[]): void {
    this.clearIndex();
    this.bulkIndex(items);
  }

  // Export index
  exportIndex(): string {
    const indexObj = Object.fromEntries(this.index);
    return JSON.stringify(indexObj, null, 2);
  }

  // Import index
  importIndex(json: string): void {
    try {
      const indexObj = JSON.parse(json);
      this.index.clear();
      Object.entries(indexObj).forEach(([id, item]) => {
        this.index.set(id, item as SearchableItem);
      });
      this.saveIndex();
    } catch (e) {
      throw new Error('Invalid index format');
    }
  }
}

// Singleton instance
export const localSearch = new LocalSearch();

// React hook for search
export function useLocalSearch() {
  return {
    index: (item: SearchableItem) => localSearch.indexItem(item),
    remove: (id: string) => localSearch.removeItem(id),
    update: (item: SearchableItem) => localSearch.updateItem(item),
    bulkIndex: (items: SearchableItem[]) => localSearch.bulkIndex(items),
    clear: () => localSearch.clearIndex(),
    search: (query: string, options?: any) => localSearch.search(query, options),
    searchByType: (type: SearchableItem['type'], query: string) => 
      localSearch.searchByType(type, query),
    searchByTags: (tags: string[], query?: string) => 
      localSearch.searchByTags(tags, query),
    searchByDateRange: (dateFrom: string, dateTo: string, query?: string) => 
      localSearch.searchByDateRange(dateFrom, dateTo, query),
    getSuggestions: (query: string, limit?: number) => 
      localSearch.getSuggestions(query, limit),
    getItemsByType: (type: SearchableItem['type']) => 
      localSearch.getItemsByType(type),
    getAllTags: () => localSearch.getAllTags(),
    getStats: () => localSearch.getIndexStats(),
    rebuild: (items: SearchableItem[]) => localSearch.rebuildIndex(items),
    export: () => localSearch.exportIndex(),
    import: (json: string) => localSearch.importIndex(json),
  };
}

export type { SearchableItem, SearchResult };