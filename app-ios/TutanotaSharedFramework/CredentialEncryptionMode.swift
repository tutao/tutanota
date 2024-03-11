public enum CredentialEncryptionMode: String, Codable {
	case deviceLock = "DEVICE_LOCK"
	case systemPassword = "SYSTEM_PASSWORD"
	case biometrics = "BIOMETRICS"
}
