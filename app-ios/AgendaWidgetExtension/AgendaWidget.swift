//
//  AgendaWidget.swift
//  AgendaWidget
//
//  Created by Tutao GmbH on 15.04.25.
//

import WidgetKit
import SwiftUI

struct Provider: AppIntentTimelineProvider {
	func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
		var entries: [SimpleEntry] = []

		let currentDate = Date()
		for hourOffset in 0 ..< 5 {
			let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
			let entry = SimpleEntry(date: entryDate, configuration: ConfigurationAppIntent())
			entries.append(entry)
		}

		return Timeline(entries: entries, policy: .atEnd)
	}

    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: ConfigurationAppIntent())
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: configuration)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
}

struct AgendaWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        VStack {
            Text("Time:")
            Text(entry.date, style: .time)

            Text("Favorite Emoji:")
            Text(entry.configuration.favoriteEmoji)
		}.containerBackground(for: .widget) { Color.clear }
    }
}

struct AgendaWidget: Widget {
    let kind: String = "AgendaWidget"

    var body: some WidgetConfiguration {
		AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) {
			entry in AgendaWidgetEntryView(entry: entry)
		}
		.configurationDisplayName("Agenda")
		.description("See the upcoming events for the current day")
		.supportedFamilies([.systemLarge])
    }
}

extension ConfigurationAppIntent {
    fileprivate static var smiley: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "😀"
        return intent
    }
    
    fileprivate static var starEyes: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "🤩"
        return intent
    }
}

#Preview("", as: .systemLarge, widget: { AgendaWidget() }, timeline: {
	SimpleEntry(date: Date(), configuration: ConfigurationAppIntent())
})
