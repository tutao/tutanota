/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.Serializable


/**
 * Key definition for shortcuts.
 */
@Serializable
data class PersistedCredentials(
	val credentialInfo: CredentialsInfo,
	val accessToken: DataWrapper,
	val databaseKey: DataWrapper?,
	val encryptedPassword: String,
	val encryptedPassphraseKey: DataWrapper?,
)
