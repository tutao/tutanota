package de.tutao.tutashared.credentials

import javax.crypto.SecretKey

/**
 * Interface for obtaining keys that can be used to encrypt arbitrary data using android's keystore API.
 */
interface DataKeyGenerator {
	fun generateDataKey(alias: String, credentialEncryptionMode: CredentialEncryptionMode): SecretKey
}