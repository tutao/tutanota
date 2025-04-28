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
	let error: WidgetError?
}

private let NORMAL_EVENTS_PLACEHOLDER = [
	CalendarEventData(id: "ev1", summary: "Gym", startDate: date(2025, 4, 23, 9, 0, "Europe/Berlin"), endDate: date(2025, 4, 23, 10, 0, "Europe/Berlin"), calendarColor: "89cff0"),
	CalendarEventData(id: "ev2", summary: "Meeting", startDate: date(2025, 4, 23, 10, 0, "Europe/Berlin"), endDate: date(2025, 4, 23, 11, 0, "Europe/Berlin"), calendarColor: "20c4f0"),
	CalendarEventData(id: "ev3", summary: "Lunch", startDate: date(2025, 4, 23, 11, 0, "Europe/Berlin"), endDate: date(2025, 4, 23, 13, 0, "Europe/Berlin"), calendarColor: "89a83b"),
	CalendarEventData(id: "ev4", summary: "Concert w/ Mark", startDate: date(2025, 4, 23, 13, 0, "Europe/Berlin"), endDate: date(2025, 4, 23, 19, 0, "Europe/Berlin"), calendarColor: "c476fc"),
	CalendarEventData(id: "ev5", summary: "Dinner", startDate: date(2025, 4, 23, 19, 0, "Europe/Berlin"), endDate: date(2025, 4, 23, 20, 0, "Europe/Berlin"), calendarColor: "a91a2f")
]

private let ALL_DAY_EVENTS_PLACEHOLDER = [
	CalendarEventData(id: "ev0", summary: "Mark is in Town", startDate: date(2025, 4, 23, 0, 0, "Europe/Berlin"), endDate: date(2025, 4, 24, 0, 0, "Europe/Berlin"), calendarColor: "ED7D99"),
	CalendarEventData(id: "ev6", summary: "Spring Festival", startDate: date(2025, 4, 20, 9, 0, "Europe/Berlin"), endDate: date(2025, 4, 25, 10, 0, "Europe/Berlin"), calendarColor: "89cff0")
]

struct AgendaProvider: AppIntentTimelineProvider {
	func makeErrorEntry(configuration: ConfigurationAppIntent, error: WidgetErrors, stackTrace: String = "") -> SimpleEntry {
		let errorObject = WidgetError(type: error, message: error.getUserFriendlyErrorMessage(), stacktrace: stackTrace)
		return SimpleEntry(date: Date(), configuration: configuration, events: ([], []), error: errorObject)
	}

	func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
		var entries: [SimpleEntry] = []

		let currentDate = Date()
		let startOfTomorrow = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: currentDate)!)

		guard let userId = configuration.account?.id else {
			let errorEntry = makeErrorEntry(configuration: configuration, error: .missingConfiguration)
			return Timeline(entries: [errorEntry], policy: .never)
		}

		guard let calendars = configuration.calendars else { return Timeline(entries: [], policy: .never) }

		do {
			let model = try await WidgetModel(userId: userId)
			let (normalEvents, longEvents) = try await model.getEventsForCalendars(calendars, date: currentDate)
			let frameOffset = 60.0 * 15 // 60 seconds * 15 = 15 minutes

			for date in stride(from: currentDate, to: startOfTomorrow, by: frameOffset) {
				let filteredNormalEvents = normalEvents.filter { $0.endDate.timeIntervalSince1970 >= date.timeIntervalSince1970 }
				let entry = SimpleEntry(date: date, configuration: configuration, events: (filteredNormalEvents, longEvents), error: nil)
				entries.append(entry)

				if filteredNormalEvents.isEmpty { break }
			}
		} catch {
			let nsError = error as NSError
			let errorType: WidgetErrors = nsError.domain == TUT_WIDGET_ERROR ? .unexpected : .credentials

			entries = [makeErrorEntry(configuration: configuration, error: errorType, stackTrace: nsError.debugDescription)]

			printLog("Error loading events with user \(userId) for widget: \(error)")
		}

		return Timeline(entries: entries, policy: .after(startOfTomorrow))
	}

    func placeholder(in context: Context) -> SimpleEntry {
		SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), events: (NORMAL_EVENTS_PLACEHOLDER, ALL_DAY_EVENTS_PLACEHOLDER), error: nil)
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
		let events = context.isPreview ? (NORMAL_EVENTS_PLACEHOLDER, ALL_DAY_EVENTS_PLACEHOLDER) : ([], [])
		return SimpleEntry(date: Date(), configuration: configuration, events: events, error: nil)
    }
}

struct AgendaWidgetEntryView : View {
	var normalEvents: [CalendarEventData]
	var allDayEvents: [CalendarEventData]
	var error: WidgetError?
	var userId: String

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
				Text(allDayEvents.first?.summary ?? translate("TutaoNoTitleLabel", default: "<No Title>")).lineLimit(1).font(.system(size: 16))

				if (allDayEvents.count > 1) {
					Text("+\(allDayEvents.count - 1)").lineLimit(1).font(.system(size: 16)).fontWeight(.medium)
				}
			}
		}
	}

	private func EmptyList(_ isSmallView: Bool) -> some View {
		let errorImages = [
			ImageResource.widgetEmptyDog,
			ImageResource.widgetEmptyMusic
		]
		let imageIndex = Int.random(in: 0...1)

		return VStack(alignment: .center) {
			Text(translate("TutaoWidgetNoEventsMsg", default: "No Events"))
				.lineLimit(2)
				.multilineTextAlignment(.center)
				.foregroundStyle(Color(.onSurface))
				.padding([.top, .bottom], 8)

			if !isSmallView {
				Image(errorImages[imageIndex]).resizable().scaledToFit()
			}
		}.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
	}

	private func EventsList() -> some View {
		LazyVStack(alignment: .leading, spacing: 4){
			ForEach(normalEvents, id: \.id){ event in
				let calendarColor = UIColor(hex: event.calendarColor) ?? .white
				Button(intent:  WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.eventDetails, eventId: event.id)) {
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
				}.buttonStyle(.plain)
			}
		}
	}

	private func Header() -> some View {
		let hasAllDayEvents = !allDayEvents.isEmpty
		let titleBottomPadding: CGFloat = if (hasAllDayEvents) {0} else {-8}

		let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: Date())
		let day = String(dateComponents.day ?? 0)
		let weekday = DateFormatter().weekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		return HStack(alignment: .top) {
			Button(intent:  WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.agenda)) {
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
			Button(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.eventEditor)) {
				Image(systemName: "plus").fontWeight(.medium).foregroundStyle(Color(.onPrimary)).font(.system(size: 20))
			}.buttonStyle(.plain).frame(width: 44, height: 44).background(Color(.primary)).clipShape(.rect(cornerRadii: .init(topLeading: 8,bottomLeading: 8,bottomTrailing: 8,topTrailing: 8)))
		}
	}

	@Environment(\.widgetFamily) var family
	var body: some View {
		GeometryReader { _ in
			VStack {
				if let err = error {
					ErrorBody(error: err)
				} else {
					Header()

					if normalEvents.isEmpty {
						EmptyList(family == .systemMedium)
					} else {
						EventsList()
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
			entry in
				let userId = entry.configuration.account?.id ?? ""
				return AgendaWidgetEntryView(normalEvents: entry.events.0, allDayEvents: entry.events.1, error: entry.error, userId: userId)
		}
		.configurationDisplayName("Agenda")
		.description(translate("TutaoWidgetDescription", default: "Show today's upcoming events"))
		.supportedFamilies([.systemMedium, .systemLarge, .systemExtraLarge])
    }
}

#Preview("With All Day Event", as: .systemLarge, widget: { AgendaWidget() }, timeline: {
	SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), events: (NORMAL_EVENTS_PLACEHOLDER, ALL_DAY_EVENTS_PLACEHOLDER), error: nil)
})

#Preview("Without All Day Event", as: .systemLarge, widget: { AgendaWidget() }, timeline: {
	SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), events: (NORMAL_EVENTS_PLACEHOLDER, ALL_DAY_EVENTS_PLACEHOLDER), error: nil)
})
