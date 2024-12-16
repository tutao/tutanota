/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Local import mail state, to show progress during an mail import.
 */
@Serializable
data class LocalImportMailState(
	val importMailStateElementId: String,
	val successfulMails: Int,
	val failedMails: Int,
	val status: Int,
)
