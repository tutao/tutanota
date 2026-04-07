import Combine
import Mockable
import Testing
import TutanotaSharedFramework

struct NotificationsHandlerTest {
	private var alarmManager: MockAlarmProcessor
	private var notificationStorage: MockNotificationStorage
	private let notificationsHandler: NotificationsHandler
	private let dateProvider = MockDateProvider()
	private let httpClient = MockHttpClient()

	let userId1 = "userId1"
	let userId2 = "userId2"
	let sseInfo: SSEInfo

	init() {
		sseInfo = SSEInfo(pushIdentifier: "pushIdentifier", sseOrigin: "sseorigin.com", userIds: [userId1, userId2])

		alarmManager = MockAlarmProcessor(policy: .relaxedVoid)
		notificationStorage = MockNotificationStorage()
		notificationsHandler = NotificationsHandler(
			alarmManager: alarmManager,
			notificationStorage: notificationStorage,
			httpClient: httpClient,
			dateProvider: dateProvider
		)
		given(dateProvider).now.willReturn(Date.init(timeIntervalSince1970: 1))
	}

	@Test func downloadsAndProcessesAlarms_noAlarms() async throws {
		given(notificationStorage).sseInfo.willReturn(sseInfo)
		let newLastProcessedNotificationId = "newLastProcessedNotificationId"
		let notification = MissedNotification(alarmNotifications: [], lastProcessedNotificationId: newLastProcessedNotificationId)
		let data = try! JSONEncoder().encode(notification)
		let response = HTTPURLResponse()
		// the first date is the one when the task is schduled and the seond one is when the request is made
		let firstDate = Date(timeIntervalSince1970: 0)
		let secondDate = Date(timeIntervalSince1970: 1)
		var checkTimes = [firstDate, secondDate]
		given(notificationStorage).lastMissedNotificationCheckTime.willProduce { checkTimes.removeFirst() }
		given(notificationStorage).lastProcessedNotificationId.willReturn(nil)
		given(httpClient).fetch(url: .any, method: .value(.get), headers: .any, body: .value(nil)).willReturn((data, response))

		await notificationsHandler.fetchMissedNotifications()

		verify(notificationStorage).lastMissedNotificationCheckTime().getCalled(.atLeastOnce)

		verify(httpClient).fetch(url: .any, method: .value(.get), headers: .any, body: .value(nil)).called(.once)
		verify(alarmManager).processNewAlarms(.value([]), .value(nil)).called(.once)
		verify(notificationStorage).lastProcessedNotificationId(newValue: .value(newLastProcessedNotificationId)).setCalled(.once)
		verify(notificationStorage).lastMissedNotificationCheckTime(newValue: .value(secondDate)).setCalled(.once)
	}
	@Test func downloadsAndProcessesAlarms_WithAlarms() async throws {
		given(notificationStorage).sseInfo.willReturn(sseInfo)
		let alarm = EncryptedAlarmNotification(
			operation: .Create,
			summary: "",
			eventStart: "",
			eventEnd: "",
			alarmInfo: EncryptedAlarmInfo(alarmIdentifier: "", trigger: ""),
			repeatRule: nil,
			notificationSessionKeys: [],
			user: ""
		)
		let notification = MissedNotification(alarmNotifications: [alarm], lastProcessedNotificationId: "newLastProcessedNotificationId")
		let data = try! JSONEncoder().encode(notification)
		let response = HTTPURLResponse()
		given(httpClient).fetch(url: .any, method: .value(.get), headers: .any, body: .value(nil)).willReturn((data, response))
		given(notificationStorage).lastMissedNotificationCheckTime.willReturn(nil)
		given(notificationStorage).lastProcessedNotificationId.willReturn(nil)
		await notificationsHandler.fetchMissedNotifications()
		verify(alarmManager).processNewAlarms(.value([alarm]), .value(nil)).called(.once)
	}
	@Test func downloadsAndProcessesAlarms_skipsAlreadyFetched() async throws {
		given(notificationStorage).sseInfo.willReturn(sseInfo)
		let oldLastId = "oldLastId"
		given(notificationStorage).lastProcessedNotificationId.willReturn(oldLastId)
		let notification = MissedNotification(alarmNotifications: [], lastProcessedNotificationId: "newLastProcessedNotificationId")
		let data = try! JSONEncoder().encode(notification)
		let response = HTTPURLResponse()
		// It's hard to control the order of invocations so we don't do the parallel invocations and instead
		// just check that the time of the request is before the last response and then skip the request.
		given(notificationStorage).lastMissedNotificationCheckTime.willReturn(Date(timeIntervalSince1970: 20))
		given(httpClient).fetch(url: .any, method: .value(.get), headers: .any, body: .value(nil)).willReturn((data, response))
		given(dateProvider).now.willReturn(Date(timeIntervalSince1970: 10))
		await notificationsHandler.fetchMissedNotifications()
		verify(httpClient).fetch(url: .any, method: .any, headers: .any, body: .any).called(.never)
	}
	@Test func downloadsAndProcessesAlarms_callIfReceivedWhenInflight() async throws {
		// Doesn't actually test anything in parallel, just checks that the checkTime comparison works correctly with the time
		// that the call was scheduled.
		given(notificationStorage).sseInfo.willReturn(sseInfo)
		let oldLastId = "oldLastId"
		given(notificationStorage).lastProcessedNotificationId.willReturn(oldLastId)
		let notification = MissedNotification(alarmNotifications: [], lastProcessedNotificationId: "newLastProcessedNotificationId")
		let data = try! JSONEncoder().encode(notification)
		let response = HTTPURLResponse()
		given(notificationStorage).lastMissedNotificationCheckTime.willReturn(Date(timeIntervalSince1970: 10))
		given(httpClient).fetch(url: .any, method: .value(.get), headers: .any, body: .value(nil)).willReturn((data, response))
		// call was scheduled after the last response, do make the call
		dateProvider.reset()
		given(dateProvider).now.willReturn(Date(timeIntervalSince1970: 20))
		await notificationsHandler.fetchMissedNotifications()
		verify(httpClient).fetch(url: .any, method: .any, headers: .any, body: .any).called(.once)
	}
	@Test func downloadsAndProcessesAlarms_removesUserIfNotAuthenticated() async throws {
		var sseInfo = self.sseInfo
		given(notificationStorage).sseInfo.willProduce { sseInfo }
		given(notificationStorage).removeUser(.value(userId1)).willProduce { _ in sseInfo.userIds.removeFirst() }
		let oldLastId = "oldLastId"
		given(notificationStorage).lastMissedNotificationCheckTime.willReturn(nil)
		given(notificationStorage).lastProcessedNotificationId.willReturn(oldLastId)
		let emptyData = Data()
		let notAuthenticatedResponse = HTTPURLResponse(
			url: URL(string: "https://example.com")!,
			statusCode: HttpStatusCode.notAuthenticated.rawValue,
			httpVersion: nil,
			headerFields: nil
		)!
		let notification = MissedNotification(alarmNotifications: [], lastProcessedNotificationId: "newLastProcessedNotificationId")
		let data = try! JSONEncoder().encode(notification)
		let response = HTTPURLResponse()
		given(httpClient).fetch(url: .any, method: .value(.get), headers: .matching(dictContains(["userIds": userId2])), body: .value(nil))
			.willReturn((data, response))
		given(httpClient).fetch(url: .any, method: .value(.get), headers: .matching(dictContains(["userIds": userId1])), body: .value(nil))
			.willReturn((emptyData, notAuthenticatedResponse))
		await notificationsHandler.fetchMissedNotifications()
		verify(httpClient).fetch(url: .any, method: .any, headers: .matching(dictContains(["userIds": userId1])), body: .any).called(.once)
		verify(httpClient).fetch(url: .any, method: .any, headers: .matching(dictContains(["userIds": userId1])), body: .any).called(.once)
		verify(httpClient).fetch(url: .any, method: .any, headers: .matching(dictContains(["userIds": userId2])), body: .any).called(.once)
		verify(notificationStorage).removeUser(.value(userId1)).called(.once)
	}
}

extension NotificationsHandler {
	func fetchMissedNotifications() async {
		await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in self.fetchMissedNotifications { _ in cont.resume(returning: ()) } }
	}
}
