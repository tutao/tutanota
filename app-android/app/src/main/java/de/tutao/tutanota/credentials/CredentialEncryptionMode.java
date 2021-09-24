package de.tutao.tutanota.credentials;

public enum CredentialEncryptionMode {
	/**
	 * Uses the device lock to protect data, i.e. you can decrypt any data encrypted using this mode as long as the device is unlocked.
	 */
	ENCRYPTION_MODE_DEVICE_LOCK("DEVICE_LOCK", false),
	/**
	 * Uses the system password (optional fingerprint) to encrypt data. Access is granted for a specified interval after authentication.
	 */
	ENCRYPTION_MODE_SYSTEM_PASSWORD("SYSTEM_PASSWORD", true),
	/**
	 * Uses strong biometrics to encrypt data. Each access to the data needs to be individually granted by providing biometric credentials.
	 */
	ENCRYPTION_MODE_BIOMETRICS("BIOMETRICS", true);

	public String name;
	/**
	 * Each encryption mode defines whether immediate user interaction is required to access the encryption key.
	 */
	boolean requiresAuthentication;

	CredentialEncryptionMode(String name, boolean requiresAuthentication) {
		this.name = name;
		this.requiresAuthentication = requiresAuthentication;
	}

	public static CredentialEncryptionMode fromName(String name) {
		for (CredentialEncryptionMode mode : CredentialEncryptionMode.values()) {
			if (mode.name.equals(name)) {
				return mode;
			}
		}
		throw new IllegalArgumentException("Invalid encryption mode: " + name);
	}
}
