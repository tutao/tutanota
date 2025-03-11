import TutanotaSharedFramework
import UserNotifications
import tutasdk

class NotificationService: UNNotificationServiceExtension {
	var contentHandler: ((UNNotificationContent) -> Void)?
	var bestAttemptContent: UNMutableNotificationContent?
	let urlSession: URLSession = makeUrlSession()

	override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
		self.contentHandler = contentHandler
		bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
		if let bestAttemptContent {
			Task {
				let credentialsDb = try! CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
				let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
				let keychainEncryption = KeychainEncryption(keychainManager: keychainManager)
				let credentialsFacade = IosNativeCredentialsFacade(
					keychainEncryption: keychainEncryption,
					credentialsDb: credentialsDb,
					cryptoFns: CryptoFunctions()
				)
				let notificationStorage = NotificationStorage(userPreferencesProvider: UserPreferencesProviderImpl())

				let mailId = bestAttemptContent.userInfo["mailId"] as? [String]
				let userId = bestAttemptContent.userInfo["userId"] as? String

				guard let userId else { return }
				guard let mailId else { return }

				guard let credentials = try await credentialsFacade.loadByUserId(userId) else { return }
				guard let mail = try await getMail(credentials, notificationStorage, mailId, userId) else { return }
				try await populateNotification(content: bestAttemptContent, mail: mail, credentials: credentials)
				try await insertMail(mail: mail, credentials: credentials)
				contentHandler(bestAttemptContent)
			}
		}
	}
	private func getMail(_ credentials: UnencryptedCredentials, _ notificationStorage: NotificationStorage, _ mailId: [String], _ userId: String) async throws
		-> tutasdk.Mail?
	{
		guard let origin = notificationStorage.sseInfo?.sseOrigin else { return nil }
		guard let encryptedPassphraseKey = credentials.encryptedPassphraseKey else { return nil }
		let credentials = tutasdk.Credentials(
			login: credentials.credentialInfo.login,
			userId: userId,
			accessToken: credentials.accessToken,
			encryptedPassphraseKey: encryptedPassphraseKey.data,
			credentialType: tutasdk.CredentialType.internal
		)
		let sdk = try await Sdk(baseUrl: origin, rawRestClient: SdkRestClient(urlSession: self.urlSession)).login(credentials: credentials)
		return try await sdk.mailFacade().loadEmailByIdEncrypted(idTuple: tutasdk.IdTupleGenerated(listId: mailId[0], elementId: mailId[1]))
	}
	private func getSenderOfMail(_ mail: tutasdk.Mail) -> String {
		if mail.sender.name.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines).isEmpty { return mail.sender.address } else { return mail.sender.name }
	}

	/// Places a downloaded mail from the SDK into the offline storage
	private func insertMail(mail: tutasdk.Mail, credentials: UnencryptedCredentials) async throws {
		let sqlCipherFacade = IosSqlCipherFacade()
		guard let databaseKey = credentials.databaseKey else { return }

		try await sqlCipherFacade.openDb(credentials.credentialInfo.userId, databaseKey)
		let serializedMail = serializeMail(mail: mail)
		do {
			try await sqlCipherFacade.run(
				"INSERT OR IGNORE INTO list_entities VALUES (?, ?, ?, ?, ?)",
				[
					TaggedSqlValue.string(value: "tutanota/Mail"), TaggedSqlValue.string(value: mail.id!.listId),
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
