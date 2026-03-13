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
	var allDayEvents: SimpleLongEventsData
	var userId: String
	let startOfToday = Calendar.current.startOfDay(for: Date()).timeIntervalSince1970
	let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: Date())
	var body: some View {
		let hasAllDayEventsToday = allDayEvents.count > 0
		let day = String(dateComponents.day ?? 00).padStart(length: 2, char: "0")
		let weekday = DateFormatter().weekdaySymbols[(dateComponents.weekday ?? 0) - 1]
		return HStack(alignment: .top) {
			Button(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.agenda)) {
				VStack(alignment: .leading, spacing: 0) {
						Text(day + " " + weekday).lineLimit(1).fontWeight(.bold).font(.system(size: Dimensions.FontSize.font_20))
					if hasAllDayEventsToday { AllDayEventRow(allDayEventsData: allDayEvents).padding(.bottom, Dimensions.Spacing.SM).padding(.leading, 2) }
				}.padding(.leading, Dimensions.Spacing.SM).padding(.top, Dimensions.Spacing.SM)
				.buttonStyle(.plain)
			}
			Spacer()
			HeaderButton(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.eventEditor))
		}.buttonStyle(.plain)
	}
}
