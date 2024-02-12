/* generated file, don't edit. */

/**
 * Common operations implemented by each mobile platform.
 */
export interface MobileSystemFacade {
	/**
	 * Redirect the user to Phone's Settings
	 */
	goToSettings(): Promise<void>

	/**
	 * Open URI in the OS.
	 */
	openLink(uri: string): Promise<boolean>

	/**
	 * Share the text via OS sharing mechanism.
	 */
	shareText(text: string, title: string): Promise<boolean>
}
