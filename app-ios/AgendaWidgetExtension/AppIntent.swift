//
//  AppIntent.swift
//  AgendaWidget
//
//  Created by Tutao GmbH on 15.04.25.
//

import WidgetKit
import AppIntents
import TutanotaSharedFramework

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Select an account and calendars" }
    static var description: IntentDescription { "This is an example widget." }

	@Parameter(title: "User", description: LocalizedStringResource(stringLiteral: "User account to load calendars from"))
	var account: Credential?

	@Parameter(title: "Calendars", description: LocalizedStringResource(stringLiteral: "Calendars to fetch the event from"), optionsProvider: CalendarsProvider())
	var calendars: [CalendarEntity]?

	static var parameterSummary: some ParameterSummary {
		When(\.$account, .hasNoValue) {
			Summary {
				\.$account
			}
		} otherwise: {
			Summary {
				\.$account
				\.$calendars
			}
		}
	}

	private struct CalendarsProvider: DynamicOptionsProvider {
		@IntentParameterDependency<ConfigurationAppIntent>(
			\.$account
	   	)
	   	var config

		func results() async throws -> [CalendarEntity] {
			guard let userId = config?.account.id else { return [] }
			return try await CalendarEntity.fetchCalendars(userId)
		}
	}
}
