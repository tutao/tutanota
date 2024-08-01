/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Represents an account/list from the device's phonebook.
 */
@Serializable
data class ContactBook(
	val id: String,
	val name: String?,
)
