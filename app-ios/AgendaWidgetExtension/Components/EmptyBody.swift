//
//  EmptyBody.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import AppIntents
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct EmptyBody: View {
	var widgetHeight: CGFloat
	var family: WidgetFamily
	private let emptyImages = [ImageResource.widgetEmptyMusic, ImageResource.widgetEmptyDog]

	var body: some View {
		let imageIndex = Int.random(in: 0...1)
		return VStack(alignment: .center) {
			Text(translate("TutaoWidgetNoEventsMsg", default: "No events")).lineLimit(2).multilineTextAlignment(.center).foregroundStyle(Color(.onSurface))
				.padding([.top, .bottom], 8)

			if family != WidgetFamily.systemMedium { Image(emptyImages[imageIndex]).resizable().scaledToFit() }
		}
		.frame(height: family != WidgetFamily.systemMedium ? widgetHeight * 0.675 : widgetHeight * 0.525).frame(alignment: .center)
	}
}
