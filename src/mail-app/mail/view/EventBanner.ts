import m, { Children, Component, Vnode } from "mithril"
import { CalendarAttendeeStatus, CalendarMethod, SECOND_MS } from "../../../common/api/common/TutanotaConstants"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { CalendarEvent, CalendarEventAttendee, Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../../common/gui/base/Dialog"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { findAttendeeInAddresses } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { base64ToBase64Url, filterNull, getHourOfDay, getStartOfDay, isNotNull, LazyLoaded, stringToBase64 } from "@tutao/tutanota-utils"
import { ParsedIcalFileContent, ReplyResult } from "../../../calendar-app/calendar/view/CalendarInvites.js"
import { mailLocator } from "../../mailLocator.js"
import { isRepliedTo } from "./MailViewerUtils.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import stream from "mithril/stream"
import { Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { theme } from "../../../common/gui/theme.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { isSameExternalEvent } from "../../../common/calendar/import/ImportExportUtils"
import { styles } from "../../../common/gui/styles.js"
import { formatEventTimes } from "../../../calendar-app/calendar/gui/CalendarGuiUtils.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { BannerButton } from "../../../common/gui/base/buttons/BannerButton.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { DateTime } from "../../../../libs/luxon.js"
import { EventConflictRenderPolicy, InviteAgenda, TimeRange, TimeScale, TimeView, TimeViewAttributes } from "../../../common/calendar/date/TimeView.js"
import { Time } from "../../../common/calendar/date/Time"

export type EventBannerAttrs = {
	contents: ParsedIcalFileContent
	mail: Mail
	recipient: string
	eventsRepository: CalendarEventsRepository
}

/**
 * displayed above a mail that contains a calendar invite.
 * Its main function is to make it possible to inspect the event with the CalendarEventPopup, to quick respond
 * your attendance with Accept/Decline/Tentative while adding the event to your personal calendar
 */
export class EventBanner implements Component<EventBannerAttrs> {
	/** ReplyButtons are used from mail-view and calendar-view.
	 * they can't import each other and only have gui-base as a
	 * common ancestor, where these don't belong. */
	private readonly ReplyButtons = new LazyLoaded(async () => (await import("../../../calendar-app/calendar/gui/eventpopup/EventPreviewView.js")).ReplyButtons)
	private agenda: Map<string, InviteAgenda> = new Map()
	private hasFinishedLoadingEvents = false

	oncreate({ attrs }: Vnode<EventBannerAttrs>) {
		this.getEvents(attrs).then((events) => {
			this.agenda = events
			this.hasFinishedLoadingEvents = true
			m.redraw()
		})
	}

	buildSkeleton() {
		// FIXME Improve skeleton
		return m(
			".skeleton.rel",
			{
				class: styles.isDesktopLayout() ? "half-width" : "w-full",
			},
			m(
				".border-radius-m.grid.clip.loading",
				{
					style: styles.isSingleColumnLayout()
						? {
								"grid-template-columns": "min-content 1fr",
								"grid-template-rows": "1fr 1fr",
						  }
						: {
								"grid-template-columns": "min-content 1fr 1fr",
						  },
				},
				[
					m(
						".flex.flex-column.center.items-center.pr-vpad-l.pl-vpad-l.pb.pt.justify-center.content-message-bg.border-content-message-bg.gap-vpad-s",
						[
							m(
								".navigation-menu-icon-bg",
								{
									style: {
										width: "25px",
										height: "30px",
									},
								},
								"",
							),
							m(
								".navigation-menu-icon-bg",
								{
									style: {
										width: "45px",
										height: "50px",
									},
								},
								"",
							),
						],
					),
					m(".flex.flex-column.pr-vpad-l.pl-vpad-l.pb.pt.justify-center.navigation-menu-bg.gap-vpad-s", [
						m(
							".flex.items-center.content-message-bg",
							{
								style: {
									height: "30px",
									width: "40%",
								},
							},
							"",
						),
						m(
							".flex.items-center.content-message-bg",
							{
								style: {
									height: "40px",
									width: "75%",
								},
							},
							"",
						),
					]),
					m(
						".flex.flex-column.pr-vpad-l.pl-vpad-l.pb.pt.navigation-menu-bg.border-content-message-bg.gap-vpad-s",
						{
							class: styles.isSingleColumnLayout() ? "border-sm border-left-none border-right-none border-bottom-none" : "border-left-sm",
						},
						[
							m(
								".flex.items-center.content-message-bg",
								{
									style: {
										height: "30px",
										width: "40%",
									},
								},
								"",
							),
							m(
								".flex.items-center.content-message-bg",
								{
									style: {
										height: "70px",
										width: "55%",
									},
								},
								"",
							),
						],
					),
				],
			),
		)
	}

	view({ attrs }: Vnode<EventBannerAttrs>): Children {
		const { contents, mail } = attrs
		if (contents == null || contents.events.length === 0) return null

		if (!this.hasFinishedLoadingEvents) {
			return this.buildSkeleton()
		}

		const messages = contents.events
			.map((event: CalendarEvent): { event: CalendarEvent; message: Children } | None => {
				const message = this.getMessage(event, attrs.mail, attrs.recipient, contents.method)
				return message == null ? null : { event, message }
			})
			// thunderbird does not add attendees to rescheduled instances when they were added during an "all event"
			// edit operation, but _will_ send all the events to the participants in a single file. we do not show the
			// banner for events that do not mention us.
			.filter(isNotNull)

		return [
			// m( // FIXME Remove icons debug
			// 	".flex.flex-wrap",
			// 	Object.entries(IconsSvg).map(([name, svg]) => {
			// 		return m(".flex.flex-column.plr", [
			// 			m(Icon, {
			// 				icon: name as AllIcons,
			// 				container: "div",
			// 				class: "mr-xsm mt-xxs",
			// 				style: { fill: theme.content_button },
			// 				size: IconSize.Medium,
			// 			}),
			// 			m("span.small", name),
			// 		])
			// 	}),
			// ),
			messages.map(({ event, message }) => {
				return this.buildEventBanner(event, this.agenda.get(event.uid ?? "") ?? null, message)
			}),
		]
	}

	private buildEventBanner(event: CalendarEvent, agenda: InviteAgenda | null, message: Children) {
		const hasConflict = agenda && (agenda.before?.conflict || agenda.after?.conflict)
		const events = filterNull([agenda?.before, agenda?.current, agenda?.after])

		// const shortestEventDuration = events.reduce() // FIXME calculate shortest event duration
		// const timeScale = getTimeScaleAccordingToEventDuration(shortestEventDuration) // FIXME implement
		const timeScale: TimeScale = 2 // FIXME Remove, using for development

		const currentEventStartTime = agenda?.current.event?.startTime.getHours()!
		const timeRangeStart = new Time(currentEventStartTime, 0).sub({ minutes: 60 / timeScale })
		const timeRangeStartEnd = new Time(currentEventStartTime, 0).add({ minutes: 60 / timeScale })
		const timeRange: TimeRange = {
			start: timeRangeStart,
			end: timeRangeStartEnd,
		}

		console.log({ agenda: this.agenda, events, timeScale, timeRange })
		/* Event Banner */
		return m(
			".border-radius-m.border-nota.border-sm.grid",
			{
				class: styles.isSingleColumnLayout() ? "" : "fit-content",
				style: styles.isSingleColumnLayout()
					? {
							"grid-template-columns": "min-content 1fr",
							"grid-template-rows": "1fr 1fr",
					  }
					: { "grid-template-columns": "min-content 1fr 1fr" },
			},
			[
				/* Date Column */
				m(
					".flex.flex-column.nota-bg.center.items-center.pb.pt.justify-center.fill-grid-column",
					{
						class: styles.isSingleColumnLayout() ? "plr-vpad" : "pr-vpad-l pl-vpad-l",
					},
					[
						m("span.normal-font-size.accent-fg", event.startTime.toLocaleString("default", { month: "short" })),
						m("span.big.accent-fg.b.lh-s", event.startTime.getDate().toString().padStart(2, "0")),
						m("span.normal-font-size.accent-fg", event.startTime.toLocaleString("default", { year: "numeric" })),
					],
				),
				/* Invite Column */
				m(".flex.flex-column.plr-vpad.pb.pt.justify-start", [
					m(".flex", [
						m(Icon, {
							icon: BootIcons.Calendar,
							container: "div",
							class: "mr-xsm mt-xxs",
							style: { fill: theme.content_button },
							size: IconSize.Medium,
						}),
						m("span.b.h5", event.summary),
					]),
					event.organizer?.address
						? m(".flex.items-center.small.mt-s", [
								m("span.b", "When:"), // FIXME Add translation
								m("span.ml-xsm", formatEventTimes(getStartOfDay(event.startTime), event, "")),
						  ])
						: null,
					message,
				]),
				/* Time Overview */
				m(
					".flex.flex-column.plr-vpad.pb.pt.justify-start.border-nota",
					{
						class: styles.isSingleColumnLayout() ? "border-sm border-left-none border-right-none border-bottom-none" : "border-left-sm",
					},
					[
						m(".flex.flex-column", [
							m(".flex", [
								m(Icon, {
									icon: Icons.Time,
									container: "div",
									class: "mr-xsm mt-xxs",
									style: { fill: theme.content_button },
									size: IconSize.Medium,
								}),
								m("span.b.h5", "Time Overview"), // FIXME translation
							]),
							m(".flex.items-center", [
								m(Icon, {
									icon: hasConflict ? Icons.AlertCircle : Icons.CheckCircleFilled,
									container: "div",
									class: "mr-xsm",
									style: { fill: hasConflict ? theme.error_color : "#39D9C1" }, //FIXME add the success color to theme
									size: IconSize.Medium,
								}),
								m("span.small.text-fade", hasConflict ? `${agenda.conflictCount} simultaneous events` : "No simultaneous events"), //FIXME Translations
							]),
						]),
						agenda
							? m(TimeView, {
									events,
									timeScale,
									timeRange,
									conflictRenderPolicy: EventConflictRenderPolicy.PARALLEL,
							  } satisfies TimeViewAttributes)
							: m("", "ERROR: Could not load the agenda for this day."),
					],
				),
			],
		)
	}

	private getMessage(event: CalendarEvent, mail: Mail, recipient: string, method: CalendarMethod): Children {
		const shallowEvent = this.agenda.get(event.uid ?? "")?.current.event
		const ownAttendee: CalendarEventAttendee | null = findAttendeeInAddresses(shallowEvent?.attendees ?? event.attendees, [recipient])

		const children: Children = []
		const replyButton = m(BannerButton, {
			borderColor: theme.content_button,
			color: theme.content_fg,
			click: () => this.handleViewOnCalendarAction(event),
			text: {
				testId: "",
				text: "View on Calendar", // FIXME translation
			} as Translation,
		})

		if (method === CalendarMethod.REQUEST && ownAttendee != null) {
			// some mails contain more than one event that we want to be able to respond to
			// separately.

			const needsAction = !isRepliedTo(mail) || ownAttendee.status === CalendarAttendeeStatus.NEEDS_ACTION
			if (needsAction && this.ReplyButtons.isLoaded()) {
				children.push(
					m(this.ReplyButtons.getLoaded(), {
						ownAttendee,
						setParticipation: async (status: CalendarAttendeeStatus) => sendResponse(event, recipient, status, mail),
					}),
				)
			} else if (!needsAction) {
				children.push(m(".align-self-start.start.small.mb-xsm.mt-s", lang.get("alreadyReplied_msg")))
				children.push(replyButton)
			} else {
				this.ReplyButtons.reload().then(m.redraw)
			}
		} else if (method === CalendarMethod.REPLY) {
			children.push(m(".pt.align-self-start.start.small", lang.get("eventNotificationUpdated_msg")))
			children.push(replyButton)
		} else {
			return null
		}

		return children
	}

	private handleViewOnCalendarAction(event: CalendarEvent) {
		const currentEvent = this.agenda.get(event.uid ?? "")?.current.event
		if (!currentEvent) {
			throw new ProgrammingError("Missing corresponding event in calendar")
		}
		const eventDate = DateTime.fromJSDate(currentEvent.startTime).toFormat("yyyy-MM-dd")
		const eventId = base64ToBase64Url(stringToBase64(currentEvent._id.join("/")))
		m.route.set(`/calendar/agenda/${eventDate}/${eventId}`)
	}

	private async getEvents(attrs: EventBannerAttrs): Promise<Map<string, InviteAgenda>> {
		if (!attrs.contents) {
			return new Map()
		}

		/*
		 * - Load events that occurs on the same day as event start/end, load both because an event can start at one day and ends in another
		 * - Extract conflicting events following the logic bellow
		 *           [==============] (event)
		 *   [=========] ev.endTime > event.startTime && ev.endTime <= event.endTime
		 *     					[=========] ev.startTime >= event.startTime && ev.startTime < event.endTime
		 *				[========]	ev.startTime >= event.startTime && ev.startTime < event.endTime
		 * [=========]
		 * [==================================] ev.startTime <= event.startTime && ev.endTime >= event.endTime
		 *  						[=========]
		 * - If there's no conflicting before event, get one from event list that starts and ends before the invitation
		 * - If there's no conflicting after event, get one from event list that starts and ends after the invitation
		 * - Build an object that should contain the event before and after, these can be null, meaning that there's no event at the time
		 */
		const eventToAgenda: Map<string, InviteAgenda> = new Map()
		const datesToLoad = new Set(attrs.contents.events.map((ev) => [getStartOfDay(ev.startTime), getStartOfDay(ev.endTime)]).flat())
		await attrs.eventsRepository.loadMonthsIfNeeded(Array.from(datesToLoad), stream(false), null)
		const events = attrs.eventsRepository.getEventsForMonths()() // Short and long events
		console.log(attrs.contents.events)
		for (const event of attrs.contents.events) {
			const startOfDay = getStartOfDay(event.startTime)
			const endOfDay = getStartOfDay(event.endTime)
			const eventsForStartDay = events.get(startOfDay.getTime()) ?? []
			const eventsForEndDay = events.get(endOfDay.getTime()) ?? []
			const allEvents = Array.from(new Set([...eventsForStartDay, ...eventsForEndDay]))

			const conflictingEvents = allEvents.filter(
				(ev) =>
					!isSameExternalEvent(ev, event) &&
					((ev.endTime > event.startTime && ev.endTime <= event.endTime) || // Ends during event
						(ev.startTime >= event.startTime && ev.startTime < event.endTime) || // Starts during event
						(ev.startTime <= event.startTime && ev.endTime >= event.endTime)), // Fully overlaps event
			)

			// Decides if we already have a conflicting event or if we should pick an event from event list that happens before the invitation
			const closestConflictingEventBeforeStartTime = conflictingEvents
				.filter((ev) => ev.startTime <= event.startTime)
				.reduce((closest: CalendarEvent | null, ev, index) => {
					if (!closest) return ev
					if (event.startTime.getTime() - ev.startTime.getTime() < event.startTime.getTime() - closest.startTime.getTime()) return ev
					return closest
				}, null)

			// Decides if we already have a conflicting event or if we should pick an event from event list that happens after the invitation
			const closestConflictingEventAfterStartTime = conflictingEvents
				.filter((ev) => ev.startTime > event.startTime)
				.reduce((closest: CalendarEvent | null, ev, index) => {
					if (!closest) return ev
					if (Math.abs(event.startTime.getTime() - ev.startTime.getTime()) < Math.abs(event.startTime.getTime() - closest.startTime.getTime()))
						return ev
					return closest
				}, null)

			const oneHour = SECOND_MS * 3600

			let eventList: InviteAgenda = {
				before: null,
				after: null,
				current: { event: event, conflict: false },
				conflictCount: conflictingEvents.length,
			}

			if (!closestConflictingEventBeforeStartTime) {
				const eventBefore = [...eventsForStartDay, ...eventsForEndDay]
					.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
					.find(
						(ev) =>
							!isSameExternalEvent(ev, event) && ev.startTime <= event.startTime && event.startTime.getTime() - ev.endTime.getTime() <= oneHour,
					)

				if (eventBefore) {
					eventList.before = { event: eventBefore, conflict: false }
				}
			} else {
				eventList.before = {
					event: closestConflictingEventBeforeStartTime,
					conflict: true,
				}
			}

			if (!closestConflictingEventAfterStartTime) {
				const eventAfter = [...eventsForStartDay, ...eventsForEndDay]
					.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
					.find(
						(ev) =>
							!isSameExternalEvent(ev, event) && ev.startTime > event.startTime && ev.startTime.getTime() - event.endTime.getTime() <= oneHour,
					)

				if (eventAfter) {
					eventList.after = { event: eventAfter, conflict: false }
				}
			} else {
				const time = getHourOfDay(
					closestConflictingEventAfterStartTime.startTime ?? new Date(),
					closestConflictingEventAfterStartTime.startTime.getHours() ?? 0,
				).getTime()
				eventList.after = { event: closestConflictingEventAfterStartTime, conflict: true }
			}

			eventToAgenda.set(event.uid ?? "", eventList)
		}

		return eventToAgenda
	}
}

/** show a progress dialog while sending a response to the event's organizer and update the ui. will always send a reply, even if the status did not change. */
export function sendResponse(event: CalendarEvent, recipient: string, status: CalendarAttendeeStatus, previousMail: Mail) {
	showProgressDialog(
		"pleaseWait_msg",
		import("../../../calendar-app/calendar/view/CalendarInvites.js").then(async ({ getLatestEvent }) => {
			const latestEvent = await getLatestEvent(event)
			const ownAttendee = findAttendeeInAddresses(latestEvent.attendees, [recipient])
			const calendarInviteHandler = await mailLocator.calendarInviteHandler()

			if (ownAttendee == null) {
				Dialog.message("attendeeNotFound_msg")
				return
			}

			const mailboxDetails = await mailLocator.mailModel.getMailboxDetailsForMail(previousMail)
			if (mailboxDetails == null) return

			const replyResult = await calendarInviteHandler.replyToEventInvitation(latestEvent, ownAttendee, status, previousMail, mailboxDetails)
			if (replyResult === ReplyResult.ReplySent) {
				ownAttendee.status = status
			}
			m.redraw()
		}),
	)
}
