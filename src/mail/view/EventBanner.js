//@flow
import m from "mithril"
import {MessageBoxN} from "../../gui/base/MessageBoxN"
import {px, size} from "../../gui/size"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import type {CalendarAttendeeStatusEnum, CalendarMethodEnum} from "../../api/common/TutanotaConstants"
import {CalendarAttendeeStatus, CalendarMethod, ReplyType} from "../../api/common/TutanotaConstants"
import {lang} from "../../misc/LanguageViewModel"
import {BannerButton} from "../../gui/base/Banner"
import {theme} from "../../gui/theme"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {Dialog} from "../../gui/base/Dialog"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {showProgressDialog} from "../../gui/ProgressDialog"

export type Attrs = {
	event: CalendarEvent,
	mail: Mail,
	recipient: string,
	method: CalendarMethodEnum
}

export class EventBanner implements MComponent<Attrs> {
	view({attrs: {event, mail, recipient, method}}: Vnode<Attrs>): Children {
		const ownAttendee = event.attendees.find((a) => a.address.address === recipient)

		return m(MessageBoxN, {
				style: {
					alignItems: "start",
					paddingBottom: "0",
					maxWidth: "100%",
					marginTop: px(size.vpad),
					display: "flex",
					flexDirection: "column",
					paddingLeft: px(size.hpad_large),
					paddingRight: px(size.hpad_large),
					overflow: "hidden",
					paddingTop: "0",
				}
			}, [
				m("", method === CalendarMethod.REQUEST && ownAttendee
					? mail.replyType === ReplyType.REPLY || (ownAttendee && ownAttendee.status !== CalendarAttendeeStatus.NEEDS_ACTION)
						? m(".pt.align-self-start.start.smaller", lang.get("alreadyReplied_msg"))
						: renderReplyButtons(event, mail, recipient)
					: method === CalendarMethod.REPLY
						? m(".pt.align-self-start.start.smaller", lang.get("eventNotificationUpdated_msg"))
						: null),
				m(".ml-negative-s.limit-width.align-self-start", m(ButtonN, {
					label: "viewEvent_action",
					type: ButtonType.Secondary,
					click: () => import("../../calendar/date/CalendarInvites").then(({showEventDetails}) => showEventDetails(event, mail))
				})),
			],
		)
	}
}

function renderReplyButtons(event: CalendarEvent, previousMail: Mail, recipient: string) {
	return [
		m(".pt", lang.get("invitedToEvent_msg")),
		m(".flex.items-center.mt", [
			m(BannerButton, {
				text: lang.get("yes_label"),
				click: () => sendResponse(event, recipient, CalendarAttendeeStatus.ACCEPTED, previousMail),
				borderColor: theme.content_button,
				color: theme.content_fg
			}),
			m(BannerButton, {
				text: lang.get("maybe_label"),
				click: () => sendResponse(event, recipient, CalendarAttendeeStatus.TENTATIVE, previousMail),
				borderColor: theme.content_button,
				color: theme.content_fg
			}),
			m(BannerButton, {
				text: lang.get("no_label"),
				click: () => sendResponse(event, recipient, CalendarAttendeeStatus.DECLINED, previousMail),
				borderColor: theme.content_button,
				color: theme.content_fg
			}),
		])
	]
}

function sendResponse(event: CalendarEvent, recipient: string, status: CalendarAttendeeStatusEnum, previousMail: Mail) {
	showProgressDialog("pleaseWait_msg", import("../../calendar/date/CalendarInvites")
		.then(({getLatestEvent, replyToEventInvitation}) => {
			return getLatestEvent(event).then(latestEvent => {
				const ownAttendee = latestEvent.attendees.find((a) => a.address.address === recipient)
				if (ownAttendee == null) {
					Dialog.error("attendeeNotFound_msg")
					return
				}
				replyToEventInvitation(latestEvent, ownAttendee, status, previousMail)
					.then(() => ownAttendee.status = status)
					.then(m.redraw)
			})
		})
	)
}