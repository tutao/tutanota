/* generated file, don't edit. */

import {Result} from "./Result.js"
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
