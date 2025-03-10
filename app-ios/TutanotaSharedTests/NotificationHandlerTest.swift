import Combine
import Mockingbird
import Testing
import TutanotaSharedFramework

struct NotificationsHandlerTest {
	private var alarmManager: AlarmManagerMock
	private var notificationStorage: NotificationStorageMock
	private var notificationsHandler: NotificationsHandler
	private let dateProvider = mock(DateProvider.self)
	private var httpClient: HttpClientMock! = mock(HttpClient.self)

	let userId1 = "userId1"
	let userId2 = "userId2"
	let sseInfo: SSEInfo

	init() {
		sseInfo = SSEInfo(pushIdentifier: "pushIdentifier", sseOrigin: "sseorigin.com", userIds: [userId1, userId2])

		initMockingbird()

		alarmManager = mock(AlarmManager.self)
			.initialize(
				alarmPersistor: mock(AlarmPersistor.self),
				alarmCryptor: mock(AlarmCryptor.self),
				alarmScheduler: mock(AlarmScheduler.self),
				alarmCalculator: mock(AlarmCalculator.self)
			)
		notificationStorage = mock(NotificationStorage.self).initialize(userPreferencesProvider: mock(UserPreferencesProvider.self))
		notificationsHandler = NotificationsHandler(
			alarmManager: alarmManager,
			notificationStorage: notificationStorage,
			httpClient: httpClient,
			dateProvider: dateProvider
		)

		given(dateProvider.now).willReturn(Date.init(timeIntervalSince1970: 1))
	}

	@Test func downloadsAndProcessesAlarms_noAlarms() async throws {
		given(notificationStorage.sseInfo).willReturn(sseInfo)
		let newLastProcessedNotificationId = "newLastProcessedNotificationId"
		let notification = MissedNotification(alarmNotifications: [], lastProcessedNotificationId: newLastProcessedNotificationId)
		let data = try! JSONEncoder().encode(notification)
		let response = HTTPURLResponse()
		// the first date is the one when the task is schduled and the seond one is when the request is made
		let firstDate = Date(timeIntervalSince1970: 0)
		let secondDate = Date(timeIntervalSince1970: 1)
		given(notificationStorage.lastMissedNotificationCheckTime).willReturn(sequence(of: firstDate, secondDate))
		given(await httpClient.fetch(url: any(), method: .get, headers: any(), body: nil)).willReturn((data, response))

		await notificationsHandler.fetchMissedNotifications()

		verify(notificationStorage.lastMissedNotificationCheckTime).wasCalled()

		verify(await httpClient.fetch(url: any(), method: .get, headers: any(), body: nil)).wasCalled()
		verify(alarmManager.processNewAlarms([])).wasCalled()
		verify(notificationStorage.lastProcessedNotificationId = newLastProcessedNotificationId).wasCalled()
		verify(notificationStorage.lastMissedNotificationCheckTime = secondDate).wasCalled()
	}

	@Test func downloadsAndProcessesAlarms_WithAlarms() async throws {
		given(notificationStorage.sseInfo).willReturn(sseInfo)
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
		given(await httpClient.fetch(url: any(), method: .get, headers: any(), body: nil)).willReturn((data, response))

		await notificationsHandler.fetchMissedNotifications()

		verify(alarmManager.processNewAlarms([alarm])).wasCalled()
	}

	@Test func downloadsAndProcessesAlarms_skipsAlreadyFetched() async throws {
		given(notificationStorage.sseInfo).willReturn(sseInfo)
		let oldLastId = "oldLastId"
		given(notificationStorage.lastProcessedNotificationId).willReturn(oldLastId)
		let notification = MissedNotification(alarmNotifications: [], lastProcessedNotificationId: "newLastProcessedNotificationId")
		let data = try! JSONEncoder().encode(notification)
		let response = HTTPURLResponse()
		// It's hard to control the order of invocations so we don't do the parallel invocations and instead
		// just check that the time of the request is before the last response and then skip the request.
		given(notificationStorage.lastMissedNotificationCheckTime).willReturn(Date(timeIntervalSince1970: 20))
		given(await httpClient.fetch(url: any(), method: .get, headers: any(), body: nil)).willReturn((data, response))
		given(dateProvider.now).willReturn(Date(timeIntervalSince1970: 10))

		await notificationsHandler.fetchMissedNotifications()

		verify(await httpClient.fetch(url: any(), method: any(), headers: any(), body: any())).wasNeverCalled()
	}

	@Test func downloadsAndProcessesAlarms_callIfReceivedWhenInflight() async throws {
		given(notificationStorage.sseInfo).willReturn(sseInfo)
		let oldLastId = "oldLastId"
		given(notificationStorage.lastProcessedNotificationId).willReturn(oldLastId)
		let notification = MissedNotification(alarmNotifications: [], lastProcessedNotificationId: "newLastProcessedNotificationId")
		let data = try! JSONEncoder().encode(notification)
		let response = HTTPURLResponse()

		given(notificationStorage.lastMissedNotificationCheckTime).willReturn(Date(timeIntervalSince1970: 10))
		given(await httpClient.fetch(url: any(), method: .get, headers: any(), body: nil)).willReturn((data, response))
		// call was scheduled after the last response, do make the call
		given(dateProvider.now).willReturn(Date(timeIntervalSince1970: 20))

		await notificationsHandler.fetchMissedNotifications()

		verify(await httpClient.fetch(url: any(), method: any(), headers: any(), body: any())).wasCalled(1)
	}

	@Test func downloadsAndProcessesAlarms_removesUserIfNotAuthenticated() async throws {
		var sseInfo = self.sseInfo
		given(notificationStorage.sseInfo).will { sseInfo }
		given(notificationStorage.removeUser(userId1)).will { _ in sseInfo.userIds.removeFirst() }
		let oldLastId = "oldLastId"
		given(notificationStorage.lastProcessedNotificationId).willReturn(oldLastId)
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
		given(await httpClient.fetch(url: any(), method: .get, headers: dict(containing: ("userIds", userId2)), body: nil)).willReturn((data, response))
		given(await httpClient.fetch(url: any(), method: .get, headers: dict(containing: ("userIds", userId1)), body: nil))
			.willReturn((emptyData, notAuthenticatedResponse))

		await notificationsHandler.fetchMissedNotifications()

		verify(await httpClient.fetch(url: any(), method: any(), headers: dict(containing: ("userIds", userId1)), body: any())).wasCalled(1)
		verify(await httpClient.fetch(url: any(), method: any(), headers: dict(containing: ("userIds", userId2)), body: any())).wasCalled(1)
		verify(notificationStorage.removeUser(userId1)).wasCalled()
	}
}

extension NotificationsHandler {
	func fetchMissedNotifications() async {
		await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in self.fetchMissedNotifications { _ in cont.resume(returning: ()) } }
	}
}
