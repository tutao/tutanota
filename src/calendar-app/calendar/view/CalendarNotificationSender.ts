import { lang } from "../../../common/misc/LanguageViewModel.js"
import { makeInvitationCalendarFile } from "../export/CalendarExporter.js"
import { getAttendeeStatus, MailMethod, mailMethodToCalendarMethod } from "../../../common/api/common/TutanotaConstants.js"
import { getTimeZone } from "../../../common/calendar/date/CalendarUtils.js"
import type { CalendarEvent, CalendarEventAttendee, EncryptedMailAddress } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { createCalendarEventAttendee } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { assertNotNull, noOp, ofClass } from "@tutao/tutanota-utils"
import type { SendMailModel } from "../../../common/mailFunctionality/SendMailModel.js"
import { windowFacade } from "../../../common/misc/WindowFacade.js"
import { RecipientsNotFoundError } from "../../../common/api/common/error/RecipientsNotFoundError.js"
import { cleanMailAddress, findAttendeeInAddresses, findRecipientWithAddress } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"

import { calendarAttendeeStatusSymbol, formatEventDuration } from "../gui/CalendarGuiUtils.js"
import { RecipientField } from "../../../common/mailFunctionality/SharedMailUtils.js"

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
			body: makeInviteEmailBody(sender, event, message),
			event,
			sender,
		})
	}

	sendUpdate(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void> {
		const message = lang.get("eventUpdated_msg", {
			"{event}": event.summary,
		})
		const sender = assertOrganizer(event).address
		return this.sendCalendarFile({
			sendMailModel,
			method: MailMethod.ICAL_REQUEST,
			subject: message,
			body: makeInviteEmailBody(sender, event, message),
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
			body: makeInviteEmailBody(sender, event, message),
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
		const body = makeInviteEmailBody(organizer.address, event, message)
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

function summaryLine(event: CalendarEvent): string {
	return newLine(lang.get("name_label"), event.summary)
}

function whenLine(event: CalendarEvent): string {
	const duration = formatEventDuration(event, getTimeZone(), true)
	return newLine(lang.get("when_label"), duration)
}

function organizerLabel(organizer: EncryptedMailAddress, a: CalendarEventAttendee) {
	return cleanMailAddress(organizer.address) === cleanMailAddress(a.address.address) ? `(${lang.get("organizer_label")})` : ""
}

function newLine(label: string, content: string): string {
	return `<p style="display: flex; flex-direction: column; gap: 8px; margin: 0;">
				<strong>${label}</strong>
				<span>${content}</span>
			</p>`
}

function attendeesLine(event: CalendarEvent): string {
	const { organizer } = event
	let attendees = ""

	// If organizer is already in the attendees, we don't have to add them separately.
	if (organizer && !findAttendeeInAddresses(event.attendees, [organizer.address])) {
		attendees = makeAttendee(
			organizer,
			createCalendarEventAttendee({
				address: organizer,
				status: "0",
			}),
		)
	}

	attendees += event.attendees.map((a) => makeAttendee(assertNotNull(organizer), a)).join("\n")
	return newLine(lang.get("who_label"), `<ul style="margin: 0; padding-left: 26px">${attendees}</ul>`)
}

function makeAttendee(organizer: EncryptedMailAddress, attendee: CalendarEventAttendee): string {
	return `<li>
				${attendee.address.name || ""} ${attendee.address.address}
				${organizerLabel(organizer, attendee)}
				${calendarAttendeeStatusSymbol(getAttendeeStatus(attendee))}
			</li>`
}

function locationLine(event: CalendarEvent): string {
	return event.location ? newLine(lang.get("location_label"), event.location) : ""
}

function descriptionLine(event: CalendarEvent): string {
	return event.description ? newLine(lang.get("description_label"), `<div>${event.description}</div>`) : ""
}

function makeInviteEmailBody(sender: string, event: CalendarEvent, message: string) {
	return `
	<div style="max-width: 100%; background: white; display: flex; flex-direction: column; gap: 16px;">
		<div style="padding: 24px 32px; border: 1px solid #ddd; border-radius: 6px;">
			You have been <strong>invited</strong> to an event
		</div>
		<div style="display: flex; flex-direction: column; gap: 24px; padding: 24px 32px; border: 1px solid #ddd; border-radius: 6px;">
			<h1 style="font-size: 24px"><strong>Event:</strong> ${event.summary}</h1>
			<hr style="border: 1px solid #ddd; margin: 0;"/>
			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
				<div style="display: flex; flex-direction: column; gap: 20px; flex: 1;">
					${whenLine(event)}
					${locationLine(event)}
					${descriptionLine(event)}
				</div>
				<div style="display: flex; flex-direction: column; gap: 20px; flex: 1;">
					${attendeesLine(event)}
				</div>
			</div>
		</div>
		<div style="padding: 24px 0">
			This invitation was securely sent from <a href="https://tuta.com" target="_blank" style="color: #850122">Tuta Calendar</a>
		</div>
	</div>
	`
}

function assertOrganizer(event: CalendarEvent): EncryptedMailAddress {
	if (event.organizer == null) {
		throw new ProgrammingError("Cannot send event update without organizer")
	}

	return event.organizer
}

export const calendarNotificationSender: CalendarNotificationSender = new CalendarNotificationSender()
