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
	var family: WidgetFamily
	var widgetHeight: CGFloat
	var normalEvents: EventMap
	var allDayEventsData: LongEventsDataMap

	var body: some View {
		LazyVStack(alignment: .leading, spacing: 6) {
			ForEach(normalEvents.keys.sorted(by: { $0 < $1 }), id: \.self) { startOfDay in
				let parsedDay = Date(timeIntervalSince1970: startOfDay)

				let normalEventsOnDay: [CalendarEventData] = normalEvents[startOfDay] ?? []
				let allDayEventsOnDay: SimpleLongEventsData = allDayEventsData[startOfDay] ?? SimpleLongEventsData(event: nil, count: 0)

				let hasAllDayEvents = allDayEventsOnDay.count > 0
				let isToday = Calendar.current.isDateInToday(parsedDay)

				Button(intent: WidgetActionsIntent(userId: userId, date: parsedDay, action: WidgetActions.agenda)) {
					Card {
						VStack(spacing: 0) {
							if isToday {  // render TodayCard
								Header(allDayEvents: allDayEventsData, userId: userId)
								if normalEventsOnDay.isEmpty && !hasAllDayEvents {
									Text("No events today").font(.system(size: 16)).padding(.top, -Dimensions.Spacing.MD).padding(.bottom, Dimensions.Spacing.SM)
								} else if (!normalEventsOnDay.isEmpty) {
									EventsList(userId: userId, events: normalEventsOnDay).padding(.bottom, Dimensions.Spacing.SM)
								}
							} else {  // render OtherDayCard
								if normalEventsOnDay.isEmpty && hasAllDayEvents {
									// render All Day Events Only Row
									HStack(alignment: VerticalAlignment.center, spacing: Dimensions.Spacing.SM) {
										DayWithWeekday(date: parsedDay)
										AllDayEventRow(allDayEventsData: allDayEventsOnDay)
									}
									.padding(.horizontal, Dimensions.Spacing.MD).padding(.vertical, Dimensions.Spacing.SM)

								} else if !normalEventsOnDay.isEmpty && !hasAllDayEvents {
									// render only the Event list (no all day events)
									EventsList(userId: userId, events: normalEventsOnDay).padding(.vertical, Dimensions.Spacing.SM)
								} else {
									// render both All Day section and Events List
									VStack(alignment: .leading, spacing: Dimensions.Spacing.XS) {
										AllDayHeader(allDayEventsData: allDayEventsOnDay)
										EventsList(userId: userId, events: normalEventsOnDay).padding(.vertical, Dimensions.Spacing.SM)
									}
								}
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
