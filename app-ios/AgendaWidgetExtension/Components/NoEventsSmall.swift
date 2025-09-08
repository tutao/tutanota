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
			Text(translate("TutaoWidgetNoEventsTodayMsg", default: "No upcoming events today")).lineLimit(2).multilineTextAlignment(.center)
				.foregroundStyle(Color(.onSurface)).padding([.top, .bottom], 8)
		}
		.frame(maxWidth: .infinity, alignment: .center)
	}
}
