/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Result of the `encryptFile()` operation.
 */
@Serializable
data class EncryptedFileInfo(
	val uri: String,
	val unencryptedSize: Int,
)
