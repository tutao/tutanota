import m, {Children, Component, Vnode} from "mithril"
import {MessageBox} from "../../gui/base/MessageBox.js"
import {px, size} from "../../gui/size"
import {Button, ButtonType} from "../../gui/base/Button.js"
import {CalendarAttendeeStatus, CalendarMethod} from "../../api/common/TutanotaConstants"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {theme} from "../../gui/theme"
import type {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {Dialog} from "../../gui/base/Dialog"
import type {CalendarEvent} from "../../api/entities/tutanota/TypeRefs.js"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import type {lazy} from "@tutao/tutanota-utils"
import {isRepliedTo} from "../model/MailUtils"

export type Attrs = {
	event: CalendarEvent
	mail: Mail
	recipient: string
	method: CalendarMethod
}

export class EventBanner implements Component<Attrs> {
	view({attrs: {event, mail, recipient, method}}: Vnode<Attrs>): Children {
		const ownAttendee = event.attendees.find(a => a.address.address === recipient)
		return m(
			MessageBox,
			{
				style: {
					alignItems: "start",
					paddingBottom: "0",
					maxWidth: "100%",
					display: "flex",
					flexDirection: "column",
					paddingLeft: px(size.hpad_large),
					paddingRight: px(size.hpad_large),
					overflow: "hidden",
					paddingTop: "0",
				},
			},
			[
				m(
					"",
					method === CalendarMethod.REQUEST && ownAttendee
						? isRepliedTo(mail) || (ownAttendee && ownAttendee.status !== CalendarAttendeeStatus.NEEDS_ACTION)
							? m(".pt.align-self-start.start.smaller", lang.get("alreadyReplied_msg"))
							: renderReplyButtons(event, mail, recipient)
						: method === CalendarMethod.REPLY
							? m(".pt.align-self-start.start.smaller", lang.get("eventNotificationUpdated_msg"))
							: null,
				),
				m(
					".ml-negative-s.limit-width.align-self-start",
					m(Button, {
						label: "viewEvent_action",
						type: ButtonType.Secondary,
						click: (e, dom) =>
							import("../../calendar/date/CalendarInvites").then(({showEventDetails}) =>
								showEventDetails(event, dom.getBoundingClientRect(), mail),
							),
					}),
				),
			],
		)
	}
}

export type BannerButtonAttrs = {
	borderColor: string
	color: string
	click: () => unknown
	text: TranslationKey | lazy<string>
}

export class BannerButton implements Component<BannerButtonAttrs> {
	view({attrs}: Vnode<BannerButtonAttrs>): Children {
		return m(
			"button.border-radius.mr-s.center",
			{
				style: {
					border: `2px solid ${attrs.borderColor}`,
					background: "transparent",
					color: attrs.color,
					width: "min-content",
					padding: px(size.hpad_button),
					minWidth: "60px",
				},
				onclick: attrs.click,
			},
			lang.getMaybeLazy(attrs.text),
		)
	}
}

function renderReplyButtons(event: CalendarEvent, previousMail: Mail, recipient: string) {
	return [
		m(".pt", lang.get("invitedToEvent_msg")),
		m(".flex.items-center.mt", [
			m(BannerButton, {
				text: "yes_label",
				click: () => sendResponse(event, recipient, CalendarAttendeeStatus.ACCEPTED, previousMail),
				borderColor: theme.content_button,
				color: theme.content_fg,
			}),
			m(BannerButton, {
				text: "maybe_label",
				click: () => sendResponse(event, recipient, CalendarAttendeeStatus.TENTATIVE, previousMail),
				borderColor: theme.content_button,
				color: theme.content_fg,
			}),
			m(BannerButton, {
				text: "no_label",
				click: () => sendResponse(event, recipient, CalendarAttendeeStatus.DECLINED, previousMail),
				borderColor: theme.content_button,
				color: theme.content_fg,
			}),
		]),
	]
}

function sendResponse(event: CalendarEvent, recipient: string, status: CalendarAttendeeStatus, previousMail: Mail) {
	showProgressDialog(
		"pleaseWait_msg",
		import("../../calendar/date/CalendarInvites").then(({getLatestEvent, replyToEventInvitation}) => {
			return getLatestEvent(event).then(latestEvent => {
				const ownAttendee = latestEvent.attendees.find(a => a.address.address === recipient)

				if (ownAttendee == null) {
					Dialog.message("attendeeNotFound_msg")
					return
				}

				replyToEventInvitation(latestEvent, ownAttendee, status, previousMail)
					.then(() => (ownAttendee.status = status))
					.then(m.redraw)
			})
		}),
	)
}