/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Key definition for shortcuts.
 */
@Serializable
data class PersistedCredentials(
	val credentialsInfo: CredentialsInfo,
	val accessToken: String,
	val databaseKey: String?,
	val encryptedPassword: String,
)
