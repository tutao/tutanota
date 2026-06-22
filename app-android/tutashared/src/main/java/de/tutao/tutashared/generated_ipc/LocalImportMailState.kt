/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Local import mail state, to show progress during an mail import.
 */
@Serializable
data class LocalImportMailState(
	val remoteStateId: de.tutao.tutashared.IdTuple,
	val status: Long,
	val start_timestamp: Long,
	val totalMails: Long,
	val successfulMails: Long,
	val failedMails: Long,
)
