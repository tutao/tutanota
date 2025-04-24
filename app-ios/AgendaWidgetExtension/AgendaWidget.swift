//
//  AgendaWidget.swift
//  AgendaWidget
//
//  Created by Tutao GmbH on 15.04.25.
//

import WidgetKit
import SwiftUI
import TutanotaSharedFramework
import tutasdk

struct SimpleEntry: TimelineEntry {
	let date: Date
	let configuration: ConfigurationAppIntent
	let events: ([CalendarEventData], [CalendarEventData])
	let errors: [String]
}

struct AgendaProvider: AppIntentTimelineProvider {
	func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
		var entries: [SimpleEntry] = []

		let currentDate = Date()
		let startOfTomorrow = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: currentDate)!)

		// FIXE Add an entry with missing acount error
		guard let userId = configuration.account?.id else { return Timeline(entries: [], policy: .never) }
		guard let calendars = configuration.calendars else { return Timeline(entries: [], policy: .never) }

		do {
			let model = try await WidgetModel(userId: userId)
			let (normalEvents, longEvents) = try await model.getEventsForCalendars(calendars, date: currentDate)
			let frameOffset = 60.0 * 15 // 60 seconds * 15 = 15 minutes

			for date in stride(from: currentDate, to: startOfTomorrow, by: frameOffset) {
				let filteredNormalEvents = normalEvents.filter { $0.endDate.timeIntervalSince1970 >= date.timeIntervalSince1970 }
				let entry = SimpleEntry(date: date, configuration: configuration, events: (filteredNormalEvents, longEvents), errors: [])
				entries.append(entry)

				if filteredNormalEvents.isEmpty { break }
			}
		} catch {
			// FIXE Clear entries and add one with error
			TUTSLog("Error loading events with user \(userId) for widget: \(error)")
		}

		return Timeline(entries: entries, policy: .after(startOfTomorrow))
	}

    func placeholder(in context: Context) -> SimpleEntry {
		SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), events: ([], []), errors: [])
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
		SimpleEntry(date: Date(), configuration: configuration, events: ([], []), errors: [])
    }
}

struct AgendaWidgetEntryView : View {
	var normalEvents: [CalendarEventData]
	var allDayEvents: [CalendarEventData]

	private let eventTimeFormatter: DateFormatter = {
			let formatter = DateFormatter()
			formatter.dateStyle = .none
			formatter.timeStyle = .short
			return formatter
	}()

	private func AllDayHeader(allDayEvents: [CalendarEventData], weekday: String, day: String) -> some View {
		let allDayBackgroundColor: UIColor = UIColor(hex: allDayEvents.first?.calendarColor ?? DEFAULT_CALENDAR_COLOR) ?? UIColor(.primary)
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
		let hasAllDayEvents = !allDayEvents.isEmpty
		let titleBottomPadding: CGFloat = if (hasAllDayEvents) {0} else {-8}

		let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: Date())

		let day = String(dateComponents.day ?? 0)
		let weekday = DateFormatter().weekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		GeometryReader { _ in
			VStack {
				HStack(alignment: .top) {
					Button(intent:  WidgetActionsIntent(userId: "OL-HZQV----4", date: Date(), action: WidgetActions.agenda)) {
						HStack {
							VStack(alignment: .leading, spacing: titleBottomPadding) {
								if(hasAllDayEvents) {
									AllDayHeader(allDayEvents: allDayEvents, weekday: weekday, day: day)
								} else {
									Text(day).fontWeight(.bold).font(.system(size: 40)).padding(.top, -9)
									Text(weekday).font(.system(size: 16))
								}
							}.foregroundStyle(Color(.onSurface))
							Spacer()
						}
					}.buttonStyle(.plain)
					Button(intent: WidgetActionsIntent(userId: "OL-HZQV----4", date: Date(), action: WidgetActions.eventEditor)) {
						Image(systemName: "plus").fontWeight(.medium).foregroundStyle(Color(.onPrimary)).font(.system(size: 20))
					}.buttonStyle(.plain).frame(width: 44, height: 44).background(Color(.primary)).clipShape(.rect(cornerRadii: .init(topLeading: 8,bottomLeading: 8,bottomTrailing: 8,topTrailing: 8)))
				}
				LazyVStack(alignment: .leading, spacing: 4){
					ForEach(normalEvents, id: \.id){ event in
						let calendarColor = UIColor(hex: event.calendarColor) ?? .white
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
			entry in AgendaWidgetEntryView(normalEvents: entry.events.0, allDayEvents: entry.events.1)
		}
		.configurationDisplayName("Agenda")
		.description("See the upcoming events for the current day")
		.supportedFamilies([.systemMedium, .systemLarge, .systemExtraLarge])
    }
}

#Preview("With All Day Event", as: .systemLarge, widget: { AgendaWidget() }, timeline: {
	let timeZone = "Etc/GMT"

	SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), events: ([
		CalendarEventData(id: "ev1", summary: "Gym", startDate: date(2025, 4, 23, 9, 0, timeZone), endDate: date(2025, 4, 23, 10, 0, timeZone), calendarColor: "89cff0"),
		CalendarEventData(id: "ev2", summary: "Meeting", startDate: date(2025, 4, 23, 10, 0, timeZone), endDate: date(2025, 4, 23, 11, 0, timeZone), calendarColor: "20c4f0"),
		CalendarEventData(id: "ev3", summary: "Lunch", startDate: date(2025, 4, 23, 11, 0, timeZone), endDate: date(2025, 4, 23, 13, 0, timeZone), calendarColor: "89a83b"),
		CalendarEventData(id: "ev4", summary: "Concert w/ Mark", startDate: date(2025, 4, 23, 13, 0, timeZone), endDate: date(2025, 4, 23, 19, 0, timeZone), calendarColor: "c476fc"),
		CalendarEventData(id: "ev5", summary: "Dinner", startDate: date(2025, 4, 23, 19, 0, timeZone), endDate: date(2025, 4, 23, 20, 0, timeZone), calendarColor: "a91a2f")
	], [CalendarEventData(id: "ev0", summary: "Mark is in Town", startDate: date(2025, 4, 23, 0, 0, timeZone), endDate: date(2025, 4, 24, 0, 0, timeZone), calendarColor: "ED7D99"), CalendarEventData(id: "ev6", summary: "Spring Festival", startDate: date(2025, 4, 20, 9, 0, timeZone), endDate: date(2025, 4, 25, 10, 0, timeZone), calendarColor: "89cff0")]), errors: [])
})

#Preview("Without All Day Event", as: .systemLarge, widget: { AgendaWidget() }, timeline: {
	let timeZone = "Etc/GMT"

	SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), events: ([
		CalendarEventData(id: "ev0", summary: "Gym", startDate: date(2025, 4, 23, 9, 0, timeZone), endDate: date(2025, 4, 23, 10, 0, timeZone), calendarColor: "89cff0"),
		CalendarEventData(id: "ev1", summary: "Meeting", startDate: date(2025, 4, 23, 10, 0, timeZone), endDate: date(2025, 4, 23, 11, 0, timeZone), calendarColor: "20c4f0"),
		CalendarEventData(id: "ev2", summary: "Lunch", startDate: date(2025, 4, 23, 11, 0, timeZone), endDate: date(2025, 4, 23, 13, 0, timeZone), calendarColor: "89a83b"),
		CalendarEventData(id: "ev3", summary: "Concert w/ Mark", startDate: date(2025, 4, 23, 13, 0, timeZone), endDate: date(2025, 4, 23, 19, 0, timeZone), calendarColor: "c476fc"),
		CalendarEventData(id: "ev4", summary: "Dinner", startDate: date(2025, 4, 23, 19, 0, timeZone), endDate: date(2025, 4, 23, 20, 0, timeZone), calendarColor: "a91a2f")
	], []), errors: [])
})
