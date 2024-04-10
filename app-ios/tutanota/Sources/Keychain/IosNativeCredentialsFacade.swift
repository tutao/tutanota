import Foundation
import LocalAuthentication

public enum CredentialEncryptionMode: String, Codable {
	case deviceLock = "DEVICE_LOCK"
	case systemPassword = "SYSTEM_PASSWORD"
	case biometrics = "BIOMETRICS"
}

class IosNativeCredentialsFacade: NativeCredentialsFacade {
	private let keychainManager: KeychainManager

	init(keychainManager: KeychainManager) { self.keychainManager = keychainManager }

	func encryptUsingKeychain(_ data: DataWrapper, _ encryptionMode: CredentialEncryptionMode) async throws -> DataWrapper {
		// iOS does not actually require explicit permission when encrypting with biometrics, and 'context.canEvaluatePolicy' does not return false until the user actually says no,
		// thus we need to force it to check for permission here; this will throw CancelledError if permission was then denied.
		//
		// If we don't do this, then the user will get locked out until they fix it in Settings.
		try await checkPermissionForEncryptionMode(encryptionMode)

		let encryptedData = try self.keychainManager.encryptData(encryptionMode: encryptionMode, data: data.data)
		return DataWrapper(data: encryptedData)
	}

	func decryptUsingKeychain(_ encryptedData: DataWrapper, _ encryptionMode: CredentialEncryptionMode) async throws -> DataWrapper {
		let data = try self.keychainManager.decryptData(encryptionMode: encryptionMode, encryptedData: encryptedData.data)
		return DataWrapper(data: data)
	}

	func getSupportedEncryptionModes() async -> [CredentialEncryptionMode] {
		var supportedModes = [CredentialEncryptionMode.deviceLock]
		let context = LAContext()

		let systemPasswordSupported = context.canEvaluatePolicy(.deviceOwnerAuthentication)
		if systemPasswordSupported { supportedModes.append(.systemPassword) }
		let biometricsSupported = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)
		if biometricsSupported { supportedModes.append(.biometrics) }
		return supportedModes
	}

	private func checkPermissionForEncryptionMode(_ mode: CredentialEncryptionMode) async throws {
		switch mode {
		case .biometrics:
			do {
				try await LAContext()
					.evaluatePolicy(
						.deviceOwnerAuthenticationWithBiometrics,
						localizedReason: translate("TutaoUnlockCredentialsAction", default: "Unlock credentials")
					)
			} catch { throw CancelledError(message: "Permission for biometrics denied, cancelled by user, or incorrect.", underlyingError: error) }
		default: break
		}
	}
}

fileprivate extension LAContext {
	func canEvaluatePolicy(_ policy: LAPolicy) -> Bool {
		var error: NSError?
		let supported = self.canEvaluatePolicy(policy, error: &error)
		if let error { TUTSLog("Cannot evaluate policy \(policy): \(error.debugDescription)") }
		return supported
	}
}
