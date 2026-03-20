//
//  CalendarUtils.swift
//
//  Created by Tutao GmbH on 23.04.25.
//

public func isAllDayEvent(startDate: Date, endDate: Date) -> Bool {
	var calendar = Calendar.current
	calendar.timeZone = TimeZone(abbreviation: "UTC")!

	let startComponents = calendar.dateComponents([.hour, .minute, .second], from: startDate)
	let startsOnZero = startComponents.hour == 0 && startComponents.minute == 0 && startComponents.second == 0

	let endComponents = calendar.dateComponents([.hour, .minute, .second], from: endDate)
	let endsOnZero = endComponents.hour == 0 && endComponents.minute == 0 && endComponents.second == 0

	return startsOnZero && endsOnZero
}

/// Checks if a given event runs during the whole day for a given reference date
public func isAllDayOnReferenceDate(startDate: Date, endDate: Date, referenceDate: Date) -> Bool {
	let referenceMidnight = Calendar.current.startOfDay(for: referenceDate)
	let nextReferenceDayMidnight = referenceDate.advanced(by: 24, .hours)
	return startDate.timeIntervalSince1970 < referenceMidnight.timeIntervalSince1970
		&& endDate.timeIntervalSince1970 > nextReferenceDayMidnight.timeIntervalSince1970
}

public func date(_ year: Int, _ month: Int, _ dayOfMonth: Int, _ hour: Int, _ minute: Int, _ timeZoneName: String) -> Date {
	let calendar = Calendar.current
	let timeZone = TimeZone(identifier: timeZoneName)
	var components = DateComponents()
	components.year = year
	components.month = month
	components.day = dayOfMonth
	components.hour = hour
	components.minute = minute
	components.timeZone = timeZone

	return calendar.date(from: components)!
}

// MARK: duration helpers

public extension Date {
	func advanced(by amount: Double, _ unit: UnitDuration) -> Date { self + Measurement(value: amount, unit: unit).converted(to: .seconds).value }
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
