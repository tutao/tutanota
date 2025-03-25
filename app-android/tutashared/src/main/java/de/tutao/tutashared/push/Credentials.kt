package de.tutao.tutashared.push

import de.tutao.tutasdk.CredentialType
import de.tutao.tutasdk.Credentials
import de.tutao.tutashared.ipc.UnencryptedCredentials

/**
 * Convert UnencryptedCredentials to credentials for logging in with Sdk.
 */
fun UnencryptedCredentials.toSdkCredentials() = Credentials(
	login = this.credentialInfo.login,
	userId = this.credentialInfo.userId,
	accessToken = this.accessToken,
	encryptedPassphraseKey = this.encryptedPassphraseKey!!.data,
	credentialType = CredentialType.INTERNAL
)