import m, { Children, Component, Vnode } from "mithril"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { ParsedIcalFileContent, ReplyResult } from "../../../calendar-app/calendar/view/CalendarInvites.js"
import { mailLocator } from "../../mailLocator.js"
import { CalendarEventsRepository } from "../../../common/calendar/date/CalendarEventsRepository.js"
import { CalendarEvent, Mail } from "../../../common/api/entities/tutanota/TypeRefs"
import { CalendarAttendeeStatus } from "../../../common/api/common/TutanotaConstants.js"
import { findAttendeeInAddresses } from "../../../common/api/common/utils/CommonCalendarUtils"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { Dialog } from "../../../common/gui/base/Dialog"
import { locator } from "../../../common/api/main/CommonLocator"
import type { EventBannerImpl, EventBannerImplAttrs } from "../../gui/date/EventBannerImpl"
import { EventBannerSkeleton } from "../../gui/EventBannerSkeleton"

export type EventBannerAttrs = {
	iCalContents: ParsedIcalFileContent
	mail: Mail
	recipient: string
	eventsRepository: CalendarEventsRepository
	groupColors: Map<Id, string>
}

/**
 * displayed above a mail that contains a calendar invite.
 * Its main function is to make it possible to inspect the event with the CalendarEventPopup, to quick respond
 * your attendance with Accept/Decline/Tentative while adding the event to your personal calendar
 */
export class EventBanner implements Component<EventBannerAttrs> {
	private impl: LazyLoaded<{
		EventBannerImpl: Class<EventBannerImpl>
	}> = new LazyLoaded(() => import("../../gui/date/EventBannerImpl.js").finally(() => m.redraw()))

	oninit() {
		this.impl.load()
	}

	view({ attrs }: Vnode<EventBannerAttrs>): Children {
		const { iCalContents } = attrs
		if (iCalContents == null || iCalContents.events.length === 0) {
			return null
		}

		if (this.impl.isLoaded()) {
			return m(this.impl.getLoaded().EventBannerImpl, {
				...attrs,
				iCalContents,
				sendResponse,
			} satisfies EventBannerImplAttrs)
		} else {
			return m(EventBannerSkeleton)
		}
	}
}

/** show a progress dialog while sending a response to the event's organizer and update the ui. will always send a reply, even if the status did not change. */
export function sendResponse(event: CalendarEvent, recipient: string, status: CalendarAttendeeStatus, previousMail: Mail): Promise<boolean> {
	return showProgressDialog(
		"pleaseWait_msg",
		import("../../../calendar-app/calendar/view/CalendarInvites.js").then(async ({ getLatestEvent }) => {
			const latestEvent = await getLatestEvent(event)
			const ownAttendee = findAttendeeInAddresses(latestEvent.attendees, [recipient])
			const calendarInviteHandler = await locator.calendarInviteHandler()

			if (ownAttendee == null) {
				Dialog.message("attendeeNotFound_msg")
				return false
			}

			const mailboxDetails = await mailLocator.mailModel.getMailboxDetailsForMail(previousMail)
			if (mailboxDetails == null) return false

			const replyResult = await calendarInviteHandler.replyToEventInvitation(latestEvent, ownAttendee, status, previousMail, mailboxDetails)
			if (replyResult === ReplyResult.ReplySent) {
				ownAttendee.status = status
			}
			m.redraw()
			return true
		}),
	)
}
