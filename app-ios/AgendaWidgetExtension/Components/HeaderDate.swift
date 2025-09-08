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
		Group {
			Text(day + " " + weekday).fontWeight(.bold).font(.system(size: 20)).padding(.top, -4)
			AllDayEventRow(allDayEventsData: allDayEventsData, textColor: nil)
		}
	}
}
