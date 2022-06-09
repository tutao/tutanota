/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class DownloadTaskResponse(
	val statusCode: Int,
	val errorId: String?,
	val precondition: String?,
	val suspensionTime: String?,
	val encryptedFileUri: String?,
)
