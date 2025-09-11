//
//  NoEvents.swift
//  calendar
//
//  Created by Tutao GmbH on 09.09.25.
//
import SwiftUI
import TutanotaSharedFramework
import WidgetKit

struct NoEvents: View {
	var userId: String
	var isToday: Bool
	var date: Date

	var body: some View {
		EventBody(userId: userId, happensToday: isToday, isFirstEventOfDay: true, calendarColor: UIColor(resource: .surfaceVariant), eventDate: date)
			.padding(.horizontal, Dimensions.Spacing.MD).padding(.vertical, Dimensions.Spacing.SM)
	}
}
