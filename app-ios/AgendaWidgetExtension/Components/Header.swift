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
		let hasAllDayEvents = (allDayEvents[startOfToday]?.count ?? 0) > 0
		let titleBottomPadding: CGFloat = if hasAllDayEvents { 0 } else { -4 }

		let day = String(dateComponents.day ?? 00).padStart(length: 2, char: "0")
		let weekday = DateFormatter().weekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		return HStack(alignment: .top) {
			Button(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.agenda)) {
				HStack {
					VStack(alignment: .leading, spacing: titleBottomPadding) {
						if hasAllDayEvents {
							HeaderDate(allDayEventsData: allDayEvents[startOfToday] ?? SimpleLongEventsData(event: nil, count: 0), weekday: weekday, day: day)
						} else {
							Text(day).fontWeight(.bold).font(.system(size: 32)).padding(.top, -7)
							Text(weekday).font(.system(size: 12))
						}
					}
					.foregroundStyle(Color(.onSurface))
					Spacer()
				}
			}
			.buttonStyle(.plain).padding(.leading, 12).padding(.top, 8)
			HeaderButton(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.eventEditor))
		}
	}

}
