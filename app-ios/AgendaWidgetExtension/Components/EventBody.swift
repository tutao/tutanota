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
		let eventTitle = if event != nil { event!.summary } else { translate("TutaoWidgetNoEventsMsg", default: "No events") }
		let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: eventDate)
		let day = String(dateComponents.day ?? 00).padStart(length: 2, char: "0")
		let weekday = DateFormatter().shortWeekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		return HStack(alignment: VerticalAlignment.center, spacing: Dimensions.Spacing.MD) {
			if !happensToday {
				HStack(alignment: VerticalAlignment.center) {
					VStack(spacing: -2) {
						Text(day).font(.system(size: 20, weight: .bold))
						Text(weekday).font(.system(size: 12, weight: .regular)).lineLimit(1)
					}
				}
				.opacity(isFirstEventOfDay ? 1 : 0).frame(width: 28, alignment: .leading)
			}
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
						Text(eventTitle).fontWeight(.bold).font(.system(size: 14))
						if eventTime != nil { Text(eventTime!).font(.system(size: 10)) }
					}
					.foregroundStyle(Color(.onSurface)).frame(maxHeight: .infinity, alignment: .center)
				}
				.frame(maxWidth: .infinity, alignment: .leading)
			}
			.buttonStyle(.plain)
		}
	}
}
