//
//  Header.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct Header: View {
	var allDayEvents: LongEventsDataMap
	var userId: String
	let startOfToday = Calendar.current.startOfDay(for: Date()).timeIntervalSince1970
	let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: Date())

	var body: some View {
		let hasAllDayEventsToday = (allDayEvents[startOfToday]?.count ?? 0) > 0
		let day = String(dateComponents.day ?? 00).padStart(length: 2, char: "0")
		let weekday = DateFormatter().weekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		return HStack(alignment: .top) {
			Button(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.agenda)) {
				HStack {
					VStack(alignment: .leading, spacing: Dimensions.Spacing.XS / 2) {
						Text(day + " " + weekday).lineLimit(1).fontWeight(.bold).font(.system(size: 20))
						if(hasAllDayEventsToday){
							AllDayEventRow(allDayEventsData: allDayEvents[startOfToday]!).padding(.bottom, Dimensions.Spacing.SM)	}
					}
					Spacer()
				}
			}
			.buttonStyle(.plain).padding(.top, Dimensions.Spacing.SM)
			HeaderButton(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.eventEditor))
		}.padding(.leading, Dimensions.Spacing.MD)
	}
}
