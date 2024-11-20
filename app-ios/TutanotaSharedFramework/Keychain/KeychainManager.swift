import Foundation
import LocalAuthentication

#if !targetEnvironment(simulator)
	import CryptoTokenKit
#endif

private let TAG = "de.tutao.tutanota.notificationkey."
private let KEY_PERMANENTLY_INVALIDATED_ERROR_DOMAIN = "de.tutao.tutashared.KeyPermanentlyInvalidatedError"
private let CREDENTIAL_AUTHENTICATION_ERROR_DOMAIN = "de.tutao.tutashared.CredentialAuthenticationError"

class KeyPermanentlyInvalidatedError: TutanotaError {
	init(underlyingError: Error) { super.init(message: underlyingError.localizedDescription, underlyingError: underlyingError) }
	init(message: String) { super.init(message: message, underlyingError: nil) }
	override init(message: String, underlyingError: Error?) { super.init(message: message, underlyingError: underlyingError) }

	override var name: String { get { KEY_PERMANENTLY_INVALIDATED_ERROR_DOMAIN } }
}

public class CredentialAuthenticationError: TutanotaError {
	public init(underlyingError: Error) { super.init(message: underlyingError.localizedDescription, underlyingError: underlyingError) }
	override public init(message: String, underlyingError: Error?) { super.init(message: message, underlyingError: underlyingError) }

	public override var name: String { get { CREDENTIAL_AUTHENTICATION_ERROR_DOMAIN } }
}

/// Class that is able to use items in sytem keychain
public class KeychainManager: NSObject {
	/// The only key that should be for used for encryption from now on. Corresponds to `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`.
	private static let DATA_KEY_ALIAS = "AfterFirstUnlockDataKey"
	private static let LEGACY_DEVICE_LOCK_DATA_KEY_ALIAS = "DeviceLockDataKey"
	private static let LEGACY_SYSTEM_PASSWORD_DATA_KEY_ALIAS = "SystemPasswordDataKey"
	private static let LEGACY_BIOMETRICS_DATA_KEY_ALIAS = "BiometricsDataKey"
	private static let DATA_ALGORITHM = SecKeyAlgorithm.eciesEncryptionCofactorVariableIVX963SHA256AESGCM

	private let keyGenerator: KeyGenerator

	public init(keyGenerator: KeyGenerator) { self.keyGenerator = keyGenerator }

	/// Store user-provided key material as key with a tag derived from `keyId`.
	/// These keys can be extracted later with `getKey`.
	public func storeKey(_ key: Data, withId keyId: String) throws {
		let keyTag = self.deriveKeyTag(fromKeyId: keyId)

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

	/// Retrieve key material for the user-provided key, previously stored with `storeKey` with a tag derived from `keyid`.
	public func getKey(keyId: String) throws -> Data? {
		let keyTag = self.deriveKeyTag(fromKeyId: keyId)
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

	/// Whether we should re-encrypt the data that was encrypt using keychain-bound keys.
	public func requiresKeyAccessMigration() throws -> Bool {
		// The presence of the new key is a sentiel as we assume that when it is available we don't need to use old keys
		// anymore.
		// Theretically this method can prompt but since this key is guaranteed to be automatically available it should be safe to call.
		let key = try self.getKeychainKeyReference(withTag: Self.DATA_KEY_ALIAS, inContext: laContext())
		return key == nil
	}

	private func deleteKey(tag: String) throws {
		let deleteQuery: [String: Any] = [kSecClass as String: kSecClassKey, kSecAttrApplicationTag as String: tag]
		let status = SecItemDelete(deleteQuery as CFDictionary)
		if status != errSecSuccess { throw TUTErrorFactory.createError("Failed to delete key: \(status)") }
	}

	/// Encrypt `data` using keychain-backed key for the `encryptionmode`.
	/// Does automatically generate the required key if needed.
	///  - throws KeyPermanentlyInvalidatedError if the key is not valid anymore
	///  - throws CredentialAuthenticationError
	public func encryptData(encryptionMode: CredentialEncryptionMode, data: Data) throws -> Data {
		let context = laContext()
		// When encrypting data we want to use the new key if we are on the `CredentialEncryptionMode.deviceLock`.
		// We shouldn't need to generate other keys ever but we keep them for now.
		let keyTag = if encryptionMode == .deviceLock { Self.DATA_KEY_ALIAS } else { self.legacyKeyTag(for: encryptionMode) }
		let privateKey = try self.getKeychainKeyReference(withTag: keyTag, inContext: context) ?? generateKeychainKey(tag: keyTag, mode: encryptionMode)

		guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
			throw TUTErrorFactory.createError("Cannot get public key from private key for mode \(encryptionMode)")
		}

		var error: Unmanaged<CFError>?
		let encryptedData = SecKeyCreateEncryptedData(publicKey, Self.DATA_ALGORITHM, data as CFData, &error) as Data?

		guard let encryptedData else {
			switch try self.handleKeychainError(error!, keyTag: keyTag, context: context) {
			case .unrecoverable(let error): throw error
			case .recoverable(let error):
				TUTSLog("Trying to recover from error \(error)")
				return try self.encryptData(encryptionMode: encryptionMode, data: data)
			}
		}
		return encryptedData
	}

	/// Encrypt `encryptedData` using keychain-backed key for the `encryptionmode`.
	///  - throws KeyPermanentlyInvalidatedError if the key does not exist or is not valid anymore
	///  - throws CredentialAuthenticationError
	public func decryptData(encryptionMode: CredentialEncryptionMode, encryptedData: Data) throws -> Data {
		let context = laContext()
		// When decrypting data we only want to get an existing key and we prefer the new key and then fallback to the legacy key
		func fetchKey() throws -> (SecKey?, String) {
			if encryptionMode == CredentialEncryptionMode.deviceLock,
				let key = try self.getKeychainKeyReference(withTag: Self.DATA_KEY_ALIAS, inContext: context)
			{
				return (key, Self.DATA_KEY_ALIAS)
			} else {
				let tag = legacyKeyTag(for: encryptionMode)
				let key = try self.getKeychainKeyReference(withTag: legacyKeyTag(for: encryptionMode), inContext: context)
				return (key, tag)
			}
		}

		let (key, tag) = try fetchKey()
		guard let key else { throw KeyPermanentlyInvalidatedError(message: "Key for mode \(encryptionMode) not found") }

		var error: Unmanaged<CFError>?
		let decryptedData = SecKeyCreateDecryptedData(key, Self.DATA_ALGORITHM, encryptedData as CFData, &error) as Data?

		guard let decryptedData else {
			switch try self.handleKeychainError(error!, keyTag: tag, context: context) {
			case .unrecoverable(let error): throw error
			case .recoverable(let error):
				TUTSLog("Trying to recover from error \(error)")
				return try self.decryptData(encryptionMode: encryptionMode, encryptedData: encryptedData)
			}
		}
		return decryptedData
	}

	private func getKeychainKeyReference(for mode: CredentialEncryptionMode, inContext context: LAContext) throws -> SecKey? {
		// If we are currently using device lock we want to try and use new key first
		if mode == CredentialEncryptionMode.deviceLock, let key = try self.getKeychainKeyReference(withTag: Self.DATA_KEY_ALIAS, inContext: context) {
			return key
		} else {
			let tag = legacyKeyTag(for: mode)
			return try self.getKeychainKeyReference(withTag: tag, inContext: context)
		}
	}

	private func legacyKeyTag(for encryptionMode: CredentialEncryptionMode) -> String {
		switch encryptionMode {
		case .deviceLock: return Self.LEGACY_DEVICE_LOCK_DATA_KEY_ALIAS
		case .systemPassword: return Self.LEGACY_SYSTEM_PASSWORD_DATA_KEY_ALIAS
		case .biometrics: return Self.LEGACY_BIOMETRICS_DATA_KEY_ALIAS
		}
	}

	private func getKeychainKeyReference(withTag tag: String, inContext context: LAContext) throws -> SecKey? {
		let getQuery = [kSecClass: kSecClassKey, kSecAttrApplicationTag: tag, kSecReturnRef: true, kSecUseAuthenticationContext: context] as CFDictionary

		var item: CFTypeRef?
		let status = SecItemCopyMatching(getQuery, &item)
		switch status {
		case errSecItemNotFound: return nil
		case errSecSuccess:
			let key = item as! SecKey?
			return key
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
		/// In the past accessControl was kSecAttrAccessibleWhenUnlockedThisDeviceOnly, that is why we need to migrate the keys now.
		let accessControl = SecAccessControlCreateWithFlags(kCFAllocatorDefault, kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly, flags, &error)

		if let accessControl {
			return accessControl
		} else {
			let error = error!.takeRetainedValue() as Error as NSError
			fatalError(error.debugDescription)
		}
	}

	private func generateKeychainKey(tag: String, mode: CredentialEncryptionMode) throws -> SecKey {
		let access = self.accessControl(for: mode)
		return try self.keyGenerator.generateKey(tag: tag, accessControl: access)
	}

	private func deriveKeyTag(fromKeyId keyId: String) -> Data {
		let keyTag = TAG + keyId
		return keyTag.data(using: .utf8)!
	}

	private func handleKeychainError(_ error: Unmanaged<CFError>, keyTag: String, context: LAContext) throws -> HandledKeychainError {
		let parsedError = self.parseKeychainError(error)
		switch parsedError {
		case .authFailure(let error): return .unrecoverable(error: CredentialAuthenticationError(underlyingError: error))
		case .lockout(error: let error):
			let (result, promptError) = blockOn { cb in self.showPasswordPrompt(context: context, reason: error.localizedDescription, cb) }
			if let error = promptError {
				return .unrecoverable(error: CredentialAuthenticationError(underlyingError: error))
			} else if result == .some(false) {
				return .unrecoverable(error: CredentialAuthenticationError(underlyingError: error))
			} else {
				return .recoverable(error: CredentialAuthenticationError(underlyingError: error))
			}
		case .keyPermanentlyInvalidated(let error):
			try self.deleteKey(tag: keyTag)
			let message = "Keychain operation failed for \(keyTag)"
			return .unrecoverable(error: KeyPermanentlyInvalidatedError(message: message, underlyingError: error))
		case .unknown(let error):
			let message = "Keychain operation failed for \(keyTag)"
			return .unrecoverable(error: TUTErrorFactory.wrapNativeError(withDomain: TUT_ERROR_DOMAIN, message: message, error: error))
		}
	}

	private func laContext() -> LAContext {
		let context = LAContext()
		context.localizedReason = translate("TutaoUnlockCredentialsAction", default: "Unlock credentials")

		return context
	}

	private func showPasswordPrompt(context: LAContext, reason: String, _ completion: @escaping (Bool?, Error?) -> Void) {
		DispatchQueue.main.async { context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason, reply: completion) }
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
