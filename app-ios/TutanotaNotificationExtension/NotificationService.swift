import UserNotifications
import TutanotaSharedFramework

class NotificationService: UNNotificationServiceExtension {

	var contentHandler: ((UNNotificationContent) -> Void)?
	var bestAttemptContent: UNMutableNotificationContent?

	override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
		self.contentHandler = contentHandler
		bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

		if let bestAttemptContent = bestAttemptContent {
			// Init
			let credentialsDb = try! CredentialsDatabase(db: SqliteDb())
			let keychainManager = KeychainManager(keyGenerator: KeyGenerator())
			let credentialsEncryption = IosNativeCredentialsFacade(
				keychainManager: keychainManager,
				credentialsDb: credentialsDb,
				userDefaults: UserDefaults(suiteName: TUTANOTA_APP_GROUP)!
			)

			let mailId = bestAttemptContent.userInfo["mailId"] as? [String]
			let userId = bestAttemptContent.userInfo["userId"] as? String

			let record = try! credentialsDb.getAll().first {
				$0.credentialsInfo.userId == userId
			}
			let accessToken = record?.accessToken ?? ""

			Task {
				do {
					let encryptedCredentialsKey = try await credentialsEncryption.getCredentialsEncryptionKey()!
					let credentialsKey = try await credentialsEncryption.decryptUsingKeychain(encryptedCredentialsKey, CredentialEncryptionMode.deviceLock)
					let decryptedAccessTokenData = try aesDecryptData(Data(base64Encoded: accessToken)!, withKey: credentialsKey.data)
					let decryptedAccessToken = String(data: decryptedAccessTokenData, encoding: .utf8)

					// Modify the notification content here...
					bestAttemptContent.title = "mailId: \(mailId?.joined(separator: ", ") ?? ""), accessToken: \(accessToken)"

					if mailId != nil {
						var additionalHeaders = [String: String]()
						addTutanotaModelHeaders(to: &additionalHeaders)

						additionalHeaders["accessToken"] = decryptedAccessToken

						let configuration = URLSessionConfiguration.ephemeral
						configuration.httpAdditionalHeaders = additionalHeaders

						let urlSession = URLSession(configuration: configuration)
						// FIXME hardcoded
						let urlString = self.mailUrl(origin: "http://192.168.178.152:9000", mailId: mailId!)

						let responseTuple = try? urlSession.synchronousDataTask(with: URL(string: urlString)!)
						if responseTuple != nil {
							let httpResponse = responseTuple!.1 as! HTTPURLResponse
							TUTSLog("Fetched mail with status code \(httpResponse.statusCode)")

							switch HttpStatusCode(rawValue: httpResponse.statusCode) {
							case .serviceUnavailable, .tooManyRequests:
								TUTSLog("ServiceUnavailable when downloading mail")
							case .notFound: return
							case .ok:
								do {
									let mail = try JSONDecoder().decode(MailMetadata.self, from: responseTuple!.0 )
									bestAttemptContent.title = "sender: \(mail.sender.address), first recipient: \(mail.firstRecipient.address)"
								} catch {
									TUTSLog("Failed to parse response for the mail, \(error)")
								}
							default:
								let errorId = httpResponse.allHeaderFields["Error-Id"]
								TUTSLog("Failed to fetch mail, error id: \(errorId ?? "")")
							}
						}
					}
				} catch {
					TUTSLog("Failed! \(error)")
				}
				contentHandler(bestAttemptContent)
			}
		}
	}

	override func serviceExtensionTimeWillExpire() {
		// Called just before the extension will be terminated by the system.
		// Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
		if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
			contentHandler(bestAttemptContent)
		}
	}

	// FIXME share between platforms
	private func mailUrl(origin: String, mailId: [String]) -> String {
		return "\(origin)/rest/tutanota/mail/\(mailId[0])/\(mailId[1])"
	}
}
