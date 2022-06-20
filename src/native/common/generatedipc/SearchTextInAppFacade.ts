/* generated file, don't edit. */

import {Result} from "./Result.js"
/**
 * Operations for in-app search.
 */
export interface SearchTextInAppFacade {

	findInPage(
		searchTerm: string,
		forward: boolean,
		matchCase: boolean,
		findNext: boolean,
	): Promise<Result | null>
	
	stopFindInPage(
	): Promise<void>
	
	setSearchOverlayState(
		isFocused: boolean,
		force: boolean,
	): Promise<void>
	
}
