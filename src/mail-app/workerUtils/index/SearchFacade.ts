import type { SearchRestriction, SearchResult } from "../../../common/api/worker/search/SearchTypes.js"

/**
 * Local search functions
 */
export interface SearchFacade {
	/**
	 * Search for entries.
	 *
	 * The returned results will match {@link query} and {@link restriction}.
	 *
	 * Note that {@link maxResults} is intended to be used as an optimization and not a hard limit. The implementation
	 * can freely ignore this value and return more or even all results.
	 *
	 * @param query search string
	 * @param restriction search parameters
	 * @param minSuggestionCount
	 * @param maxResults desired number of results, or unlimited if left undefined
	 */
	search(query: string, restriction: SearchRestriction, minSuggestionCount: number, maxResults?: number): Promise<SearchResult>

	/**
	 * Get more search results in case search did not return everything.
	 *
	 * This may be a no-op on some implementations which would return everything upfront anyway.
	 *
	 * @param searchResult search result from search()
	 * @param moreResultCount number of results
	 */
	getMoreSearchResults(searchResult: SearchResult, moreResultCount: number): Promise<SearchResult>
}
