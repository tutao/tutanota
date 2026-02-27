/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*


/**
 * State Id and number of remaining mails of resumable import
 */
@Serializable
data class ResumableImport(
	val remoteStateId: de.tutao.tutashared.IdTupleCustom,
	val remainingEmlCount: Int,
)
