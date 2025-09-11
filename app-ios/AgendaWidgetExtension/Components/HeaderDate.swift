//
//  AllDayHeader.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct HeaderDate: View {
	var allDayEventsData: SimpleLongEventsData
	var weekday: String
	var day: String
	var body: some View {
		VStack(alignment: .leading, spacing: Dimensions.Spacing.XS / 2) {
			Text(day + " " + weekday).lineLimit(1).fontWeight(.bold).font(.system(size: 20)).padding(.top, -Dimensions.Spacing.XS)
			AllDayEventRow(allDayEventsData: allDayEventsData, textColor: nil)
		}
	}
}
