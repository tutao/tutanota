/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Key definition for shortcuts.
 */
@Serializable
data class CredentialsInfo(
	val login: String,
	val userId: String,
	val type: CredentialType,
)
