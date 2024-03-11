import TutanotaSharedFramework
import UserNotifications

class NotificationService: UNNotificationServiceExtension {

	var contentHandler: ((UNNotificationContent) -> Void)?
	var bestAttemptContent: UNMutableNotificationContent?

	override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
		self.contentHandler = contentHandler
		bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

		if let bestAttemptContent {
			Task {
				try await populateNotification(content: bestAttemptContent)
				contentHandler(bestAttemptContent)
			}
		}
	}

	/// try to download email and populate notification content with it
	private func populateNotification(content: UNMutableNotificationContent) async throws {
		// Init
		let credentialsDb = try! CredentialsDatabase(dbPath: credentialsDatabasePath().absoluteString)
		let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
		let keychainEncryption = KeychainEncryption(keychainManager: keychainManager)
		let credentialsFacade = IosNativeCredentialsFacade(keychainEncryption: keychainEncryption, credentialsDb: credentialsDb, cryptoFns: CryptoFunctions())
		let notificationStorage = NotificationStorage(userPreferencesProvider: UserPreferencesProviderImpl())

		let mailId = content.userInfo["mailId"] as? [String]
		let userId = content.userInfo["userId"] as? String

		guard let userId else { return }

		let notificationMode = try notificationStorage.getExtendedNotificationConfig(userId)

		do {
			guard let credentials = try await credentialsFacade.loadByUserId(userId) else { return }

			// Modify the notification content here...
			// We use recipient's address as default value for body. It will be overwritten once
			// we download email metadata
			content.body = try await credentialsFacade.loadByUserId(userId)?.credentialInfo.login ?? ""

			if notificationMode != .no_sender_or_subject && mailId != nil {
				var additionalHeaders = [String: String]()
				addTutanotaModelHeaders(to: &additionalHeaders)

				additionalHeaders["accessToken"] = credentials.accessToken

				let configuration = URLSessionConfiguration.ephemeral
				configuration.httpAdditionalHeaders = additionalHeaders

				let urlSession = URLSession(configuration: configuration)
				guard let origin = notificationStorage.sseInfo?.sseOrigin else {
					TUTSLog("No SSE origin")
					return
				}
				let urlString = self.mailUrl(origin: origin, mailId: mailId!)

				let responseTuple = try? urlSession.synchronousDataTask(with: URL(string: urlString)!)
				if responseTuple != nil {
					let httpResponse = responseTuple!.1 as! HTTPURLResponse
					TUTSLog("Fetched mail with status code \(httpResponse.statusCode)")

					switch HttpStatusCode(rawValue: httpResponse.statusCode) {
					case .serviceUnavailable, .tooManyRequests: TUTSLog("ServiceUnavailable when downloading mail")
					case .notFound: return
					case .ok:
						do {
							let mail = try JSONDecoder().decode(MailMetadata.self, from: responseTuple!.0)
							content.title = mail.sender.address
							content.body = mail.firstRecipient.address
						} catch { TUTSLog("Failed to parse response for the mail, \(error)") }
					default:
						let errorId = httpResponse.allHeaderFields["Error-Id"]
						TUTSLog("Failed to fetch mail, error id: \(errorId ?? "")")
					}
				}
			}
		} catch { TUTSLog("Failed! \(error)") }
	}

	override func serviceExtensionTimeWillExpire() {
		// Called just before the extension will be terminated by the system.
		// Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
		if let contentHandler, let bestAttemptContent { contentHandler(bestAttemptContent) }
	}

	private func mailUrl(origin: String, mailId: [String]) -> String { "\(origin)/rest/tutanota/mail/\(mailId[0])/\(mailId[1])" }
}
