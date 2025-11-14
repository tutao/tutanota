import OSLog
import TutanotaSharedFramework
import UserNotifications
import tutasdk

var suspensionEndTime: Date?

class NotificationService: UNNotificationServiceExtension {
	private let notificationStorage = NotificationStorage(userPreferencesProvider: UserPreferencesProviderImpl())

	private var contentHandler: ((UNNotificationContent) -> Void)?
	private var bestAttemptContent: UNMutableNotificationContent?
	private let urlSession: URLSession = makeUrlSession()
	private let logger = Logger(subsystem: "TutaNotifications", category: "Notifications")

	override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
		self.contentHandler = contentHandler

		notificationStorage.incrementNotificationCount()

		bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
		if let bestAttemptContent {
			bestAttemptContent.badge = notificationStorage.notificationCount as NSNumber

			Task {
				await notificationHandleTask(bestAttemptContent)
				contentHandler(bestAttemptContent)
			}
		}
	}

	private func notificationHandleTask(_ bestAttemptContent: UNMutableNotificationContent) async {
		// Catch all errors to always call contentHandler, otherwise we will use up our quota to time out
		do { try await handleNotification(content: bestAttemptContent) } catch {
			printLog("Failed to populate notification: \(error)")
			logger.notice("Failed to populate notification: \(error, privacy: .public)")
		}
	}

	private func handleNotification(content: UNMutableNotificationContent) async throws {
		if let suspensionTime = suspensionEndTime {
			if suspensionTime.timeIntervalSinceNow < 0 {
				logger.notice("Suspension over, clearing")
				suspensionEndTime = nil
			} else {
				logger.notice("Cannot handle notification due to previous suspension: \(suspensionTime.timeIntervalSinceNow, privacy: .public)s")
				// We cannot try again later because the system only gives a limited time to process the notification, that time will probably be passed by the
				// time the suspension is over so we just return here
				return
			}
		}

		let credentialsDb = try! CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
		let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
		let keychainEncryption = KeychainEncryption(keychainManager: keychainManager)
		let credentialsFacade = IosNativeCredentialsFacade(keychainEncryption: keychainEncryption, credentialsDb: credentialsDb, cryptoFns: CryptoFunctions())

		let mailId = content.userInfo["mailId"] as? [String]
		let userId = content.userInfo["userId"] as? String

		guard let userId else { return }
		guard let mailId else { return }

		guard let credentials = try await credentialsFacade.loadByUserId(userId) else { return }
		guard let origin = notificationStorage.sseInfo?.sseOrigin else { return }
		guard let encryptedPassphraseKey = credentials.encryptedPassphraseKey else { return }
		let sdkCredentials = tutasdk.Credentials(
			login: credentials.credentialInfo.login,
			userId: userId,
			accessToken: credentials.accessToken,
			encryptedPassphraseKey: encryptedPassphraseKey.data,
			credentialType: tutasdk.CredentialType.internal
		)
		// do not use SDK with built-in suspension: we don't have time budget to wait for it, we just want to mark that we are suspended for further requests
		let sdk = Sdk.newWithoutSuspension(baseUrl: origin, rawRestClient: SdkRestClient(urlSession: self.urlSession), fileClient: SdkFileClient())
		var loggedInSdk: LoggedInSdk
		do { loggedInSdk = try await sdk.login(credentials: sdkCredentials) } catch {
			if let error = error as? LoginError, case .ApiCall(let error) = error { checkForSuspensionError(error: error) }
			throw error
		}

		let mailServerModelParsed = try await getParsedMail(sdk: loggedInSdk, mailId)
		guard let mail = try makeTypedMail(sdk: sdk, mailServerModelParsed) else { return }
		try await populateNotification(content: content, mail: mail, credentials: credentials)
		try await insertMail(sdk: sdk, credentials, mailServerModelParsed, mail)
	}

	private func getParsedMail(sdk: LoggedInSdk, _ mailId: [String]) async throws -> [String: ElementValue] {
		do { return try await sdk.mailFacade().loadUntypedMail(idTuple: tutasdk.IdTupleGenerated(listId: mailId[0], elementId: mailId[1])) } catch {
			if let error = error as? ApiCallError { checkForSuspensionError(error: error) }
			throw error
		}
	}
	private func checkForSuspensionError(error: ApiCallError) {
		if case let .ServerResponseError(error) = error {
			switch error {
			case let .serviceUnavailableError(suspensionTimeSec: .some(time)), let .tooManyRequestsError(suspensionTimeSec: .some(time)):
				logger.notice("Suspension received, suspending for \(time, privacy: .public)s")
				suspensionEndTime = Date(timeIntervalSinceNow: Double(time))
			default: break
			}
		}
	}
	private func getSenderOfMail(_ mail: tutasdk.Mail) -> String {
		if mail.sender.name.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines).isEmpty { return mail.sender.address } else { return mail.sender.name }
	}
	private func makeTypedMail(sdk: Sdk, _ mailServerModelParsed: [String: ElementValue]) throws -> Mail? {
		try sdk.makeTypedMail(mailServerModelParsed: mailServerModelParsed)
	}

	/// Places a downloaded mail from the SDK into the offline storage
	private func insertMail(sdk: Sdk, _ credentials: UnencryptedCredentials, _ mailServerModelParsed: [String: ElementValue], _ mail: Mail) async throws {
		let sqlCipherFacade = IosSqlCipherFacade()
		guard let databaseKey = credentials.databaseKey else { return }

		try await sqlCipherFacade.openDb(credentials.credentialInfo.userId, databaseKey)
		let serializedMail = sdk.serializeMail(mailServerModelParsed: mailServerModelParsed)
		do {
			try await sqlCipherFacade.run(
				"INSERT OR IGNORE INTO list_entities VALUES (?, ?, ?, ?, ?)",
				[
					// 97 is typeId for Mail
					TaggedSqlValue.string(value: "tutanota/97"), TaggedSqlValue.string(value: mail.id!.listId),
					TaggedSqlValue.string(value: mail.id!.elementId), TaggedSqlValue.string(value: mail.ownerGroup ?? ""),
					TaggedSqlValue.bytes(value: serializedMail.wrap()),
				]
			)

			// Have to have two of these because defer doesn't support async.
			//
			// Better hope this doesn't throw because we'll call this again!
			try await sqlCipherFacade.closeDb()
		} catch {
			// This is fine 🔥🐶🔥
			try await sqlCipherFacade.closeDb()
			throw error
		}
	}

	/// try to download email and populate notification content with it
	///
	private func populateNotification(content: UNMutableNotificationContent, mail: tutasdk.Mail, credentials: UnencryptedCredentials) async throws {
		// Init
		let notificationStorage = NotificationStorage(userPreferencesProvider: UserPreferencesProviderImpl())

		let userId = content.userInfo["userId"] as? String

		guard let userId else { return }

		let notificationMode = try notificationStorage.getExtendedNotificationConfig(userId)

		// Modify the notification content here...
		// We use recipient's address as default value for body. It will be overwritten once
		// we download email metadata
		content.body = credentials.credentialInfo.login

		let firstRecipient = mail.firstRecipient?.address
		if firstRecipient != nil { content.userInfo["firstRecipient"] = firstRecipient }

		switch notificationMode {
		case .no_sender_or_subject:
			content.title = firstRecipient ?? ""
			content.body = translate("TutaoPushNewMail", default: "New email received.")
		case .only_sender:
			content.title = getSenderOfMail(mail)
			content.body = translate("TutaoPushNewMail", default: "New email received.")
		case .sender_and_subject:
			content.title = getSenderOfMail(mail)
			content.body = mail.subject
		}

		content.subtitle = firstRecipient ?? userId
		content.threadIdentifier = "\(mail.firstRecipient?.address ?? userId):\(content.title)"
		content.categoryIdentifier = MAIL_ACTIONS_CATEGORY
	}

	override func serviceExtensionTimeWillExpire() {
		// Called just before the extension will be terminated by the system.
		// Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
		if let contentHandler, let bestAttemptContent { contentHandler(bestAttemptContent) }
	}

	private func mailUrl(origin: String, mailId: [String]) -> String { "\(origin)/rest/tutanota/mail/\(mailId[0])/\(mailId[1])" }
}
