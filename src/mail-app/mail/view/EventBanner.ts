import m, { Children, Component, Vnode } from "mithril"
import { CalendarAttendeeStatus, CalendarMethod } from "../../../common/api/common/TutanotaConstants"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { CalendarEvent, Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../../common/gui/base/Dialog"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { findAttendeeInAddresses } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../../common/gui/base/InfoBanner.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { deduplicate, deepEqual, getStartOfDay, isNotNull, LazyLoaded } from "@tutao/tutanota-utils"
import { ParsedIcalFileContent, ReplyResult } from "../../../calendar-app/calendar/view/CalendarInvites.js"
import { mailLocator } from "../../mailLocator.js"
import { isRepliedTo } from "./MailViewerUtils.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import stream from "mithril/stream"

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

	constructor(attrs: Vnode<EventBannerAttrs>) {
		this.getEvents(attrs.attrs)
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

		return messages.map(({ event, message }) =>
			m(InfoBanner, {
				message: () => message,
				type: BannerType.Info,
				icon: Icons.People,
				buttons: [
					{
						label: "viewEvent_action",
						click: (e, dom) =>
							import("../../../calendar-app/calendar/view/CalendarInvites.js").then(({ showEventDetails }) =>
								showEventDetails(event, dom.getBoundingClientRect(), mail),
							),
					},
				],
			} satisfies InfoBannerAttrs),
		)
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

	private async getEvents(attrs: EventBannerAttrs) {
		if (!attrs.contents) {
			return
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
		const datesToLoad = attrs.contents.events.map((ev) => [getStartOfDay(ev.startTime), getStartOfDay(ev.endTime)]).flat()
		await attrs.eventsRepository.loadMonthsIfNeeded(datesToLoad, stream(false), null)
		const events = attrs.eventsRepository.getEventsForMonths()()

		for (const event of attrs.contents.events) {
			const start = getStartOfDay(event.startTime)
			const end = getStartOfDay(event.endTime)
			const eventsForStartDay = events.get(start.getTime()) ?? []
			const eventsForEndDay = events.get(end.getTime()) ?? []

			const conflictingEvents = deduplicate(
				[
					...eventsForStartDay.filter(
						(ev) =>
							(ev.startTime < event.startTime && ev.endTime <= event.endTime && ev.endTime >= event.startTime) ||
							(ev.startTime <= event.endTime && ev.endTime >= event.endTime) ||
							(ev.startTime >= event.startTime && ev.endTime <= event.endTime),
					),
					...eventsForEndDay.filter(
						(ev) =>
							(ev.startTime < event.startTime && ev.endTime <= event.endTime) ||
							(ev.startTime <= event.endTime && ev.endTime >= event.endTime) ||
							(ev.startTime >= event.startTime && ev.endTime <= event.endTime),
					),
				],
				(a, b) => deepEqual(a._id, b._id),
			)

			// Decides if we already have a conflicting event or if we should pick an event from event list that happens before the invitation
			const needAnEventBefore = !conflictingEvents.some(
				(ev) => ev.startTime < event.startTime && ev.endTime <= event.endTime && ev.endTime >= event.startTime,
			)

			// Decides if we already have a conflicting event or if we should pick an event from event list that happens after the invitation
			const needAnEventAfter = !conflictingEvents.some(
				(ev) => (ev.startTime <= event.endTime && ev.endTime >= event.endTime) || (ev.startTime >= event.startTime && ev.endTime <= event.endTime),
			)

			const eventList: Array<CalendarEvent> = []

			if (needAnEventBefore) {
				const eventBefore = [...eventsForStartDay, ...eventsForEndDay]
					.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
					.find((ev) => ev.startTime < event.startTime)
				console.log("Event Before (Non-Conflicting): ", eventBefore)
				if (eventBefore) {
					eventList.push(eventBefore)
				}
			} else {
				const eventBefore = conflictingEvents
					.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
					.find((ev) => ev.startTime < event.startTime && ev.endTime <= event.endTime && ev.endTime >= event.startTime)
				console.log("Event Before (Conflicting): ", eventBefore)
				if (eventBefore) {
					eventList.push(eventBefore)
				}
			}

			if (needAnEventAfter) {
				const eventAfter = [...eventsForStartDay, ...eventsForEndDay]
					.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
					.find(
						(ev) =>
							(ev.startTime <= event.endTime && ev.endTime >= event.startTime) ||
							(ev.startTime >= event.startTime && ev.endTime <= event.endTime),
					)
				console.log("Event After (Non-Conflicting): ", eventAfter)
				if (eventAfter) {
					eventList.push(eventAfter)
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
					eventList.push(eventAfter)
				}
			}

			eventList.push(event)

			console.log(conflictingEvents)
			console.log(needAnEventBefore)
			console.log(needAnEventAfter)
			console.log(eventList.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()))
		}
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
