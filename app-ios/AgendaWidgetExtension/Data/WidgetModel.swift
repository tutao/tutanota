//
//  WidgetModel.swift
//  calendar
//
//  Created by Tutao GmbH on 24.04.25.
//
import TutanotaSharedFramework
// Generated protocols are still not Sendable see https://github.com/mozilla/uniffi-rs/issues/1674
@preconcurrency import tutasdk

// Start of day to list of events
/**
 A map representing a set of events on a given day.
 Keys are the epoch milliseconds (or seconds?) representing the start of a day.
 Values are an array of CalendarEventData for events occurring on that day.
 */
typealias DaysToEventsList = [[UIEvent]]

struct UIEvent: Equatable, Hashable, Encodable {
	var calendarId: String
	var id: String
	var summary: String
	var startDate: Date
	var endDate: Date
	var calendarColor: String
	var isBirthdayEvent: Bool
	var isDisplayedAsAllDay: Bool
	var timeString: String
}

struct WidgetModel {
	private let urlSession: URLSession = makeUrlSession()
	private let sdk: LoggedInSdk

	init(userId: String) async throws { self.sdk = try await SdkFactory.createSdk(userId: userId) }

	func replaceDateTimeZone(date: Date) -> Date {
		var gmtCalendar = Calendar.current
		gmtCalendar.timeZone = TimeZone(secondsFromGMT: 0)!

		let eventOgDateComponents = gmtCalendar.dateComponents([.day, .month, .year], from: date)
		var eventMidnightAtCurrentZone: Date = Calendar.current.startOfDay(for: date)

		if let dt = Calendar.current.date(bySetting: .year, value: eventOgDateComponents.year!, of: eventMidnightAtCurrentZone) {
			eventMidnightAtCurrentZone = dt
		}

		if let dt = Calendar.current.date(bySetting: .month, value: eventOgDateComponents.month!, of: eventMidnightAtCurrentZone) {
			eventMidnightAtCurrentZone = dt
		}

		if let dt = Calendar.current.date(bySetting: .day, value: eventOgDateComponents.day!, of: eventMidnightAtCurrentZone) {
			eventMidnightAtCurrentZone = dt
		}

		return eventMidnightAtCurrentZone
	}

	func getEventsForCalendars(_ calendars: [CalendarEntity], date: Date) async throws -> DaysToEventsList {
		printLog("Fetching \(calendars.count) calendars")
		let dateInSeconds = UInt64(date.timeIntervalSince1970)
		let endSeconds = UInt64(Calendar.current.date(byAdding: .day, value: 7, to: date)!.timeIntervalSince1970)
		let calendarFacade = self.sdk.calendarFacade()

		let widgetStartDate = date

		let currentCalendar = Calendar.current
		var daysAndEvents: DaysToEventsList = [[], [], [], [], [], [], []]

		for calendar in calendars {
			let eventsList: CalendarEventsList = try await calendarFacade.getCalendarEvents(calendarId: calendar.id, start: dateInSeconds * 1000, end: endSeconds * 1000)

			let shortAndLongEvents = eventsList.shortEvents + eventsList.longEvents

			let dateFormatter = DateFormatter()
			dateFormatter.setLocalizedDateFormatFromTemplate("HH:mm")

			for calendarEvent in shortAndLongEvents {

				for dayIndex in stride(from: 0, to: daysAndEvents.count, by: 1) {

					let currentDayMidnightInstantMs = currentCalendar.startOfDay(for: currentCalendar.date(byAdding: .day, value: dayIndex, to: widgetStartDate)!)
						.timeIntervalSince1970 * 1000
					let nextDayMidnightInstantMs = currentCalendar.startOfDay(for: currentCalendar.date(byAdding: .day, value: 1 + dayIndex, to: widgetStartDate)!)
						.timeIntervalSince1970 * 1000

					// calendarEvent.endTime start of day is in milliseconds, but iOS time intervals are seconds.
					// since we don't really care about millisecond differences, maybe we can divide all incoming dates by 1000 for calculations.  since this would use less memory.

					let calendarEventStartTimeMs = Double(calendarEvent.startTime)
					let calendarEventEndTimeMs = Double(calendarEvent.endTime)

					let uiEventStartMax = max(currentDayMidnightInstantMs, calendarEventStartTimeMs)
					let uiEventEndMin = min(nextDayMidnightInstantMs, calendarEventEndTimeMs)

					let eventStartsAfterToday = uiEventStartMax >= uiEventEndMin
					let eventEndsBeforeToday = uiEventEndMin <= uiEventStartMax

					if eventEndsBeforeToday || eventStartsAfterToday { continue }

					let eventStartDate = Date.init(timeIntervalSince1970: Double(calendarEvent.startTime) / 1000)
					let eventEndDate = Date.init(timeIntervalSince1970: Double(calendarEvent.endTime) / 1000)

					let dateFormatter = DateFormatter()
					dateFormatter.timeZone = .current

					let eventTakesEntireDay =
						Double(calendarEvent.startTime) < currentDayMidnightInstantMs && Double(calendarEvent.endTime) >= nextDayMidnightInstantMs

					let eventStartsTodayAndEndsLater =
						Double(calendarEvent.startTime) >= currentDayMidnightInstantMs && Double(calendarEvent.endTime) >= nextDayMidnightInstantMs

					let eventStartsBeforeTodayAndEndsToday =
						Double(calendarEvent.startTime) < currentDayMidnightInstantMs && Double(calendarEvent.endTime) < nextDayMidnightInstantMs

					let isConsideredAllDay = isAllDayEvent(startDate: eventStartDate, endDate: eventEndDate) || eventTakesEntireDay

					var timeString: String {
						if eventStartsBeforeTodayAndEndsToday {
							return "Ends at " + dateFormatter.string(from: eventEndDate)
						} else if eventStartsTodayAndEndsLater {
							return "Starts at " + dateFormatter.string(from: eventStartDate)
						} else {
							return dateFormatter.string(from: eventStartDate) + " - " + dateFormatter.string(from: eventEndDate)
						}
					}

					let eventId = if let id = calendarEvent.id { id.listId + "/" + id.elementId } else { "" }

					let uiEvent = UIEvent(
						calendarId: calendar.id,
						id: eventId,
						summary: calendarEvent.summary,
						startDate: eventStartDate,
						endDate: eventEndDate,
						calendarColor: calendar.color,
						isBirthdayEvent: false,
						isDisplayedAsAllDay: isConsideredAllDay,
						timeString: timeString
					)
					daysAndEvents[dayIndex].append(uiEvent)
				}
			}

			//			eventsList.birthdayEvents.forEach { birthdayEvent: BirthdayEvent ->
			//				let eventStartDate = Date.init(timeIntervalSince1970: calendarEvent.startTime)
			//
			//				let eventStartLocalTime = currentCalendar.date(from: eventStartDate)
			//				let eventEndLocalTime = currentCalendar.date(from: eventEndDate)
			//
			//				let uiEvent = UIEvent(
			//					calendarId: calendar.id,
			//					id: birhdayEvent.calendarEvent.id,
			//					summary: getBirthdayEventTitle(name: birthdayEvent.contact.firstName, age: parseContactAge(birthdayIso: birthdayEvent.contact.birthdayIso)),
			//					startDate: dateFormatter.string(from: eventStartLocalTime),
			//					endDate: dateFormatter.string(from: eventEndLocalTime),
			//					calendarColor: calendar.color,
			//					isBirthdayEvent: true,
			//					isDisplayedAsAllDay: true,
			//					""
			//				)

			//				let index =

			//				daysAndEvents.append(

			//			eventsList.birthdayEvents.forEach { event in
			//				let eventStart = Date(timeIntervalSince1970: Double(event.calendarEvent.startTime) / 1000)
			//				let eventEnd = Date(timeIntervalSince1970: Double(event.calendarEvent.endTime) / 1000)
			//				let eventId = if let id = event.calendarEvent.id { id.listId + "/" + id.elementId } else { "" }
			//
			//				let startOfEventDay = Calendar.current.startOfDay(for: self.replaceDateTimeZone(date: eventStart)).timeIntervalSince1970
			//
			//				let eventDao = UIEvent(
			//					id: eventId,
			//					summary: getBirthdayEventTitle(name: event.contact.firstName, age: parseContactAge(birthdayIso: event.contact.birthdayIso)),
			//					startDate: eventStart,
			//					endDate: eventEnd,
			//					calendarColor: calendar.color.isEmpty ? DEFAULT_CALENDAR_COLOR : calendar.color,
			//					isBirthdayEvent: true
			//				)
			//
			////				if longEvents.index(forKey: startOfEventDay) == nil || longEvents[startOfEventDay]?.event == nil {
			////					longEvents.updateValue(SimpleAllDayEventsData(event: eventData, count: 1), forKey: startOfEventDay)
			////					if daysAndEvents.index(forKey: startOfEventDay) == nil { daysAndEvents.updateValue([], forKey: startOfEventDay) }
			////					return
			////				}
			//
			//				longEvents[startOfEventDay]?.count += 1
			//			}

			//			(eve).sorted(by: { $0.startTime < $1.startTime })
			//				.forEach { event in
			//					let eventStart = Date(timeIntervalSince1970: Double(event.startTime) / 1000)
			//					let eventEnd = Date(timeIntervalSince1970: Double(event.endTime) / 1000)
			//					let isAllDay =
			//						isAllDayEvent(startDate: eventStart, endDate: eventEnd)
			//						|| isAllDayOnReferenceDate(startDate: eventStart, endDate: eventEnd, referenceDate: date)
			//
			//					let eventId = if let id = event.id { id.listId + "/" + id.elementId } else { "" }
			//
			//					var referenceDate: Date
			//
			//					if isAllDay { referenceDate = self.replaceDateTimeZone(date: eventStart) } else { referenceDate = eventStart }
			//
			//					let startOfEventDay = Calendar.current.startOfDay(for: referenceDate).timeIntervalSince1970
			//					if startOfEventDay >= now {
			//						let eventData = CalendarEventData(
			//							id: eventId,
			//							summary: event.summary,
			//							startDate: eventStart,
			//							endDate: eventEnd,
			//							calendarColor: calendar.color.isEmpty ? DEFAULT_CALENDAR_COLOR : calendar.color,
			//							isBirthdayEvent: false
			//						)
			//
			//						if longEvents.index(forKey: startOfEventDay) == nil {
			//							longEvents.updateValue(SimpleAllDayEventsData(event: nil, count: 0), forKey: startOfEventDay)
			//							daysAndEvents.updateValue([], forKey: startOfEventDay)
			//						}
			//
			//						if isAllDay {
			//							if longEvents[startOfEventDay]?.event == nil { longEvents[startOfEventDay]?.event = eventData }
			//							longEvents[startOfEventDay]?.count += 1
			//						} else {
			//							daysAndEvents[startOfEventDay]?.append(eventData)
			//						}
			//					}
			//				}

		}

		//		events.forEach { key, value in events[key] = value.sorted { $0.startDate.timeIntervalSince1970 < $1.startDate.timeIntervalSince1970 } }
		return daysAndEvents
	}

	private func parseContactAge(birthdayIso: String?) -> Int? {
		if birthdayIso == nil { return nil }
		if birthdayIso!.starts(with: "--") { return nil }

		let birthdayParts = birthdayIso!.split(separator: "-")
		if birthdayParts[0].count != 4 { return nil }

		if let currentYear = Calendar.current.dateComponents([.year], from: Date()).year, let birthYear = Int(birthdayParts[0]) {
			return currentYear - birthYear
		}

		return nil
	}

	private func getBirthdayEventTitle(name: String, age: Int?) -> String {
		if let contactAge = age {
			var ageString = translate("TutaoBirthdayEventAgeTitle", default: "{age} years old")
			ageString.replace("{age}", with: String(contactAge))

			return "\(name) (\(ageString))"
		}

		var translation = translate("TutaoBirthdayEventTitle", default: "{name}'s Birthday")
		translation.replace("{name}", with: name)

		return translation
	}
}
