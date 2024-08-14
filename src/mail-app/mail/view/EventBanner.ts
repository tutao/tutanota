import m, { Children, Component, Vnode } from "mithril"
import { CalendarAttendeeStatus, CalendarMethod } from "../../../common/api/common/TutanotaConstants"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { CalendarEvent, Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../../common/gui/base/Dialog"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog"
import { findAttendeeInAddresses } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../../common/gui/base/InfoBanner.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { isNotNull, LazyLoaded } from "@tutao/tutanota-utils"
import { ParsedIcalFileContent, ReplyResult } from "../../../calendar-app/calendar/view/CalendarInvites.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { mailLocator } from "../../mailLocator.js"
import { isRepliedTo } from "./MailViewerUtils.js"

export type EventBannerAttrs = {
	contents: ParsedIcalFileContent
	mail: Mail
	recipient: string
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
