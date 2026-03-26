/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * State Id and number of remaining mails of resumable import
 */
@Serializable
data class ResumableImport(
	val remoteStateId: de.tutao.tutashared.IdTuple,
	val remainingEmlCount: Int,
)
