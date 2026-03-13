//
//  TodayCard.swift
//  calendar
//
//  Created by Tutao GmbH on 12.03.26.
//

import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct TodayCard: View {
	var allDayEvents: SimpleLongEventsData
	var normalEventsOnDay: [CalendarEventData]
	var userId: String
	var parsedDay: Date

	var body: some View {
		let hasAllDayEvents = allDayEvents.count > 0
		Button(intent: WidgetActionsIntent(userId: userId, date: parsedDay, action: WidgetActions.agenda)) {
			Card {
				Header(allDayEvents: allDayEvents, userId: userId)
				VStack(spacing: 0) {
					if normalEventsOnDay.isEmpty && !hasAllDayEvents {
						Text("No events today").font(.system(size: Dimensions.FontSize.font_12)).padding(.bottom, Dimensions.Spacing.SM)
					} else if !normalEventsOnDay.isEmpty {
						EventsList(userId: userId, events: normalEventsOnDay).padding(.bottom, Dimensions.Spacing.SM)
					}
				}.padding(.top, -Dimensions.Spacing.XS) // moves EventsList up slightly so its alignment overlaps with the HeaderButton
			}
		}
		.buttonStyle(.plain)
	}
}
