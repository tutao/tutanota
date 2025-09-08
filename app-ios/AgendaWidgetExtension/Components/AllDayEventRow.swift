//
//  AllDayEventRow.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//

import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct AllDayEventRow: View {
	var allDayEventsData: SimpleLongEventsData
	var textColor: Color?
	var body: some View {
		let (allDayImage, allDayPadding): (ImageResource, CGFloat) =
			if let firstEvent = allDayEventsData.event, firstEvent.isBirthdayEvent { (.giftIcon, 4) } else { (.allDayIcon, 2) }
		let eventTitle: String =
			if let title: String = allDayEventsData.event?.summary, !title.isEmpty { allDayEventsData.event!.summary } else {
				translate("TutaoNoTitleLabel", default: "<No Title>")
			}
		let backgroundColor: UIColor = UIColor(hex: allDayEventsData.event?.calendarColor ?? DEFAULT_CALENDAR_COLOR) ?? UIColor(.primary)
		let foregroundColor: Color = if backgroundColor.getLuminance() > 0.5 { .black } else { .white }

		return HStack(alignment: .center, spacing: 4) {
			Image(allDayImage).foregroundStyle(foregroundColor).font(.system(size: 14)).padding(allDayPadding).background(Color(backgroundColor.cgColor))
				.clipShape(.rect(cornerRadii: .init(topLeading: 12, bottomLeading: 12, bottomTrailing: 12, topTrailing: 12)))
			Text(eventTitle).lineLimit(1).font(.system(size: 12)).if(textColor != nil) { $0.foregroundStyle(textColor!) }

			if allDayEventsData.count > 1 {
				Text("+\(allDayEventsData.count - 1)").lineLimit(1).font(.system(size: 12)).fontWeight(.medium)
					.if(textColor != nil) { $0.foregroundStyle(textColor!) }
			}
		}
	}
}
