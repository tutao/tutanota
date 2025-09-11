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
			AllDayEventRow(allDayEventsData: allDayEventsData, textColor: Color(.onSurfaceVariant)).padding(.vertical, Dimensions.Spacing.XS)
				.padding(.horizontal, Dimensions.Spacing.MD)
		}
		.frame(maxWidth: .infinity, alignment: .leading).background(Color(.surfaceVariant))
	}
}
