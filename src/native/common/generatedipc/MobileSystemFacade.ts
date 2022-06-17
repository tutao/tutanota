/* generated file, don't edit. */

import {NativeContact} from "./NativeContact.js"
export interface MobileSystemFacade {

	findSuggestions(
		query: string,
	): Promise<ReadonlyArray<NativeContact>>
	
	openLink(
		uri: string,
	): Promise<boolean>
	
	shareText(
		text: string,
		title: string,
	): Promise<boolean>
	
	getLog(
	): Promise<string>
	
}
