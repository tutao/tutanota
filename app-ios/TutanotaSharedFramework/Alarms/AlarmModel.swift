import Foundation
import tutasdk

/// Identifier for when event will happen
public struct EventOccurrence {
	let occurrenceNumber: Int
	let startDate: Date
}

public struct AlarmOccurrence: Equatable {
	let occurrenceNumber: Int
	let eventStartDate: Date
	let alarmNotification: AlarmNotification
	let localTimeZone: TimeZone

	/// Calculates alarm occurence time for a given event occurnce time and trigger from alarm.
	var triggerDate: Date { AlarmModel.calculateAlarmTime(trigger: alarmNotification.alarmInfo.trigger, eventTime: eventStartDate, timeZone: localTimeZone) }
}

/// Something that can calculate when alarms should happen
public protocol AlarmCalculator {
	/// Calcuate the soonest alarm occurences up to the specified limits
	/// note: return type would ideally not be required to be boxed but it's the easiest until proper upper bound inference is available at runtime
	/// see https://forums.swift.org/t/inferred-result-type-requires-explicit-coercion/59602/2
	/// (alternatively we could always produce arrays)
	func futureAlarmOccurrences(acrossAlarms alarms: [AlarmNotification], upToForEach: Int, upToOverall: Int) -> any BidirectionalCollection<AlarmOccurrence>

	/// Calculate upcoming alarm occurences for a single alarm
	/// - Returns: lazy sequence of alarm occurences. It might be infinite if alarm repeats indefinitely!
	func alarmOccurrencesSequence(ofAlarm alarm: AlarmNotification, maxFutureOccurrences: Int) -> any Sequence<AlarmOccurrence>
}

/// A helper to magically unbox any Sequence to call prefix() on it because
/// "we cannot call a member of an existential value if the result type of that member uses any of the associated types in an invariant position."
/// see https://forums.swift.org/t/se-0353-constrained-existential-types/56853/22
func prefix(_ s: some Sequence<AlarmOccurrence>, _ maxLength: Int) -> any Sequence<AlarmOccurrence> { s.prefix(maxLength) }

public class AlarmModel: AlarmCalculator {
	private let dateProvider: DateProvider

	public init(dateProvider: DateProvider) { self.dateProvider = dateProvider }

	public func futureAlarmOccurrences(acrossAlarms alarms: [AlarmNotification], upToForEach: Int, upToOverall: Int) -> any BidirectionalCollection<
		AlarmOccurrence
	> {
		var occurrences = [AlarmOccurrence]()
		let (singleEventAlarms, repeatingEventAlarms): (Array<AlarmNotification>, Array<AlarmNotification>) = alarms.reduce(into: ([], [])) { result, alarm in
			if alarm.repeatRule == nil { return result.0.append(alarm) }
			result.1.append(alarm)
		}

		printLog("Handling \(singleEventAlarms.count) single event alarms and \(repeatingEventAlarms.count) repeating event alarms.")

		for alarm in singleEventAlarms { occurrences += self.alarmOccurrencesSequence(ofAlarm: alarm, maxFutureOccurrences: 1) }
		for alarm in repeatingEventAlarms {
			occurrences += self.alarmOccurrencesSequence(ofAlarm: alarm, maxFutureOccurrences: upToForEach)  // Get the first N future occurences. (N = uptoForEach)
		}

		occurrences.sort(by: { $0.eventStartDate < $1.eventStartDate })
		return occurrences.prefix(upToOverall)
	}

	public func alarmOccurrencesSequence(ofAlarm alarm: AlarmNotification, maxFutureOccurrences: Int) -> any Sequence<AlarmOccurrence> {
		if let repeatRule = alarm.repeatRule {
			return self.generateFutureAlarmOccurences(ofAlarm: alarm, withRepeatRule: repeatRule, maxFutureOccurrences: maxFutureOccurrences)
		} else {
			let isAllDayEvent = isAllDayEvent(startDate: alarm.eventStart, endDate: alarm.eventEnd)
			let eventTime = isAllDayEvent ? allDayLocalDate(fromUTCDate: alarm.eventStart, inZone: dateProvider.timeZone) : alarm.eventStart
			let singleOcurrence = AlarmOccurrence(
				occurrenceNumber: 0,
				eventStartDate: eventTime,
				alarmNotification: alarm,
				localTimeZone: dateProvider.timeZone
			)
			return shouldScheduleAlarm(at: singleOcurrence.triggerDate) ? [singleOcurrence] : []
		}
	}

	private func generateFutureAlarmOccurences(ofAlarm alarmNotification: AlarmNotification, withRepeatRule: RepeatRule, maxFutureOccurrences: Int)
		-> some Sequence<AlarmOccurrence>
	{
		let futureAlarmOccurrences = eventOccurrences(
			eventStart: alarmNotification.eventStart,
			eventEnd: alarmNotification.eventEnd,
			repeatRule: withRepeatRule,
			localTimeZone: dateProvider.timeZone
		)
		.compactMap({ (occurrence: EventOccurrence) -> AlarmOccurrence? in
			guard self.shouldScheduleAlarm(at: occurrence.startDate) else { return nil }  // Ignore if event occurrence is in the past

			let alarm = AlarmOccurrence(
				occurrenceNumber: occurrence.occurrenceNumber,
				eventStartDate: occurrence.startDate,
				alarmNotification: alarmNotification,
				localTimeZone: dateProvider.timeZone
			)

			guard self.shouldScheduleAlarm(at: alarm.triggerDate) else { return nil }  // Ignore if resulting alarm is in the past

			return alarm
		})
		.prefix(maxFutureOccurrences)
		return futureAlarmOccurrences
	}

	private func shouldScheduleAlarm(at date: Date) -> Bool { date > dateProvider.now }

	private func eventOccurrences(eventStart: Date, eventEnd: Date, repeatRule: RepeatRule, localTimeZone: TimeZone) -> LazyEventSequence {
		var cal = Calendar.current
		let calendarUnit = calendarUnit(for: repeatRule.frequency)

		let isAllDayEvent = isAllDayEvent(startDate: eventStart, endDate: eventEnd)
		let calcEventStart = isAllDayEvent ? allDayLocalDate(fromUTCDate: eventStart, inZone: localTimeZone) : eventStart

		let endDate: Date?

		switch repeatRule.endCondition {

		case let .untilDate(valueDate):
			if isAllDayEvent { endDate = allDayLocalDate(fromUTCDate: valueDate, inZone: localTimeZone) } else { endDate = valueDate }
		default: endDate = nil
		}

		cal.timeZone = isAllDayEvent ? localTimeZone : TimeZone(identifier: repeatRule.timeZone) ?? localTimeZone

		return LazyEventSequence(
			seedEventStartDate: calcEventStart,
			recurrenceEndDate: endDate,
			repeatRule: repeatRule,
			cal: cal,
			recurrenceComponent: calendarUnit,
			dateProvider: self.dateProvider
		)
	}

	static func calculateAlarmTime(trigger: AlarmInterval, eventTime: Date, timeZone: TimeZone = TimeZone.current) -> Date {
		var cal = Calendar.current
		cal.timeZone = timeZone
		switch trigger.unit {
		case .minute: return cal.date(byAdding: .minute, value: -trigger.value, to: eventTime)!
		case .hour: return cal.date(byAdding: .hour, value: -trigger.value, to: eventTime)!
		case .day: return cal.date(byAdding: .day, value: -trigger.value, to: eventTime)!
		case .week: return cal.date(byAdding: .weekOfYear, value: -trigger.value, to: eventTime)!
		}
	}
}

private struct LazyEventSequence: Sequence, IteratorProtocol {
	let seedEventStartDate: Date
	let recurrenceEndDate: Date?
	let repeatRule: RepeatRule
	let cal: Calendar
	let recurrenceComponent: Calendar.Component
	let dateProvider: DateProvider
	fileprivate let eventFacade = EventFacade()
	fileprivate lazy var byRules = repeatRule.advancedRules.map { $0.toSDKRule() }
	fileprivate lazy var sdkRepeatRule = EventRepeatRule(frequency: repeatRule.frequency.toSDKPeriod(), byRules: byRules)

	var pendingOccurrenceTimestamps: [DateTime] = []

	fileprivate var intervalNumber = 0
	fileprivate var occurrenceNumber = 0
	fileprivate var exclusionNumber = 0
	fileprivate var remainingFutureExpansions = EVENTS_SCHEDULED_AHEAD

	fileprivate lazy var setPosRules = repeatRule.advancedRules.filter { item in item.ruleType == ByRuleType.bysetpos }
		.map { rule in
			if let parsedInterval = Int(string: rule.interval) {
				if parsedInterval < 0 { return pendingOccurrenceTimestamps.count - abs(parsedInterval) }
				return parsedInterval - 1
			}

			return -1
		}
		.filter { interval in interval >= 0 && interval < repeatRule.frequency.getMaxDaysInPeriod() }

	mutating func next() -> EventOccurrence? {
		while remainingFutureExpansions > 0 {
			if case let .count(n) = repeatRule.endCondition, occurrenceNumber >= n { return nil }
			if pendingOccurrenceTimestamps.isEmpty {

				guard let expansionStart = cal.date(byAdding: self.recurrenceComponent, value: repeatRule.interval * intervalNumber, to: seedEventStartDate)
				else {
					printLog(
						"Received an invalid progenitor! Stopping alarm generation... \(seedEventStartDate) for interval \(repeatRule.interval) at iteration \(intervalNumber)"
					)
					return nil
				}
				guard let expansionStartInMilis = UInt64(exactly: expansionStart.timeIntervalSince1970.rounded() * 1000) else {
					printLog(
						"Received an invalid date! Stopping alarm generation for date... \(seedEventStartDate) for interval \(repeatRule.interval) at iteration \(intervalNumber)"
					)
					return nil
				}
				var generatedEvents: [DateTime] = []
				do {
					generatedEvents = try eventFacade.generateFutureInstances(
						date: expansionStartInMilis,
						repeatRule: sdkRepeatRule,
						progenitorDate: UInt64(seedEventStartDate.timeIntervalSince1970 * 1000)
					)
				} catch {
					printLog(
						"Failed to generate future occurences. Event start: \(seedEventStartDate.debugDescription) - Repeat rule: \(repeatRule). Original error: \(error)"
					)
				}
				self.pendingOccurrenceTimestamps.append(contentsOf: generatedEvents)
				// Handle the event 0
				if self.intervalNumber == 0 && !self.pendingOccurrenceTimestamps.contains(expansionStartInMilis) {
					pendingOccurrenceTimestamps.append(expansionStartInMilis)
				}

				self.pendingOccurrenceTimestamps = pendingOccurrenceTimestamps.enumerated()
					.filter { (index, _) in
						if !setPosRules.isEmpty && !setPosRules.contains(index) { return false }

						return true
					}
					.map { (_, event) in event }.sorted { $1 < $0 }

				intervalNumber += 1

				if expansionStart > dateProvider.now { remainingFutureExpansions -= 1 }
			}

			if let date = pendingOccurrenceTimestamps.popLast() {
				let dateInSeconds = date / 1000
				occurrenceNumber += 1

				if let recurrenceEndDate, dateInSeconds >= UInt64(recurrenceEndDate.timeIntervalSince1970) { return nil }

				while exclusionNumber < repeatRule.excludedDates.count
					&& UInt64(repeatRule.excludedDates[exclusionNumber].timeIntervalSince1970) < dateInSeconds
				{
					exclusionNumber += 1  // Skipping excluded dates before current occurence
				}

				if exclusionNumber < repeatRule.excludedDates.count && UInt64(repeatRule.excludedDates[exclusionNumber].timeIntervalSince1970) == dateInSeconds
				{
					continue
				}

				return EventOccurrence(occurrenceNumber: occurrenceNumber, startDate: Date(timeIntervalSince1970: Double(dateInSeconds)))
			}
		}

		return nil
	}
}

private func calendarUnit(for repeatPeriod: RepeatPeriod) -> Calendar.Component {
	switch repeatPeriod {
	case .daily: return .day
	case .weekly: return .weekOfYear
	case .monthly: return .month
	case .annually: return .year
	}
}

private extension RepeatPeriod {
	func toSDKPeriod() -> tutasdk.RepeatPeriod {
		switch self {
		case .annually: return tutasdk.RepeatPeriod.annually
		case .daily: return tutasdk.RepeatPeriod.daily
		case .monthly: return tutasdk.RepeatPeriod.monthly
		case .weekly: return tutasdk.RepeatPeriod.weekly
		}
	}

	func getMaxDaysInPeriod() -> Int {
		switch self {
		case .annually: return 366
		case .monthly: return 31
		case .weekly: return 7
		case .daily: return 1
		}
	}
}
