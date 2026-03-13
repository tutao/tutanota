//
//  EventBody.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct EventBody: View {
	var userId: String
	var happensToday: Bool
	var isFirstEventOfDay: Bool
	var calendarColor: UIColor
	var eventDate: Date
	var eventTime: String?
	var event: CalendarEventData?

	var body: some View {
		let eventTitle: String
		if let eventSummary = event?.summary, !eventSummary.isEmpty {
			eventTitle = eventSummary
		} else {
			eventTitle = event == nil ? translate("TutaoWidgetNoEventsMsg", default: "No events") : translate("TutaoNoTitleLabel", default: "<No title>")
		}
		return HStack(alignment: VerticalAlignment.center, spacing: Dimensions.Spacing.MD) {
			Button(
				intent: WidgetActionsIntent(
					userId: userId,
					date: eventDate,
					action: event?.id == nil ? WidgetActions.agenda : WidgetActions.eventDetails,
					eventId: event?.id
				)
			) {
				HStack(spacing: Dimensions.Spacing.MD) {
					VStack { Rectangle().fill(Color(calendarColor.cgColor)).frame(width: 3).frame(maxHeight: .infinity).clipShape(.rect(cornerRadius: 3)) }
					VStack(alignment: .leading) {
						Text(eventTitle).fontWeight(.bold).font(.system(size: Dimensions.FontSize.font_14))
						if eventTime != nil { Text(eventTime!).font(.system(size: Dimensions.FontSize.font_12)) }
					}
					.foregroundStyle(Color(.onSurface)).frame(maxHeight: .infinity, alignment: .center)
				}
				.frame(maxWidth: .infinity, alignment: .leading)
			}
			.buttonStyle(.plain)
		}
	}
}
