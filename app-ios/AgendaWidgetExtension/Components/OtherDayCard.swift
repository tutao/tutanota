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
				if normalEvents.isEmpty && hasAllDayEvents {
					HStack(alignment: VerticalAlignment.center, spacing: Dimensions.Spacing.SM) {
						DayWithWeekday(date: date)
						AllDayEventRow(allDayEventsData: allDayEventsOnDay)
					}
					.padding(.horizontal, Dimensions.Spacing.MD).padding(.vertical, Dimensions.Spacing.SM)

				} else {
					if hasAllDayEvents { AllDayHeader(allDayEventsData: allDayEventsOnDay) }
					EventsList(userId: userId, events: normalEvents, displayDate: date).padding(.vertical, Dimensions.Spacing.SM)
				}
			}
		}
		.buttonStyle(.plain)
	}
}
