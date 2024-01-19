/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Common operations implemented by each mobile platform.
 */
interface MobileSystemFacade {
	/**
	 * Find suggestions in the OS contact provider.
	 */
	 suspend fun findSuggestions(
		query: String,
	): List<NativeContact>
	/**
	 * Store contacts in system contact book
	 */
	 suspend fun saveContacts(
		userId: String,
		contacts: List<StructuredContact>,
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
