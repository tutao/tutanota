/* generated file, don't edit. */

/**
 * Common operations used by mobile platforms.
 */
export interface MobileFacade {
	/**
	 * Android: Called when 'hardware' back key is pressed. Returns `true` if the web app consumed the event.
	 */
	handleBackPress(): Promise<boolean>

	/**
	 * Android: called when the app becomes completely visible/hidden (not just covered by dialog).
	 */
	visibilityChange(visibility: boolean): Promise<void>

	/**
	 * iOS: called when keyboard opens/closes/resizes. Passes the height of the keyboard.
	 */
	keyboardSizeChanged(newSize: number): Promise<void>
}
