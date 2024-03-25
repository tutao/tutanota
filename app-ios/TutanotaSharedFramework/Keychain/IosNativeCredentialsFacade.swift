import Foundation
import LocalAuthentication

struct NotImplemented: Error {

}

public class IosNativeCredentialsFacade: NativeCredentialsFacade {
	private static let ENCRYPTION_MODE_KEY = "credentialEncryptionMode"
	private static let CREDENTIALS_ENCRYPTION_KEY_KEY = "credentialsEncryptionKey"

	private let keychainManager: KeychainManager
	private let credentialsDb: CredentialsDatabase
	private let userDefaults: UserDefaults

	public init(keychainManager: KeychainManager, credentialsDb: CredentialsDatabase, userDefaults: UserDefaults) {
		self.keychainManager = keychainManager
		self.credentialsDb = credentialsDb
		self.userDefaults = userDefaults
	}

	public func loadAll() async throws -> [PersistedCredentials] { try self.credentialsDb.getAll() }
	public func store(_ credentials: PersistedCredentials) async throws { try self.credentialsDb.store(credentials: credentials) }
	public func loadByUserId(_ id: String) async throws -> PersistedCredentials? {
		let credentials = try self.credentialsDb.getAll()
		return credentials.first { persistedCredentials in persistedCredentials.credentialsInfo.userId == id }
	}
	public func deleteByUserId(_ id: String) async throws { try self.credentialsDb.delete(userId: id) }
	public func getCredentialEncryptionMode() async throws -> CredentialEncryptionMode? {
		let value = self.userDefaults.value(forKey: Self.ENCRYPTION_MODE_KEY) as! String?
		return value.flatMap(CredentialEncryptionMode.init(rawValue:))
	}
	public func setCredentialEncryptionMode(_ encryptionMode: CredentialEncryptionMode?) async throws {
		self.userDefaults.setValue(encryptionMode?.rawValue, forKey: Self.ENCRYPTION_MODE_KEY)
	}
	public func getCredentialsEncryptionKey() async throws -> DataWrapper? {
		let value = self.userDefaults.value(forKey: Self.CREDENTIALS_ENCRYPTION_KEY_KEY) as! String?
		return value.flatMap { Data(base64Encoded: $0) }?.wrap()
	}
	public func setCredentialsEncryptionKey(_ credentialsEncryptionKey: DataWrapper?) async throws {
		let base64 = credentialsEncryptionKey.map { wrapper in wrapper.data.base64EncodedString() }
		self.userDefaults.setValue(base64, forKey: Self.CREDENTIALS_ENCRYPTION_KEY_KEY)
	}

	public func encryptUsingKeychain(_ data: DataWrapper, _ encryptionMode: CredentialEncryptionMode) async throws -> DataWrapper {
		let encryptedData = try self.keychainManager.encryptData(encryptionMode: encryptionMode, data: data.data)
		return DataWrapper(data: encryptedData)
	}

	public func decryptUsingKeychain(_ encryptedData: DataWrapper, _ encryptionMode: CredentialEncryptionMode) async throws -> DataWrapper {
		let data = try self.keychainManager.decryptData(encryptionMode: encryptionMode, encryptedData: encryptedData.data)
		return DataWrapper(data: data)
	}

	public func getSupportedEncryptionModes() async -> [CredentialEncryptionMode] {
		var supportedModes = [CredentialEncryptionMode.deviceLock]
		let context = LAContext()

		let systemPasswordSupported = context.canEvaluatePolicy(.deviceOwnerAuthentication)
		if systemPasswordSupported { supportedModes.append(.systemPassword) }
		let biometricsSupported = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics)
		if biometricsSupported { supportedModes.append(.biometrics) }
		return supportedModes
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
