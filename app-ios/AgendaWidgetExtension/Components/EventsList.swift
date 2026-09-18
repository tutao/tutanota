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
	var events: [UIEvent]
	var applyPaddingEndForFirstElement = false

	private let eventTimeFormatter: DateFormatter = {
		let formatter = DateFormatter()
		formatter.dateStyle = .none
		formatter.timeStyle = .short
		return formatter
	}()

	var body: some View {
		VStack(alignment: .leading) {
			ForEach(Array(events.enumerated()), id: \.element) { index, event in
				let calendarColor = UIColor(hex: event.calendarColor) ?? .white
				let happensToday = Calendar.current.isDateInToday(event.startDate)

				EventBody(
					userId: userId,
					happensToday: happensToday,
					isFirstEventOfDay: index == 0,
					calendarColor: calendarColor,
					eventDate: event.startDate,
					eventTime: event.timeString,
					event: event
				)
				.padding(.trailing, applyPaddingEndForFirstElement && index == 0 ? Dimensions.Size.core_48 : 0.0)
			}
		}
	}
}
