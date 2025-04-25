//
//  WidgetErrorHandler.swift
//  calendar
//
//  Created by Tutao GmbH on 25.04.25.
//
import TutanotaSharedFramework


enum WidgetErrors {
	case credentials
	case unexpected
	case missingConfiguration

	func getUserFriendlyErrorMessage() -> String {
		switch self {
			case .credentials: "FIXME: Credentials Login"
			case .missingConfiguration: "FIXME: Widget not configured"
			default: "FIXME: Unexpected"
		}
	}
}

struct WidgetError {
	let type: WidgetErrors
	let message: String
	let stacktrace: String
}

struct WidgetErrorHandler {
	public static func writeLogs(logs: String) async throws {
		let sharingInfo = SharingInfo(identifier: "Widget", text: logs, fileUrls: [])

		try writeSharingInfo(info: sharingInfo, infoLocation: WIDGET_LOGS_LOCATION)
	}
}
