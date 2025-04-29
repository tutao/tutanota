//
//  Calendar.swift
//  calendar
//
//  Created by Tutao GmbH on 16.04.25.
//

import AppIntents
import TutanotaSharedFramework
import tutasdk

let DEFAULT_CALENDAR_NAME = translate("TutaoDefaultCalendarNameTitle", default: "Private")
let DEFAULT_CALENDAR_COLOR = "23f520"

struct CalendarEntity: AppEntity {
	static var defaultQuery: CalendarQuery = CalendarQuery()

	var id: String
	var name: String
	var color: String

	static var typeDisplayRepresentation: TypeDisplayRepresentation = "Calendar"

	var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: LocalizedStringResource(stringLiteral: name)) }

	static func fetchCalendars(_ userId: String) async throws -> [CalendarEntity] {
		let sdk = try await SdkFactory.createSdk(userId: userId)
		let calendars = await sdk.calendarFacade().getCalendarsRenderData()
		return calendars.map { calendarId, renderData in
			CalendarEntity(
				id: calendarId,
				name: renderData.name.isEmpty ? DEFAULT_CALENDAR_NAME : renderData.name,
				color: renderData.color.isEmpty ? DEFAULT_CALENDAR_COLOR : renderData.color
			)
		}
	}
}

struct CalendarQuery: EntityQuery {
	@IntentParameterDependency<ConfigurationAppIntent>(\.$account) var config

	func entities(for identifiers: [CalendarEntity.ID]) async throws -> [CalendarEntity] {
		guard let userId = config?.account.id else { return [] }
		return try await CalendarEntity.fetchCalendars(userId).filter { identifiers.contains($0.id) }
	}

	func suggestedEntities() async throws -> some ResultsCollection {
		guard let userId = ConfigurationAppIntent().account?.id else { return [] as [CalendarEntity] }
		return try await CalendarEntity.fetchCalendars(userId)
	}

	func defaultResult() async -> CalendarEntity? { nil }
}
