import Foundation
import XCTest

@testable import TutanotaSharedFramework

class AlarmManagerTest: XCTestCase {
	private var persistor: AlarmPersistorStub!
	private var cryptor: AlarmCryptorStub!
	private var scheduler: AlarmSchedulerStub!
	private var alarmManager: AlarmManager!
	private var alarmModel: AlarmModel!

	private var dateProvider: DateProviderStub!

	private let userID = "user"

	override func setUp() {
		dateProvider = DateProviderStub()

		persistor = AlarmPersistorStub()
		cryptor = AlarmCryptorStub()
		scheduler = AlarmSchedulerStub()
		alarmModel = AlarmModel(dateProvider: dateProvider)

		alarmManager = AlarmManager(alarmPersistor: persistor, alarmCryptor: cryptor, alarmScheduler: scheduler, alarmCalculator: alarmModel)
	}

	private func makeAlarm(at date: Date, trigger: String, repeatRule: RepeatRule? = nil, identifier: String = "identifier") -> AlarmNotification {
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

	private func add(alarm: AlarmNotification) {
		let encryptedAlarm = encryptAlarm(alarm: alarm)
		persistor.add(alarm: encryptedAlarm)
		cryptor.alarms[alarm.identifier] = alarm
	}

	func testProcessNewAlarmsSchedulesAndSavedNewAlarm() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarm = makeAlarm(at: start, trigger: "5M")
		// processNewAlarms will add alarm to the persister but who would think about the poor cryptor?
		cryptor.alarms[alarm.identifier] = alarm

		try! alarmManager.processNewAlarms([encryptAlarm(alarm: alarm)])

		XCTAssertEqual(persistor.alarms.count, 1)
		XCTAssertEqual(scheduler.scheduled.map { $0.identifier }, [ocurrenceIdentifier(alarmIdentifier: alarm.identifier, occurrence: 0)])
	}

	func testProcessNewAlarmsUnschedulesAndDeletesAlarm() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarm = makeAlarm(at: start, trigger: "5M")
		add(alarm: alarm)
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

		try! alarmManager.processNewAlarms([deleteAlarm])

		XCTAssertEqual(persistor.alarms.count, 0)
		XCTAssertEqual(scheduler.unscheduled, [ocurrenceIdentifier(alarmIdentifier: alarm.identifier, occurrence: 0)])
	}

	func testUnscheduleAllAlarms() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarm = makeAlarm(at: start, trigger: "5M")
		add(alarm: alarm)

		alarmManager.unscheduleAllAlarms(userId: userID)

		XCTAssertEqual(scheduler.unscheduled, [ocurrenceIdentifier(alarmIdentifier: alarm.identifier, occurrence: 0)])
	}

	func testRescheduleAlarmsReschedulesAlarms() {
		let start1 = dateProvider.now.advanced(by: 10, .minutes)
		let alarm1 = makeAlarm(at: start1, trigger: "5M", identifier: "alarm1")
		let start2 = dateProvider.now.advanced(by: 30, .minutes)
		let alarm2 = makeAlarm(
			at: start2,
			trigger: "10M",
			repeatRule: RepeatRule(
				frequency: .daily,
				interval: 1,
				timeZone: dateProvider.timeZone.identifier,
				endCondition: .count(times: 2),
				excludedDates: []
			),
			identifier: "alarm2"
		)
		add(alarm: alarm1)
		add(alarm: alarm2)

		alarmManager.rescheduleAlarms()

		XCTAssertEqual(
			scheduler.scheduled,
			[
				ScheduledAlarmInfo(
					alarmTime: start2.advanced(by: 24, .hours).advanced(by: -10, .minutes),
					occurrence: 1,
					identifier: ocurrenceIdentifier(alarmIdentifier: alarm2.identifier, occurrence: 1),
					summary: alarm2.summary,
					eventDate: start2.advanced(by: 24, .hours)
				),
				ScheduledAlarmInfo(
					alarmTime: start2.advanced(by: -10, .minutes),
					occurrence: 0,
					identifier: ocurrenceIdentifier(alarmIdentifier: alarm2.identifier, occurrence: 0),
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
		if let alarm = self.alarms[alarm.alarmInfo.alarmIdentifier] {
			return alarm
		} else {
			throw TutanotaError(message: "Failed to 'decrypt' alarm \(alarm.alarmInfo.alarmIdentifier)")
		}
	}
}

class AlarmSchedulerStub: AlarmScheduler {
	var scheduled: [ScheduledAlarmInfo] = []
	var unscheduled: [String] = []

	func schedule(info: ScheduledAlarmInfo) { self.scheduled.append(info) }

	func unscheduleAll(occurrenceIds: [String]) { self.unscheduled += occurrenceIds }
}

class DateProviderStub: DateProvider {
	// Mon Mar 06 2023 16:52:24 GMT+0100 (Central European Standard Time)
	var now: Date = Date(timeIntervalSince1970: 1678117944)

	var timeZone: TimeZone = TimeZone(identifier: "Europe/Berlin")!
}
