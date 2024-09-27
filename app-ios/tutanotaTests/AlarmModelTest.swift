import Foundation
import XCTest

@testable import TutanotaSharedFramework

class AlarmModelTest: XCTestCase {
	private let perAlarmLimit = 5
	private let overallAlarmLimit = 10

	private var dateProvider: DateProviderStub!
	private var alarmModel: AlarmModel!

	override func setUp() {
		dateProvider = DateProviderStub()
		alarmModel = AlarmModel(dateProvider: dateProvider)
	}

	/// any Sequence does not conform to Sequence so we must explicitly open it
	private func prefix(seq: some Sequence<AlarmOccurence>, _ maxLength: Int) -> [AlarmOccurence] { Array(seq.prefix(maxLength)) }

	private func makeAlarm(at date: Date, trigger: String, repeatRule: RepeatRule? = nil, identifier: String = "identifier") -> AlarmNotification {
		AlarmNotification(
			operation: .Create,
			summary: "summary",
			eventStart: date,
			eventEnd: date,
			alarmInfo: AlarmInfo(alarmIdentifer: identifier, trigger: AlarmInterval(string: trigger)!),
			repeatRule: repeatRule,
			user: "user"
		)
	}

	private func plan(alarms: [AlarmNotification]) -> [AlarmOccurence] {
		// a hack to make array initializer work by unpacking existential
		func wrapInArray(_ a: any BidirectionalCollection<AlarmOccurence>) -> [AlarmOccurence] { Array(a) }

		return wrapInArray(alarmModel.futureOccurrences(acrossAlarms: alarms, upToForEach: perAlarmLimit, upToOverall: overallAlarmLimit))
	}

	func testPlanWhenSingleInRecentFutureItIsPlanned() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarm = makeAlarm(at: start, trigger: "5M")

		let result = plan(alarms: [alarm])
		let expectedAlarmOccurence = AlarmOccurence(occurrenceNumber: 0, eventOccurrenceTime: start, alarm: alarm)
		XCTAssertEqual(result, [expectedAlarmOccurence])
	}

	func testPlanWhenSingleInThePastItIsNotPlanned() {
		let start = dateProvider.now.advanced(by: 2, .minutes)
		let alarm = makeAlarm(at: start, trigger: "5M")

		let result = plan(alarms: [alarm])
		XCTAssertEqual(result, [])
	}

	func testPlanWhenRepeatedAlarmStartsAfterNowAllOcurrencesArePlanned() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarm = makeAlarm(
			at: start,
			trigger: "5M",
			repeatRule: RepeatRule(frequency: .daily, interval: 1, timeZone: "Europe/Berlin", endCondition: .count(times: 3), excludedDates: [])
		)

		let result = plan(alarms: [alarm])

		XCTAssertEqual(result.count, 3)
		XCTAssertEqual(result[2].occurrenceNumber, 2)
	}

	func testWhenRepeatedAlarmStartsBeforeNowOnlyFutureOcurrencesArePlanned() {
		let start = dateProvider.now.advanced(by: -10, .minutes)
		let alarm = makeAlarm(
			at: start,
			trigger: "5M",
			repeatRule: RepeatRule(frequency: .daily, interval: 1, timeZone: "Europe/Berlin", endCondition: .count(times: 3), excludedDates: [])
		)

		let result = plan(alarms: [alarm])

		XCTAssertEqual(result.count, 2)
		XCTAssertEqual(result[1].occurrenceNumber, 2)
	}

	func testWhenMultipleAlarmsArePresentOnlyTheNewestOccurrencesArePlanned() {
		let repeatRule = RepeatRule(frequency: .daily, interval: 1, timeZone: "Europe/Berlin", endCondition: .never, excludedDates: [])

		let alarm1 = makeAlarm(at: dateProvider.now.advanced(by: 10, .minutes), trigger: "5M", repeatRule: repeatRule, identifier: "alarm1")
		let alarm2 = makeAlarm(at: dateProvider.now.advanced(by: 20, .minutes), trigger: "5M", repeatRule: repeatRule, identifier: "alarm2")
		let alarm3 = makeAlarm(at: dateProvider.now.advanced(by: 30, .minutes), trigger: "5M", repeatRule: repeatRule, identifier: "alarm3")

		let result = plan(alarms: [alarm1, alarm2, alarm3])

		XCTAssertEqual(result.count, overallAlarmLimit)
		let identifiers = result.map { $0.alarm.identifier }
		let expectedIdentifiers = ["alarm1", "alarm2", "alarm3", "alarm1", "alarm2", "alarm3", "alarm1", "alarm2", "alarm3", "alarm1"]
		XCTAssertEqual(identifiers, expectedIdentifiers)
	}

	func testIteratedRepeatAlarm() {
		let timeZone = "Europe/Berlin"
		dateProvider.timeZone = TimeZone(identifier: timeZone)!
		dateProvider.now = date(2019, 6, 1, 10, timeZone)

		let eventStart = date(2019, 6, 2, 12, timeZone)
		let eventEnd = date(2019, 6, 2, 12, timeZone)

		let repeatRule = RepeatRule(frequency: .weekly, interval: 1, timeZone: timeZone, endCondition: .never, excludedDates: [])

		let seq = alarmModel.futureOccurrences(
			ofAlarm: AlarmNotification(
				operation: .Create,
				summary: "summary",
				eventStart: eventStart,
				eventEnd: eventEnd,
				alarmInfo: AlarmInfo(alarmIdentifer: "id", trigger: AlarmInterval(unit: .minute, value: 5)),
				repeatRule: repeatRule,
				user: "user"
			)
		)
		let occurrences = prefix(seq: seq, 4).map { $0.eventOccurrenceTime }

		let expected = [date(2019, 6, 2, 12, timeZone), date(2019, 6, 9, 12, timeZone), date(2019, 6, 16, 12, timeZone), date(2019, 6, 23, 12, timeZone)]
		XCTAssertEqual(occurrences, expected)
	}

	func testIteratedRepeatAlarmWithExclusions() {
		let timeZone = "Europe/Berlin"
		dateProvider.timeZone = TimeZone(identifier: timeZone)!
		dateProvider.now = date(2019, 6, 1, 10, timeZone)

		let eventStart = date(2019, 6, 2, 12, timeZone)
		let eventEnd = date(2019, 6, 2, 12, timeZone)

		let repeatRule = RepeatRule(
			frequency: .weekly,
			interval: 1,
			timeZone: timeZone,
			endCondition: .never, /* this is excluded       this is ignored */
			excludedDates: [date(2019, 6, 9, 12, timeZone), date(2019, 6, 10, 12, timeZone)]
		)

		let seq = alarmModel.futureOccurrences(
			ofAlarm: AlarmNotification(
				operation: .Create,
				summary: "summary",
				eventStart: eventStart,
				eventEnd: eventEnd,
				alarmInfo: AlarmInfo(alarmIdentifer: "id", trigger: AlarmInterval(unit: .minute, value: 5)),
				repeatRule: repeatRule,
				user: "user"
			)
		)
		let occurrences = prefix(seq: seq, 4).map { $0.eventOccurrenceTime }

		let expected = [date(2019, 6, 2, 12, timeZone), date(2019, 6, 16, 12, timeZone), date(2019, 6, 23, 12, timeZone), date(2019, 6, 30, 12, timeZone)]
		XCTAssertEqual(occurrences, expected)
	}

	func testIteratesAllDayEventWithEnd() {
		let timeZone = "Europe/Berlin"
		dateProvider.timeZone = TimeZone(identifier: "Europe/Berlin")!
		dateProvider.now = date(2019, 4, 20, 0, timeZone)

		let repeatRuleTimeZone = "Asia/Anadyr"
		let eventStart = allDayUTCDate(fromLocalDate: date(2019, 5, 1, 0, timeZone), inTimeZone: timeZone)
		let eventEnd = allDayUTCDate(fromLocalDate: date(2019, 5, 2, 0, timeZone), inTimeZone: timeZone)
		let repeatEnd = allDayUTCDate(fromLocalDate: date(2019, 5, 3, 0, timeZone), inTimeZone: timeZone)
		let repeatRule = RepeatRule(frequency: .daily, interval: 1, timeZone: repeatRuleTimeZone, endCondition: .untilDate(date: repeatEnd), excludedDates: [])

		let seq: any Sequence<AlarmOccurence> = alarmModel.futureOccurrences(
			ofAlarm: AlarmNotification(
				operation: .Create,
				summary: "summary",
				eventStart: eventStart,
				eventEnd: eventEnd,
				alarmInfo: AlarmInfo(alarmIdentifer: "id", trigger: AlarmInterval(unit: .minute, value: 5)),
				repeatRule: repeatRule,
				user: "user"
			)
		)

		let occurrences = prefix(seq: seq, 4).map { $0.eventOccurrenceTime }

		let expected = [date(2019, 5, 1, 0, timeZone), date(2019, 5, 2, 0, timeZone)]
		XCTAssertEqual(occurrences, expected)
	}
}

private func date(_ year: Int, _ month: Int, _ dayOfMonth: Int, _ hour: Int, _ timeZoneName: String) -> Date {
	let calendar = Calendar.current
	let timeZone = TimeZone(identifier: timeZoneName)
	var components = DateComponents()
	components.year = year
	components.month = month
	components.day = dayOfMonth
	components.hour = hour
	components.timeZone = timeZone

	return calendar.date(from: components)!
}

// MARK: duration helpers

extension Date {
	func advanced(by amount: Double, _ unit: UnitDuration) -> Date { self + Measurement(value: amount, unit: unit).converted(to: .seconds).value }
}
