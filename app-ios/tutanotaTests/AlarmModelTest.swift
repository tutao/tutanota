import Foundation
import Testing

@testable import TutanotaSharedFramework

struct AlarmModelTest {
	private let perAlarmLimit = 5
	private let overallAlarmLimit = 10

	private var dateProvider: DateProviderStub!
	private var alarmModel: AlarmModel!

	init() {
		dateProvider = DateProviderStub()
		alarmModel = AlarmModel(dateProvider: dateProvider)
	}

	/// any Sequence does not conform to Sequence so we must explicitly open it
	private func prefix(seq: some Sequence<AlarmOccurrence>, _ maxLength: Int) -> [AlarmOccurrence] { Array(seq.prefix(maxLength)) }

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

	private func plan(alarms: [AlarmNotification]) -> [AlarmOccurrence] {
		// a hack to make array initializer work by unpacking existential
		func wrapInArray(_ a: any BidirectionalCollection<AlarmOccurrence>) -> [AlarmOccurrence] { Array(a) }

		return wrapInArray(alarmModel.futureAlarmOccurrences(acrossAlarms: alarms, upToForEach: perAlarmLimit, upToOverall: overallAlarmLimit))
	}

	@Test func testPlanWhenSingleInRecentFutureItIsPlanned() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarmNotification = makeAlarm(at: start, trigger: "5M")

		let triggerDate = AlarmModel.calculateAlarmTime(trigger: alarmNotification.alarmInfo.trigger, eventTime: start, timeZone: dateProvider.timeZone)
		let result = plan(alarms: [alarmNotification])
		let expectedAlarmOccurence = AlarmOccurrence(occurrenceNumber: 0, eventStartDate: start, alarmNotification: alarmNotification, triggerDate: triggerDate)
		#expect(result == [expectedAlarmOccurence])
	}

	@Test func testPlanWhenSingleInThePastItIsNotPlanned() {
		let start = dateProvider.now.advanced(by: 2, .minutes)
		let alarm = makeAlarm(at: start, trigger: "5M")

		let result = plan(alarms: [alarm])
		#expect(result.isEmpty)
	}

	@Test func testPlanWhenRepeatedAlarmStartsAfterNowAllOcurrencesArePlanned() {
		let start = dateProvider.now.advanced(by: 10, .minutes)
		let alarm = makeAlarm(
			at: start,
			trigger: "5M",
			repeatRule: RepeatRule(
				frequency: .daily,
				interval: 1,
				timeZone: "Europe/Berlin",
				endCondition: .count(times: 3),
				excludedDates: [],
				advancedRules: []
			)
		)

		let result = plan(alarms: [alarm])

		#expect(result.count == 3)
		#expect(result[2].occurrenceNumber == 3)
	}

	@Test func testWhenRepeatedAlarmStartsBeforeNowOnlyFutureOcurrencesArePlanned() {
		let start = dateProvider.now.advanced(by: -10, .minutes)
		let alarm = makeAlarm(
			at: start,
			trigger: "5M",
			repeatRule: RepeatRule(
				frequency: .daily,
				interval: 1,
				timeZone: "Europe/Berlin",
				endCondition: .count(times: 3),
				excludedDates: [],
				advancedRules: []
			)
		)

		let result = plan(alarms: [alarm])

		#expect(result.count == 2)
		#expect(result[1].occurrenceNumber == 3)
	}

	@Test func testWhenMultipleAlarmsArePresentOnlyTheNewestOccurrencesArePlanned() {
		let repeatRule = RepeatRule(frequency: .daily, interval: 1, timeZone: "Europe/Berlin", endCondition: .never, excludedDates: [], advancedRules: [])

		let alarm1 = makeAlarm(at: dateProvider.now.advanced(by: 10, .minutes), trigger: "5M", repeatRule: repeatRule, identifier: "alarm1")
		let alarm2 = makeAlarm(at: dateProvider.now.advanced(by: 20, .minutes), trigger: "5M", repeatRule: repeatRule, identifier: "alarm2")
		let alarm3 = makeAlarm(at: dateProvider.now.advanced(by: 30, .minutes), trigger: "5M", repeatRule: repeatRule, identifier: "alarm3")

		let result = plan(alarms: [alarm1, alarm2, alarm3])

		#expect(result.count == overallAlarmLimit)
		let identifiers = result.map { $0.alarmNotification.identifier }
		let expectedIdentifiers = ["alarm1", "alarm2", "alarm3", "alarm1", "alarm2", "alarm3", "alarm1", "alarm2", "alarm3", "alarm1"]
		#expect(identifiers == expectedIdentifiers)
	}

	@Test func testIteratedRepeatAlarm() {
		let timeZone = "Europe/Berlin"
		dateProvider.timeZone = TimeZone(identifier: timeZone)!
		dateProvider.now = date(2019, 6, 1, 10, 0, timeZone)

		let eventStart = date(2019, 6, 2, 12, 0, timeZone)
		let eventEnd = date(2019, 6, 2, 12, 0, timeZone)

		let repeatRule = RepeatRule(frequency: .weekly, interval: 1, timeZone: timeZone, endCondition: .never, excludedDates: [], advancedRules: [])

		let seq = alarmModel.alarmOccurrencesSequence(
			ofAlarm: AlarmNotification(
				operation: .Create,
				summary: "summary",
				eventStart: eventStart,
				eventEnd: eventEnd,
				alarmInfo: AlarmInfo(alarmIdentifer: "id", trigger: AlarmInterval(unit: .minute, value: 5)),
				repeatRule: repeatRule,
				user: "user"
			),
			maxFutureOccurrences: 4
		)
		let occurrences = seq.map { $0.eventStartDate }

		let expected = [
			date(2019, 6, 2, 12, 0, timeZone), date(2019, 6, 9, 12, 0, timeZone), date(2019, 6, 16, 12, 0, timeZone), date(2019, 6, 23, 12, 0, timeZone),
		]
		#expect(occurrences == expected)
	}

	@Test func testIteratedRepeatAlarmWithByRule() {
		let timeZone = "Europe/Berlin"
		dateProvider.timeZone = TimeZone(identifier: timeZone)!
		dateProvider.now = date(2025, 2, 1, 10, 0, timeZone)

		let eventStart = date(2025, 2, 2, 12, 0, timeZone)
		let eventEnd = date(2025, 2, 2, 15, 0, timeZone)

		let repeatRule = RepeatRule(
			frequency: .weekly,
			interval: 1,
			timeZone: timeZone,
			endCondition: .never,
			excludedDates: [],
			advancedRules: [AdvancedRule(ruleType: ByRuleType.byday, interval: "MO"), AdvancedRule(ruleType: ByRuleType.byday, interval: "TU")]
		)

		let seq = alarmModel.alarmOccurrencesSequence(
			ofAlarm: AlarmNotification(
				operation: .Create,
				summary: "summary",
				eventStart: eventStart,
				eventEnd: eventEnd,
				alarmInfo: AlarmInfo(alarmIdentifer: "id", trigger: AlarmInterval(unit: .hour, value: 1)),
				repeatRule: repeatRule,
				user: "user"
			),
			maxFutureOccurrences: 5
		)
		let occurrences = seq.map { $0.eventStartDate }

		let expected = [
			date(2025, 2, 2, 12, 0, timeZone), date(2025, 2, 3, 12, 0, timeZone), date(2025, 2, 4, 12, 0, timeZone), date(2025, 2, 10, 12, 0, timeZone),
			date(2025, 2, 11, 12, 0, timeZone),
		]
		#expect(occurrences == expected)
	}

	@Test func testIteratedRepeatAlarmWithExclusions() {
		let timeZone = "Europe/Berlin"
		dateProvider.timeZone = TimeZone(identifier: timeZone)!
		dateProvider.now = date(2019, 6, 1, 10, 0, timeZone)

		let eventStart = date(2019, 6, 2, 12, 0, timeZone)
		let eventEnd = date(2019, 6, 2, 12, 0, timeZone)

		let repeatRule = RepeatRule(
			frequency: .weekly,
			interval: 1,
			timeZone: timeZone,
			endCondition: .never, /* this is excluded       this is ignored */
			excludedDates: [date(2019, 6, 9, 12, 0, timeZone), date(2019, 6, 10, 12, 0, timeZone)],
			advancedRules: []
		)

		let seq = alarmModel.alarmOccurrencesSequence(
			ofAlarm: AlarmNotification(
				operation: .Create,
				summary: "summary",
				eventStart: eventStart,
				eventEnd: eventEnd,
				alarmInfo: AlarmInfo(alarmIdentifer: "id", trigger: AlarmInterval(unit: .minute, value: 5)),
				repeatRule: repeatRule,
				user: "user"
			),
			maxFutureOccurrences: 4
		)
		let occurrences = seq.map { $0.eventStartDate }

		let expected = [
			date(2019, 6, 2, 12, 0, timeZone), date(2019, 6, 16, 12, 0, timeZone), date(2019, 6, 23, 12, 0, timeZone), date(2019, 6, 30, 12, 0, timeZone),
		]
		#expect(occurrences == expected)
	}

	@Test func testIteratesAllDayEventWithEnd() {
		let timeZone = "Europe/Berlin"
		dateProvider.timeZone = TimeZone(identifier: "Europe/Berlin")!
		dateProvider.now = date(2019, 4, 20, 0, 0, timeZone)

		let repeatRuleTimeZone = "Asia/Anadyr"
		let eventStart = allDayUTCDate(fromLocalDate: date(2019, 5, 1, 0, 0, timeZone), inTimeZone: timeZone)
		let eventEnd = allDayUTCDate(fromLocalDate: date(2019, 5, 2, 0, 0, timeZone), inTimeZone: timeZone)
		let repeatEnd = allDayUTCDate(fromLocalDate: date(2019, 5, 3, 0, 0, timeZone), inTimeZone: timeZone)
		let repeatRule = RepeatRule(
			frequency: .daily,
			interval: 1,
			timeZone: repeatRuleTimeZone,
			endCondition: .untilDate(date: repeatEnd),
			excludedDates: [],
			advancedRules: []
		)

		let seq: any Sequence<AlarmOccurrence> = alarmModel.alarmOccurrencesSequence(
			ofAlarm: AlarmNotification(
				operation: .Create,
				summary: "summary",
				eventStart: eventStart,
				eventEnd: eventEnd,
				alarmInfo: AlarmInfo(alarmIdentifer: "id", trigger: AlarmInterval(unit: .minute, value: 5)),
				repeatRule: repeatRule,
				user: "user"
			),
			maxFutureOccurrences: 4
		)

		let occurrences = seq.map { $0.eventStartDate }

		let expected = [date(2019, 5, 1, 0, 0, timeZone), date(2019, 5, 2, 0, 0, timeZone)]
		#expect(occurrences == expected)
	}

	@Test func testOldEventIteratedRepeatAlarmWithByRule() {
		let timeZone = "Europe/Berlin"
		dateProvider.timeZone = TimeZone(identifier: timeZone)!
		dateProvider.now = date(2025, 7, 1, 10, 0, timeZone)

		let eventStart = date(2024, 2, 2, 12, 0, timeZone)
		let eventEnd = date(2024, 2, 2, 15, 0, timeZone)

		let repeatRule = RepeatRule(
			frequency: .weekly,
			interval: 1,
			timeZone: timeZone,
			endCondition: .never,
			excludedDates: [],
			advancedRules: [
				AdvancedRule(ruleType: ByRuleType.byday, interval: "MO"), AdvancedRule(ruleType: ByRuleType.byday, interval: "TU"),
				AdvancedRule(ruleType: ByRuleType.byday, interval: "WE"),
			]
		)

		let seq = alarmModel.alarmOccurrencesSequence(
			ofAlarm: AlarmNotification(
				operation: .Create,
				summary: "Old Event",
				eventStart: eventStart,
				eventEnd: eventEnd,
				alarmInfo: AlarmInfo(alarmIdentifer: "id", trigger: AlarmInterval(unit: .hour, value: 1)),
				repeatRule: repeatRule,
				user: "user"
			),
			maxFutureOccurrences: 5
		)
		let occurrences = seq.map { $0.eventStartDate }

		let expected = [
			date(2025, 7, 1, 12, 0, timeZone), date(2025, 7, 2, 12, 0, timeZone), date(2025, 7, 7, 12, 0, timeZone), date(2025, 7, 8, 12, 0, timeZone),
			date(2025, 7, 9, 12, 0, timeZone),
		]
		#expect(occurrences == expected)
	}
}
