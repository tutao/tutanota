//
//  Credentials.swift
//  calendar
//
//  Created by Tutao GmbH on 15.04.25.
//

import AppIntents
import TutanotaSharedFramework
import tutasdk

struct WidgetCredential: AppEntity {
	var id: String
	var email: String

	static var defaultQuery: CredentialsQuery = CredentialsQuery()

	static var typeDisplayRepresentation: TypeDisplayRepresentation = "Credential"

	var displayRepresentation: DisplayRepresentation {
		let emailUser = String(email.split(separator: "@").first ?? "")
		return DisplayRepresentation(title: LocalizedStringResource(stringLiteral: emailUser), subtitle: LocalizedStringResource(stringLiteral: email))
	}

	static func fetchCredentials() async throws -> [WidgetCredential] {
		do {
			let credentialsDb = try CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
			let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
			let keychainEncryption = KeychainEncryption(keychainManager: keychainManager)
			let credentialsFacade = IosNativeCredentialsFacade(
				keychainEncryption: keychainEncryption,
				credentialsDb: credentialsDb,
				cryptoFns: CryptoFunctions()
			)
			let credentials = try await credentialsFacade.loadAll()
			return credentials.map { WidgetCredential(id: $0.credentialInfo.userId, email: $0.credentialInfo.login) }
		} catch {
			printLog("[WidgetConfig] Error: \(error)")
			return []
		}
	}
}

struct CredentialsQuery: EntityQuery {
	func entities(for identifiers: [WidgetCredential.ID]) async throws -> [WidgetCredential] { try await WidgetCredential.fetchCredentials() }

	func suggestedEntities() async throws -> [WidgetCredential] { try await WidgetCredential.fetchCredentials() }

	func defaultResult() async -> WidgetCredential? { nil }
}
