/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Result of the download operation done via native. 'suspensionTime' is from either 'Retry-After' or 'Suspension-Time' headers.
 */
@Serializable
data class DownloadTaskResponse(
	val statusCode: Int,
	val errorId: String?,
	val precondition: String?,
	val suspensionTime: String?,
	val encryptedFileUri: String?,
)
