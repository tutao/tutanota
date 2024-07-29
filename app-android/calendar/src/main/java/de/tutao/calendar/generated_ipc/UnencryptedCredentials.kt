/* generated file, don't edit. */


package de.tutao.calendar.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Credentials ready to be used at runtime
 */
@Serializable
data class UnencryptedCredentials(
		val credentialInfo: CredentialsInfo,
		val accessToken: String,
		val databaseKey: DataWrapper?,
		val encryptedPassword: String,
)
