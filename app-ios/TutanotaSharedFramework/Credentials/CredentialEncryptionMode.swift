/// How to encrypt credentials
public enum CredentialEncryptionMode: String, Codable, CaseIterable {
	public static var allCases: [CredentialEncryptionMode] = [.deviceLock, .systemPassword, .biometrics]

	/// Automatic unlock when the system is initialized
	/// The only mode that should be used now.
	case deviceLock = "DEVICE_LOCK"
	/// Get a key that is protected with system lock screen (biometric/password)
	/// Do not use, migrate to deviceLock
	case systemPassword = "SYSTEM_PASSWORD"
	/// Get a key that is protected with biometrics
	/// Do not use, migrate to deviceLock
	case biometrics = "BIOMETRICS"
}
