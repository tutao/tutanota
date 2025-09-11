//
//  AgendaWidget.swift
//  AgendaWidget
//
//  Created by Tutao GmbH on 15.04.25.
//

import SwiftUI
import TutanotaSharedFramework
import WidgetKit
import tutasdk

struct WidgetEntry: TimelineEntry {
	let date: Date
	let configuration: ConfigurationAppIntent
	let events: (EventMap, LongEventsDataMap)
	let error: WidgetError?
}

private let startOfToday = Calendar.current.startOfDay(for: Date.now).timeIntervalSince1970
private let startOfTomorrow = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: Date.now)!).timeIntervalSince1970
private let startOfAfterTomorrow = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 2, to: Date.now)!).timeIntervalSince1970

private let NORMAL_EVENTS_PLACEHOLDER = [
	startOfToday: [
		CalendarEventData(
			id: "ev1",
			summary: "Gym",
			startDate: date(2025, 4, 22, 9, 0, "Europe/Berlin"),
			endDate: date(2025, 4, 22, 10, 0, "Europe/Berlin"),
			calendarColor: "89cff0",
			isBirthdayEvent: false
		),
		CalendarEventData(
			id: "ev2",
			summary: "Meeting",
			startDate: date(2025, 4, 22, 10, 0, "Europe/Berlin"),
			endDate: date(2025, 4, 22, 11, 0, "Europe/Berlin"),
			calendarColor: "20c4f0",
			isBirthdayEvent: false
		),
	],
	startOfTomorrow: [
		CalendarEventData(
			id: "ev3",
			summary: "Lunch",
			startDate: date(2025, 4, 23, 11, 0, "Europe/Berlin"),
			endDate: date(2025, 4, 23, 13, 0, "Europe/Berlin"),
			calendarColor: "89a83b",
			isBirthdayEvent: false
		)
	],
	startOfAfterTomorrow: [
		CalendarEventData(
			id: "ev4",
			summary: "Concert w/ Mark",
			startDate: date(2025, 4, 24, 13, 0, "Europe/Berlin"),
			endDate: date(2025, 4, 24, 19, 0, "Europe/Berlin"),
			calendarColor: "c476fc",
			isBirthdayEvent: false
		),
		CalendarEventData(
			id: "ev5",
			summary: "Dinner",
			startDate: date(2025, 4, 24, 19, 0, "Europe/Berlin"),
			endDate: date(2025, 4, 24, 20, 0, "Europe/Berlin"),
			calendarColor: "a91a2f",
			isBirthdayEvent: false
		),
	],
]

private let ALL_DAY_EVENTS_PLACEHOLDER = [
	startOfToday: SimpleLongEventsData(
		event: CalendarEventData(
			id: "ev0",
			summary: "Mark is in Town",
			startDate: date(2025, 4, 24, 0, 0, "Europe/Berlin"),
			endDate: date(2025, 4, 25, 0, 0, "Europe/Berlin"),
			calendarColor: "ED7D99",
			isBirthdayEvent: false
		),
		count: 1
	),
	startOfAfterTomorrow: SimpleLongEventsData(
		event: CalendarEventData(
			id: "ev6",
			summary: "Spring Festival",
			startDate: date(2025, 4, 20, 9, 0, "Europe/Berlin"),
			endDate: date(2025, 4, 25, 10, 0, "Europe/Berlin"),
			calendarColor: "89cff0",
			isBirthdayEvent: false
		),
		count: 2
	),
]

struct AgendaProvider: AppIntentTimelineProvider {
	func makeErrorEntry(configuration: ConfigurationAppIntent, error: WidgetErrors, stackTrace: String = "") -> WidgetEntry {
		let errorObject = WidgetError(type: error, message: error.getUserFriendlyErrorMessage(), stacktrace: stackTrace)
		return WidgetEntry(date: Date(), configuration: configuration, events: ([:], [:]), error: errorObject)
	}

	func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<WidgetEntry> {
		var entries: [WidgetEntry] = []

		let currentDate = Date()
		let nextPeriod = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!

		guard let userId = configuration.account?.id else {
			let errorEntry = makeErrorEntry(configuration: configuration, error: .missingConfiguration)
			return Timeline(entries: [errorEntry], policy: .never)
		}

		do {
			let loadedCalendars = try await CalendarEntity.fetchCalendars(userId)
			if let calendars = configuration.calendars {
				for var calendar in calendars {
					if let newColor = loadedCalendars.first(where: { c in c.id == calendar.id })?.color { calendar.color = newColor }
				}
			}
		} catch { printLog("Failed to refresh calendars: \(error)") }

		guard let calendars = configuration.calendars else { return Timeline(entries: [], policy: .never) }

		do {
			let model = try await WidgetModel(userId: userId)
			let (normalEvents, longEvents) = try await model.getEventsForCalendars(calendars, date: currentDate)
			let frameOffset = 60.0 * 15  // 60 seconds * 15 = 15 minutes

			for date in stride(from: currentDate, to: nextPeriod, by: frameOffset) {
				let filteredNormalEvents = normalEvents.mapValues({ normalEvents in
					normalEvents.filter { event in event.endDate.timeIntervalSince1970 >= date.timeIntervalSince1970 }
				})

				let entry = WidgetEntry(date: date, configuration: configuration, events: (filteredNormalEvents, longEvents), error: nil)
				entries.append(entry)

				if filteredNormalEvents.isEmpty { break }
			}
		} catch {
			let nsError = error as NSError
			let errorType: WidgetErrors = nsError.domain == TUT_WIDGET_ERROR ? .unexpected : .credentials

			entries = [makeErrorEntry(configuration: configuration, error: errorType, stackTrace: nsError.debugDescription)]

			printLog("Error loading events with user \(userId) for widget: \(error)")
		}

		return Timeline(entries: entries, policy: .atEnd)
	}

	func placeholder(in context: Context) -> WidgetEntry {
		WidgetEntry(date: Date(), configuration: ConfigurationAppIntent(), events: (NORMAL_EVENTS_PLACEHOLDER, ALL_DAY_EVENTS_PLACEHOLDER), error: nil)
	}

	func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> WidgetEntry {
		let events = context.isPreview ? (NORMAL_EVENTS_PLACEHOLDER, ALL_DAY_EVENTS_PLACEHOLDER) : ([:], [:])
		return WidgetEntry(date: Date(), configuration: configuration, events: events, error: nil)
	}
}

extension Image {
	func tinted(renderingMode: WidgetRenderingMode) -> AnyView {
		if renderingMode == .accented, #available(iOSApplicationExtension 18.0, *) { return AnyView(self.widgetAccentedRenderingMode(.accented)) }

		return AnyView(self)
	}
}

extension View {
	func tinted(renderingMode: WidgetRenderingMode) -> AnyView {
		if renderingMode == .accented { return AnyView(self.luminanceToAlpha().widgetAccentable()) }

		return AnyView(self)
	}
}

struct AgendaWidgetEntryView: View {
	var normalEvents: EventMap
	var allDayEventsData: LongEventsDataMap
	var error: WidgetError?
	var userId: String

	@Environment(\.widgetRenderingMode) var renderingMode

	@Environment(\.widgetFamily) var family
	var body: some View {
		GeometryReader { g in
			VStack {
				if let err = error {
					ErrorBody(error: err)
				} else {
					let isEmpty =
						normalEvents.allSatisfy({ $0.value.isEmpty })
						&& !(allDayEventsData.contains(where: {
							if let today = normalEvents.keys.min() { return $0.key != today && $0.value.count != 0 }

							return false
						}))

					DaysList(
						userId: userId,
						isEmpty: isEmpty,
						family: family,
						widgetHeight: g.size.height,
						normalEvents: normalEvents,
						allDayEventsData: allDayEventsData
					)
				}
			}
			.frame(maxHeight: g.size.height, alignment: .top)
		}
		.containerBackground(for: .widget) { Color(.background) }.tinted(renderingMode: renderingMode)
	}
}

struct AgendaWidget: Widget {
	let kind: String = "AgendaWidget"

	var body: some WidgetConfiguration {
		let appIntentConfiguration = AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: AgendaProvider()) { entry in
			let userId = entry.configuration.account?.id ?? ""
			return AgendaWidgetEntryView(normalEvents: entry.events.0, allDayEventsData: entry.events.1, error: entry.error, userId: userId)
		}
		.configurationDisplayName("Agenda").description(translate("TutaoWidgetDescription", default: "Show today's upcoming events"))
		.supportedFamilies([.systemMedium, .systemLarge, .systemExtraLarge])

		if #available(iOSApplicationExtension 18.0, *) { return appIntentConfiguration.promptsForUserConfiguration() }

		return appIntentConfiguration
	}
}

extension String {
	func padStart(length: Int, char: String) -> String {
		if self.count < length {
			return "".padding(toLength: length, withPad: self.padding(toLength: length, withPad: char, startingAt: 0), startingAt: self.count)
		}
		return self
	}
}

extension View {
	@ViewBuilder func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View { if condition { transform(self) } else { self } }
}

#Preview(
	"With All Day Event",
	as: .systemLarge,
	widget: { AgendaWidget() },
	timeline: {
		WidgetEntry(date: Date(), configuration: ConfigurationAppIntent(), events: (NORMAL_EVENTS_PLACEHOLDER, ALL_DAY_EVENTS_PLACEHOLDER), error: nil)
	}
)

#Preview(
	"Without All Day Event",
	as: .systemLarge,
	widget: { AgendaWidget() },
	timeline: {
		WidgetEntry(date: Date(), configuration: ConfigurationAppIntent(), events: (NORMAL_EVENTS_PLACEHOLDER, ALL_DAY_EVENTS_PLACEHOLDER), error: nil)
	}
)
