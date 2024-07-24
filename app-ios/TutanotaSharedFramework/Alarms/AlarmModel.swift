import Foundation

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
	func futureOccurrences(ofAlarm alarm: AlarmNotification) -> any Sequence<AlarmOccurence>
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

		for alarm in alarms {
			let a = prefix(self.futureOccurrences(ofAlarm: alarm), upToForEach)
			occurrences += a
		}

		occurrences.sort(by: { $0.eventOccurrenceTime < $1.eventOccurrenceTime })
		return occurrences.prefix(upToOverall)
	}

	public func futureOccurrences(ofAlarm alarm: AlarmNotification) -> any Sequence<AlarmOccurence> {
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

		let isAllDayEvent = isAllDayEvent(startTime: eventStart, endTime: eventEnd)
		let calcEventStart = isAllDayEvent ? allDayLocalDate(fromUTCDate: eventStart, inZone: localTimeZone) : eventStart
		let endDate: Date?
		switch repeatRule.endCondition {
		case let .untilDate(valueDate):
			if isAllDayEvent { endDate = allDayLocalDate(fromUTCDate: valueDate, inZone: localTimeZone) } else { endDate = valueDate }
		default: endDate = nil
		}

		cal.timeZone = isAllDayEvent ? localTimeZone : TimeZone(identifier: repeatRule.timeZone) ?? localTimeZone

		return LazyEventSequence(calcEventStart: calcEventStart, endDate: endDate, repeatRule: repeatRule, cal: cal, calendarComponent: calendarUnit)
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

	fileprivate var ocurrenceNumber = 0
	fileprivate var exclusionNumber = 0

	mutating func next() -> EventOccurrence? {
		if case let .count(n) = repeatRule.endCondition, ocurrenceNumber >= n { return nil }
		let occurrenceDate = cal.date(byAdding: self.calendarComponent, value: repeatRule.interval * ocurrenceNumber, to: calcEventStart)!
		if let endDate, occurrenceDate >= endDate {
			return nil
		} else {
			let occurrence = EventOccurrence(occurrenceNumber: ocurrenceNumber, occurenceDate: occurrenceDate)
			ocurrenceNumber += 1

			while exclusionNumber < repeatRule.excludedDates.count && repeatRule.excludedDates[exclusionNumber] < occurrenceDate { exclusionNumber += 1 }
			if exclusionNumber < repeatRule.excludedDates.count && repeatRule.excludedDates[exclusionNumber] == occurrenceDate { return self.next() }
			return occurrence
		}
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

private func isAllDayEvent(startTime: Date, endTime: Date) -> Bool {
	var calendar = Calendar.current
	calendar.timeZone = TimeZone(abbreviation: "UTC")!

	let startComponents = calendar.dateComponents([.hour, .minute, .second], from: startTime)
	let startsOnZero = startComponents.hour == 0 && startComponents.minute == 0 && startComponents.second == 0

	let endComponents = calendar.dateComponents([.hour, .minute, .second], from: endTime)
	let endsOnZero = endComponents.hour == 0 && endComponents.minute == 0 && endComponents.second == 0

	return startsOnZero && endsOnZero
}

private func calendarUnit(for repeatPeriod: RepeatPeriod) -> Calendar.Component {
	switch repeatPeriod {
	case .daily: return .day
	case .weekly: return .weekOfYear
	case .monthly: return .month
	case .annually: return .year
	}
}
