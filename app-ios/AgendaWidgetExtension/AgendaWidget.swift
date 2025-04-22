//
//  AgendaWidget.swift
//  AgendaWidget
//
//  Created by Tutao GmbH on 15.04.25.
//

import WidgetKit
import SwiftUI
import TutanotaSharedFramework

struct CalendarEventData {
	var id: String
	var summary: String
	var startDate: Date
	var endDate: Date
	var calendarColor: String
}

struct SimpleEntry: TimelineEntry {
	let date: Date
	let configuration: ConfigurationAppIntent
	let events: [CalendarEventData]
}

struct AgendaProvider: AppIntentTimelineProvider {
	func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
		let timeZone = "Etc/GMT"
		var entries: [SimpleEntry] = []

		let currentDate = Date()
		for hourOffset in 0 ..< 5 {
			let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
			let entry = SimpleEntry(date: entryDate, configuration: configuration, events: [
		  CalendarEventData(id: "ev1", summary: "Gym", startDate: date(2025, 4, 23, 9, 0, timeZone), endDate: date(2025, 4, 23, 10, 0, timeZone), calendarColor: "89cff0"),
		  CalendarEventData(id: "ev2", summary: "Meeting", startDate: date(2025, 4, 23, 10, 0, timeZone), endDate: date(2025, 4, 23, 11, 0, timeZone), calendarColor: "20c4f0"),
		  CalendarEventData(id: "ev3", summary: "Lunch", startDate: date(2025, 4, 23, 11, 0, timeZone), endDate: date(2025, 4, 23, 13, 0, timeZone), calendarColor: "89a83b"),
		  CalendarEventData(id: "ev4", summary: "Concert w/ Mark", startDate: date(2025, 4, 23, 13, 0, timeZone), endDate: date(2025, 4, 23, 19, 0, timeZone), calendarColor: "c476fc"),
		  CalendarEventData(id: "ev5", summary: "Dinner", startDate: date(2025, 4, 23, 19, 0, timeZone), endDate: date(2025, 4, 23, 20, 0, timeZone), calendarColor: "a91a2f")
	  ])
			entries.append(entry)
		}

		return Timeline(entries: entries, policy: .atEnd)
	}

    func placeholder(in context: Context) -> SimpleEntry {
		SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), events: [])
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
		SimpleEntry(date: Date(), configuration: configuration, events: [])
    }
}

struct AgendaWidgetEntryView : View {
	var events: [CalendarEventData]

	private let eventTimeFormatter: DateFormatter = {
			let formatter = DateFormatter()
			formatter.dateStyle = .none
			formatter.timeStyle = .short
			return formatter
	}()

	private func isAllDayEventToday(_ event: CalendarEventData) -> Bool {
		let eventStartDate = event.startDate
		let eventEndDate = event.endDate

		return isAllDayEvent(startDate: eventStartDate, endDate: eventEndDate) || isAllDayOnReferenceDate(startDate: eventStartDate, endDate: eventEndDate, referenceDate: Date())
	}

	private func extractNonAndAllDayEvents(events: [CalendarEventData]) -> ([CalendarEventData],
																			[CalendarEventData]) {
		var allDayEvents: [CalendarEventData] = []
		var nonAllDayEvents: [CalendarEventData] = []

		events.forEach {
			if isAllDayEventToday($0) { allDayEvents.append($0) }
			else { nonAllDayEvents.append($0) }
		}

		return (nonAllDayEvents, allDayEvents)
	}

	private func AllDayHeader(allDayEvents: [CalendarEventData], weekday: String, day: String) -> some View {
		let allDayBackgroundColor: UIColor = UIColor(hex: allDayEvents.first?.calendarColor ?? "#013E85") ?? UIColor(.primary)
		let foregroundColor: Color = if allDayBackgroundColor.getLuminance() > 0.5 { .black } else { .white }

		return Group {
			Text(weekday + " " + day).fontWeight(.bold).font(.system(size: 24)).padding(.top, -4)
			HStack(alignment: .center, spacing: 4) {
				Image(.allDayIcon).foregroundStyle(foregroundColor).padding(2).background(Color(allDayBackgroundColor.cgColor)).clipShape(.rect(cornerRadii: .init(topLeading: 12, bottomLeading: 12, bottomTrailing: 12, topTrailing: 12)))
				// FIXME Add translation
				Text(allDayEvents.first?.summary ?? "<No Title>").lineLimit(1).font(.system(size: 16))

				if (allDayEvents.count > 1) {
					Text("+\(allDayEvents.count - 1)").lineLimit(1).font(.system(size: 16)).fontWeight(.medium)
				}
			}
		}
	}

	var body: some View {
		let (nonAllDayEvents, allDayEvents) = extractNonAndAllDayEvents(events: events)
		let hasAllDayEvents = !allDayEvents.isEmpty
		let titleBottomPadding: CGFloat = if (hasAllDayEvents) {0} else {-8}

		let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: Date())

		let day = String(dateComponents.day ?? 0)
		let weekday = DateFormatter().weekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		GeometryReader { _ in
			VStack {
				HStack(alignment: .top) {
					VStack(alignment: .leading, spacing: titleBottomPadding) {
						if(hasAllDayEvents) {
							AllDayHeader(allDayEvents: allDayEvents, weekday: weekday, day: day)
						} else {
							Text(day).fontWeight(.bold).font(.system(size: 40)).padding(.top, -9)
							Text(weekday).font(.system(size: 16))
						}
					}.foregroundStyle(Color(.onSurface))
					Spacer()
					Button(action: {}){
						Image(systemName: "plus").fontWeight(.medium).foregroundStyle(Color(.onPrimary)).font(.system(size: 20))
					}.buttonStyle(.plain).frame(width: 44, height: 44).background(Color(.primary)).clipShape(.rect(cornerRadii: .init(topLeading: 8,bottomLeading: 8,bottomTrailing: 8,topTrailing: 8)))
				}
				LazyVStack(alignment: .leading, spacing: 4){
					ForEach(nonAllDayEvents, id: \.id){ event in
						let calendarColor = UIColor(hex: "#" + event.calendarColor) ?? .white
						VStack {
							HStack {
								VStack{
									Circle().fill(Color(calendarColor.cgColor)).frame(width: 20, height: 20)
								}
								VStack(alignment: .leading){
									Text(event.summary).fontWeight(.bold)
									Text(eventTimeFormatter.string(from: event.startDate) + " - " + eventTimeFormatter.string(from: event.endDate)).font(.system(size: 14))
								}.foregroundStyle(Color(.onSurface))
							}.padding(8)
						}.frame(maxWidth: .infinity, alignment: .leading).background(Color(.surface)).clipShape(.rect(cornerRadii: .init(topLeading: 8,bottomLeading: 8,bottomTrailing: 8,topTrailing: 8)))
					}
				}
			}.frame(maxHeight: .infinity, alignment: .top)
		}.containerBackground(for: .widget) { Color(.background) }
	}
}

struct AgendaWidget: Widget {
    let kind: String = "AgendaWidget"

    var body: some WidgetConfiguration {
		AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: AgendaProvider()) {
			entry in AgendaWidgetEntryView(events: entry.events)
		}
		.configurationDisplayName("Agenda")
		.description("See the upcoming events for the current day")
		.supportedFamilies([.systemMedium, .systemLarge, .systemExtraLarge])
    }
}

#Preview("With All Day Event", as: .systemLarge, widget: { AgendaWidget() }, timeline: {
	let timeZone = "Etc/GMT"

	SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), events: [
		CalendarEventData(id: "ev0", summary: "Mark is in Town", startDate: date(2025, 4, 23, 0, 0, timeZone), endDate: date(2025, 4, 24, 0, 0, timeZone), calendarColor: "ED7D99"),
		CalendarEventData(id: "ev1", summary: "Gym", startDate: date(2025, 4, 23, 9, 0, timeZone), endDate: date(2025, 4, 23, 10, 0, timeZone), calendarColor: "89cff0"),
		CalendarEventData(id: "ev2", summary: "Meeting", startDate: date(2025, 4, 23, 10, 0, timeZone), endDate: date(2025, 4, 23, 11, 0, timeZone), calendarColor: "20c4f0"),
		CalendarEventData(id: "ev3", summary: "Lunch", startDate: date(2025, 4, 23, 11, 0, timeZone), endDate: date(2025, 4, 23, 13, 0, timeZone), calendarColor: "89a83b"),
		CalendarEventData(id: "ev4", summary: "Concert w/ Mark", startDate: date(2025, 4, 23, 13, 0, timeZone), endDate: date(2025, 4, 23, 19, 0, timeZone), calendarColor: "c476fc"),
		CalendarEventData(id: "ev5", summary: "Dinner", startDate: date(2025, 4, 23, 19, 0, timeZone), endDate: date(2025, 4, 23, 20, 0, timeZone), calendarColor: "a91a2f"),
		CalendarEventData(id: "ev6", summary: "Spring Festival", startDate: date(2025, 4, 20, 9, 0, timeZone), endDate: date(2025, 4, 25, 10, 0, timeZone), calendarColor: "89cff0")
	])
})

#Preview("Without All Day Event", as: .systemLarge, widget: { AgendaWidget() }, timeline: {
	let timeZone = "Etc/GMT"

	SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), events: [
		CalendarEventData(id: "ev1", summary: "Gym", startDate: date(2025, 4, 23, 9, 0, timeZone), endDate: date(2025, 4, 23, 10, 0, timeZone), calendarColor: "89cff0"),
		CalendarEventData(id: "ev2", summary: "Meeting", startDate: date(2025, 4, 23, 10, 0, timeZone), endDate: date(2025, 4, 23, 11, 0, timeZone), calendarColor: "20c4f0"),
		CalendarEventData(id: "ev3", summary: "Lunch", startDate: date(2025, 4, 23, 11, 0, timeZone), endDate: date(2025, 4, 23, 13, 0, timeZone), calendarColor: "89a83b"),
		CalendarEventData(id: "ev4", summary: "Concert w/ Mark", startDate: date(2025, 4, 23, 13, 0, timeZone), endDate: date(2025, 4, 23, 19, 0, timeZone), calendarColor: "c476fc"),
		CalendarEventData(id: "ev5", summary: "Dinner", startDate: date(2025, 4, 23, 19, 0, timeZone), endDate: date(2025, 4, 23, 20, 0, timeZone), calendarColor: "a91a2f")
	])
})
