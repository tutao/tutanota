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
			if let firstEvent = allDayEventsData.event, firstEvent.isBirthdayEvent { (.giftIcon, Dimensions.Spacing.XS / 2) } else {
				(.allDayIcon, Dimensions.Spacing.XS / 2)
			}
		let eventTitle: String =
			if let title: String = allDayEventsData.event?.summary, !title.isEmpty { allDayEventsData.event!.summary } else {
				translate("TutaoNoTitleLabel", default: "<No Title>")
			}
		let backgroundColor: UIColor = UIColor(hex: allDayEventsData.event?.calendarColor ?? DEFAULT_CALENDAR_COLOR) ?? UIColor(.primary)
		let foregroundColor: Color = if backgroundColor.getLuminance() > 0.5 { .black } else { .white }

		return HStack() {
			Image(allDayImage).resizable().frame(width: Dimensions.Size.XS, height: Dimensions.Size.XS).foregroundStyle(foregroundColor).padding(allDayPadding)
				.background(Color(backgroundColor.cgColor)).clipShape(.rect(cornerRadius: Dimensions.Size.SM))
			Text(eventTitle).lineLimit(1).font(.system(size: Dimensions.FontSize.font_12)).if(textColor != nil) { $0.foregroundStyle(textColor!) }

			if allDayEventsData.count > 1 {
				Text("+\(allDayEventsData.count - 1)").lineLimit(1).font(.system(size: Dimensions.FontSize.font_12)).fontWeight(.medium)
					.if(textColor != nil) { $0.foregroundStyle(textColor!) }
			}
		}
	}
}
