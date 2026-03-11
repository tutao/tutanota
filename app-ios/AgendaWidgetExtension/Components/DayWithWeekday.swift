//
//  DayWithWeekday.swift
//  calendar
//
//  Created by Tutao GmbH on 11.03.26.
//

import AppIntents
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct DayWithWeekday: View {
	var date: Date

	var body: some View {
		let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: date)
		let day = String(dateComponents.day ?? 00).padStart(length: 2, char: "0")
		let weekday = DateFormatter().shortWeekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		HStack(alignment: VerticalAlignment.center) {
			VStack(alignment: .center) {
				Text(day).font(.system(size: Dimensions.FontSize.font_20, weight: .bold))
				Text(weekday).font(.system(size: Dimensions.FontSize.font_12, weight: .regular)).lineLimit(1)
			}
		}
		.padding(.leading, Dimensions.Spacing.MD)  // left padding must be the same everywhere for vertical alignment
	}
}
