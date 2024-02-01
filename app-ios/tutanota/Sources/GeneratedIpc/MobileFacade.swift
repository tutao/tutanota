/* generated file, don't edit. */


import Foundation

/**
 * Common operations used by mobile platforms.
 */
public protocol MobileFacade {
	/**
	 * Android: Called when 'hardware' back key is pressed. Returns `true` if the web app consumed the event.
	 */
	func handleBackPress(
	) async throws -> Bool
	/**
	 * Android: called when the app becomes completely visible/hidden (not just covered by dialog).
	 */
	func visibilityChange(
		_ visibility: Bool
	) async throws -> Void
	/**
	 * iOS: called when keyboard opens/closes/resizes. Passes the height of the keyboard.
	 */
	func keyboardSizeChanged(
		_ newSize: Int
	) async throws -> Void
}
