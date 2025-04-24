//
//  WidgetModel.swift
//  calendar
//
//  Created by Tutao GmbH on 24.04.25.
//
import TutanotaSharedFramework
import tutasdk

struct CalendarEventData {
	var id: String
	var summary: String
	var startDate: Date
	var endDate: Date
	var calendarColor: String
}

struct WidgetModel {
	private let urlSession: URLSession = makeUrlSession()
	private let sdk: LoggedInSdk

	init(userId: String) async throws {
		self.sdk = try await SdkFactory.createSdk(userId: userId)
	}

	func getEventsForCalendars(_ calendars: [CalendarEntity], date: Date) async throws -> ([CalendarEventData], [CalendarEventData]) {
		let dateInMiliseconds = UInt64(date.timeIntervalSince1970) * 1000
		let calendarFacade = self.sdk.calendarFacade()

		var normalEvents: [CalendarEventData] = []
		var longEvents: [CalendarEventData] = []

		for calendar in calendars {
			let eventsList = await calendarFacade.getCalendarEvents(calendarId: calendar.id, date: dateInMiliseconds)
			(eventsList.shortEvents + eventsList.longEvents).forEach { event in
				let eventStart = Date(timeIntervalSince1970: Double(event.startTime) / 1000)
				let eventEnd = Date(timeIntervalSince1970: Double(event.endTime) / 1000)
				let isAllDay = isAllDayEvent(startDate: eventStart, endDate: eventEnd) || isAllDayOnReferenceDate(startDate: eventStart, endDate: eventEnd, referenceDate: date)

				let eventId = if let id = event.id {
					id.listId + "/" + id.elementId
				} else { "" }

				let eventData = CalendarEventData(
					id: eventId,
					summary: event.summary,
					startDate: eventStart,
					endDate: eventEnd,
					calendarColor: calendar.color == "" ? DEFAULT_CALENDAR_COLOR : calendar.color
				)

				if isAllDay {
					longEvents.append(eventData)
				} else {
					normalEvents.append(eventData)
				}
			}
		}

		normalEvents.sort(by: { $0.startDate.timeIntervalSince1970 < $1.startDate.timeIntervalSince1970 })

		return (normalEvents, longEvents)
	}
}
