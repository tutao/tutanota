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
				if normalEventsOnDay.isEmpty && !hasAllDayEvents {
					Text(translate("TutaoWidgetNoEventsTodayMsg", default: "No events today")).font(.system(size: Dimensions.FontSize.font_12))
						.padding(.bottom, Dimensions.Spacing.space_8).padding(.top, -Dimensions.Spacing.space_12)
				} else {
					VStack(alignment: .leading, spacing: 0) {
						if hasAllDayEvents {
							AllDayEventRow(allDayEventsData: allDayEvents).padding(.bottom, Dimensions.Spacing.space_8)
								.padding(.trailing, Dimensions.Size.core_48)
						}
						if !normalEventsOnDay.isEmpty {
							EventsList(userId: userId, events: normalEventsOnDay, applyPaddingEndForFirstElement: !hasAllDayEvents)
								.padding(.bottom, Dimensions.Spacing.space_8)
						}
					}
					.padding(.top, -Dimensions.Spacing.space_12).padding(.leading, Dimensions.Spacing.space_12)
					// moves EventsList up slightly so its alignment overlaps with the HeaderButton
				}
			}
		}
		.buttonStyle(.plain)
	}
}
