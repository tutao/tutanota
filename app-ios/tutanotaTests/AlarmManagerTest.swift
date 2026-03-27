import Foundation
import Testing

@testable import TutanotaSharedFramework

struct AlarmManagerTest {
	private var persistor: AlarmPersistorStub!
	private var cryptor: AlarmCryptorStub!
	private var scheduler: AlarmSchedulerStub!
	private var alarmManager: AlarmManager!
	private var alarmModel: AlarmModel!

	private var dateProvider: DateProviderStub!

	private let userID = "user"

	init() {
		dateProvider = DateProviderStub()

		persistor = AlarmPersistorStub()
		cryptor = AlarmCryptorStub()
		scheduler = AlarmSchedulerStub()
		alarmModel = AlarmModel(dateProvider: dateProvider)

		alarmManager = AlarmManager(alarmPersistor: persistor, alarmCryptor: cryptor, alarmScheduler: scheduler, alarmCalculator: alarmModel)
	}

	private func makeAlarm(eventStartAt date: Date, trigger: String, repeatRule: RepeatRule? = nil, identifier: String = "identifier") -> AlarmNotification {
		AlarmNotification(
			operation: .Create,
			summary: "summary",
			eventStart: date,
			eventEnd: date,
			alarmInfo: AlarmInfo(alarmIdentifer: identifier, trigger: AlarmInterval(string: trigger)!),
			repeatRule: repeatRule,
			user: userID
		)
	}

	private func encryptAlarm(alarm: AlarmNotification) -> EncryptedAlarmNotification {
		EncryptedAlarmNotification(
			operation: alarm.operation,
			summary: alarm.summary,
			eventStart: "",
			eventEnd: "",
			alarmInfo: EncryptedAlarmInfo(alarmIdentifier: alarm.identifier, trigger: ""),
			repeatRule: nil,
			notificationSessionKeys: [],
			user: alarm.user
		)
	}

	private func addToFakePersistence(alarm: AlarmNotification) {
		let encryptedAlarm = encryptAlarm(alarm: alarm)
		persistor.add(alarm: encryptedAlarm)
		cryptor.alarms[alarm.identifier] = alarm
	}

	@Test func testProcessNewAlarmsSchedulesAndSavedNewAlarm() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarm = makeAlarm(eventStartAt: start, trigger: "5M")
		// processNewAlarms will add alarm to the persister but who would think about the poor cryptor?
		cryptor.alarms[alarm.identifier] = alarm

		try! alarmManager.processNewAlarms([encryptAlarm(alarm: alarm)], nil)

		#expect(persistor.alarms.count == 1)
		#expect(scheduler.scheduled.map { $0.identifier } == [ocurrenceIdentifier(alarmIdentifier: alarm.identifier, occurrence: 0)])
	}

	@Test func testProcessNewAlarmsUnschedulesAndDeletesAlarm() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarm = makeAlarm(eventStartAt: start, trigger: "5M")
		addToFakePersistence(alarm: alarm)
		let deleteAlarm = EncryptedAlarmNotification(
			operation: .Delete,
			summary: "",
			eventStart: "",
			eventEnd: "",
			alarmInfo: EncryptedAlarmInfo(alarmIdentifier: alarm.identifier, trigger: ""),
			repeatRule: nil,
			notificationSessionKeys: [],
			user: userID
		)

		try! alarmManager.processNewAlarms([deleteAlarm], nil)

		#expect(persistor.alarms.count == 0)
		#expect(scheduler.unscheduled == [ocurrenceIdentifier(alarmIdentifier: alarm.identifier, occurrence: 0)])
	}

	@Test func testUnscheduleAllAlarms() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarm = makeAlarm(eventStartAt: start, trigger: "5M")
		addToFakePersistence(alarm: alarm)

		alarmManager.unscheduleAllAlarms(userId: userID)

		#expect(scheduler.unscheduled == [ocurrenceIdentifier(alarmIdentifier: alarm.identifier, occurrence: 0)])
	}

	@Test func testRescheduleAlarmsReschedulesAlarms() {
		let start1 = dateProvider.now.advanced(by: 10, .minutes)
		let alarm1 = makeAlarm(eventStartAt: start1, trigger: "5M", identifier: "alarm1")

		let start2 = dateProvider.now.advanced(by: 30, .minutes)
		let alarm2 = makeAlarm(
			eventStartAt: start2,
			trigger: "10M",
			repeatRule: RepeatRule(
				frequency: .daily,
				interval: 1,
				timeZone: dateProvider.timeZone.identifier,
				endCondition: .count(times: 2),
				excludedDates: [],
				advancedRules: []
			),
			identifier: "alarm2"
		)

		addToFakePersistence(alarm: alarm1)
		addToFakePersistence(alarm: alarm2)

		alarmManager.rescheduleAlarms()

		#expect(
			scheduler.scheduled == [
				ScheduledAlarmInfo(
					alarmTime: start2.advanced(by: 24, .hours).advanced(by: -10, .minutes),
					occurrence: 2,
					identifier: ocurrenceIdentifier(alarmIdentifier: alarm2.identifier, occurrence: 2),
					summary: alarm2.summary,
					eventDate: start2.advanced(by: 24, .hours)
				),
				ScheduledAlarmInfo(
					alarmTime: start2.advanced(by: -10, .minutes),
					occurrence: 1,
					identifier: ocurrenceIdentifier(alarmIdentifier: alarm2.identifier, occurrence: 1),
					summary: alarm2.summary,
					eventDate: start2
				),
				ScheduledAlarmInfo(
					alarmTime: start1.advanced(by: -5, .minutes),
					occurrence: 0,
					identifier: ocurrenceIdentifier(alarmIdentifier: alarm1.identifier, occurrence: 0),
					summary: alarm1.summary,
					eventDate: alarm1.eventStart
				),
			]
		)
	}

	@Test func testAllDayEvent_OneDayBeforeAlarm_ScheduledAtLocalMidnight() {
		// Mar 08 2023 00:00:00 GMT0
		let eventStartUTC = allDayUTCDate(fromLocalDate: dateProvider.now.advanced(by: 48, .hours), inTimeZone: dateProvider.timeZone.identifier)
		let eventEndUTC = eventStartUTC.advanced(by: 24, .hours)

		let alarmNotification = makeAlarm(eventStartAt: eventStartUTC, trigger: "1D")
		addToFakePersistence(alarm: alarmNotification)

		let eventStartLocalMidnight = allDayLocalDate(fromUTCDate: eventStartUTC, inZone: dateProvider.timeZone)
		let expectedAlarmTime = eventStartLocalMidnight.advanced(by: -24, .hours)  // Mar 07 2023 00:00:00 GMT+1

		let expectedScheduledAlarmInfo = ScheduledAlarmInfo(
			alarmTime: expectedAlarmTime,
			occurrence: 0,
			identifier: ocurrenceIdentifier(alarmIdentifier: alarmNotification.identifier, occurrence: 0),
			summary: alarmNotification.summary,
			eventDate: eventStartLocalMidnight
		)

		try! alarmManager.processNewAlarms([encryptAlarm(alarm: alarmNotification)], nil)

		#expect(scheduler.scheduled.count == 1)
		#expect(
			scheduler.scheduled == [expectedScheduledAlarmInfo],
			"It should schedule an alarm at exactly 1 day at local time before event start (24hr + timezoneOffset)"
		)
	}

	@Test func testRepeatingAllDayEvent_OneDayBeforeAlarm_ScheduledAtLocalMidnight() {
		// Mar 08 2023 00:00:00 GMT0
		let eventStartUTC = allDayUTCDate(fromLocalDate: dateProvider.now.advanced(by: 48, .hours), inTimeZone: dateProvider.timeZone.identifier)
		let eventEndUTC = eventStartUTC.advanced(by: 24, .hours)

		let alarmNotification = makeAlarm(
			eventStartAt: eventStartUTC,
			trigger: "1D",
			repeatRule: RepeatRule(frequency: .daily, interval: 1, timeZone: "Europe/Berlin", endCondition: .never, excludedDates: [], advancedRules: []),
		)
		addToFakePersistence(alarm: alarmNotification)

		let firstOccurrenceLocalMidnight = allDayLocalDate(fromUTCDate: eventStartUTC, inZone: dateProvider.timeZone)
		let expectedAlarmTime = firstOccurrenceLocalMidnight.advanced(by: -24, .hours)  // Mar 07 2023 00:00:00 GMT+1
		let expectedScheduledAlarmOccurrence = ScheduledAlarmInfo(
			alarmTime: expectedAlarmTime,
			occurrence: 1,  // Repeating events counts occurrences starting at one
			identifier: ocurrenceIdentifier(alarmIdentifier: alarmNotification.identifier, occurrence: 1),
			summary: alarmNotification.summary,
			eventDate: firstOccurrenceLocalMidnight
		)

		try! alarmManager.processNewAlarms([encryptAlarm(alarm: alarmNotification)], nil)

		#expect(scheduler.scheduled.count == EVENTS_SCHEDULED_AHEAD)

		// Scheduling is descending -> last = earliest occurrence
		#expect(
			scheduler.scheduled.last == expectedScheduledAlarmOccurrence,
			"It should schedule an alarm at exactly 1 day at local time before event start (24hr + timezoneOffset)"
		)
	}
}

// MARK: stubs

class AlarmPersistorStub: AlarmPersistor {
	var alarms: [EncryptedAlarmNotification] = []

	func add(alarm: EncryptedAlarmNotification) { self.alarms.append(alarm) }

	func store(alarms: [EncryptedAlarmNotification]) { self.alarms = alarms }

	func clear() { self.alarms = [] }
}

class AlarmCryptorStub: AlarmCryptor {
	var alarms: [String: AlarmNotification] = [:]

	func decrypt(alarm: EncryptedAlarmNotification) throws -> AlarmNotification {
		if let alarm = self.alarms[alarm.getAlarmInfo().alarmIdentifier] {
			return alarm
		} else {
			throw TutanotaError(message: "Failed to 'decrypt' alarm \(alarm.getAlarmInfo().alarmIdentifier)")
		}
	}

	public func storeNewDeviceSessionKey(pushIdentifierId: String, sessionKey: Key) throws {
		// do nothing
		return
	}
}

class AlarmSchedulerStub: AlarmScheduler {
	var scheduled: [ScheduledAlarmInfo] = []
	var unscheduled: [String] = []

	func schedule(info: ScheduledAlarmInfo, isAllDayevent: Bool = false) { self.scheduled.append(info) }

	func unscheduleAll(occurrenceIds: [String]) { self.unscheduled += occurrenceIds }
}

class DateProviderStub: DateProvider {
	// Mon Mar 06 2023 16:52:24 GMT+0100 (Central European Standard Time)
	var now: Date = Date(timeIntervalSince1970: 1678117944)

	var timeZone: TimeZone = TimeZone(identifier: "Europe/Berlin")!
}
