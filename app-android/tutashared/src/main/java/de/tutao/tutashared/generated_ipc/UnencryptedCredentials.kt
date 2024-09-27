/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.Serializable


/**
 * Credentials ready to be used at runtime
 */
@Serializable
data class UnencryptedCredentials(
	val credentialInfo: CredentialsInfo,
	val accessToken: String,
	val databaseKey: DataWrapper?,
	val encryptedPassword: String,
	val encryptedPassphraseKey: DataWrapper?,
)
