//
//  WidgetModel.swift
//  calendar
//
//  Created by Tutao GmbH on 24.04.25.
//
import TutanotaSharedFramework
import tutasdk

struct CalendarEventData: Equatable, Hashable, Encodable {
	var id: String
	var summary: String
	var startDate: Date
	var endDate: Date
	var calendarColor: String
	var isBirthdayEvent: Bool
}

struct WidgetModel {
	private let urlSession: URLSession = makeUrlSession()
	private let sdk: LoggedInSdk

	init(userId: String) async throws { self.sdk = try await SdkFactory.createSdk(userId: userId) }

	func getEventsForCalendars(_ calendars: [CalendarEntity], date: Date) async throws -> ([CalendarEventData], [CalendarEventData]) {
		let dateInMiliseconds = UInt64(date.timeIntervalSince1970) * 1000
		let end = UInt64(Calendar.current.date(byAdding: .day, value: 7, to: date)!.timeIntervalSince1970) * 1000
		let calendarFacade = self.sdk.calendarFacade()

		var normalEvents: [CalendarEventData] = []
		var longEvents: [CalendarEventData] = []

		for calendar in calendars {
			let eventsList = await calendarFacade.getCalendarEvents(calendarId: calendar.id, start: dateInMiliseconds, end: end)
			(eventsList.shortEvents + eventsList.longEvents)
				.forEach { event in
					let eventStart = Date(timeIntervalSince1970: Double(event.startTime) / 1000)
					let eventEnd = Date(timeIntervalSince1970: Double(event.endTime) / 1000)
					let isAllDay =
						isAllDayEvent(startDate: eventStart, endDate: eventEnd)
						|| isAllDayOnReferenceDate(startDate: eventStart, endDate: eventEnd, referenceDate: date)

					let eventId = if let id = event.id { id.listId + "/" + id.elementId } else { "" }

					let eventData = CalendarEventData(
						id: eventId,
						summary: event.summary,
						startDate: eventStart,
						endDate: eventEnd,
						calendarColor: calendar.color.isEmpty ? DEFAULT_CALENDAR_COLOR : calendar.color,
						isBirthdayEvent: false
					)

					if isAllDay { longEvents.append(eventData) } else { normalEvents.append(eventData) }
				}

			eventsList.birthdayEvents.forEach { event in
				let eventStart = Date(timeIntervalSince1970: Double(event.calendarEvent.startTime) / 1000)
				let eventEnd = Date(timeIntervalSince1970: Double(event.calendarEvent.endTime) / 1000)
				let eventId = if let id = event.calendarEvent.id { id.listId + "/" + id.elementId } else { "" }

				let eventData = CalendarEventData(
					id: eventId,
					summary: getBirthdayEventTitle(name: event.contact.firstName, age: parseContactAge(birthdayIso: event.contact.birthdayIso)),
					startDate: eventStart,
					endDate: eventEnd,
					calendarColor: calendar.color.isEmpty ? DEFAULT_CALENDAR_COLOR : calendar.color,
					isBirthdayEvent: true
				)

				longEvents.append(eventData)
			}
		}

		normalEvents.sort(by: { $0.startDate.timeIntervalSince1970 < $1.startDate.timeIntervalSince1970 })
		longEvents.sort(by: { $0.startDate.timeIntervalSince1970 < $1.startDate.timeIntervalSince1970 })
		return (Array(normalEvents.prefix(upTo: 8)), longEvents)
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
