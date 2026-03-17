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
			AllDayEventRow(allDayEventsData: allDayEventsData, textColor: Color(.onSurfaceVariant)).padding(.vertical, Dimensions.Spacing.space_4)
				.padding(.horizontal, Dimensions.Spacing.space_12)
		}
		.frame(maxWidth: .infinity, alignment: .leading).background(Color(.surfaceVariant))
	}
}
