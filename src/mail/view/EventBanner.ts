import m, { Children, Component, Vnode } from "mithril"
import { ButtonType } from "../../gui/base/Button.js"
import { CalendarAttendeeStatus, CalendarMethod } from "../../api/common/TutanotaConstants"
import { lang } from "../../misc/LanguageViewModel"
import type { CalendarEvent, Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { Dialog } from "../../gui/base/Dialog"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { isRepliedTo } from "../model/MailUtils"
import { findAttendeeInAddresses } from "../../api/common/utils/CommonCalendarUtils.js"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../gui/base/InfoBanner.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { ReplyResult } from "../../calendar/date/CalendarInvites.js"

export type EventBannerAttrs = {
	event: CalendarEvent
	mail: Mail
	recipient: string
	method: CalendarMethod
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
	private readonly ReplyButtons = new LazyLoaded(async () => (await import("../../calendar/view/eventpopup/EventPreviewView.js")).ReplyButtons)

	view({ attrs }: Vnode<EventBannerAttrs>): Children {
		const { event, mail } = attrs
		return m(InfoBanner, {
			message: () => this.getMessage(attrs),
			type: BannerType.Info,
			icon: Icons.People,
			buttons: [
				{
					label: "viewEvent_action",
					type: ButtonType.Secondary,
					click: (e, dom) =>
						import("../../calendar/date/CalendarInvites").then(({ showEventDetails }) =>
							showEventDetails(event, dom.getBoundingClientRect(), mail),
						),
				},
			],
		} satisfies InfoBannerAttrs)
	}

	private getMessage({ event, mail, recipient, method }: EventBannerAttrs): Children {
		const ownAttendee = findAttendeeInAddresses(event.attendees, [recipient])
		if (method === CalendarMethod.REQUEST && ownAttendee != null) {
			if (isRepliedTo(mail) || ownAttendee.status !== CalendarAttendeeStatus.NEEDS_ACTION) {
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
		import("../../calendar/date/CalendarInvites").then(async ({ getLatestEvent, replyToEventInvitation }) => {
			const latestEvent = await getLatestEvent(event)
			const ownAttendee = findAttendeeInAddresses(latestEvent.attendees, [recipient])

			if (ownAttendee == null) {
				Dialog.message("attendeeNotFound_msg")
				return
			}

			const replyResult = await replyToEventInvitation(latestEvent, ownAttendee, status, previousMail)
			if (replyResult === ReplyResult.ReplySent) {
				ownAttendee.status = status
			}
			m.redraw()
		}),
	)
}
