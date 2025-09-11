//
//  Card.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct Card<Content: View>: View {
	@ViewBuilder var children: () -> Content

	var body: some View {
		VStack(spacing: 0) { children() }.frame(maxWidth: .infinity, alignment: .leading).background(Color(.surface))
			.clipShape(.rect(cornerRadius: Dimensions.Size.XS))
	}
}
