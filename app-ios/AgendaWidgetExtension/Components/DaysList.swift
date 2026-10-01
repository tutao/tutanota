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
	var daysToEventsList: DaysToEventsList

	var body: some View {
		let currentCalendar: Calendar = Calendar.current
		let now = Date.now
		let startOfToday = currentCalendar.startOfDay(for: Date())

		LazyVStack(alignment: .leading, spacing: 6) {
			ForEach(Array(daysToEventsList.enumerated()), id: \.offset) { (index, dayEvents) in
				let currentDay = currentCalendar.startOfDay(for: currentCalendar.date(byAdding: .day, value: index, to: now)!)
					DayRow(currentDay: currentDay, userId: userId, events: dayEvents, index: index)
			}
		}
	}
}

private struct DayRow: View {
	let currentDay: Date
	let userId: String
	let events: [UIEvent]
	let index: Int

	var body: some View {
		let normalEventsOnDay: [UIEvent] = events.filter { !$0.isDisplayedAsAllDay }
		let allDayEventsOnDay: [UIEvent] = events.filter { $0.isDisplayedAsAllDay }
		let isToday = index == 0

		if isToday {
			TodayCard(allDayEvents: allDayEventsOnDay, normalEventsOnDay: normalEventsOnDay, userId: userId, parsedDay: currentDay)
		} else {
			if(!events.isEmpty){
				OtherDayCard(userId: userId, date: currentDay, allDayEventsOnDay: allDayEventsOnDay, normalEvents: normalEventsOnDay)
			}
		}
	}
}
