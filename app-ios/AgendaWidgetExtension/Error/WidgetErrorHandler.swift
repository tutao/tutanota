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
		case .credentials: translate("TutaoWidgetCredentialsErrorMsg", default: "Please login on the Calendar App")
		case .missingConfiguration: translate("TutaoWidgetMissingConfigurationErrorMsg", default: "Missing widget configuration")
		default: translate("TutaoWidgetUnexpectedErrorMsg", default: "Oops! Something went wrong.")
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
