//
//  AppIntent.swift
//  AgendaWidget
//
//  Created by Tutao GmbH on 15.04.25.
//

import AppIntents
import TutanotaSharedFramework
import WidgetKit

struct ConfigurationAppIntent: WidgetConfigurationIntent {
	static var title: LocalizedStringResource { "Select an account and calendars" }

	@Parameter(
		title: LocalizedStringResource("TutaoAccountLabel", defaultValue: "User", table: "InfoPlist"),
		description: LocalizedStringResource(stringLiteral: "User account to load calendars from")
	) var account: WidgetCredential?

	@Parameter(
		title: LocalizedStringResource("TutaoCalendarsLabel", defaultValue: "Calendars", table: "InfoPlist"),
		description: LocalizedStringResource(stringLiteral: "Calendars to fetch the event from"),
		optionsProvider: CalendarsProvider()
	) var calendars: [CalendarEntity]?

	static var parameterSummary: some ParameterSummary {
		When(\.$account, .hasNoValue) {
			Summary { \.$account }
		} otherwise: {
			Summary {
				\.$account
				\.$calendars
			}
		}
	}

	private struct CalendarsProvider: DynamicOptionsProvider {
		@IntentParameterDependency<ConfigurationAppIntent>(\.$account) var config

		func results() async throws -> [CalendarEntity] {
			guard let userId = config?.account.id else { return [] }
			return try await CalendarEntity.fetchCalendars(userId)
		}
	}
}
