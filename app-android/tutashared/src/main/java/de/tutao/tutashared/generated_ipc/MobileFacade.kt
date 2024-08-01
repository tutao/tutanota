/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Common operations used by mobile platforms.
 */
interface MobileFacade {
	/**
	 * Android: Called when 'hardware' back key is pressed. Returns `true` if the web app consumed the event.
	 */
	suspend fun handleBackPress(
	): Boolean
	/**
	 * Android: called when the app becomes completely visible/hidden (not just covered by dialog).
	 */
	suspend fun visibilityChange(
		visibility: Boolean,
	): Unit
	/**
	 * iOS: called when keyboard opens/closes/resizes. Passes the height of the keyboard.
	 */
	suspend fun keyboardSizeChanged(
		newSize: Int,
	): Unit
}
