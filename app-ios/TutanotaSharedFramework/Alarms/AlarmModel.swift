import Foundation
import tutasdk

/// Identifier for when event will happen
public struct EventOccurrence {
	let occurrenceNumber: Int
	let occurenceDate: Date
}

public struct AlarmOccurence: Equatable {
	let occurrenceNumber: Int
	let eventOccurrenceTime: Date
	let alarm: AlarmNotification

	/// Calculates alarm occurence time for a given event occurnce time and trigger from alarm.
	func alarmOccurenceTime() -> Date { AlarmModel.alarmTime(trigger: alarm.alarmInfo.trigger, eventTime: eventOccurrenceTime) }
}

/// Something that can calculate when alarms should happen
public protocol AlarmCalculator {
	/// Calcuate the soonest alarm occurences up to the specified limits
	/// note: return type would ideally not be required to be boxed but it's the easiest until proper upper bound inference is available at runtime
	/// see https://forums.swift.org/t/inferred-result-type-requires-explicit-coercion/59602/2
	/// (alternatively we could always produce arrays)
	func futureOccurrences(acrossAlarms alarms: [AlarmNotification], upToForEach: Int, upToOverall: Int) -> any BidirectionalCollection<AlarmOccurence>

	/// Calculate upcoming alarm occurences for a single alarm
	/// - Returns: lazy sequence of alarm occurences. It might be infinite if alarm repeats indefinitely!
	func futureAlarmOccurrencesSequence(ofAlarm alarm: AlarmNotification) -> any Sequence<AlarmOccurence>
}

/// A helper to magically unbox any Sequence to call prefix() on it because
/// "we cannot call a member of an existential value if the result type of that member uses any of the associated types in an invariant position."
/// see https://forums.swift.org/t/se-0353-constrained-existential-types/56853/22
func prefix(_ s: some Sequence<AlarmOccurence>, _ maxLength: Int) -> any Sequence<AlarmOccurence> { s.prefix(maxLength) }

public class AlarmModel: AlarmCalculator {
	private let dateProvider: DateProvider

	public init(dateProvider: DateProvider) { self.dateProvider = dateProvider }

	public func futureOccurrences(acrossAlarms alarms: [AlarmNotification], upToForEach: Int, upToOverall: Int) -> any BidirectionalCollection<AlarmOccurence> {
		var occurrences = [AlarmOccurence]()
		let (singleEventAlarms, repeatingEventAlarms): (Array<AlarmNotification>, Array<AlarmNotification>) = alarms.reduce(into: ([], [])) { result, alarm in
			if alarm.repeatRule == nil { return result.0.append(alarm) }
			result.1.append(alarm)
		}
		printLog("Handling \(singleEventAlarms.count) single event alarms and \(repeatingEventAlarms.count) repeating event alarms.")
		for alarm in singleEventAlarms { occurrences += self.futureAlarmOccurrencesSequence(ofAlarm: alarm) }
		for alarm in repeatingEventAlarms {
			occurrences += prefix(self.futureAlarmOccurrencesSequence(ofAlarm: alarm), upToForEach)  // Get the first N future occurences. (N = uptoForEach)
		}

		occurrences.sort(by: { $0.eventOccurrenceTime < $1.eventOccurrenceTime })
		return occurrences.prefix(upToOverall)
	}

	public func futureAlarmOccurrencesSequence(ofAlarm alarm: AlarmNotification) -> any Sequence<AlarmOccurence> {
		if let repeatRule = alarm.repeatRule {
			return self.futureOccurences(ofAlarm: alarm, withRepeatRule: repeatRule)
		} else {
			let singleOcurrence = AlarmOccurence(occurrenceNumber: 0, eventOccurrenceTime: alarm.eventStart, alarm: alarm)
			if shouldScheduleAlarmAt(ocurrenceTime: singleOcurrence.alarmOccurenceTime()) { return [singleOcurrence] } else { return [] }
		}
	}

	private func futureOccurences(ofAlarm alarm: AlarmNotification, withRepeatRule: RepeatRule) -> some Sequence<AlarmOccurence> {
		let occurencesAfterNow = occurencesOfRepeatingEvent(
			eventStart: alarm.eventStart,
			eventEnd: alarm.eventEnd,
			repeatRule: withRepeatRule,
			localTimeZone: dateProvider.timeZone
		)
		.lazy  // trying to optimize it: do not calculate alarm occurence if event occurence itself is in the past
		.filter { self.shouldScheduleAlarmAt(ocurrenceTime: $0.occurenceDate) }
		.map { occurrence in AlarmOccurence(occurrenceNumber: occurrence.occurrenceNumber, eventOccurrenceTime: occurrence.occurenceDate, alarm: alarm) }
		.filter { self.shouldScheduleAlarmAt(ocurrenceTime: $0.alarmOccurenceTime()) }
		return occurencesAfterNow
	}

	private func shouldScheduleAlarmAt(ocurrenceTime: Date) -> Bool { ocurrenceTime > dateProvider.now }

	private func occurencesOfRepeatingEvent(eventStart: Date, eventEnd: Date, repeatRule: RepeatRule, localTimeZone: TimeZone) -> LazyEventSequence {
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
			calcEventStart: calcEventStart,
			endDate: endDate,
			repeatRule: repeatRule,
			cal: cal,
			calendarComponent: calendarUnit,
			dateProvider: self.dateProvider
		)
	}

	static func alarmTime(trigger: AlarmInterval, eventTime: Date) -> Date {
		let cal = Calendar.current
		switch trigger.unit {
		case .minute: return cal.date(byAdding: .minute, value: -trigger.value, to: eventTime)!
		case .hour: return cal.date(byAdding: .hour, value: -trigger.value, to: eventTime)!
		case .day: return cal.date(byAdding: .day, value: -trigger.value, to: eventTime)!
		case .week: return cal.date(byAdding: .weekOfYear, value: -trigger.value, to: eventTime)!
		}
	}
}

private struct LazyEventSequence: Sequence, IteratorProtocol {
	let calcEventStart: Date
	let endDate: Date?
	let repeatRule: RepeatRule
	let cal: Calendar
	let calendarComponent: Calendar.Component
	let dateProvider: DateProvider

	var expandedEvents: [DateTime] = []

	fileprivate var intervalNumber = 0
	fileprivate var occurrenceNumber = 0
	fileprivate var exclusionNumber = 0
	fileprivate var remainingIntervals = EVENTS_SCHEDULED_AHEAD

	fileprivate lazy var setPosRules = repeatRule.advancedRules.filter { item in item.ruleType == ByRuleType.bysetpos }
		.map { rule in
			let parsedInterval = Int(string: rule.interval)!

			if parsedInterval < 0 { return expandedEvents.count - abs(parsedInterval) }

			return parsedInterval - 1
		}
		.filter { interval in interval >= 0 && interval < repeatRule.frequency.getMaxDaysInPeriod() }

	mutating func next() -> EventOccurrence? {
		while remainingIntervals > 0 {
			if case let .count(n) = repeatRule.endCondition, occurrenceNumber >= n { return nil }
			if expandedEvents.isEmpty {

				let expansionProgenitor = cal.date(byAdding: self.calendarComponent, value: repeatRule.interval * intervalNumber, to: calcEventStart)!
				let progenitorTime = UInt64(expansionProgenitor.timeIntervalSince1970)
				let eventFacade = EventFacade()
				let byRules = repeatRule.advancedRules.map { $0.toSDKRule() }
				let progenitorTimeInMilis = progenitorTime * 1000
				let generatedEvents = eventFacade.generateFutureInstances(
					date: progenitorTimeInMilis,  // To Milliseconds
					repeatRule: EventRepeatRule(frequency: repeatRule.frequency.toSDKPeriod(), byRules: byRules),
					progenitorDate: UInt64(calcEventStart.timeIntervalSince1970 * 1000)
				)
				self.expandedEvents.append(contentsOf: generatedEvents)
				// Handle the event 0
				if self.intervalNumber == 0 && !self.expandedEvents.contains(progenitorTimeInMilis) { expandedEvents.append(progenitorTimeInMilis) }

				self.expandedEvents = expandedEvents.enumerated()
					.filter { (index, _) in
						if !setPosRules.isEmpty && !setPosRules.contains(index) { return false }

						return true
					}
					.map { (_, event) in event }.sorted { $1 < $0 }

				intervalNumber += 1

				if expansionProgenitor.timeIntervalSince1970 > Date().timeIntervalSince1970 { remainingIntervals -= 1 }
			}

			if let date = expandedEvents.popLast() {
				let dateInSeconds = date / 1000
				occurrenceNumber += 1

				if let endDate, dateInSeconds >= UInt64(endDate.timeIntervalSince1970) { return nil }

				while exclusionNumber < repeatRule.excludedDates.count
					&& UInt64(repeatRule.excludedDates[exclusionNumber].timeIntervalSince1970) < dateInSeconds
				{
					exclusionNumber += 1  // Skipping excluded dates before current occurence
				}

				if exclusionNumber < repeatRule.excludedDates.count && UInt64(repeatRule.excludedDates[exclusionNumber].timeIntervalSince1970) == dateInSeconds
				{
					continue
				}

				return EventOccurrence(occurrenceNumber: occurrenceNumber, occurenceDate: Date(timeIntervalSince1970: Double(dateInSeconds)))
			}
		}

		return nil
	}
}

/// Takes local date and makes a UTC date with year, month, day from it.
/// This is how we indicate days without attachment to a time zone or time.
func allDayUTCDate(fromLocalDate localDate: Date, inTimeZone dateTimeZone: String) -> Date {
	var calendar = Calendar.current
	calendar.timeZone = TimeZone(identifier: dateTimeZone)!
	var localComponents = calendar.dateComponents([.year, .month, .day], from: localDate)
	let timeZone = TimeZone(identifier: "UTC")!
	localComponents.timeZone = timeZone
	return calendar.date(from: localComponents)!
}

/// Takes UTC date and makes a local date with year, month, day from it.
/// This is how we indicate days without attachment to a time zone or time.
func allDayLocalDate(fromUTCDate utcDate: Date, inZone localTimeZone: TimeZone) -> Date {
	var calendar = Calendar.current
	let timeZone = TimeZone(identifier: "UTC")!
	calendar.timeZone = timeZone
	let components = calendar.dateComponents([.year, .month, .day], from: utcDate)
	calendar.timeZone = localTimeZone
	return calendar.date(from: components)!
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
