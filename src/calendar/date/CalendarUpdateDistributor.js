//@flow
import {lang} from "../../misc/LanguageViewModel"
import {makeInvitationCalendarFile} from "../export/CalendarImporter"
import type {CalendarAttendeeStatusEnum, MailMethodEnum} from "../../api/common/TutanotaConstants"
import {
	CalendarMethod,
	ConversationType,
	getAttendeeStatus,
	MailMethod,
	mailMethodToCalendarMethod
} from "../../api/common/TutanotaConstants"
import {calendarAttendeeStatusSymbol, formatEventDuration, getTimeZone} from "./CalendarUtils"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {assertNotNull, noOp} from "@tutao/tutanota-utils"
import type {SendMailModel} from "../../mail/editor/SendMailModel"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {windowFacade} from "../../misc/WindowFacade"
import type {EncryptedMailAddress} from "../../api/entities/tutanota/EncryptedMailAddress"
import type {CalendarEventAttendee} from "../../api/entities/tutanota/CalendarEventAttendee"
import {createCalendarEventAttendee} from "../../api/entities/tutanota/CalendarEventAttendee"
import {isTutanotaMailAddress} from "../../api/common/RecipientInfo"
import {createMailAddress} from "../../api/entities/tutanota/MailAddress"
import {themeController} from "../../gui/theme"
import {RecipientsNotFoundError} from "../../api/common/error/RecipientsNotFoundError"
import {ofClass} from "@tutao/tutanota-utils"

export interface CalendarUpdateDistributor {
	sendInvite(existingEvent: CalendarEvent, sendMailModel: SendMailModel): Promise<void>;

	sendUpdate(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void>;

	sendCancellation(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void>;

	sendResponse(event: CalendarEvent, sendMailModel: SendMailModel, sendAs: string, responseTo: ?Mail, status: CalendarAttendeeStatusEnum
	): Promise<void>;
}

export class CalendarMailDistributor implements CalendarUpdateDistributor {
	/** Used for knowing how many emails are in the process of being sent. */
	_countDownLatch: number;

	constructor() {
		this._countDownLatch = 0
	}

	sendInvite(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void> {
		const message = lang.get("eventInviteMail_msg", {"{event}": event.summary})
		const sender = assertOrganizer(event).address
		return this._sendCalendarFile({
			sendMailModel,
			method: MailMethod.ICAL_REQUEST,
			subject: message,
			body: makeInviteEmailBody(sender, event, message),
			event,
			sender
		})
	}

	sendUpdate(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void> {
		const message = lang.get("eventUpdated_msg", {"{event}": event.summary})
		const sender = assertOrganizer(event).address
		return this._sendCalendarFile({
			sendMailModel,
			method: MailMethod.ICAL_REQUEST,
			subject: message,
			body: makeInviteEmailBody(sender, event, message),
			event,
			sender
		})
	}

	sendCancellation(event: CalendarEvent, sendMailModel: SendMailModel): Promise<void> {
		const message = lang.get("eventCancelled_msg", {"{event}": event.summary})
		const sender = assertOrganizer(event).address
		return this._sendCalendarFile({
			sendMailModel,
			method: MailMethod.ICAL_CANCEL,
			subject: message,
			body: makeInviteEmailBody(sender, event, message),
			event,
			sender
		}).catch(ofClass(RecipientsNotFoundError, e => {
			// we want to delete the event even if the recipient is not an existing tutanota address
			// and just exclude them from sending out updates but leave the event untouched for other recipients
			const invalidRecipients = e.message.split("\n")
			let hasRemovedRecipient = false
			invalidRecipients.forEach(invalidRecipient => {
				const recipientInfo = sendMailModel.bccRecipients().find(r => r.mailAddress === invalidRecipient)
				if (recipientInfo) {
					hasRemovedRecipient = sendMailModel.removeRecipient(recipientInfo, "bcc", false) || hasRemovedRecipient
				}
			})
			// only try sending again if we successfully removed a recipient and there are still other recipients
			if (hasRemovedRecipient && sendMailModel.allRecipients().length) {
				return this.sendCancellation(event, sendMailModel)
			}
		}))
	}

	sendResponse(event: CalendarEvent, sendMailModel: SendMailModel, sendAs: string, responseTo: ?Mail, status: CalendarAttendeeStatusEnum
	): Promise<void> {
		const message = lang.get("repliedToEventInvite_msg", {"{sender}": sendAs, "{event}": event.summary})
		const organizer = assertOrganizer(event)
		const body = makeInviteEmailBody(organizer.address, event, message)
		if (responseTo) {
			return Promise.resolve()
			              .then(() => {
				              this._sendStart()
				              return sendMailModel.initAsResponse({
					              previousMail: responseTo,
					              conversationType: ConversationType.REPLY,
					              senderMailAddress: sendAs,
					              toRecipients: [createMailAddress({address: organizer.address, name: organizer.name, contact: null})],
					              ccRecipients: [],
					              bccRecipients: [],
					              attachments: [],
					              bodyText: body,
					              subject: message,
					              replyTos: [],
				              }, Promise.resolve(new Map()))
			              })
			              .then(model => {
				              model.attachFiles([makeInvitationCalendarFile(event, CalendarMethod.REPLY, new Date(), getTimeZone())])
				              return model.send(MailMethod.ICAL_REPLY).then(noOp)
			              })
			              .finally(() => this._sendEnd())
		} else {
			return this._sendCalendarFile({sendMailModel, method: MailMethod.ICAL_REPLY, subject: message, body, event, sender: sendAs})
		}
	}

	async _sendCalendarFile({sendMailModel, method, subject, event, body, sender}: {
		sendMailModel: SendMailModel,
		method: MailMethodEnum,
		subject: string,
		event: CalendarEvent,
		body: string,
		sender: string
	}): Promise<void> {
		const inviteFile = makeInvitationCalendarFile(event, mailMethodToCalendarMethod(method), new Date(), getTimeZone())
		sendMailModel.setSender(sender)
		sendMailModel.attachFiles([inviteFile])
		sendMailModel.setSubject(subject)
		sendMailModel.setBody(body)
		this._sendStart()
		await sendMailModel.send(method)
		                   .catch((e) => {
			                   // we remove the attachment from the model to prevent adding more than one calendar file
			                   // in case the user changes the event and tries to send again a new attachment is created
			                   const attachedInviteFile = sendMailModel.getAttachments().find(file => file.name === inviteFile.name)
			                   if (attachedInviteFile) {
				                   sendMailModel.removeAttachment(attachedInviteFile)
			                   }
			                   throw e
		                   })
		                   .finally(() => this._sendEnd())
	}

	_windowUnsubscribe: ?(() => void)

	_sendStart() {
		this._countDownLatch++
		if (this._countDownLatch === 1) {
			this._windowUnsubscribe = windowFacade.addWindowCloseListener(noOp)
		}
	}

	_sendEnd() {
		this._countDownLatch--
		if (this._countDownLatch === 0 && this._windowUnsubscribe) {
			this._windowUnsubscribe()
			this._windowUnsubscribe = null
		}
	}
}

function summaryLine(event: CalendarEvent): string {
	return newLine(lang.get('name_label'), event.summary)
}

function whenLine(event: CalendarEvent): string {
	const duration = formatEventDuration(event, getTimeZone(), true)
	return newLine(lang.get("when_label"), duration)
}

function organizerLabel(organizer: EncryptedMailAddress, a: CalendarEventAttendee) {
	return organizer.address === a.address.address ? `(${lang.get("organizer_label")})` : ""
}

function newLine(label: string, content: string): string {
	return `<div style="display: flex; margin-top: 8px"><div style="min-width: 120px"><b style="float:right; margin-right:16px">${label}:</b></div>${content}</div>`
}

function attendeesLine(event: CalendarEvent): string {
	const {organizer} = event
	var attendees = ""
	// If organizer is already in the attendees, we don't have to add them separately.
	if (organizer && !event.attendees.find((a) => a.address.address === organizer.address)) {
		attendees = makeAttendee(organizer, createCalendarEventAttendee({address: organizer}))
	}
	attendees += event.attendees.map(a => makeAttendee(assertNotNull(organizer), a)).join("\n");
	return newLine(lang.get("who_label"), `<div>${attendees}</div>`)
}

function makeAttendee(organizer: EncryptedMailAddress, attendee: CalendarEventAttendee): string {
	return `<div>
${attendee.address.name || ""} ${attendee.address.address}
${(organizerLabel(organizer, attendee))}
${calendarAttendeeStatusSymbol(getAttendeeStatus(attendee))}</div>`
}

function locationLine(event: CalendarEvent): string {
	return event.location ? newLine(lang.get("location_label"), event.location) : ""
}

function descriptionLine(event: CalendarEvent): string {
	return event.description ? newLine(lang.get("description_label"), `<div>${event.description}</div>`) : ""
}

function makeInviteEmailBody(sender: string, event: CalendarEvent, message: string) {
	// Take whitelabel logo if set otherwise take default theme logo
	const logo = isTutanotaMailAddress(sender)
		? `
  <img style="width: 200px; max-height: 38px; display: block; background-color: white; padding: 4px 8px; border-radius: 4px; margin: 16px auto 0"
  src="data:image/svg+xml;base64,${uint8ArrayToBase64(stringToUtf8Uint8Array(themeController.getDefaultTheme().logo))}"
  alt="logo"/>
`
		: ""
	return `<div style="max-width: 685px; margin: 0 auto">
  <h2 style="text-align: center">${message}</h2>
  <div style="margin: 0 auto">
  	${summaryLine(event)}
    ${whenLine(event)}
    ${locationLine(event)}
    ${attendeesLine(event)}
    ${descriptionLine(event)}
  </div>
  <hr style="border: 0; height: 1px; background-color: #ddd">
${logo}  
</div>`
}

function assertOrganizer(event: CalendarEvent): EncryptedMailAddress {
	if (event.organizer == null) {
		throw new Error("Cannot send event update without organizer")
	}
	return event.organizer
}

export const calendarUpdateDistributor: CalendarUpdateDistributor = new CalendarMailDistributor()