//
//  DaysList.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct DaysList: View {
	var userId: String
	var isEmpty: Bool
	var family: WidgetFamily
	var widgetHeight: CGFloat
	var normalEvents: EventMap
	var allDayEventsData: LongEventsDataMap

	var body: some View {
		LazyVStack(alignment: .leading, spacing: 6) {
			ForEach(normalEvents.keys.sorted(by: { $0 < $1 }), id: \.self) { startOfDay in
				let parsedDay = Date(timeIntervalSince1970: startOfDay)

				let events = normalEvents[startOfDay] ?? []
				let allDayEvents = allDayEventsData[startOfDay] ?? SimpleLongEventsData(event: nil, count: 0)

				let hasAllDayEvents = allDayEvents.count > 0
				let isToday = Calendar.current.isDateInToday(parsedDay)

				return Button(intent: WidgetActionsIntent(userId: userId, date: parsedDay, action: WidgetActions.agenda)) {
					Card {
						if isToday {
							Header(allDayEvents: allDayEventsData, userId: userId)
						} else if hasAllDayEvents {
							AllDayHeader(allDayEventsData: allDayEvents)
						}

						if isEmpty {
							EmptyBody(widgetHeight: widgetHeight, family: family)
						} else {
							// Has at least one all day event
							if events.isEmpty {
								self.RenderOnlyAllDayEvents(date: parsedDay, hasAllDay: hasAllDayEvents)
							} else {
								EventsList(userId: userId, events: events)
							}
						}
					}
				}
				.buttonStyle(.plain)
			}
		}
	}

	@ViewBuilder private func RenderOnlyAllDayEvents(date: Date, hasAllDay: Bool) -> some View {
		let isToday = Calendar.current.isDateInToday(date)

		if isToday { NoEventsSmall() } else if hasAllDay { NoEvents(userId: userId, isToday: isToday, date: date) }
	}
}
