/* generated file, don't edit. */

import { NativeContact } from "./NativeContact.js"
/**
 * Common operations implemented by each mobile platform.
 */
export interface MobileSystemFacade {
	/**
	 * Find suggestions in the OS contact provider.
	 */
	findSuggestions(query: string): Promise<ReadonlyArray<NativeContact>>

	/**
	 * Open URI in the OS.
	 */
	openLink(uri: string): Promise<boolean>

	/**
	 * Share the text via OS sharing mechanism.
	 */
	shareText(text: string, title: string): Promise<boolean>
}
