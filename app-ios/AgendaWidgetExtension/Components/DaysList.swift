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
			let days: [Double] = normalEvents.keys.sorted(by: { $0 < $1 })

			ForEach(days, id: \.self) { startOfDay in
				DayRow(startOfDay: startOfDay, userId: userId, normalEvents: normalEvents, allDayEventsData: allDayEventsData)
			}
		}
	}
}

private struct DayRow: View {
	let startOfDay: Double
	let userId: String
	let normalEvents: EventMap
	let allDayEventsData: LongEventsDataMap

	var body: some View {
		let parsedDay = Date(timeIntervalSince1970: startOfDay)
		let normalEventsOnDay: [CalendarEventData] = normalEvents[startOfDay] ?? []
		let allDayEventsOnDay: SimpleLongEventsData = allDayEventsData[startOfDay] ?? SimpleLongEventsData(event: nil, count: 0)
		let isToday = Calendar.current.isDateInToday(parsedDay)

		if isToday {
			TodayCard(allDayEvents: allDayEventsOnDay, normalEventsOnDay: normalEventsOnDay, userId: userId, parsedDay: parsedDay)
		} else {
			OtherDayCard(userId: userId, date: parsedDay, allDayEventsOnDay: allDayEventsOnDay, normalEvents: normalEventsOnDay)
		}
	}
}
