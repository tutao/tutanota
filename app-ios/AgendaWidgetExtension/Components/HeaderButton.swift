//
//  HeaderButton.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct HeaderButton: View {
	var intent: WidgetActionsIntent
	@Environment(\.widgetRenderingMode) var renderingMode

	let image = Image(systemName: "plus")

	var body: some View {
		let imageColor = renderingMode == .accented ? Color(.onSurface) : Color(.onPrimary)
		return Button(intent: intent) { image.tinted(renderingMode: renderingMode).fontWeight(.medium).foregroundStyle(imageColor).font(.system(size: 20)) }
			.buttonStyle(.plain).frame(width: Dimensions.Size.XXL, height: Dimensions.Size.XXL).background(Color(.primary))
			.clipShape(.rect(cornerRadii: .init(topLeading: 0, bottomLeading: Dimensions.Size.XS, bottomTrailing: 0, topTrailing: Dimensions.Size.XS)))
	}
}
