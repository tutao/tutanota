/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * FIXME
 */
@Serializable
data class ArchiveDownloadRangeHeader(
	val rangeStart: Long,
	val reprDigest: String,
)
