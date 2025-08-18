//
//  WidgetModel.swift
//  calendar
//
//  Created by Tutao GmbH on 24.04.25.
//
import TutanotaSharedFramework
import tutasdk

// Start of day to list of events
typealias EventMap = [Double: [CalendarEventData]]

typealias LongEventsDataMap = [Double: SimpleLongEventsData]

struct CalendarEventData: Equatable, Hashable, Encodable {
	var id: String
	var summary: String
	var startDate: Date
	var endDate: Date
	var calendarColor: String
	var isBirthdayEvent: Bool
}

struct SimpleLongEventsData: Equatable, Hashable, Encodable {
	var event: CalendarEventData?
	var count: Int
}

struct WidgetModel {
	private let urlSession: URLSession = makeUrlSession()
	private let sdk: LoggedInSdk

	init(userId: String) async throws { self.sdk = try await SdkFactory.createSdk(userId: userId) }

	func getEventsForCalendars(_ calendars: [CalendarEntity], date: Date) async throws -> (EventMap, LongEventsDataMap) {
		let dateInMiliseconds = UInt64(date.timeIntervalSince1970) * 1000
		let end = UInt64(Calendar.current.date(byAdding: .day, value: 7, to: date)!.timeIntervalSince1970) * 1000
		let calendarFacade = self.sdk.calendarFacade()

		let startOfToday = Calendar.current.startOfDay(for: date).timeIntervalSince1970

		var normalEvents: EventMap = [startOfToday: []]
		var longEvents: LongEventsDataMap = [startOfToday: SimpleLongEventsData(event: nil, count: 0)]

		for calendar in calendars {
			let eventsList = await calendarFacade.getCalendarEvents(calendarId: calendar.id, start: dateInMiliseconds, end: end)

			eventsList.birthdayEvents.forEach { event in
				let eventStart = Date(timeIntervalSince1970: Double(event.calendarEvent.startTime) / 1000)
				let eventEnd = Date(timeIntervalSince1970: Double(event.calendarEvent.endTime) / 1000)
				let eventId = if let id = event.calendarEvent.id { id.listId + "/" + id.elementId } else { "" }

				let startOfEventDay = Calendar.current.startOfDay(for: eventStart).timeIntervalSince1970

				let eventData = CalendarEventData(
					id: eventId,
					summary: getBirthdayEventTitle(name: event.contact.firstName, age: parseContactAge(birthdayIso: event.contact.birthdayIso)),
					startDate: eventStart,
					endDate: eventEnd,
					calendarColor: calendar.color.isEmpty ? DEFAULT_CALENDAR_COLOR : calendar.color,
					isBirthdayEvent: true
				)

				if longEvents.index(forKey: startOfEventDay) == nil || longEvents[startOfEventDay]?.event == nil {
					longEvents.updateValue(SimpleLongEventsData(event: eventData, count: 1), forKey: startOfEventDay)
					if normalEvents.index(forKey: startOfEventDay) == nil { normalEvents.updateValue([], forKey: startOfEventDay) }
					return
				}

				longEvents[startOfEventDay]?.count += 1
			}

			var normalEventCount = 0
			(eventsList.shortEvents + eventsList.longEvents).sorted(by: { $0.startTime < $1.startTime })
				.forEach { event in
					let eventStart = Date(timeIntervalSince1970: Double(event.startTime) / 1000)
					let eventEnd = Date(timeIntervalSince1970: Double(event.endTime) / 1000)
					let isAllDay =
						isAllDayEvent(startDate: eventStart, endDate: eventEnd)
						|| isAllDayOnReferenceDate(startDate: eventStart, endDate: eventEnd, referenceDate: date)

					let startOfEventDay = Calendar.current.startOfDay(for: eventStart).timeIntervalSince1970

					let eventId = if let id = event.id { id.listId + "/" + id.elementId } else { "" }

					let eventData = CalendarEventData(
						id: eventId,
						summary: event.summary,
						startDate: eventStart,
						endDate: eventEnd,
						calendarColor: calendar.color.isEmpty ? DEFAULT_CALENDAR_COLOR : calendar.color,
						isBirthdayEvent: false
					)

					if longEvents.index(forKey: startOfEventDay) == nil {
						longEvents.updateValue(SimpleLongEventsData(event: nil, count: 0), forKey: startOfEventDay)
						normalEvents.updateValue([], forKey: startOfEventDay)
					}

					if isAllDay {
						if longEvents[startOfEventDay]?.event == nil { longEvents[startOfEventDay]?.event = eventData }
						longEvents[startOfEventDay]?.count += 1
					} else if normalEventCount <= 8 {
						normalEvents[startOfEventDay]?.append(eventData)
						normalEventCount += 1
					}
				}
		}

		return (normalEvents, longEvents)
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
