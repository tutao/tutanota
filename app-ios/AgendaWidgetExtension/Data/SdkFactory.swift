//
//  SdkFactory.swift
//  calendar
//
//  Created by Tutao GmbH on 24.04.25.
//
import TutanotaSharedFramework
import tutasdk

class SdkFactory {
	static func createSdk(userId: String) async throws -> LoggedInSdk {
		let urlSession: URLSession = makeUrlSession()
		let credentialsDb = try! CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
		let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
		let keychainEncryption = KeychainEncryption(keychainManager: keychainManager)
		let credentialsFacade = IosNativeCredentialsFacade(keychainEncryption: keychainEncryption, credentialsDb: credentialsDb, cryptoFns: CryptoFunctions())

		let remoteStorage = RemoteStorage(userPreferencesProvider: UserPreferencesProviderImpl())

		// In case the origin is not present, we ask the user to open and login into the app
		guard let origin = remoteStorage.getRemoteOrigin()?.url else { throw TUTErrorFactory.createError(withDomain: TUT_WIDGET_CREDENTIAL_ERROR, message: "Missing Server Origin") }

		guard let unencryptedCredentials = try await credentialsFacade.loadByUserId(userId) else { throw TUTErrorFactory.createError(withDomain: TUT_WIDGET_CREDENTIAL_ERROR, message: "Unable to load credentials for user \(userId)") }
		guard let encryptedPassphraseKey = unencryptedCredentials.encryptedPassphraseKey else { throw TUTErrorFactory.createError(withDomain: TUT_WIDGET_CREDENTIAL_ERROR, message: "Failed to get encrypted passphrase key") }

		let credentials = tutasdk.Credentials(
			login: unencryptedCredentials.credentialInfo.login,
			userId: userId,
			accessToken: unencryptedCredentials.accessToken,
			encryptedPassphraseKey: encryptedPassphraseKey.data,
			credentialType: tutasdk.CredentialType.internal
		)

		do {
			return try await Sdk(baseUrl: origin, rawRestClient: SdkRestClient(urlSession: urlSession)).login(credentials: credentials)
		} catch {
			throw TUTErrorFactory.createError(withDomain: TUT_WIDGET_CREDENTIAL_ERROR, message: "Failed to login into SDK: \(error)")
		}
	}
}
