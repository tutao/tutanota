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
	var allDayEvents: LongEventsDataMap
	var error: WidgetError?
	var userId: String

	private let eventTimeFormatter: DateFormatter = {
		let formatter = DateFormatter()
		formatter.dateStyle = .none
		formatter.timeStyle = .short
		return formatter
	}()

	@Environment(\.widgetRenderingMode) var renderingMode

	private func AllDayEventsRow(allDayEventsData: SimpleLongEventsData, textColor: Color?) -> some View {
		let allDayBackgroundColor: UIColor = UIColor(hex: allDayEventsData.event?.calendarColor ?? DEFAULT_CALENDAR_COLOR) ?? UIColor(.primary)
		let foregroundColor: Color = if allDayBackgroundColor.getLuminance() > 0.5 { .black } else { .white }

		let (allDayImage, allDayPadding): (ImageResource, CGFloat) =
			if let firstEvent = allDayEventsData.event, firstEvent.isBirthdayEvent { (.giftIcon, 4) } else { (.allDayIcon, 2) }

		let eventTitle: String =
			if let title: String = allDayEventsData.event?.summary, !title.isEmpty { allDayEventsData.event!.summary } else {
				translate("TutaoNoTitleLabel", default: "<No Title>")
			}

		return HStack(alignment: .center, spacing: 4) {
			Image(allDayImage).foregroundStyle(foregroundColor).font(.system(size: 14)).padding(allDayPadding).background(Color(allDayBackgroundColor.cgColor))
				.clipShape(.rect(cornerRadii: .init(topLeading: 12, bottomLeading: 12, bottomTrailing: 12, topTrailing: 12)))
			Text(eventTitle).lineLimit(1).font(.system(size: 12)).if(textColor != nil) { $0.foregroundStyle(textColor!) }

			if allDayEventsData.count > 1 {
				Text("+\(allDayEventsData.count - 1)").lineLimit(1).font(.system(size: 12)).fontWeight(.medium)
					.if(textColor != nil) { $0.foregroundStyle(textColor!) }
			}
		}
	}
	private func AllDayHeader(allDayEventsData: SimpleLongEventsData, weekday: String, day: String) -> some View {
		Group {
			Text(weekday + " " + day).fontWeight(.bold).font(.system(size: 20)).padding(.top, -4)
			AllDayEventsRow(allDayEventsData: allDayEventsData, textColor: nil)
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

	private func DaysList() -> some View {
		LazyVStack(alignment: .leading, spacing: 6) {
			ForEach(normalEvents.keys.sorted(by: { $0 < $1 }), id: \.self) { startOfDay in
				let parsedDay = Date(timeIntervalSince1970: startOfDay)
				let events = normalEvents[startOfDay] ?? []
				let allDayEvents = allDayEvents[startOfDay] ?? SimpleLongEventsData(event: nil, count: 0)
				let hasOnlyAllDays = events.isEmpty && allDayEvents.count > 0
				let hasAllDayEvents = allDayEvents.count > 0
				let hasAllDayAndNotToday = hasAllDayEvents && !Calendar.current.isDateInToday(parsedDay)
				if Calendar.current.isDateInToday(parsedDay) && events.isEmpty {
					HStack(alignment: .center) {
						Text(translate("TutaoWidgetNoEventsTodayMsg", default: "No upcoming events today")).lineLimit(2).multilineTextAlignment(.center)
							.foregroundStyle(Color(.onSurface)).padding([.top, .bottom], 8)
					}
					.frame(maxWidth: .infinity, alignment: .center)
				} else {
					Button(intent: WidgetActionsIntent(userId: userId, date: parsedDay, action: WidgetActions.agenda)) {
						VStack(spacing: 0) {
							if hasAllDayAndNotToday {
								HStack(alignment: .center) {
									AllDayEventsRow(allDayEventsData: allDayEvents, textColor: Color(.onSurfaceVariant)).padding(.vertical, 8)
										.padding(.horizontal, 12)
								}
								.frame(maxWidth: .infinity, alignment: .leading).background(Color(.surfaceVariant))
								.clipShape(.rect(cornerRadii: .init(topLeading: 8, bottomLeading: 0, bottomTrailing: 0, topTrailing: 8)))
							}

							if hasOnlyAllDays {
								VStack {
									EventBody(
										happensToday: false,
										isFirstEventOfDay: true,
										calendarColor: UIColor(resource: .surfaceVariant),
										eventDate: parsedDay
									)
									.padding(.horizontal, 12).padding(.vertical, 8)
								}
								.frame(maxWidth: .infinity, alignment: .leading).background(Color(.surface))
								.clipShape(.rect(cornerRadii: .init(topLeading: 0, bottomLeading: 8, bottomTrailing: 8, topTrailing: 0)))
							} else {
								VStack { EventsList(events: events) }.frame(maxWidth: .infinity, alignment: .leading).background(Color(.surface))
									.clipShape(
										.rect(
											cornerRadii: .init(
												topLeading: hasAllDayAndNotToday ? 0 : 8,
												bottomLeading: 8,
												bottomTrailing: 8,
												topTrailing: hasAllDayAndNotToday ? 0 : 8
											)
										)
									)
							}
						}
					}
					.buttonStyle(.plain)
				}
			}
		}
	}

	private func EventBody(
		happensToday: Bool,
		isFirstEventOfDay: Bool,
		calendarColor: UIColor,
		eventDate: Date,
		eventTime: String? = nil,
		event: CalendarEventData? = nil
	) -> some View {
		let eventTitle = if event != nil { event!.summary } else { translate("TutaoWidgetNoEventsMsg", default: "No upcoming events") }
		let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: eventDate)
		let day = String(dateComponents.day ?? 00).padStart(length: 2, char: "0")
		let weekday = DateFormatter().shortWeekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		return HStack(alignment: VerticalAlignment.center, spacing: 12) {
			if !happensToday {
				HStack(alignment: VerticalAlignment.center) {
					VStack(spacing: -2) {
						Text(day).font(.system(size: 20, weight: .bold))
						Text(weekday).font(.system(size: 14, weight: .regular))
					}
				}
				.opacity(isFirstEventOfDay ? 1 : 0).frame(width: 32, alignment: .leading)
			}
			Button(
				intent: WidgetActionsIntent(
					userId: userId,
					date: eventDate,
					action: event?.id == nil ? WidgetActions.agenda : WidgetActions.eventDetails,
					eventId: event?.id
				)
			) {
				HStack(spacing: 12) {
					VStack {
						Rectangle().fill(Color(calendarColor.cgColor)).frame(width: 3).frame(maxHeight: .infinity)
							.clipShape(.rect(cornerRadii: .init(topLeading: 3, bottomLeading: 3, bottomTrailing: 3, topTrailing: 3)))
					}
					VStack(alignment: .leading) {
						Text(eventTitle).fontWeight(.bold).font(.system(size: 14)).lineLimit(1)
						if eventTime != nil { Text(eventTime!).font(.system(size: 10)) }
					}
					.foregroundStyle(Color(.onSurface)).frame(maxHeight: .infinity, alignment: .center)
				}
				.frame(maxWidth: .infinity, alignment: .leading)
			}
			.buttonStyle(.plain)
		}
		.frame(alignment: .leading)
	}
	private func EventsList(events: [CalendarEventData]) -> some View {
		VStack(alignment: .leading, spacing: 6) {
			ForEach(Array(events.enumerated()), id: \.element) { index, event in
				let calendarColor = UIColor(hex: event.calendarColor) ?? .white
				let eventTime = eventTimeFormatter.string(from: event.startDate) + " - " + eventTimeFormatter.string(from: event.endDate)
				let happensToday = Calendar.current.isDateInToday(event.startDate)

				EventBody(
					happensToday: happensToday,
					isFirstEventOfDay: index == 0,
					calendarColor: calendarColor,
					eventDate: event.startDate,
					eventTime: eventTime,
					event: event
				)
			}
		}
		.padding(.horizontal, 12).padding(.vertical, 8)
	}

	private func Header() -> some View {
		let startOfToday = Calendar.current.startOfDay(for: Date()).timeIntervalSince1970
		let hasAllDayEvents = (allDayEvents[startOfToday]?.count ?? 0) > 0

		let titleBottomPadding: CGFloat = if hasAllDayEvents { 0 } else { -4 }

		let dateComponents = Calendar.current.dateComponents([.day, .weekday], from: Date())
		let day = String(dateComponents.day ?? 00).padStart(length: 2, char: "0")

		let weekday = DateFormatter().weekdaySymbols[(dateComponents.weekday ?? 0) - 1]

		return HStack(alignment: .top) {
			Button(intent: WidgetActionsIntent(userId: userId, date: Date(), action: WidgetActions.agenda)) {
				HStack {
					VStack(alignment: .leading, spacing: titleBottomPadding) {
						if hasAllDayEvents {
							AllDayHeader(allDayEventsData: allDayEvents[startOfToday] ?? SimpleLongEventsData(event: nil, count: 0), weekday: weekday, day: day)
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

					if normalEvents.allSatisfy({ $0.value.isEmpty })
						&& !(allDayEvents.contains(where: {
							if let today = normalEvents.keys.min() { return $0.key != today && $0.value.count != 0 }

							return false
						}))
					{
						EmptyList(family == .systemMedium)
					} else {
						DaysList()
					}
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
