import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { makeInvitationCalendarFile } from "../export/CalendarExporter.js"
import { getAttendeeStatus, MailMethod, mailMethodToCalendarMethod } from "../../../common/api/common/TutanotaConstants.js"
import { getTimeZone } from "../../../common/calendar/date/CalendarUtils.js"
import type { CalendarEvent, CalendarEventAttendee, EncryptedMailAddress } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { assertNotNull, noOp, ofClass } from "@tutao/tutanota-utils"
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
			subject: message,
			body: makeEventInviteEmailBody(sender, event, message),
			event,
			sender,
		})
	}

	sendUpdate(event: CalendarEvent, sendMailModel: SendMailModel, oldEvent: CalendarEvent): Promise<void> {
		const message = lang.get("eventUpdated_msg", {
			"{event}": event.summary,
		})
		const sender = assertOrganizer(event).address
		return this.sendCalendarFile({
			sendMailModel,
			method: MailMethod.ICAL_REQUEST,
			subject: message,
			body: makeEventInviteEmailBody(sender, event, message, oldEvent),
			event,
			sender,
		})
	}

	sendCancellation(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void> {
		const message = lang.get("eventCancelled_msg", {
			"{event}": event.summary,
		})
		const sender = assertOrganizer(event).address
		return this.sendCalendarFile({
			sendMailModel,
			method: MailMethod.ICAL_CANCEL,
			subject: message,
			body: makeEventInviteEmailBody(sender, event, message),
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

	/**
	 * send a response mail to the organizer of an event
	 * @param event the event to respond to (included as a .ics file attachment)
	 * @param sendMailModel used to actually send the mail
	 */
	async sendResponse(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void> {
		const sendAs = sendMailModel.getSender()
		const message = lang.get("repliedToEventInvite_msg", {
			"{event}": event.summary,
		})
		const organizer = assertOrganizer(event)
		const body = makeEventInviteEmailBody(organizer.address, event, message)
		return this.sendCalendarFile({
			event,
			sendMailModel,
			method: MailMethod.ICAL_REPLY,
			subject: message,
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
}

function whenLine(event: CalendarEvent, highlightChange: boolean): string {
	const duration = formatEventDuration(event, getTimeZone(), true)
	return newLine(getLabel("when_label", highlightChange), duration, false)
}

function organizerLine(event: CalendarEvent, highlightChange: boolean): string {
	const { organizer } = event
	return newLine(getLabel("organizer_label", highlightChange), `${organizer?.name} <span style="color: #707070">${organizer?.address}</span>`)
}

function attendeesLine(
	event: CalendarEvent,
	attendeesChanges: {
		removed: Array<string>
		added: Array<string>
	},
): string {
	// FIXME Icon and handle additions and removals correctly
	const { organizer } = event
	const hasChanges = !!(attendeesChanges.added.length || attendeesChanges.removed.length)
	const attendees = event.attendees
		.map((a) => {
			if (a.address.address === organizer?.address) {
				return ""
			}
			return makeAttendee(assertNotNull(organizer), a, attendeesChanges.removed.includes(a.address.address))
		})
		.join("")
	return newLine(getLabel("guests_label", hasChanges), `<table style="line-height: 1rem;">${attendees}</table>`)
}

function makeAttendee(organizer: EncryptedMailAddress, attendee: CalendarEventAttendee, removed: boolean = false): string {
	//FIXME translation for Removed
	const content = `
				<span style="${removed ? "text-decoration: line-through" : ""}">
				${attendee.address.name || ""} <span style="color:#707070;">${attendee.address.address}</span>
				${removed ? "" : calendarAttendeeStatusSymbol(getAttendeeStatus(attendee))}
				</span>
				${removed ? "(Removed)" : ""}
	`

	return `<tr><td>${content}</td></tr>`
}

function locationLine(event: CalendarEvent, highlightChange: boolean): string {
	const content = `
		<span>${event.location}</span><br>
		<a href=${getLocationUrl(event.location).toString()} target="_blank" referrerpolicy="no-referrer" style="color: #013E85">View on map</a>
	`
	return event.location ? newLine(getLabel("location_label", highlightChange), content) : ""
}

function descriptionLine(event: CalendarEvent, highlightChange: boolean): string {
	// We can't actually highlight the description because it can have richtext/html
	return event.description ? newLine(getLabel("description_label", highlightChange), `<div>${event.description}</div>`) : ""
}

function getLabel(translationKey: TranslationKey, highlightChange: boolean) {
	return highlightChange ? highlight(lang.get(translationKey)) : lang.get(translationKey)
}

function highlight(content: string) {
	return `<mark style="background-color: #FFECB7; border-radius: 3px; color: #303030; padding: 0 4px">
				${content}
			</mark>`
}

function newLine(label: string, content: string, applyPaddingTop: boolean = true): string {
	return `<tr>
				<th style="text-align: left; padding-bottom: 4px; text-transform: uppercase; ${applyPaddingTop ? "padding-top: 28px;" : ""}"><strong>${label}</strong></th>
			</tr>
			<tr>
				<td>${content}</td>
			</tr>`
}

function makeEventInviteEmailBody(sender: string, event: CalendarEvent, message: string, oldEvent?: CalendarEvent) {
	const changedFields = {
		summary: false,
		when: false,
		location: false,
		description: false,
		organizer: false,
		attendee: {
			removed: [],
			added: [],
		},
	} //FIXME Find changes

	// <div style="padding: 24px 32px; border: 1px solid #ddd; border-radius: 6px;">
	// 	You have been <strong>invited</strong> to an event.
	// </div>

	// TODO [colors] Use new material like colors tokens
	return `
	<div style="padding: 24px 32px; border: 1px solid #ddd; border-radius: 6px; color: #303030;">
		<table>
			<tr>
				<td>
					<h1 style="font-size: 24px; margin: 0">
						<strong>${changedFields.summary ? highlight("Event:") : "Event:"}</strong>${" " + event.summary}
					</h1>
				</td>
			</tr>
		</table>
		
		<hr style="border-width: 0; margin: 24px 0; background: #ddd; color: #ddd; height:1px">
		
		<table style="width: 100%;">
			${whenLine(event, changedFields.when)}
			${locationLine(event, changedFields.location)}
			${descriptionLine(event, changedFields.description)}
			${organizerLine(event, changedFields.organizer)}
			${attendeesLine(event, changedFields.attendee)}
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
