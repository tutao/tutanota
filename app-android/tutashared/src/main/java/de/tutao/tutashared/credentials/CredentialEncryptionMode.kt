package de.tutao.tutashared.credentials

import kotlinx.serialization.Serializable

/**
 * This is a reimplementation of the CredentialEncryptionMode enum on the web app.
 *
 * the variant names are significant for serialization.
 */
@Serializable
enum class CredentialEncryptionMode(
	/**
	 * Each encryption mode defines whether immediate user interaction is required to access the encryption key.
	 */
	var requiresAuthentication: Boolean
) {
	/**
	 * Uses the device lock to protect data, i.e. you can decrypt any data encrypted using this mode as long as the device is unlocked.
	 */
	DEVICE_LOCK(false),

	/**
	 * Uses the system password (optional fingerprint) to encrypt data. Access is granted for a specified interval after authentication.
	 */
	SYSTEM_PASSWORD(true),

	/**
	 * Uses strong biometrics to encrypt data. Each access to the data needs to be individually granted by providing biometric credentials.
	 */
	BIOMETRICS(true);

	companion object {
		fun fromValue(
			value: String,
		): CredentialEncryptionMode? = when (value) {
			"DEVICE_LOCK" -> DEVICE_LOCK
			"SYSTEM_PASSWORD" -> SYSTEM_PASSWORD
			"BIOMETRICS" -> BIOMETRICS
			else -> null
		}
	}
}