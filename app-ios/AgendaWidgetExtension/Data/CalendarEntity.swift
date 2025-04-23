//
//  Calendar.swift
//  calendar
//
//  Created by Tutao GmbH on 16.04.25.
//

import AppIntents
import TutanotaSharedFramework
import tutasdk

let DEFAULT_CALENDAR_NAME = "Private"
let DEFAULT_CALENDAR_COLOR = "23f520"

struct CalendarEntity: AppEntity {
	static var defaultQuery: CalendarQuery = CalendarQuery()

	var id: String
	var name: String
	var color: String

	static var typeDisplayRepresentation: TypeDisplayRepresentation = "Calendar"

	var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: LocalizedStringResource(stringLiteral: name)) }

	static func fetchCalendars(_ userId: String) async throws -> [CalendarEntity] {
		// FIXME Remove log
		TUTSLog("fetchCalendars for userId \(userId)")

		let urlSession: URLSession = makeUrlSession()

		let credentialsDb = try! CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
		let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
		let keychainEncryption = KeychainEncryption(keychainManager: keychainManager)
		let credentialsFacade = IosNativeCredentialsFacade(keychainEncryption: keychainEncryption, credentialsDb: credentialsDb, cryptoFns: CryptoFunctions())
		let notificationStorage = NotificationStorage(userPreferencesProvider: UserPreferencesProviderImpl())
		let unencryptedCredential: UnencryptedCredentials

		do {
			guard let loadedUnencryptedCredential = try await credentialsFacade.loadByUserId(userId) else { throw TUTErrorFactory.createError("Missing credentials for user \(userId)") }
			unencryptedCredential = loadedUnencryptedCredential
		} catch {
			// FIXME Replace by proper log function
			TUTSLog("Sothing went wrong loading the unencyptedCredentials \(error)")
			return []
		}

		guard let origin = notificationStorage.sseInfo?.sseOrigin else {
			// FIXME Replace by proper log function
			TUTSLog("Missing Server Origin Info")
			return []
		}
		
		guard let encryptedPassphraseKey = unencryptedCredential.encryptedPassphraseKey else {
			// FIXME Replace by proper log function
			TUTSLog("Missing encryptedPassphraseKey")
			return []
		}

		let credentials = tutasdk.Credentials(
			login: unencryptedCredential.credentialInfo.login,
			userId: userId,
			accessToken: unencryptedCredential.accessToken,
			encryptedPassphraseKey: encryptedPassphraseKey.data,
			credentialType: tutasdk.CredentialType.internal
		)
		let sdk = try await Sdk(baseUrl: origin, rawRestClient: SdkRestClient(urlSession: urlSession)).login(credentials: credentials)
		let calendars = await sdk.calendarFacade().getCalendarsRenderData()
		return calendars.map { calendarId, renderData in
			CalendarEntity(
				id: calendarId,
				name: renderData.name.isEmpty ? DEFAULT_CALENDAR_NAME : renderData.name,
				color: renderData.color.isEmpty ? DEFAULT_CALENDAR_COLOR : renderData.color)
		}
	}
}

struct CalendarQuery: EntityQuery {
	@IntentParameterDependency<ConfigurationAppIntent>(\.$account) var config

	func entities(for identifiers: [CalendarEntity.ID]) async throws -> [CalendarEntity] {
		// FIXME Remove log
		TUTSLog("[CalendarQuery] fetch entities")
		guard let userId = config?.account.id else { return [] }

		// FIXME Remove log
		TUTSLog("WOW! Look this amazing account: \(userId)")
		return try await CalendarEntity.fetchCalendars(userId).filter { identifiers.contains($0.id) }
	}

	func suggestedEntities() async throws -> some ResultsCollection {
		// FIXME Remove log
		TUTSLog("[CalendarQuery] suggested entities")
		guard let userId = ConfigurationAppIntent().account?.id else { return [] as [CalendarEntity] }
		return try await CalendarEntity.fetchCalendars(userId)
	}

	func defaultResult() async -> CalendarEntity? { nil }
}
