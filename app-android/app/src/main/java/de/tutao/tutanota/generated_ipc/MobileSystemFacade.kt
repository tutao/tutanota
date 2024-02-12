/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Common operations implemented by each mobile platform.
 */
interface MobileSystemFacade {
	/**
	 * Redirect the user to Phone's Settings
	 */
	 suspend fun goToSettings(
	): Unit
	/**
	 * Open URI in the OS.
	 */
	 suspend fun openLink(
		uri: String,
	): Boolean
	/**
	 * Share the text via OS sharing mechanism.
	 */
	 suspend fun shareText(
		text: String,
		title: String,
	): Boolean
}
