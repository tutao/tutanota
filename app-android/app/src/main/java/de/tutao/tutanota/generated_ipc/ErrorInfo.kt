/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * When the error happens in the native we serialize it via this structure.
 */
@Serializable
data class ErrorInfo(
	val name: String?,
	val message: String?,
	val stack: String?,
)
