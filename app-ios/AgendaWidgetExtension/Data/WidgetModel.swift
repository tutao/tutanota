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
		// UTC would be better to use here but Apple's APIs don't provide it, so we use GMT here.
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

		let currentCalendar = Calendar.current

		// create a separate calendar that uses UTC times so we can get the UTC dates for all-day event calculations
		var utcCalendar = Calendar.init(identifier: .gregorian)
		// UTC would be better to use here but Apple's APIs don't provide it, so we use GMT here.  It is functionally the same.
		utcCalendar.timeZone = TimeZone.gmt

		// an array representing the current day and the next six days, to fill with events that appear on each day.
		var daysAndEvents: DaysToEventsList = [[], [], [], [], [], [], []]

		let widgetStartDate = date
		let widgetStartDateComponents = currentCalendar.dateComponents([.day, .month, .year], from: widgetStartDate)

		for calendar in calendars {
			let eventsList: CalendarEventsList = try await calendarFacade.getCalendarEvents(
				calendarId: calendar.id,
				start: dateInSeconds * 1000, // getCalendarEvents requires start and end in milliseconds
				end: endSeconds * 1000
			)

			let shortAndLongEvents = eventsList.shortEvents + eventsList.longEvents

			let dateFormatter = DateFormatter()
			dateFormatter.setLocalizedDateFormatFromTemplate("HH:mm")

			for calendarEvent in shortAndLongEvents {

				for dayIndex in stride(from: 0, to: daysAndEvents.count, by: 1) {
					let currentDayMidnightDateInstant = currentCalendar.startOfDay(
						for: currentCalendar.date(byAdding: .day, value: dayIndex, to: widgetStartDate)!
					)
					let nextDayMidnightDateInstant = currentCalendar.startOfDay(
						for: currentCalendar.date(byAdding: .day, value: 1 + dayIndex, to: widgetStartDate)!
					)

					let currentDayMidnightInstantMs = currentDayMidnightDateInstant.timeIntervalSince1970 * 1000
					let nextDayMidnightInstantMs = nextDayMidnightDateInstant.timeIntervalSince1970 * 1000

					let currentDayMidnightUTC = utcCalendar.startOfDay(for: currentCalendar.date(byAdding: .day, value: dayIndex, to: widgetStartDate)!)
					let nextDayMidnightUTC = utcCalendar.startOfDay(for: currentCalendar.date(byAdding: .day, value: dayIndex + 1, to: widgetStartDate)!)

					let calendarEventStartTimeMs = Double(calendarEvent.startTime)
					let calendarEventEndTimeMs = Double(calendarEvent.endTime)

					let calendarEventStartDate = Date.init(timeIntervalSince1970: calendarEventStartTimeMs / 1000)
					let calendarEventEndDate = Date.init(timeIntervalSince1970: calendarEventEndTimeMs / 1000)

					var uiEventStartMax: Double
					var uiEventEndMin: Double

					// for each day in the days to events list, check and see if this event overlaps with the represented day.
					if isAllDayEvent(startDate: calendarEventStartDate, endDate: calendarEventEndDate) {
						// We consider the "start of day" as midnight UTC if the event is an all day event
						uiEventStartMax = max(currentDayMidnightUTC.timeIntervalSince1970 * 1000, calendarEventStartTimeMs)
						uiEventEndMin = min(nextDayMidnightUTC.timeIntervalSince1970 * 1000, calendarEventEndTimeMs)
					} else {
						// We consider the "start of day" as midnight in the device's configured time zone if it is a normal event.
						uiEventStartMax = max(currentDayMidnightInstantMs, calendarEventStartTimeMs)
						uiEventEndMin = min(nextDayMidnightInstantMs, calendarEventEndTimeMs)
					}

					let eventStartsAfterCurrentDay = uiEventStartMax >= uiEventEndMin
					let eventEndsBeforeCurrentDay = uiEventEndMin <= uiEventStartMax

					// if the event ends before today or starts after today, this means we don't add an entry for it in the current day.
					// but there might be other days where we must add it.
					if eventEndsBeforeCurrentDay || eventStartsAfterCurrentDay { continue }

					let eventStartDate = Date.init(timeIntervalSince1970: Double(calendarEvent.startTime) / 1000)
					let eventEndDate = Date.init(timeIntervalSince1970: Double(calendarEvent.endTime) / 1000)

					let eventTakesEntireDay =
						Double(calendarEvent.startTime) < currentDayMidnightInstantMs && Double(calendarEvent.endTime) >= nextDayMidnightInstantMs

					let eventStartsTodayAndEndsLater =
						Double(calendarEvent.startTime) >= currentDayMidnightInstantMs && Double(calendarEvent.endTime) >= nextDayMidnightInstantMs

					let eventStartsBeforeTodayAndEndsToday =
						Double(calendarEvent.startTime) < currentDayMidnightInstantMs && Double(calendarEvent.endTime) < nextDayMidnightInstantMs

					let isConsideredAllDay = isAllDayEvent(startDate: eventStartDate, endDate: eventEndDate) || eventTakesEntireDay

					// Based on the above calculations, if the event is continuing from a previous day OR continues onto the next day we should say so.
					var timeString: String {
						if eventStartsBeforeTodayAndEndsToday {
							return "Ends at " + eventEndDate.formatted(.dateTime.hour(.defaultDigits(amPM: .abbreviated)).minute(.twoDigits))
						} else if eventStartsTodayAndEndsLater {
							return "Starts at " + eventStartDate.formatted(.dateTime.hour(.defaultDigits(amPM: .abbreviated)).minute(.twoDigits))
						} else {
							// if the event starts and ends on the current day, display times normally
							return eventStartDate.formatted(.dateTime.hour(.defaultDigits(amPM: .abbreviated)).minute(.twoDigits)) + " - "
								+ eventEndDate.formatted(.dateTime.hour(.defaultDigits(amPM: .abbreviated)).minute(.twoDigits))
						}
					}

					// this eventId is used to find the event in tuta calendar if the user taps on the event in the widget.
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

			for birthdayEvent in eventsList.birthdayEvents {

				let eventStartDate = Date.init(timeIntervalSince1970: Double(birthdayEvent.calendarEvent.startTime) / 1000)
				let eventEndDate = Date.init(timeIntervalSince1970: Double(birthdayEvent.calendarEvent.endTime) / 1000)

				let eventId = if let id = birthdayEvent.calendarEvent.id { id.listId + "/" + id.elementId } else { "" }

				let uiEvent = UIEvent(
					calendarId: calendar.id,
					id: eventId,
					summary: getBirthdayEventTitle(name: birthdayEvent.contact.firstName, age: parseContactAge(birthdayIso: birthdayEvent.contact.birthdayIso)),
					startDate: eventStartDate,
					endDate: eventEndDate,
					calendarColor: calendar.color,
					isBirthdayEvent: true,
					isDisplayedAsAllDay: true,
					timeString: ""
				)

				// Needs to calculate based on only day month year of UTC date (i.e. all day event date).
				let widgetStartDateComponents = currentCalendar.dateComponents([.day, .month, .year], from: widgetStartDate)
				let widgetStartDateStartOfDayUTC = currentCalendar.date(from: widgetStartDateComponents)!

				// calculate index differently here because we know birthday events only ever happen on one day.
				// so there is no need to do much of the logic that was necessary for the non-birthday events.
				let index = utcCalendar.dateComponents([.day], from: widgetStartDateStartOfDayUTC, to: eventStartDate).day!
				daysAndEvents[index].append(uiEvent)

			}
		}

		// sort all of the events so that they appear in chronological order within a widget day, regardless of what calendar they are in.
		for (index, day) in daysAndEvents.enumerated() {
			daysAndEvents[index] = day.sorted { $0.startDate.timeIntervalSince1970 < $1.startDate.timeIntervalSince1970 }
		}
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
