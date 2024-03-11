import Foundation
import LocalAuthentication

#if !targetEnvironment(simulator)
	import CryptoTokenKit
#endif

private let TAG = "de.tutao.tutanota.notificationkey."
private let KEY_PERMANENTLY_INVALIDATED_ERROR_DOMAIN = "de.tutao.tutanota.KeyPermanentlyInvalidatedError"
private let CREDENTIAL_AUTHENTICATION_ERROR_DOMAIN = "de.tutao.tutanota.CredentialAuthenticationError"

class KeyPermanentlyInvalidatedError: TutanotaError {
	init(underlyingError: Error) { super.init(message: underlyingError.localizedDescription, underlyingError: underlyingError) }
	init(message: String) { super.init(message: message, underlyingError: nil) }

	override var name: String { get { KEY_PERMANENTLY_INVALIDATED_ERROR_DOMAIN } }
}

public class CredentialAuthenticationError: TutanotaError {
	public init(underlyingError: Error) { super.init(message: underlyingError.localizedDescription, underlyingError: underlyingError) }
	override public init(message: String, underlyingError: Error?) { super.init(message: message, underlyingError: underlyingError) }

	public override var name: String { get { CREDENTIAL_AUTHENTICATION_ERROR_DOMAIN } }
}

public class KeychainManager: NSObject {
	private static let DEVICE_LOCK_DATA_KEY_ALIAS = "DeviceLockDataKey"
	private static let SYSTEM_PASSWORD_DATA_KEY_ALIAS = "SystemPasswordDataKey"
	private static let BIOMETRICS_DATA_KEY_ALIAS = "BiometricsDataKey"
	private static let DATA_ALGORITHM = SecKeyAlgorithm.eciesEncryptionCofactorVariableIVX963SHA256AESGCM

	private let keyGenerator: KeyGenerator

	public init(keyGenerator: KeyGenerator) { self.keyGenerator = keyGenerator }

	public func storeKey(_ key: Data, withId keyId: String) throws {
		let keyTag = self.keyTagFromKeyId(keyId: keyId)

		let existingKey = try? self.getKey(keyId: keyId)

		let status: OSStatus

		if let key = existingKey {
			let updateQuery: [String: Any] = [kSecClass as String: kSecClassKey, kSecAttrApplicationTag as String: keyTag]
			let updateFields: [String: Any] = [kSecValueData as String: key, kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
			status = SecItemUpdate(updateQuery as CFDictionary, updateFields as CFDictionary)
		} else {
			let addQuery: [String: Any] = [
				kSecValueData as String: key, kSecClass as String: kSecClassKey, kSecAttrApplicationTag as String: keyTag,
				kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
			]
			status = SecItemAdd(addQuery as CFDictionary, nil)
		}
		if status != errSecSuccess { throw TUTErrorFactory.createError("Could not store the key, status: \(status)") }
	}

	public func getKey(keyId: String) throws -> Data? {
		let keyTag = self.keyTagFromKeyId(keyId: keyId)
		let getQuery: [String: Any] = [kSecClass as String: kSecClassKey, kSecAttrApplicationTag as String: keyTag, kSecReturnData as String: true]
		var item: CFTypeRef?
		let status = SecItemCopyMatching(getQuery as CFDictionary, &item)
		if status != errSecSuccess {
			throw TUTErrorFactory.createError("Failed to get key \(keyId). status: \(status)") as NSError
		} else if let item {
			return (item as! Data)
		} else {
			return nil
		}
	}

	public func removePushIdentifierKeys() throws {
		// TODO: Don't delete all of teh keyz when fingerprints
		let deleteQuery: [String: Any] = [kSecClass as String: kSecClassKey]
		let status = SecItemDelete(deleteQuery as CFDictionary)
		if status != errSecSuccess { throw TUTErrorFactory.createError("Could not delete the keys, status: \(status)") }
	}

	private func deleteKey(tag: String) throws {
		let deleteQuery: [String: Any] = [kSecClass as String: kSecClassKey, kSecAttrApplicationTag as String: tag]
		let status = SecItemDelete(deleteQuery as CFDictionary)
		if status != errSecSuccess { throw TUTErrorFactory.createError("Failed to delete key: \(status)") }
	}

	public func encryptData(encryptionMode: CredentialEncryptionMode, data: Data) throws -> Data {
		let privateKey = try self.getDataKey(mode: encryptionMode)
		guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
			throw TUTErrorFactory.createError("Cannot get public key from private key for mode \(encryptionMode)")
		}

		var error: Unmanaged<CFError>?
		let encryptedData = SecKeyCreateEncryptedData(publicKey, Self.DATA_ALGORITHM, data as CFData, &error) as Data?

		guard let encryptedData else {
			switch try self.handleKeychainError(error!, mode: encryptionMode) {
			case .unrecoverable(let error): throw error
			case .recoverable(let error):
				TUTSLog("Trying to recover from error \(error)")
				return try self.encryptData(encryptionMode: encryptionMode, data: data)
			}
		}
		return encryptedData
	}

	public func decryptData(encryptionMode: CredentialEncryptionMode, encryptedData: Data) throws -> Data {
		let key = try self.getDataKey(mode: encryptionMode)

		var error: Unmanaged<CFError>?
		let decryptedData = SecKeyCreateDecryptedData(key, Self.DATA_ALGORITHM, encryptedData as CFData, &error) as Data?

		guard let decryptedData else {
			switch try self.handleKeychainError(error!, mode: encryptionMode) {
			case .unrecoverable(let error): throw error
			case .recoverable(let error):
				TUTSLog("Trying to recover from error \(error)")
				return try self.decryptData(encryptionMode: encryptionMode, encryptedData: encryptedData)
			}
		}
		return decryptedData
	}

	private func getDataKey(mode: CredentialEncryptionMode) throws -> SecKey {
		let tag = self.keyAlias(for: mode)
		return try self.fetchDataKey(tag: tag) ?? self.generateDataKey(tag: tag, mode: mode)
	}

	private func keyAlias(for encryptionMode: CredentialEncryptionMode) -> String {
		switch encryptionMode {
		case .deviceLock: return Self.DEVICE_LOCK_DATA_KEY_ALIAS
		case .systemPassword: return Self.SYSTEM_PASSWORD_DATA_KEY_ALIAS
		case .biometrics: return Self.BIOMETRICS_DATA_KEY_ALIAS
		}
	}

	private func fetchDataKey(tag: String) throws -> SecKey? {
		let getQuery: [String: Any] = [
			kSecClass as String: kSecClassKey, kSecAttrApplicationTag as String: tag, kSecReturnRef as String: true,
			kSecUseOperationPrompt as String: translate("TutaoUnlockCredentialsAction", default: "Unlock credentials"),
		]

		var item: CFTypeRef?
		let status = SecItemCopyMatching(getQuery as CFDictionary, &item)
		switch status {
		case errSecItemNotFound: return nil
		case errSecSuccess: return item as! SecKey?
		default: throw TUTErrorFactory.createError("Failed to get key \(tag). Status: \(status)")
		}
	}

	private func accessControl(for encryptionMethod: CredentialEncryptionMode) -> SecAccessControl {
		let flags: SecAccessControlCreateFlags

		switch encryptionMethod {
		case .deviceLock: flags = .privateKeyUsage
		case .systemPassword: flags = [.privateKeyUsage, .userPresence]
		case .biometrics: flags = [.privateKeyUsage, .biometryCurrentSet]
		}

		var error: Unmanaged<CFError>?
		let accessControl = SecAccessControlCreateWithFlags(kCFAllocatorDefault, kSecAttrAccessibleWhenUnlockedThisDeviceOnly, flags, &error)

		if let accessControl {
			return accessControl
		} else {
			let error = error!.takeRetainedValue() as Error as NSError
			fatalError(error.debugDescription)
		}
	}

	private func generateDataKey(tag: String, mode: CredentialEncryptionMode) throws -> SecKey {
		let access = self.accessControl(for: mode)
		return try self.keyGenerator.generateKey(tag: tag, accessControl: access)
	}

	private func keyTagFromKeyId(keyId: String) -> Data {
		let keyTag = TAG + keyId
		return keyTag.data(using: .utf8)!
	}

	private func handleKeychainError(_ error: Unmanaged<CFError>, mode: CredentialEncryptionMode) throws -> HandledKeychainError {
		let parsedError = self.parseKeychainError(error)
		switch parsedError {
		case .authFailure(let error): return .unrecoverable(error: CredentialAuthenticationError(underlyingError: error))
		case .lockout(error: let error):
			let (result, promptError) = blockOn { cb in self.showPasswordPrompt(reason: error.localizedDescription, cb) }
			if let error = promptError {
				return .unrecoverable(error: CredentialAuthenticationError(underlyingError: error))
			} else if result == .some(false) {
				return .unrecoverable(error: CredentialAuthenticationError(underlyingError: error))
			} else {
				return .recoverable(error: CredentialAuthenticationError(underlyingError: error))
			}
		case .keyPermanentlyInvalidated(let error):
			let tag = self.keyAlias(for: mode)
			try self.deleteKey(tag: tag)
			return .unrecoverable(error: KeyPermanentlyInvalidatedError(underlyingError: error))
		case .unknown(let error):
			let message = "Keychain operation failed with mode \(mode)"
			return .unrecoverable(error: TUTErrorFactory.wrapNativeError(withDomain: TUT_ERROR_DOMAIN, message: message, error: error))
		}
	}

	private func showPasswordPrompt(reason: String, _ completion: @escaping (Bool?, Error?) -> Void) {
		DispatchQueue.main.async { LAContext().evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason, reply: completion) }
	}

	private func parseKeychainError(_ error: Unmanaged<CFError>) -> KeychainError {
		let e = error.takeRetainedValue() as Error as NSError

		#if !targetEnvironment(simulator)
			if e.domain == TKError.errorDomain && e.code == TKError.Code.corruptedData.rawValue { return .keyPermanentlyInvalidated(error: e) }
		#endif

		if e.domain == LAError.errorDomain && e.code == LAError.Code.biometryLockout.rawValue { return .lockout(error: e) }

		if e.domain == LAError.errorDomain { return .authFailure(error: e) }

		// This sometimes happens to some users for unknown reasons
		if e.domain == NSOSStatusErrorDomain && e.code == Security.errSecParam { return .keyPermanentlyInvalidated(error: e) }

		return .unknown(error: e)
	}
}

private enum HandledKeychainError {
	case recoverable(error: Error)
	case unrecoverable(error: Error)
}

private enum KeychainError {
	case authFailure(error: NSError)
	/// Too many attempts to use biometrics, user must authenticate with password before trying again
	case lockout(error: NSError)
	case keyPermanentlyInvalidated(error: NSError)
	case unknown(error: NSError)
}
