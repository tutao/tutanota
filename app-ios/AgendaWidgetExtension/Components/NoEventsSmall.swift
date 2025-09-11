//
//  NoEventsToday.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct NoEventsSmall: View {
	var body: some View {
		HStack(alignment: .center) {
			Text(translate("TutaoWidgetNoEventsMsg", default: "No events")).lineLimit(2).multilineTextAlignment(.center).foregroundStyle(Color(.onSurface))
				.padding([.top, .bottom], Dimensions.Spacing.SM).fontWeight(.bold).font(.system(size: 14))
		}
		.frame(maxWidth: .infinity, alignment: .center)
	}
}
