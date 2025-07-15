import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { makeInvitationCalendarFile } from "../export/CalendarExporter.js"
import { getAttendeeStatus, MailMethod, mailMethodToCalendarMethod } from "../../../common/api/common/TutanotaConstants.js"
import { getTimeZone } from "../../../common/calendar/date/CalendarUtils.js"
import type { CalendarEvent, CalendarEventAttendee, EncryptedMailAddress } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { assertNotNull, difference, noOp, ofClass } from "@tutao/tutanota-utils"
import type { SendMailModel } from "../../../common/mailFunctionality/SendMailModel.js"
import { windowFacade } from "../../../common/misc/WindowFacade.js"
import { RecipientsNotFoundError } from "../../../common/api/common/error/RecipientsNotFoundError.js"
import { findRecipientWithAddress } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"

import { calendarAttendeeStatusSymbol, formatEventDuration } from "../gui/CalendarGuiUtils.js"
import { RecipientField } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { getLocationUrl } from "../gui/eventpopup/EventPreviewView"

export class CalendarNotificationSender {
	/** Used for knowing how many emails are in the process of being sent. */
	private countDownLatch: number

	constructor() {
		this.countDownLatch = 0
	}

	sendInvite(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void> {
		const message = lang.get("eventInviteMail_msg", {
			"{event}": event.summary,
		})
		const sender = assertOrganizer(event).address
		return this.sendCalendarFile({
			sendMailModel,
			method: MailMethod.ICAL_REQUEST,
			subject: message, // FIXME Subject
			body: makeEventInviteEmailBody(sendMailModel.isPlainTextMail(), {
				event,
				infoBannerMessage: "",
				eventInviteEmailType: EventInviteEmailType.INVITE,
			}),
			event,
			sender,
		})
	}

	sendUpdate(event: CalendarEvent, sendMailModel: SendMailModel, oldEvent: CalendarEvent): Promise<void> {
		const message = lang.get("eventUpdated_msg", {
			"{event}": event.summary,
		})
		const infoBannerMessage = this.getInfoBannerMessage(EventInviteEmailType.UPDATE)
		const changedFields = this.getDiff(oldEvent, event)
		const sender = assertOrganizer(event).address
		return this.sendCalendarFile({
			sendMailModel,
			method: MailMethod.ICAL_REQUEST,
			subject: message,
			body: makeEventInviteEmailBody(sendMailModel.isPlainTextMail(), {
				event,
				infoBannerMessage,
				eventInviteEmailType: EventInviteEmailType.UPDATE,
				changedFields,
			}),
			event,
			sender,
		})
	}

	sendCancellation(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void> {
		const message = lang.get("eventCancelled_msg", {
			"{event}": event.summary,
		})
		const infoBannerMessage = this.getInfoBannerMessage(EventInviteEmailType.CANCEL)
		const sender = assertOrganizer(event).address
		return this.sendCalendarFile({
			sendMailModel,
			method: MailMethod.ICAL_CANCEL,
			subject: message,
			body: makeEventInviteEmailBody(sendMailModel.isPlainTextMail(), {
				event,
				infoBannerMessage,
				eventInviteEmailType: EventInviteEmailType.CANCEL,
			}),
			event,
			sender,
		}).catch(
			ofClass(RecipientsNotFoundError, (e) => {
				// we want to delete the event even if the recipient is not an existing tutanota address
				// and just exclude them from sending out updates but leave the event untouched for other recipients
				const invalidRecipients = e.message.split("\n")
				let hasRemovedRecipient = false
				for (const invalidRecipient of invalidRecipients) {
					const recipientInfo = findRecipientWithAddress(sendMailModel.bccRecipients(), invalidRecipient)

					if (recipientInfo) {
						hasRemovedRecipient = sendMailModel.removeRecipient(recipientInfo, RecipientField.BCC, false) || hasRemovedRecipient
					}
				}

				// only try sending again if we successfully removed a recipient and there are still other recipients
				if (hasRemovedRecipient && sendMailModel.allRecipients().length) {
					return this.sendCancellation(event, sendMailModel)
				}
			}),
		)
	}

	private getInfoBannerMessage(eventInviteEmailType: EventInviteEmailType, senderName?: string) {
		const icon = this.getEmailIcon(eventInviteEmailType)
		const translationKey = this.getTranslationKey(eventInviteEmailType)
		return `${icon ? icon + " " : ""}${lang.get(translationKey, senderName ? { "{name}": senderName } : {})}`
	}

	private getTranslationKey(eventInviteEmailType: EventInviteEmailType): TranslationKey {
		switch (eventInviteEmailType) {
			case EventInviteEmailType.CANCEL:
				return "canceledEventInfo_msg"
			case EventInviteEmailType.UPDATE:
				return "updatedEventInfo_msg"
			case EventInviteEmailType.REPLY_ACCEPT:
				return "replyAcceptEventInfo_msg"
			case EventInviteEmailType.REPLY_TENTATIVE:
				return "replyTentativeEventInfo_msg"
			case EventInviteEmailType.REPLY_DECLINE:
				return "replyDeclineEventInfo_msg"
			default:
				return "emptyString_msg"
		}
	}

	private getEmailIcon(eventInviteEmailType: EventInviteEmailType) {
		switch (eventInviteEmailType) {
			case EventInviteEmailType.CANCEL:
				return ""
			case EventInviteEmailType.UPDATE:
				return ""
			case EventInviteEmailType.REPLY_ACCEPT:
				return ""
			case EventInviteEmailType.REPLY_TENTATIVE:
				return ""
			case EventInviteEmailType.REPLY_DECLINE:
				return ""
			default:
				return ""
		}
	}

	/**
	 * send a response mail to the organizer of an event
	 * @param event the event to respond to (included as a .ics file attachment)
	 * @param sendMailModel used to actually send the mail
	 */
	async sendResponse(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void> {
		const sendAs = sendMailModel.getSender()
		const infoBannerMessage = lang.get("repliedToEventInvite_msg", {
			"{event}": event.summary,
		})
		const organizer = assertOrganizer(event)
		const body = makeEventInviteEmailBody(sendMailModel.isPlainTextMail(), {
			event,
			infoBannerMessage,
			eventInviteEmailType: sendMailModel.emailType,
		})
		return this.sendCalendarFile({
			event,
			sendMailModel,
			method: MailMethod.ICAL_REPLY,
			subject: infoBannerMessage,
			body: body,
			sender: sendAs,
		})
	}

	private async sendCalendarFile({
		sendMailModel,
		method,
		subject,
		event,
		body,
		sender,
	}: {
		sendMailModel: SendMailModel
		method: MailMethod
		subject: string
		event: CalendarEvent
		body: string
		sender: string
	}): Promise<void> {
		const inviteFile = makeInvitationCalendarFile(event, mailMethodToCalendarMethod(method), new Date(), getTimeZone())
		sendMailModel.setSender(sender)
		sendMailModel.attachFiles([inviteFile])
		sendMailModel.setSubject(subject)
		sendMailModel.setBody(body)

		this.sendStart()

		await sendMailModel.send(method).finally(() => this.sendEnd())
	}

	private _windowUnsubscribe: (() => void) | null = null

	private sendStart() {
		this.countDownLatch++

		if (this.countDownLatch === 1) {
			this._windowUnsubscribe = windowFacade.addWindowCloseListener(noOp)
		}
	}

	private sendEnd() {
		this.countDownLatch--

		if (this.countDownLatch === 0 && this._windowUnsubscribe) {
			this._windowUnsubscribe()

			this._windowUnsubscribe = null
		}
	}

	private getDiff(oldEvent: CalendarEvent, event: CalendarEvent) {
		const removed = difference(oldEvent.attendees, event.attendees, (a, b) => a.address.address === b.address.address)
		const added = difference(event.attendees, oldEvent.attendees, (a, b) => a.address.address === b.address.address)
		return {
			summary: oldEvent.summary !== event.summary,
			when: oldEvent.startTime.getTime() !== event.startTime.getTime() || oldEvent.endTime.getTime() !== event.endTime.getTime(),
			location: oldEvent.location !== event.location,
			description: oldEvent.description.trim() !== event.description.trim(),
			organizer: oldEvent.organizer?.address !== event.organizer?.address,
			attendee: {
				removed,
				added,
			},
		}
	}
}

function whenLine(event: CalendarEvent, highlightChange: boolean, theme: EmailTheme): string {
	const duration = formatEventDuration(event, getTimeZone(), true)
	return newLine(getLabel("when_label", highlightChange), duration, false)
}

function organizerLine(event: CalendarEvent, highlightChange: boolean, theme: EmailTheme): string {
	const { organizer } = event
	const attendee = event.attendees.find((attendee) => attendee.address.address === organizer?.address)
	return newLine(
		getLabel("organizer_label", highlightChange),
		`${organizer?.name} <span style="color: ${theme.textSecondaryColor}">${organizer?.address}</span> ${
			attendee ? calendarAttendeeStatusSymbol(getAttendeeStatus(attendee)) : ""
		}`,
	)
}

function attendeesLine(
	event: CalendarEvent,
	attendeesChanges: {
		added: CalendarEventAttendee[]
		removed: CalendarEventAttendee[]
	},
	theme: EmailTheme,
): string {
	const { organizer } = event
	const hasChanges = !!(attendeesChanges.added.length || attendeesChanges.removed.length)

	function buildAttendee(a: CalendarEventAttendee, removed: boolean) {
		if (a.address.address === organizer?.address) {
			return ""
		}
		return makeAttendee(assertNotNull(organizer), a, theme, removed)
	}

	const attendees = event.attendees.map((a) => buildAttendee(a, false))
	attendees.push(...attendeesChanges.removed.map((a) => buildAttendee(a, true)))

	return newLine(getLabel("guests_label", hasChanges), `<table style="line-height: 1rem;">${attendees.join("")}</table>`)
}

function makeAttendee(organizer: EncryptedMailAddress, attendee: CalendarEventAttendee, theme: EmailTheme, removed: boolean = false): string {
	const content = `
				<span style="${removed ? `text-decoration: line-through; color: ${theme.textSecondaryColor}` : ""}">
				${attendee.address.name || ""} <span style="color:${theme.textSecondaryColor};">${attendee.address.address}</span>
				</span>
				${
					removed
						? `<span style='color: ${theme.textSecondaryColor}'>(${lang.get("removed_label")})</span>`
						: calendarAttendeeStatusSymbol(getAttendeeStatus(attendee))
				}
	`

	return `<tr><td>${content}</td></tr>`
}

function locationLine(event: CalendarEvent, highlightChange: boolean, theme: EmailTheme): string {
	const content = `
		<span>${event.location}</span><br>
		<a href=${getLocationUrl(event.location).toString()} target="_blank" referrerpolicy="no-referrer" style="color: ${theme.linkColor}">View on map</a>
	`
	return event.location ? newLine(getLabel("location_label", highlightChange), content) : ""
}

function descriptionLine(event: CalendarEvent, highlightChange: boolean, theme: EmailTheme): string {
	// We can't actually highlight the description because it can have richtext/html
	return event.description ? newLine(getLabel("description_label", highlightChange), `<div>${event.description}</div>`) : ""
}

function getLabel(translationKey: TranslationKey, highlightChange: boolean) {
	return highlightChange ? highlight(lang.get(translationKey)) : lang.get(translationKey)
}

function highlight(content: string) {
	// TODO [colors] Use new material like colors tokens
	return `<span style="background-color: #FFEFCC; border-radius: 8px; color: #655000; padding: 4px 8px">
				${content}
			</span>`
}

function newLine(label: string, content: string, applyPaddingTop: boolean = true): string {
	return `<tr>
				<th style="text-align: left; padding-bottom: 4px; text-transform: uppercase; ${applyPaddingTop ? "padding-top: 28px;" : ""}"><strong>${label}</strong></th>
			</tr>
			<tr>
				<td>${content}</td>
			</tr>`
}

// TODO [colors] Use new material like colors tokens
type EmailTheme = {
	textPrimaryColor: string
	textSecondaryColor: string
	linkColor: string
	infoBanner?: {
		border: string
		background: string
		text: string
	}
}
const EmailThemes: Record<string, EmailTheme> = {
	invite: {
		textPrimaryColor: "#303030",
		textSecondaryColor: "#707070",
		linkColor: "#013E85",
	},
	update: {
		textPrimaryColor: "#303030",
		textSecondaryColor: "#707070",
		linkColor: "#013E85",
		infoBanner: {
			border: "#655000",
			background: "#FFEFCC",
			text: "#655000",
		},
	},
	cancel: {
		textPrimaryColor: "#707070",
		textSecondaryColor: "#707070",
		linkColor: "#707070",
		infoBanner: {
			border: "#707070",
			background: "#EAEAEA",
			text: "#303030",
		},
	},
	replyAccept: {
		textPrimaryColor: "#303030",
		textSecondaryColor: "#707070",
		linkColor: "#013E85",
		infoBanner: {
			border: "#1B5E3C",
			background: "#E9FFED",
			text: "#1B5E3C",
		},
	},
	replyTentative: {
		textPrimaryColor: "#303030",
		textSecondaryColor: "#707070",
		linkColor: "#013E85",
		infoBanner: {
			border: "#C5C7C7",
			background: "#FFFFFF",
			text: "#303030",
		},
	},
	replyDecline: {
		textPrimaryColor: "#303030",
		textSecondaryColor: "#707070",
		linkColor: "#013E85",
		infoBanner: {
			border: "#A80710",
			background: "#FFDAD6",
			text: "#A80710",
		},
	},
}

export const enum EventInviteEmailType {
	INVITE,
	UPDATE,
	CANCEL,
	REPLY_ACCEPT,
	REPLY_TENTATIVE,
	REPLY_DECLINE,
}

function getEmailTheme(emailType: EventInviteEmailType): EmailTheme {
	switch (emailType) {
		case EventInviteEmailType.INVITE:
			return EmailThemes.invite
		case EventInviteEmailType.UPDATE:
			return EmailThemes.update
		case EventInviteEmailType.CANCEL:
			return EmailThemes.cancel
		case EventInviteEmailType.REPLY_ACCEPT:
			return EmailThemes.replyAccept
		case EventInviteEmailType.REPLY_TENTATIVE:
			return EmailThemes.replyTentative
		case EventInviteEmailType.REPLY_DECLINE:
			return EmailThemes.replyDecline
	}
}

function makeEventInviteEmailBody(isPlainText: boolean, emailBodyIngredients: EmailBodyIngredients) {
	return isPlainText ? makePlainTextBody(emailBodyIngredients) : makeHTMLBody(emailBodyIngredients)
}

interface EmailBodyIngredients {
	event: CalendarEvent
	infoBannerMessage: string
	eventInviteEmailType: EventInviteEmailType
	changedFields?: {
		attendee: { added: CalendarEventAttendee[]; removed: CalendarEventAttendee[] }
		description: boolean
		location: boolean
		organizer: boolean
		summary: boolean
		when: boolean
	}
}

function makePlainTextBody({ event, infoBannerMessage, eventInviteEmailType, changedFields }: EmailBodyIngredients) {
	const duration = formatEventDuration(event, getTimeZone(), true)
	return `
> ${infoBannerMessage}
<br><br>
${lang.get("event_label")}: ${event.summary}
<br><br>
${lang.get("when_label")}:
<br>
${duration}
<br><br>
${lang.get("location_label")}:
<br>
${event.location}
<br><br>
${lang.get("description_label")}:
<br>
${event.description}
<br><br>
${lang.get("organizer_label")}:
<br>
${event.organizer?.name ? event.organizer?.name + " " : ""}${event.organizer?.address}
<br><br>
${lang.get("guests_label")}:
<br>
${event.attendees
	.map((a) => {
		return `${a.address.name ? a.address.name + " " : ""}${a.address.address}`
	})
	.join("<br>")}
`
}

function makeHTMLBody({ event, infoBannerMessage, eventInviteEmailType, changedFields }: EmailBodyIngredients) {
	const theme = getEmailTheme(eventInviteEmailType)
	return `
	${
		eventInviteEmailType != EventInviteEmailType.INVITE
			? `	<div style="margin-bottom: 16px; padding: 24px 32px; border: 1px solid ${theme.infoBanner?.border}; border-radius: 6px; background-color: ${theme.infoBanner?.background}; color: ${theme.infoBanner?.text}">
					${infoBannerMessage}
				</div>`
			: ""
	}
	<div style="margin-bottom: 16px; padding: 24px 32px; border: 1px solid #ddd; border-radius: 6px; color: ${theme.textPrimaryColor};">
		<table>
			<tr>
				<td>
					<h1 style="font-size: 24px; margin: 0">
						<strong>${changedFields?.summary ? highlight("Event:") : "Event:"}</strong>${" " + event.summary}
					</h1>
				</td>
			</tr>
		</table>
		
		<hr style="border-width: 0; margin: 24px 0; background: #ddd; color: #ddd; height:1px">
		
		<table style="width: 100%;">
			${whenLine(event, changedFields?.when ?? false, theme)}
			${locationLine(event, changedFields?.location ?? false, theme)}
			${descriptionLine(event, changedFields?.description ?? false, theme)}
			${organizerLine(event, changedFields?.organizer ?? false, theme)}
			${attendeesLine(event, changedFields?.attendee ?? { added: [], removed: [] }, theme)}
		</table>
	</div>
	<table style="padding: 24px 0">
		<tr>
			<td>
				This invitation was securely sent from <strong><a href="https://tuta.com" target="_blank">Tuta Calendar</a></strong>
			<ts>
		</tr>
	</table>
	`
}

function assertOrganizer(event: CalendarEvent): EncryptedMailAddress {
	if (event.organizer == null) {
		throw new ProgrammingError("Cannot send event update without organizer")
	}

	return event.organizer
}

export const calendarNotificationSender: CalendarNotificationSender = new CalendarNotificationSender()
