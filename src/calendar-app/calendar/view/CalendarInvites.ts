import { parseCalendarFile } from "../../../common/calendar/gui/CalendarImporter.js"
import type { CalendarEvent, CalendarEventAttendee, File as TutanotaFile, Mail, MailboxProperties } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { CalendarAttendeeStatus, CalendarMethod, ConversationType, getAsEnumValue } from "../../../common/api/common/TutanotaConstants.js"
import { assert, assertNotNull, clone, filterInt, Require } from "@tutao/tutanota-utils"
import { CalendarNotificationSender } from "./CalendarNotificationSender.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { DataFile } from "../../../common/api/common/DataFile.js"
import { findAttendeeInAddresses } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { Recipient, RecipientList } from "../../../common/api/common/recipients/Recipient.js"
import { EventType } from "../gui/eventeditor-model/CalendarEventModel.js"
import { CalendarNotificationModel } from "../gui/eventeditor-model/CalendarNotificationModel.js"
import { getEventType } from "../gui/CalendarGuiUtils.js"
import { CalendarModel } from "../model/CalendarModel.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import type { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { SendMailModel } from "../../../common/mailFunctionality/SendMailModel.js"
import { RecipientField } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { IcsCalendarEvent, makeCalendarEventFromIcsCalendarEvent } from "../../../common/calendar/gui/ImportExportUtils"
import { CalendarEventUidIndexEntry } from "../../../common/api/worker/facades/lazy/CalendarFacade"

// not picking the status directly from CalendarEventAttendee because it's a NumberString
export type Guest = Recipient & { status: CalendarAttendeeStatus }

export interface ParsedIcalFileContentData {
	method: CalendarMethod
	events: Array<IcsCalendarEvent>
	uid: string
}

export type ParsedIcalFileContent = ParsedIcalFileContentData | None

async function getParsedEvent(fileData: DataFile): Promise<ParsedIcalFileContent> {
	try {
		const { contents, method } = await parseCalendarFile(fileData)
		const uid = contents[0].icsCalendarEvent.uid
		if (uid == null) return null
		assert(!contents.some((c) => c.icsCalendarEvent.uid !== uid), "received invite with multiple events, but mismatched UIDs")
		return {
			events: contents.map((c) => c.icsCalendarEvent),
			uid,
			method: getAsEnumValue(CalendarMethod, method) || CalendarMethod.PUBLISH,
		}
	} catch (e) {
		console.log(e)
		return null
	}
}

export async function getEventsFromFile(file: TutanotaFile): Promise<ParsedIcalFileContent> {
	const dataFile = await locator.fileController.getAsDataFile(file)
	return getParsedEvent(dataFile)
}

/**
 * Returns the latest version for the given event by uid and recurrenceId. If the event is not in
 * any calendar (because it has not been stored yet, e.g. in case of invite)
 * the given event is returned.
 */
export async function getLatestEvent(event: IcsCalendarEvent): Promise<CalendarEvent> {
	const uid = event.uid
	const fromIcsCalendarEvent = makeCalendarEventFromIcsCalendarEvent(event)
	if (uid == null) {
		return fromIcsCalendarEvent
	}
	const existingEvents = await locator.calendarFacade.getEventsByUid(uid)

	// If the file we are opening is newer than the one which we have on the server, update server version.
	// Should not happen normally but can happen when e.g. reply and update were sent one after another before we accepted
	// the invite. Then accepting first invite and then opening update should give us updated version.
	const existingEvent =
		event.recurrenceId == null
			? existingEvents?.progenitor // the progenitor does not have a recurrence id and is always first in uid index
			: existingEvents?.alteredInstances.find((e) => e.recurrenceId === event.recurrenceId)

	if (existingEvent == null) return fromIcsCalendarEvent

	if (filterInt(existingEvent.sequence) < filterInt(event.sequence)) {
		const calendarModel = await locator.calendarModel()
		return await calendarModel.updateEventWithExternal(existingEvent, fromIcsCalendarEvent)
	} else {
		return existingEvent
	}
}

export const enum ReplyResult {
	ReplyNotSent,
	ReplySent,
}

export class CalendarInviteHandler {
	constructor(
		private readonly mailboxModel: MailboxModel,
		private readonly calendarModel: CalendarModel,
		private readonly logins: LoginController,
		private readonly calendarNotificationSender: CalendarNotificationSender,
		private sendMailModelFactory: (mailboxDetails: MailboxDetail, mailboxProperties: MailboxProperties) => Promise<SendMailModel>,
	) {}

	/**
	 * Sends a quick reply for the given event and saves the event to the first private calendar.
	 * @param event the CalendarEvent to respond to, will be serialized and sent back with updated status, then saved.
	 * @param attendee the attendee that should respond to the mail
	 * @param decision the new status of the attendee
	 * @param previousMail the mail to respond to
	 * @param mailboxDetails
	 * @param comment
	 */
	async replyToEventInvitation(
		event: CalendarEvent,
		attendee: CalendarEventAttendee,
		decision: CalendarAttendeeStatus,
		previousMail: Mail | null,
		mailboxDetails: MailboxDetail | null,
		comment?: string,
	): Promise<ReplyResult> {
		if (event.organizer === null) {
			throw new Error("Replying to an event without an organizer")
		}
		const eventClone = clone(event)
		eventClone.invitedConfidentially = previousMail ? previousMail.confidential : eventClone.invitedConfidentially
		eventClone.pendingInvitation = false

		const foundAttendee = assertNotNull(findAttendeeInAddresses(eventClone.attendees, [attendee.address.address]), "attendee was not found in event clone")
		foundAttendee.status = decision

		const notificationModel = new CalendarNotificationModel(this.calendarNotificationSender, this.logins)
		//NOTE: mailDetails are getting passed through because the calendar does not have access to the mail folder structure
		//	which is needed to find mailboxdetails by mail. This may be fixed by static mail ids which are being worked on currently.
		//  This function is only called by EventBanner from the mail app so this should be okay.
		const resolvedMailboxDetails = mailboxDetails ?? (await this.mailboxModel.getUserMailboxDetails())
		const sender = previousMail?.sender.address || event.sender || event.organizer.address
		const responseModel = await this.getResponseModelForMail(previousMail, resolvedMailboxDetails, attendee.address.address, decision, sender)

		try {
			await notificationModel.send(
				eventClone,
				[],
				{
					responseModel,
					inviteModel: null,
					cancelModel: null,
					updateModel: null,
				},
				undefined,
				comment,
			)
		} catch (e) {
			if (e instanceof UserError) {
				await Dialog.message(lang.makeTranslation("confirm_msg", e.message))
				return ReplyResult.ReplyNotSent
			} else {
				throw e
			}
		}
		const calendars = await this.calendarModel.getCalendarInfos()
		const type = getEventType(event, calendars, [attendee.address.address], this.logins.getUserController())

		if (type === EventType.SHARED_RO) {
			// if the Event type is shared read only, the event will be updated by the response, trying to update the calendar here will result in error
			// since there is no write permission.
			return ReplyResult.ReplySent
		}

		if (eventClone.uid) {
			return await this.handleCalendarEventAfterUserReply(eventClone as Require<"uid", CalendarEvent>, event.recurrenceId, decision, sender)
		}

		return ReplyResult.ReplySent
	}

	async getSendMailModelWithoutOwnRecipient(recipients: RecipientList) {
		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const model = await this.sendMailModelFactory(mailboxDetails, mailboxProperties)

		const filteredRecipients = recipients.filter((recipient) => {
			return !mailboxProperties.mailAddressProperties.some((mailAddressProperty) => {
				return mailAddressProperty.mailAddress === recipient.address
			})
		})

		return await model.initWithTemplate(filteredRecipients, "", "")
	}

	private async getResponseModelForMail(
		previousMail: Mail | null,
		mailboxDetails: MailboxDetail,
		responder: string,
		responseDecision: CalendarAttendeeStatus,
		sender: string,
	): Promise<SendMailModel | null> {
		//NOTE: mailDetails are getting passed through because the calendar does not have access to the mail folder structure
		//	which is needed to find mailboxdetails by mail. This may be fixed by static mail ids which are being worked on currently
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const model = await this.sendMailModelFactory(mailboxDetails, mailboxProperties)

		model.setEmailTypeFromAttendeeStatus(responseDecision)
		await model.addRecipient(RecipientField.TO, { address: sender })

		if (!previousMail) {
			await model.initWithTemplate({}, "", "")
			return model
		}

		await model.initAsResponse(
			{
				previousMail,
				conversationType: ConversationType.REPLY,
				senderMailAddress: responder,
				recipients: [],
				attachments: [],
				subject: "",
				bodyText: "",
				replyTos: [],
			},
			new Map(),
		)
		// Send confidential reply to confidential mails and the other way around.
		// If the contact is removed or the password is not there the user would see an error but they wouldn't be
		// able to reply anyway (unless they fix it).
		model.setConfidential(previousMail.confidential)
		return model
	}

	private async handleCalendarEventAfterUserReply(
		eventUserIsReplyingTo: Require<"uid", CalendarEvent>,
		originalEventOccurrence: Date | null,
		usersDecision: CalendarAttendeeStatus,
		sender: string,
	): Promise<ReplyResult.ReplySent> {
		const dbEvents = await this.calendarModel.getEventsByUid(eventUserIsReplyingTo.uid, true)

		if (this.shouldTreatAsNewInvitation(dbEvents, originalEventOccurrence)) {
			if (usersDecision === CalendarAttendeeStatus.DECLINED) {
				return ReplyResult.ReplySent
			}

			await this.createEventFromIcsFile(sender, eventUserIsReplyingTo, dbEvents)
		} else {
			await this.handleInvitationForExistingEntries(eventUserIsReplyingTo, dbEvents, originalEventOccurrence, sender)
		}

		return ReplyResult.ReplySent
	}
	private async handleInvitationForExistingEntries(
		eventUserIsReplyingTo: Require<"uid", CalendarEvent>,
		dbEvents: CalendarEventUidIndexEntry | null,
		originalEventOccurrence: Date | null,
		sender: string,
	) {
		const resolvedEvent = eventUserIsReplyingTo.repeatRule !== null ? dbEvents?.progenitor : eventUserIsReplyingTo
		if (!resolvedEvent) {
			throw new Error("Could not resolve event series progenitor when processing an update to it.")
		}
		resolvedEvent.pendingInvitation = eventUserIsReplyingTo.pendingInvitation
		resolvedEvent.attendees = eventUserIsReplyingTo.attendees

		const originalRecurrenceIdTimestamp = originalEventOccurrence?.getTime()
		const targetDbEvent =
			originalRecurrenceIdTimestamp == null
				? dbEvents?.progenitor
				: dbEvents?.alteredInstances.find((e) => e.recurrenceId.getTime() === originalRecurrenceIdTimestamp)

		if (dbEvents && targetDbEvent) {
			await this.calendarModel.processUpdateToCalendarEventFromIcs(dbEvents, targetDbEvent, resolvedEvent)
		} else {
			await this.createEventFromIcsFile(sender, eventUserIsReplyingTo, dbEvents)
		}
	}

	private async createEventFromIcsFile(sender: string, eventUserIsReplyingTo: IcsCalendarEvent, dbEvents: CalendarEventUidIndexEntry | null) {
		await this.calendarModel.handleNewCalendarEventInvitationFromIcs(
			sender,
			{
				method: CalendarMethod.REQUEST,
				contents: [{ icsCalendarEvent: eventUserIsReplyingTo, alarms: [] }],
			},
			dbEvents,
		)
	}

	private shouldTreatAsNewInvitation(dbEvents: CalendarEventUidIndexEntry | null, originalEventOccurrence: Date | null): boolean {
		if (!dbEvents) return true

		const occurrenceTimeStamp = originalEventOccurrence?.getTime()
		const hasMatchingAlteredInstance =
			originalEventOccurrence != null && dbEvents.alteredInstances.some((ai) => ai.recurrenceId.getTime() === occurrenceTimeStamp)

		return !dbEvents.progenitor && !hasMatchingAlteredInstance
	}
}
