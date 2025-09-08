//
//  AllDayHeader.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct AllDayHeader: View {
	var allDayEventsData: SimpleLongEventsData

	var body: some View {
		HStack(alignment: .center) {
			AllDayEventRow(allDayEventsData: allDayEventsData, textColor: Color(.onSurfaceVariant)).padding(.vertical, 8).padding(.horizontal, 12)
		}
		.frame(maxWidth: .infinity, alignment: .leading).background(Color(.surfaceVariant))
		.clipShape(.rect(cornerRadii: .init(topLeading: 8, bottomLeading: 0, bottomTrailing: 0, topTrailing: 8)))
	}
}
