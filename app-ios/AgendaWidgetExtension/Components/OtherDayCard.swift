//
//  OtherDayCard.swift
//  calendar
//
//  Created by Tutao GmbH on 12.03.26.
//

import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct OtherDayCard: View {
	var userId: String
	var date: Date
	var allDayEventsOnDay: SimpleLongEventsData
	var normalEvents: [CalendarEventData]

	var body: some View {
		let hasAllDayEvents = allDayEventsOnDay.count > 0
		Button(intent: WidgetActionsIntent(userId: userId, date: date, action: WidgetActions.agenda)) {
			Card {
				if normalEvents.isEmpty {
					HStack(alignment: .center, spacing: Dimensions.Spacing.space_12) {
						DayWithWeekday(date: date)
						AllDayEventRow(allDayEventsData: allDayEventsOnDay)
					}
					.padding(.vertical, Dimensions.Spacing.space_4)
				} else {
					if hasAllDayEvents && !normalEvents.isEmpty { AllDayHeader(allDayEventsData: allDayEventsOnDay) }
					HStack(alignment: .top) {
						DayWithWeekday(date: date).padding(.top, Dimensions.Spacing.space_4)
						EventsList(userId: userId, events: normalEvents).padding(.vertical, Dimensions.Spacing.space_8)
					}
				}
			}
		}
		.buttonStyle(.plain)
	}
}
