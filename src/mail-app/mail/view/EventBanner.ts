import m, { Children, Component, Vnode } from "mithril"
import { CalendarAttendeeStatus, CalendarMethod } from "../../../common/api/common/TutanotaConstants"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import type { CalendarEvent, Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../../common/gui/base/Dialog"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { findAttendeeInAddresses } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { base64ToBase64Url, getStartOfDay, isNotNull, LazyLoaded, stringToBase64 } from "@tutao/tutanota-utils"
import { ParsedIcalFileContent, ReplyResult } from "../../../calendar-app/calendar/view/CalendarInvites.js"
import { mailLocator } from "../../mailLocator.js"
import { isRepliedTo } from "./MailViewerUtils.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import stream from "mithril/stream"
import { AllIcons, Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { theme } from "../../../common/gui/theme.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { shallowIsSameEvent } from "../../../common/calendar/import/ImportExportUtils"
import { styles } from "../../../common/gui/styles.js"
import { formatEventTimes } from "../../../calendar-app/calendar/gui/CalendarGuiUtils.js"
import { Icons, IconsSvg } from "../../../common/gui/base/icons/Icons.js"
import { BannerButton } from "../../../common/gui/base/buttons/BannerButton.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { DateTime } from "../../../../libs/luxon.js"

export type EventBannerAttrs = {
	contents: ParsedIcalFileContent
	mail: Mail
	recipient: string
	eventsRepository: CalendarEventsRepository
}

type InviteAgendaEvent = {
	event: CalendarEvent
	conflict: boolean
}

type InviteAgenda = { before: InviteAgendaEvent | null; after: InviteAgendaEvent | null; current: CalendarEvent | null; conflictCount: number }

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
	private agenda: WeakMap<CalendarEvent, InviteAgenda> = new WeakMap()
	private hasFinishedLoadingEvents = false

	oncreate({ attrs }: Vnode<EventBannerAttrs>) {
		this.getEvents(attrs).then((events) => {
			this.agenda = events
			this.hasFinishedLoadingEvents = true
			m.redraw()
		})
	}

	buildSkeleton() {
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
						  }
						: {
								"grid-template-columns": "min-content 1fr 1fr",
						  },
				},
				[
					m(
						".flex.flex-column.center.items-center.pr-vpad-l.pl-vpad-BulbOutlinel.pb.pt.justify-center.content-message-bg.border-content-message-bg.gap-vpad-s",
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
							class: styles.isSingleColumnLayout()
								? "border-sm border-left-none border-right-none border-bottom-none fill-grid-row"
								: "border-left-sm",
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
			m(
				".flex.flex-wrap",
				Object.entries(IconsSvg).map(([name, svg]) => {
					return m(".flex.flex-column.plr", [
						m(Icon, {
							icon: name as AllIcons,
							container: "div",
							class: "mr-xsm mt-xxs",
							style: { fill: theme.content_button },
							size: IconSize.Medium,
						}),
						m("span.small", name),
					])
				}),
			),
			messages.map(({ event, message }) =>
				this.buildEventBanner(
					event,
					this.agenda.get(event) ?? {
						before: null,
						after: null,
						current: null,
						conflictCount: 0,
					},
					message,
				),
			),
		]
	}

	private buildEventBanner(event: CalendarEvent, agenda: InviteAgenda, message: Children) {
		const hasConflict = agenda.before?.conflict || agenda.after?.conflict
		return m(
			".border-radius-m.border-nota.border-sm.grid",
			{
				class: styles.isSingleColumnLayout() ? "" : "fit-content",
				style: styles.isSingleColumnLayout() ? { "grid-template-columns": "min-content 1fr" } : { "grid-template-columns": "min-content 1fr 1fr" },
			},
			[
				m(".flex.flex-column.nota-bg.center.items-center.pr-vpad-l.pl-vpad-l.pb.pt.justify-center", [
					m("span.normal-font-size.accent-fg", event.startTime.toLocaleString("default", { month: "short" })),
					m("span.big.accent-fg.b.lh-s", event.startTime.getDate().toString().padStart(2, "0")),
					m("span.normal-font-size.accent-fg", event.startTime.toLocaleString("default", { year: "numeric" })),
				]),
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
					// FIXME Fix not displaying the attending status for the invitation (Accepted, Maybe or No)
					message,
				]),
				m(
					".flex.flex-column.plr-vpad.pb.pt.justify-start.border-nota",
					{
						class: styles.isSingleColumnLayout()
							? "border-sm border-left-none border-right-none border-bottom-none fill-grid-row"
							: "border-left-sm",
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
								m("span.b.h5", "Overview"),
							]),
							m(".flex.items-center", [
								m(Icon, {
									icon: hasConflict ? Icons.AlertCircle : Icons.CheckCircleFilled,
									container: "div",
									class: "mr-xsm mt-xxs",
									style: { fill: hasConflict ? theme.error_color : "#39D9C1" }, //FIXME add the success color to theme
									size: IconSize.Medium,
								}),
								m("span.small.text-fade", hasConflict ? `${agenda.conflictCount} simultaneous events` : "No simultaneous events"), //FIXME Translations
							]),
						]),
						m(".flex.flex-column.mt-m", [
							m(
								"span.text-fade",
								agenda.before
									? `${agenda.before.event.startTime.toLocaleString("default", {
											hour: "2-digit",
											minute: "2-digit",
									  })} - ${agenda.before.event.endTime.toLocaleString("default", {
											hour: "2-digit",
											minute: "2-digit",
									  })} ${agenda.before.event.summary}${agenda.before.conflict ? " (Conflict)" : ""}`
									: "No events before",
							), //FIXME Add translation
							m(
								"span",
								`${event.startTime.toLocaleString("default", {
									hour: "2-digit",
									minute: "2-digit",
								})} - ${event.endTime.toLocaleString("default", {
									hour: "2-digit",
									minute: "2-digit",
								})} ${event.summary}`,
							),
							m(
								"span.text-fade",
								agenda.after
									? `${agenda.after.event.startTime.toLocaleString("default", {
											hour: "2-digit",
											minute: "2-digit",
									  })} - ${agenda.after.event.endTime.toLocaleString("default", {
											hour: "2-digit",
											minute: "2-digit",
									  })} ${agenda.after.event.summary}${agenda.after.conflict ? " (Conflict)" : ""}`
									: "No events before",
							), //FIXME Add translation
						]),
					],
				),
			],
		)
	}

	private getMessage(event: CalendarEvent, mail: Mail, recipient: string, method: CalendarMethod): Children {
		const shallowEvent = this.agenda.get(event)?.current
		const ownAttendee = findAttendeeInAddresses(shallowEvent?.attendees ?? event.attendees, [recipient])

		const children: Children = []
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
				children.push(
					m(BannerButton, {
						borderColor: theme.content_button,
						color: theme.content_fg,
						click: () => this.handleViewOnCalendarAction(event),
						text: {
							testId: "",
							text: "View on Calendar",
						} as Translation,
					}),
				) // FIXME translation
			} else {
				this.ReplyButtons.reload().then(m.redraw)
			}
		} else if (method === CalendarMethod.REPLY) {
			children.push(m(".pt.align-self-start.start.small", lang.get("eventNotificationUpdated_msg")))
			children.push(
				m(BannerButton, {
					borderColor: theme.content_button,
					color: theme.content_fg,
					click: () => this.handleViewOnCalendarAction(event),
					text: {
						testId: "",
						text: "View on Calendar",
					} as Translation,
				}),
			) // FIXME translation
		} else {
			return null
		}

		return children
	}

	private handleViewOnCalendarAction(event: CalendarEvent) {
		const currentEvent = this.agenda.get(event)?.current
		if (!currentEvent) {
			throw new ProgrammingError("Missing corresponding event in calendar")
		}
		const eventDate = DateTime.fromJSDate(currentEvent.startTime).toFormat("yyyy-MM-dd")
		const eventId = base64ToBase64Url(stringToBase64(currentEvent._id.join("/")))
		m.route.set(`/calendar/agenda/${eventDate}/${eventId}`)
	}

	private async getEvents(attrs: EventBannerAttrs): Promise<WeakMap<CalendarEvent, InviteAgenda>> {
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
		const eventToAgenda: WeakMap<CalendarEvent, InviteAgenda> = new WeakMap()
		const datesToLoad = new Set(attrs.contents.events.map((ev) => [getStartOfDay(ev.startTime), getStartOfDay(ev.endTime)]).flat())
		await attrs.eventsRepository.loadMonthsIfNeeded(Array.from(datesToLoad), stream(false), null)
		const events = attrs.eventsRepository.getEventsForMonths()() // Short and long events

		for (const event of attrs.contents.events) {
			const startOfDay = getStartOfDay(event.startTime)
			const endOfDay = getStartOfDay(event.endTime)
			const eventsForStartDay = events.get(startOfDay.getTime()) ?? []
			const eventsForEndDay = events.get(endOfDay.getTime()) ?? []
			const allEvents = Array.from(new Set([...eventsForStartDay, ...eventsForEndDay]))

			const conflictingEvents = allEvents.filter(
				(ev) =>
					!shallowIsSameEvent(ev, event) &&
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

			let eventList: InviteAgenda = {
				before: null,
				after: null,
				current: [...eventsForStartDay, ...eventsForEndDay].find((ev) => shallowIsSameEvent(ev, event)) ?? null,
				conflictCount: conflictingEvents.length,
			}

			if (!closestConflictingEventBeforeStartTime) {
				const eventBefore = [...eventsForStartDay, ...eventsForEndDay]
					.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
					.find((ev) => !shallowIsSameEvent(ev, event) && ev.startTime <= event.startTime)

				if (eventBefore) {
					eventList.before = { event: eventBefore, conflict: false }
				}
			} else {
				eventList.before = { event: closestConflictingEventBeforeStartTime, conflict: true }
			}

			if (!closestConflictingEventAfterStartTime) {
				const eventAfter = [...eventsForStartDay, ...eventsForEndDay]
					.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
					.find((ev) => ev.startTime > event.startTime)

				if (eventAfter) {
					eventList.after = { event: eventAfter, conflict: false }
				}
			} else {
				eventList.after = { event: closestConflictingEventAfterStartTime, conflict: true }
			}

			eventToAgenda.set(event, eventList)
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
