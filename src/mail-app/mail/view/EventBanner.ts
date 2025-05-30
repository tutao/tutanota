import m, { Children, Component, Vnode } from "mithril"
import { CalendarAttendeeStatus, CalendarMethod } from "../../../common/api/common/TutanotaConstants"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { CalendarEvent, Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../../common/gui/base/Dialog"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { findAttendeeInAddresses } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { getStartOfDay, isNotNull, LazyLoaded } from "@tutao/tutanota-utils"
import { ParsedIcalFileContent, ReplyResult } from "../../../calendar-app/calendar/view/CalendarInvites.js"
import { mailLocator } from "../../mailLocator.js"
import { isRepliedTo } from "./MailViewerUtils.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import stream from "mithril/stream"
import { Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { theme } from "../../../common/gui/theme.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { eventHasSameFields } from "../../../common/calendar/import/ImportExportUtils"

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
	private agenda: Map<CalendarEvent, { event: CalendarEvent; conflict: boolean }[]> = new Map()

	oncreate({ attrs }: Vnode<EventBannerAttrs>) {
		this.getEvents(attrs).then((events) => {
			this.agenda = events
			m.redraw()
		})
	}

	view({ attrs }: Vnode<EventBannerAttrs>): Children {
		const { contents, mail } = attrs
		if (contents == null || contents.events.length === 0) return null

		const messages = contents.events
			.map((event: CalendarEvent): { event: CalendarEvent; message: Children } | None => {
				const message = this.getMessage(event, attrs.mail, attrs.recipient, contents.method)
				return message == null ? null : { event, message }
			})
			// thunderbird does not add attendees to rescheduled instances when they were added during an "all event"
			// edit operation, but _will_ send all the events to the participants in a single file. we do not show the
			// banner for events that do not mention us.
			.filter(isNotNull)

		return messages.map(
			({ event, message }) => this.buildEventBanner(event, this.agenda.get(event) ?? [], message),
			// m("", [
			// 	Array.from(this.agenda.entries()).map(([event, agenda]) => {
			// 		const eventBefore = agenda.find((e) => e.event.startTime < event.startTime)
			// 		const eventAfter = agenda.find((e) => e.event.startTime >= event.startTime)
			//
			// 		return m(".flex.flex-column", [
			// 			m("", eventBefore ? `${eventBefore?.event.startTime.toLocaleTimeString()} - ${eventBefore?.event.endTime.toLocaleTimeString()} ${eventBefore?.event.summary}${eventBefore?.conflict ? " (Conflict)" : ""}` : "No event before"),
			// 			m("", `${event.startTime.toLocaleTimeString()} - ${event.endTime.toTimeString()} ${event.summary}`),
			// 			m("", eventAfter ? `${eventAfter?.event.startTime.toLocaleTimeString()} - ${eventAfter?.event.endTime.toLocaleTimeString()} ${eventAfter?.event.summary}${eventAfter?.conflict ? " (Conflict)" : ""}` : "No event after"),
			// 		])
			// 	}),
			// 	m(InfoBanner, {
			// 		message: () => message,
			// 		type: BannerType.Info,
			// 		icon: Icons.People,
			// 		buttons: [
			// 			{
			// 				label: "viewEvent_action",
			// 				click: (e, dom) =>
			// 					import("../../../calendar-app/calendar/view/CalendarInvites.js").then(({ showEventDetails }) =>
			// 						showEventDetails(event, dom.getBoundingClientRect(), mail),
			// 					),
			// 			},
			// 		],
			// 	} satisfies InfoBannerAttrs),
			// ]),
		)
	}

	private buildEventBanner(
		event: CalendarEvent,
		agenda: {
			event: CalendarEvent
			conflict: boolean
		}[],
		message: Children,
	) {
		const eventBefore = agenda.find((e) => e.event.startTime < event.startTime)
		const eventAfter = agenda.find((e) => e.event.startTime >= event.startTime)

		return m(".flex.border-radius-top-left-m.border-radius-bottom-left-m.border-nota.border-sm.fit-content", [
			m(".flex.flex-column.nota-bg.center.items-center.pr-vpad-l.pl-vpad-l.pb.pt", [
				m("span.normal-font-size.accent-fg", event.startTime.toLocaleString("default", { month: "short" })),
				m("span.big.accent-fg.b", event.startTime.getDate()),
			]),
			m(".flex.flex-column.pr-vpad-l.pl-vpad-l.pb.pt.justify-center", [
				m(".flex.items-center", [
					m(Icon, {
						icon: BootIcons.Calendar,
						container: "div",
						class: "mr-xs",
						style: { fill: theme.button_bubble_fg },
						size: IconSize.Large,
					}),
					m("span.b.h5", event.summary),
				]),
				event.organizer?.address
					? m(".flex.items-center.small", [
							m("span.b", "Who:"), // FIXME Add translation
							m("span.ml-xsm", event.organizer?.address),
					  ])
					: null,
				// FIXME Fix not displaying the attending status for the invitation (Accepted, Maybe or No)
				message,
			]),
			m(".flex.flex-column.pr-vpad-l.pl-vpad-l.pb.pt.border-nota.border-left-sm", [
				m(".flex.flex-column", [
					m("span.b.h5", "Overview"), // FIXME Add translation
					m(
						"span.small.text-fade",
						event.startTime.toLocaleString("default", {
							month: "short",
							day: "2-digit",
							year: "numeric",
						}),
					),
				]),
				m(".flex.flex-column.mt-m", [
					m(
						"span.text-fade",
						eventBefore
							? `${eventBefore.event.startTime.toLocaleString("default", {
									hour: "2-digit",
									minute: "2-digit",
							  })} - ${eventBefore.event.endTime.toLocaleString("default", {
									hour: "2-digit",
									minute: "2-digit",
							  })} ${eventBefore.event.summary}${eventBefore.conflict ? " (Conflict)" : ""}`
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
						eventAfter
							? `${eventAfter.event.startTime.toLocaleString("default", {
									hour: "2-digit",
									minute: "2-digit",
							  })} - ${eventAfter.event.endTime.toLocaleString("default", {
									hour: "2-digit",
									minute: "2-digit",
							  })} ${eventAfter.event.summary}${eventAfter.conflict ? " (Conflict)" : ""}`
							: "No events before",
					), //FIXME Add translation
				]),
			]),
		])
	}

	private getMessage(event: CalendarEvent, mail: Mail, recipient: string, method: CalendarMethod): Children {
		const ownAttendee = findAttendeeInAddresses(event.attendees, [recipient])
		if (method === CalendarMethod.REQUEST && ownAttendee != null) {
			// some mails contain more than one event that we want to be able to respond to
			// separately.
			if (isRepliedTo(mail) && ownAttendee.status !== CalendarAttendeeStatus.NEEDS_ACTION) {
				return m(".align-self-start.start.small", lang.get("alreadyReplied_msg"))
			} else if (this.ReplyButtons.isLoaded()) {
				return m(this.ReplyButtons.getLoaded(), {
					ownAttendee,
					setParticipation: async (status: CalendarAttendeeStatus) => sendResponse(event, recipient, status, mail),
				})
			} else {
				this.ReplyButtons.reload().then(m.redraw)
				return null
			}
		} else if (method === CalendarMethod.REPLY) {
			return m(".pt.align-self-start.start.small", lang.get("eventNotificationUpdated_msg"))
		} else {
			return null
		}
	}

	private async getEvents(attrs: EventBannerAttrs): Promise<
		Map<
			CalendarEvent,
			{
				event: CalendarEvent
				conflict: boolean
			}[]
		>
	> {
		if (!attrs.contents) {
			return new Map()
		}

		/*
		 * FIXME Refactor this
		 * A small mvp, performance and readability were not taken into account here, and they should have been =)
		 * - Load events that occurs on the same day as event start/end, load both because an event can start at one day and ends in another
		 * - Extract conflicting events following the logic bellow
		 *           [==============]
		 *   [=========] startTime < eventStart && (endTime <= eventEnd && endTime >= eventStart)
		 *     					[=========] startTime <= eventEnd && endTime >= eventEnd
		 *				[========]	startTime >= eventStart && endTime <= eventEnd
		 * [=========]
		 *  						[=========]
		 * - If there's no conflicting before event, get one from event list that starts and ends before the invitation
		 * - If there's no conflicting after event, get one from event list that starts and ends after the invitation
		 * - Build an array that should contain 1 >= n <= 3 items, 1 event before (nullable), the invitation, 1 event after (nullable)
		 * - Return this array ordered by startTime
		 */
		const eventToAgenda: Map<CalendarEvent, { event: CalendarEvent; conflict: boolean }[]> = new Map()
		const datesToLoad = new Set(attrs.contents.events.map((ev) => [getStartOfDay(ev.startTime), getStartOfDay(ev.endTime)]).flat())
		await attrs.eventsRepository.loadMonthsIfNeeded(Array.from(datesToLoad), stream(false), null)
		const events = attrs.eventsRepository.getEventsForMonths()() // Short and long events

		console.log("Loaded Events: ", events)

		for (const event of attrs.contents.events) {
			const startOfDay = getStartOfDay(event.startTime)
			const endOfDay = getStartOfDay(event.endTime)
			const eventsForStartDay = events.get(startOfDay.getTime()) ?? []
			const eventsForEndDay = events.get(endOfDay.getTime()) ?? []
			const allEvents = Array.from(new Set([...eventsForStartDay, ...eventsForEndDay]))

			console.log("Start / End events: ", { eventsForStartDay, eventsForEndDay })
			console.log("All events: ", allEvents)

			const conflictingEvents = allEvents.filter(
				(ev) =>
					(!eventHasSameFields(ev, event) && // FIXME what to do when user already replied ot the invite? currently filtering out
						ev.endTime > event.startTime &&
						ev.endTime <= event.endTime) || // Ends during event
					(ev.startTime >= event.startTime && ev.startTime < event.endTime) || // Starts during event
					(ev.startTime <= event.startTime && ev.endTime >= event.endTime), // Fully overlaps event
			)

			console.log("Conflicting Events: ", conflictingEvents)

			// Decides if we already have a conflicting event or if we should pick an event from event list that happens before the invitation
			const closestConflictingEventBeforeStartTime = conflictingEvents
				.filter((ev) => ev.startTime <= event.startTime)
				.reduce((closest: CalendarEvent, ev, index) => {
					if (!closest) return ev
					if (event.startTime.getTime() - ev.startTime.getTime() < event.startTime.getTime() - closest.startTime.getTime()) return ev
					return closest
				}, null)

			console.log({ closestConflictingEventBeforeStartTime })

			// Decides if we already have a conflicting event or if we should pick an event from event list that happens after the invitation
			const closestConflictingEventAfterStartTime = conflictingEvents
				.filter((ev) => ev.startTime > event.startTime)
				.reduce((closest: CalendarEvent, ev, index) => {
					if (!closest) return ev
					if (Math.abs(event.startTime.getTime() - ev.startTime.getTime()) < Math.abs(event.startTime.getTime() - closest.startTime.getTime()))
						return ev
					return closest
				}, null)
			console.log({ closestConflictingEventAfterStartTime })

			const eventList: { event: CalendarEvent; conflict: boolean }[] = []

			if (!closestConflictingEventBeforeStartTime) {
				const eventBefore = [...eventsForStartDay, ...eventsForEndDay]
					.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
					.find((ev) => ev.startTime < event.startTime)
				console.log("Event Before (Non-Conflicting): ", eventBefore)
				if (eventBefore) {
					eventList.push({ event: eventBefore, conflict: false })
				}
			} else {
				const eventBefore = conflictingEvents
					.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
					.find((ev) => ev.startTime < event.startTime && ev.endTime <= event.endTime && ev.endTime >= event.startTime)
				console.log("Event Before (Conflicting): ", eventBefore)
				if (eventBefore) {
					eventList.push({ event: eventBefore, conflict: true })
				}
			}

			if (!closestConflictingEventAfterStartTime) {
				const eventAfter = [...eventsForStartDay, ...eventsForEndDay]
					.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
					.find(
						(ev) =>
							(ev.startTime <= event.endTime && ev.endTime >= event.startTime) ||
							(ev.startTime >= event.startTime && ev.endTime <= event.endTime),
					)
				console.log("Event After (Non-Conflicting): ", eventAfter)
				if (eventAfter) {
					eventList.push({ event: eventAfter, conflict: false })
				}
			} else {
				const eventAfter = conflictingEvents
					.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
					.find(
						(ev) =>
							(ev.startTime <= event.endTime && ev.endTime >= event.endTime) || (ev.startTime >= event.startTime && ev.endTime <= event.endTime),
					)
				console.log("Event After (Conflicting): ", eventAfter)
				if (eventAfter) {
					eventList.push({ event: eventAfter, conflict: true })
				}
			}

			eventToAgenda.set(event, eventList)

			console.log(conflictingEvents)
			console.log(closestConflictingEventBeforeStartTime)
			console.log(closestConflictingEventAfterStartTime)
			console.log(eventToAgenda)
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
