//
//  EventsList.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct EventsList: View {
	var userId: String
	var events: [CalendarEventData]

	private let eventTimeFormatter: DateFormatter = {
		let formatter = DateFormatter()
		formatter.dateStyle = .none
		formatter.timeStyle = .short
		return formatter
	}()

	var body: some View {
		VStack(alignment: .leading, spacing: 6) {
			ForEach(Array(events.enumerated()), id: \.element) { index, event in
				let calendarColor = UIColor(hex: event.calendarColor) ?? .white
				let eventTime = eventTimeFormatter.string(from: event.startDate) + " - " + eventTimeFormatter.string(from: event.endDate)
				let happensToday = Calendar.current.isDateInToday(event.startDate)

				EventBody(
					userId: userId,
					happensToday: happensToday,
					isFirstEventOfDay: index == 0,
					calendarColor: calendarColor,
					eventDate: event.startDate,
					eventTime: eventTime,
					event: event
				)
			}
		}
		.padding(.horizontal, Dimensions.Spacing.MD).padding(.vertical, Dimensions.Spacing.SM)
	}
}
