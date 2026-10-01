/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * HTTP range request headers used to resume archive download.
 */
@Serializable
data class ArchiveDownloadRangeHeaders(
	val rangeStart: Long,
	val reprDigest: String,
)
