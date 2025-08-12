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
	let events: ([CalendarEventData], [CalendarEventData])
	let error: WidgetError?
}

private let NORMAL_EVENTS_PLACEHOLDER = [
	CalendarEventData(
		id: "ev1",
		summary: "Gym",
		startDate: date(2025, 4, 23, 9, 0, "Europe/Berlin"),
		endDate: date(2025, 4, 23, 10, 0, "Europe/Berlin"),
		calendarColor: "89cff0",
		isBirthdayEvent: false
	),
	CalendarEventData(
		id: "ev2",
		summary: "Meeting",
		startDate: date(2025, 4, 23, 10, 0, "Europe/Berlin"),
		endDate: date(2025, 4, 23, 11, 0, "Europe/Berlin"),
		calendarColor: "20c4f0",
		isBirthdayEvent: false
	),
	CalendarEventData(
		id: "ev3",
		summary: "Lunch",
		startDate: date(2025, 4, 23, 11, 0, "Europe/Berlin"),
		endDate: date(2025, 4, 23, 13, 0, "Europe/Berlin"),
		calendarColor: "89a83b",
		isBirthdayEvent: false
	),
	CalendarEventData(
		id: "ev4",
		summary: "Concert w/ Mark",
		startDate: date(2025, 4, 23, 13, 0, "Europe/Berlin"),
		endDate: date(2025, 4, 23, 19, 0, "Europe/Berlin"),
		calendarColor: "c476fc",
		isBirthdayEvent: false
	),
	CalendarEventData(
		id: "ev5",
		summary: "Dinner",
		startDate: date(2025, 4, 23, 19, 0, "Europe/Berlin"),
		endDate: date(2025, 4, 23, 20, 0, "Europe/Berlin"),
		calendarColor: "a91a2f",
		isBirthdayEvent: false
	),
]

private let ALL_DAY_EVENTS_PLACEHOLDER = [
	CalendarEventData(
		id: "ev0",
		summary: "Mark is in Town",
		startDate: date(2025, 4, 23, 0, 0, "Europe/Berlin"),
		endDate: date(2025, 4, 24, 0, 0, "Europe/Berlin"),
		calendarColor: "ED7D99",
		isBirthdayEvent: false
	),
	CalendarEventData(
		id: "ev6",
		summary: "Spring Festival",
		startDate: date(2025, 4, 20, 9, 0, "Europe/Berlin"),
		endDate: date(2025, 4, 25, 10, 0, "Europe/Berlin"),
		calendarColor: "89cff0",
		isBirthdayEvent: false
	),
]

struct AgendaProvider: AppIntentTimelineProvider {
	func makeErrorEntry(configuration: ConfigurationAppIntent, error: WidgetErrors, stackTrace: String = "") -> WidgetEntry {
		let errorObject = WidgetError(type: error, message: error.getUserFriendlyErrorMessage(), stacktrace: stackTrace)
		return WidgetEntry(date: Date(), configuration: configuration, events: ([], []), error: errorObject)
	}

	func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<WidgetEntry> {
		var entries: [WidgetEntry] = []

		let currentDate = Date()
		let nextPeriod = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)!

		guard let userId = configuration.account?.id else {
			let errorEntry = makeErrorEntry(configuration: configuration, error: .missingConfiguration)
			return Timeline(entries: [errorEntry], policy: .never)
		}

		guard let calendars = configuration.calendars else { return Timeline(entries: [], policy: .never) }

		do {
			let model = try await WidgetModel(userId: userId)
			let (normalEvents, longEvents) = try await model.getEventsForCalendars(calendars, date: currentDate)
			let frameOffset = 60.0 * 15  // 60 seconds * 15 = 15 minutes

			for date in stride(from: currentDate, to: nextPeriod, by: frameOffset) {
				let filteredNormalEvents = normalEvents.filter { $0.endDate.timeIntervalSince1970 >= date.timeIntervalSince1970 }
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
		let events = context.isPreview ? (NORMAL_EVENTS_PLACEHOLDER, ALL_DAY_EVENTS_PLACEHOLDER) : ([], [])
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

	@Environment(\.widgetRenderingMode) var renderingMode

	private func AllDayHeader(allDayEvents: [CalendarEventData], weekday: String, day: String) -> some View {
		let allDayBackgroundColor: UIColor = UIColor(hex: allDayEvents.first?.calendarColor ?? DEFAULT_CALENDAR_COLOR) ?? UIColor(.primary)
		let foregroundColor: Color = if allDayBackgroundColor.getLuminance() > 0.5 { .black } else { .white }

		let (allDayImage, allDayPadding): (ImageResource, CGFloat) =
			if let firstEvent = allDayEvents.first, firstEvent.isBirthdayEvent { (.giftIcon, 4) } else { (.allDayIcon, 2) }

		return Group {
			Text(weekday + " " + day).fontWeight(.bold).font(.system(size: 20)).padding(.top, -4)
			HStack(alignment: .center, spacing: 4) {
				Image(allDayImage).foregroundStyle(foregroundColor).font(.system(size: 14)).padding(allDayPadding)
					.background(Color(allDayBackgroundColor.cgColor))
					.clipShape(.rect(cornerRadii: .init(topLeading: 12, bottomLeading: 12, bottomTrailing: 12, topTrailing: 12)))
				Text(allDayEvents.first?.summary ?? translate("TutaoNoTitleLabel", default: "<No Title>")).lineLimit(1).font(.system(size: 12))

				if allDayEvents.count > 1 { Text("+\(allDayEvents.count - 1)").lineLimit(1).font(.system(size: 12)).fontWeight(.medium) }
			}
		}
	}

	private func EmptyList(_ isSmallView: Bool) -> some View {
		let errorImages = [ImageResource.widgetEmptyDog, ImageResource.widgetEmptyMusic]
		let imageIndex = Int.random(in: 0...1)

		return VStack(alignment: .center) {
			Text(translate("TutaoWidgetNoEventsMsg", default: "No Events")).lineLimit(2).multilineTextAlignment(.center).foregroundStyle(Color(.onSurface))
				.padding([.top, .bottom], 8)

			if !isSmallView { Image(errorImages[imageIndex]).resizable().scaledToFit() }
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
	}

	private func EventsList() -> some View {
		let eventsToList = normalEvents.isEmpty ? allDayEvents : normalEvents
		return LazyVStack(alignment: .leading, spacing: 4) {
			ForEach(eventsToList, id: \.self) { event in
				let calendarColor = UIColor(hex: event.calendarColor) ?? .white
				let eventTime =
					eventsToList == allDayEvents
					? translate("TutaoAllDayLabel", default: "All Day")
					: eventTimeFormatter.string(from: event.startDate) + " - " + eventTimeFormatter.string(from: event.endDate)

				Button(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.eventDetails, eventId: event.id)) {
					VStack {
						HStack {
							VStack { Circle().fill(Color(calendarColor.cgColor)).frame(width: 16, height: 16) }
							VStack(alignment: .leading) {
								Text(event.summary).fontWeight(.bold).font(.system(size: 14))
								Text(eventTime).font(.system(size: 10))
							}
							.foregroundStyle(Color(.onSurface))
						}
						.padding(.horizontal, 8).padding(.vertical, 6)
					}
					.frame(maxWidth: .infinity, alignment: .leading).background(Color(.surface))
					.clipShape(.rect(cornerRadii: .init(topLeading: 8, bottomLeading: 8, bottomTrailing: 8, topTrailing: 8)))
				}
				.buttonStyle(.plain)
			}
		}
	}

	private func Header() -> some View {
		let hasAllDayEvents = !allDayEvents.isEmpty
		let titleBottomPadding: CGFloat = if hasAllDayEvents { 0 } else { -4 }

		let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: Date())
		let day = String(dateComponents.day ?? 00).padStart(length: 2, char: "0")

		let weekday = DateFormatter().weekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		return HStack(alignment: .top) {
			Button(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.agenda)) {
				HStack {
					VStack(alignment: .leading, spacing: titleBottomPadding) {
						if hasAllDayEvents {
							AllDayHeader(allDayEvents: allDayEvents, weekday: weekday, day: day)
						} else {
							Text(day).fontWeight(.bold).font(.system(size: 32)).padding(.top, -7)
							Text(weekday).font(.system(size: 12))
						}
					}
					.foregroundStyle(Color(.onSurface))
					Spacer()
				}
			}
			.buttonStyle(.plain)
			HeaderButton()
		}
	}

	private func HeaderButton() -> some View {
		var image = Image(systemName: "plus")
		let imageColor = renderingMode == .accented ? Color(.onSurface) : Color(.onPrimary)

		return Button(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.eventEditor)) {
			image.tinted(renderingMode: renderingMode).fontWeight(.medium).foregroundStyle(imageColor).font(.system(size: 20))
		}
		.buttonStyle(.plain).frame(width: 48, height: 48).background(Color(.primary))
		.clipShape(.rect(cornerRadii: .init(topLeading: 8, bottomLeading: 8, bottomTrailing: 8, topTrailing: 8)))
	}

	@Environment(\.widgetFamily) var family
	var body: some View {
		GeometryReader { _ in
			VStack {
				if let err = error {
					ErrorBody(error: err)
				} else {
					Header()

					if normalEvents.isEmpty && allDayEvents.isEmpty { EmptyList(family == .systemMedium) } else { EventsList() }
				}
			}
			.frame(maxHeight: .infinity, alignment: .top)
		}
		.containerBackground(for: .widget) { Color(.background) }.tinted(renderingMode: renderingMode)
	}
}

struct AgendaWidget: Widget {
	let kind: String = "AgendaWidget"

	var body: some WidgetConfiguration {
		let appIntentConfiguration = AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: AgendaProvider()) { entry in
			let userId = entry.configuration.account?.id ?? ""
			return AgendaWidgetEntryView(normalEvents: entry.events.0, allDayEvents: entry.events.1, error: entry.error, userId: userId)
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
