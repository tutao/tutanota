/* generated file, don't edit. */

import { Result } from "./Result.js"
/**
 * Operations for in-app search.
 */
export interface SearchTextInAppFacade {
	/**
	 * send a search request to the native search api on the current window
	 */
	findInPage(searchTerm: string, forward: boolean, matchCase: boolean, findNext: boolean): Promise<Result | null>

	/**
	 * cancel all previously sent search requests
	 */
	stopFindInPage(): Promise<void>

	/**
	 * make current overlay state known to properly handle key events
	 */
	setSearchOverlayState(isFocused: boolean, force: boolean): Promise<void>
}
