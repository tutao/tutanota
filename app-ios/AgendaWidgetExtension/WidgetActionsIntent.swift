//
//  WidgetActionIntent.swift
//  calendar
//
//  Created by Tutao GmbH on 23.04.25.
//

import WidgetKit
import AppIntents
import TutanotaSharedFramework
import SwiftUI


enum WidgetActions: String, AppEnum {
	static var typeDisplayRepresentation: TypeDisplayRepresentation = "Widget Actions"

	static var caseDisplayRepresentations: [WidgetActions : DisplayRepresentation] = [
		.agenda: DisplayRepresentation(title: LocalizedStringResource(stringLiteral: "agenda")),
		.eventDetails: DisplayRepresentation(title: LocalizedStringResource(stringLiteral: "eventDetails")),
		.eventEditor: DisplayRepresentation(title: LocalizedStringResource(stringLiteral: "eventEditor")),
		.sendLogs: DisplayRepresentation(title: LocalizedStringResource(stringLiteral: "sendLogs"))
	]

	case eventEditor
	case agenda
	case eventDetails
	case sendLogs
}

struct WidgetActionsIntent: AppIntent {
	init() {
		userId = ""
		date = Date()
		action = WidgetActions.agenda
	}

	init(userId: String, date: Date, action: WidgetActions, eventId: String? = nil, extras: [String]? = []) {
		self.userId = userId
		self.date = date
		self.action = action
		self.eventId = eventId
		self.extras = extras
	}

	static var title: LocalizedStringResource { "WidgetActionIntent" }
	static var openAppWhenRun: Bool = true // required
	static var isDiscoverable: Bool = false // optional, if you want to hide this from the Shortcuts app, Spotlight, etc


	@Parameter(title: "UserId")
	var userId: String
	@Parameter(title: "Date")
	var date: Date
	@Parameter(title: "Widget Actions")
	var action: WidgetActions
	@Parameter(title: "EventID")
	var eventId: String?
	@Parameter(title: "Extras")
	var extras: [String]?

	func perform() async throws -> some IntentResult {
		var components = URLComponents()

		components.scheme = "tutacalendar"
		components.host = "interop"

		components.queryItems = [
			URLQueryItem(name: "widget", value: action.rawValue),
			URLQueryItem(name: "userId", value: userId),
			URLQueryItem(name: "date", value: date.ISO8601Format()),
			URLQueryItem(name: "eventId", value: eventId)
		]

		if action == WidgetActions.sendLogs {
			try await WidgetErrorHandler.writeLogs(logs: extras?.first ?? "")
		}

		// FIXME Change logger
		guard let url = components.url else {
			TUTSLog("Failed to build Widget Action URL: Available query items = \(components.queryItems ?? [])")
			return .result()
		}

		await EnvironmentValues().openURL(url)
		return .result()
	}
}
