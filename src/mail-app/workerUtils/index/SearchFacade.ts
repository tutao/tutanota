import type { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes.js"

/**
 * Local search functions
 */
export interface SearchFacade {
	search(query: string, restriction: SearchRestriction, minSuggestionCount: number, maxResults?: number): Promise<SearchResult>
	getMoreSearchResults(searchResult: SearchResult, moreResultCount: number): Promise<SearchResult>
}
