//
//  ErrorBody.swift
//  calendar
//
//  Created by Tutao GmbH on 25.04.25.
//

import AppIntents
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct ErrorBody: View {
	var error: WidgetError

	private func makeIntentErrorMap() -> [WidgetErrors: (WidgetActions, [String])] {
		[.credentials: (WidgetActions.agenda, []), .unexpected: (WidgetActions.sendLogs, [getLogs()])]
	}

	func makeIntent() -> some AppIntent {
		let intentErrorMap = makeIntentErrorMap()
		guard let intentErrorConfig = intentErrorMap[error.type] else {
			printLog("Unknown Widget Error. Consider checking if this type is being handled: \(error.type)")
			return WidgetActionsIntent()
		}
		return WidgetActionsIntent(userId: "", date: Date(), action: intentErrorConfig.0, logs: intentErrorConfig.1)
	}

	func ErrorBodyWrapper(isMedium: Bool, content: () -> some View) -> some View {
		Group {
			if isMedium {
				Button(intent: makeIntent()) { content() }.buttonStyle(.plain).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
			} else {
				VStack(alignment: .center) { content() }.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
			}
		}
	}

	func ActionButton(isMedium: Bool) -> some View {
		let buttonText =
			error.type == .credentials
			? translate("TutaoWidgetOpenAppAction", default: "Open App") : translate("TutaoWidgetSendLogsAction", default: "Send Logs")

		return VStack {
			if isMedium && error.type != WidgetErrors.missingConfiguration {
				Button(intent: makeIntent()) { Text(buttonText).fontWeight(.medium).padding([.leading, .trailing], 16) }.buttonStyle(.plain).frame(height: 44)
					.background(Color(.primary)).clipShape(.rect(topLeadingRadius: 8, bottomLeadingRadius: 8, bottomTrailingRadius: 8, topTrailingRadius: 8))
					.foregroundStyle(Color(.onPrimary))
			}
		}
	}

	func makeErrorImage() -> ImageResource {
		if self.error.type == WidgetErrors.missingConfiguration { return .widgetConfig }

		return .widgetError
	}

	@Environment(\.widgetFamily) var family
	var body: some View {
		ErrorBodyWrapper(isMedium: family == .systemMedium) {
			VStack(alignment: .center) {
				Image(self.makeErrorImage()).imageScale(.large)
				Text(error.type.getUserFriendlyErrorMessage()).font(.system(size: 16)).lineLimit(2).multilineTextAlignment(.center)
					.foregroundStyle(Color(.onSurface)).padding([.top, .bottom], 8)
				ActionButton(isMedium: family == .systemMedium)
			}
			.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
		}
	}
}
