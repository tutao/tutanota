/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Key definition for shortcuts.
 */
@Serializable
data class PersistedCredentials(
	val credentialInfo: CredentialsInfo,
	val accessToken: DataWrapper,
	val databaseKey: DataWrapper?,
	val encryptedPassword: String,
)
