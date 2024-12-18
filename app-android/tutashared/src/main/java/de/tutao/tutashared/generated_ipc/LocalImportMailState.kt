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
	val status: Int,
	val start_timestamp: Int,
	val totalMails: Int,
	val successfulMails: Int,
	val failedMails: Int,
)
