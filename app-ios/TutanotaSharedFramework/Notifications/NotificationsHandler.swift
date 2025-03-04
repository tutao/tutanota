import Foundation

private let MISSED_NOTIFICATION_TTL_SEC: Int64 = 30 * 24 * 60 * 60  // 30 days

/// Downlaods notifications and dispatches them to AlarmManager
public class NotificationsHandler {
	private let alarmManager: AlarmManager
	private let notificationStorage: NotificationStorage
	private let httpClient: HttpClient
	private let dateProvider: DateProvider
	private let taskQueue = AsyncQueue()

	public init(alarmManager: AlarmManager, notificationStorage: NotificationStorage, httpClient: HttpClient, dateProvider: DateProvider) {
		self.alarmManager = alarmManager
		self.notificationStorage = notificationStorage
		self.httpClient = httpClient
		self.dateProvider = dateProvider
	}

	public func initialize() {
		if self.hasNotificationTTLExpired() {
			self.alarmManager.resetStoredState()
		} else {
			// we're scheduling the reschedule before fetching so we don't get
			// two reschedules in parallel
			self.taskQueue.enqueue { [weak self] in self?.alarmManager.rescheduleAlarms() }

			self.fetchMissedNotifications { result in
				switch result {
				case .success: printLog("Successfully processed missed notification")
				case .failure(let err): printLog("Failed to fetch/process missed notification \(err)")
				}
			}
		}
	}

	private func hasNotificationTTLExpired() -> Bool {
		guard let lastMissedNotificationCheckTime = notificationStorage.lastMissedNotificationCheckTime else { return false }
		let sinceNow = lastMissedNotificationCheckTime.timeIntervalSinceNow
		// Important: timeIntervalSinceNow is negative if it's in the past
		return sinceNow < 0 && Int64(abs(sinceNow)) > MISSED_NOTIFICATION_TTL_SEC
	}

	/// Fetch and process missed notification. Will execute fetch operations one by one if it's queued multiple times.  Will wait for suspension if necessary.
	public func fetchMissedNotifications(_ completionHandler: @escaping ResponseCallback<Void>) {
		printLog("Adding fetch notification operation to queue")
		let receiveTime = self.dateProvider.now
		self.taskQueue.enqueue { [weak self] in
			let void: Void = ()
			guard let self else {
				TUTSLog("Handler is gone, skipping task")
				completionHandler(.success(void))
				return
			}

			// If we received notification before we started a newer download we can safely ignore this notification as we already downloaded the data for it.
			if let lastMissedNotificationCheckTime = notificationStorage.lastMissedNotificationCheckTime, lastMissedNotificationCheckTime > receiveTime {
				completionHandler(.success(void))
				return
			}
			do {
				try await self.doFetchMissedNotifications()
				completionHandler(.success(void))
			} catch {
				printLog("Failed to fetch missed notificaiton: \(error)")
				completionHandler(.failure(error))
			}
		}
	}

	/// Fetch and process missed notification, actual impl without queuing which makes it easier to just call it recursively.
	private func doFetchMissedNotifications() async throws {
		guard let sseInfo = self.notificationStorage.sseInfo else {
			printLog("No stored SSE info")
			return
		}

		if sseInfo.userIds.isEmpty {
			printLog("No users to download missed notification with")
			self.alarmManager.unscheduleAllAlarms(userId: nil)
			return
		}
		let requestTime = dateProvider.now

		let url = self.missedNotificationUrl(origin: sseInfo.sseOrigin, pushIdentifier: sseInfo.pushIdentifier)
		let userId = sseInfo.userIds[0]
		var headers: [String: String] = ["userIds": userId]
		addSystemModelHeaders(to: &headers)
		if let lastNotificationId = self.notificationStorage.lastProcessedNotificationId { headers["lastProcessedNotificationId"] = lastNotificationId }

		printLog("Downloading missed notification with userId \(userId)")
		let (data, httpResponse) = try await self.httpClient.fetch(url: url, headers: headers)
		printLog("Fetched missed notifications with status code \(httpResponse.statusCode)")

		switch HttpStatusCode(rawValue: httpResponse.statusCode) {
		case .notAuthenticated:
			printLog("Not authenticated to download missed notification w/ user \(userId)")
			self.alarmManager.unscheduleAllAlarms(userId: userId)
			self.notificationStorage.removeUser(userId)
			try await self.doFetchMissedNotifications()
		case .serviceUnavailable, .tooManyRequests:
			let suspensionTime = extractSuspensionTime(from: httpResponse)
			printLog("ServiceUnavailable when downloading missed notification, waiting for \(suspensionTime)s")
			try await Task.sleep(nanoseconds: suspensionTime.nanos)
			try await self.doFetchMissedNotifications()
		case .notFound: return
		case .ok:
			self.notificationStorage.lastMissedNotificationCheckTime = requestTime
			let missedNotification: MissedNotification
			do { missedNotification = try JSONDecoder().decode(MissedNotification.self, from: data) } catch {
				throw TUTErrorFactory.createError("Failed to parse response for the missed notificaiton, \(error)")
			}
			self.notificationStorage.lastProcessedNotificationId = missedNotification.lastProcessedNotificationId
			try alarmManager.processNewAlarms(missedNotification.alarmNotifications)
		default:
			let errorId = httpResponse.allHeaderFields["Error-Id"]
			let error = NSError(
				domain: TUT_NETWORK_ERROR,
				code: httpResponse.statusCode,
				userInfo: ["message": "Failed to fetch missed notification, error id: \(errorId ?? "")"]
			)
			throw error
		}
	}

	private func missedNotificationUrl(origin: String, pushIdentifier: String) -> URL {
		let base64UrlId = stringToCustomId(customId: pushIdentifier)
		return URL(string: "\(origin)/rest/sys/missednotification/\(base64UrlId)")!
	}
}
