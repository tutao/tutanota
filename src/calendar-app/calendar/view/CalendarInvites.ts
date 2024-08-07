import { parseCalendarFile } from "../../../common/calendar/import/CalendarImporter.js"
import type { CalendarEvent, CalendarEventAttendee, File as TutanotaFile, Mail, MailboxProperties } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { CalendarAttendeeStatus, CalendarMethod, ConversationType, FeatureType, getAsEnumValue } from "../../../common/api/common/TutanotaConstants.js"
import { assert, assertNotNull, clone, filterInt, noOp, Require } from "@tutao/tutanota-utils"
import { findFirstPrivateCalendar } from "../../../common/calendar/date/CalendarUtils.js"
import { CalendarNotificationSender } from "./CalendarNotificationSender.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { DataFile } from "../../../common/api/common/DataFile.js"
import { findAttendeeInAddresses } from "../../../common/api/common/utils/CommonCalendarUtils.js"
import { Recipient } from "../../../common/api/common/recipients/Recipient.js"
import { CalendarEventModel, CalendarOperation, EventType } from "../gui/eventeditor-model/CalendarEventModel.js"
import { CalendarNotificationModel } from "../gui/eventeditor-model/CalendarNotificationModel.js"
import { ResolveMode } from "../../../common/api/main/RecipientsModel.js"
import { isCustomizationEnabledForCustomer } from "../../../common/api/common/utils/CustomerUtils.js"
import { getEventType } from "../gui/CalendarGuiUtils.js"
import { CalendarModel } from "../model/CalendarModel.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import type { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { SendMailModel } from "../../../common/mailFunctionality/SendMailModel.js"
import { RecipientField } from "../../../common/mailFunctionality/SharedMailUtils.js"

// not picking the status directly from CalendarEventAttendee because it's a NumberString
export type Guest = Recipient & { status: CalendarAttendeeStatus }

export type ParsedIcalFileContent =
	| {
			method: CalendarMethod
			events: Array<CalendarEvent>
			uid: string
	  }
	| None

async function getParsedEvent(fileData: DataFile): Promise<ParsedIcalFileContent> {
	try {
		const { contents, method } = await parseCalendarFile(fileData)
		const uid = contents[0].event.uid
		if (uid == null) return null
		assert(!contents.some((c) => c.event.uid !== uid), "received invite with multiple events, but mismatched UIDs")
		return {
			events: contents.map((c) => c.event),
			uid,
			method: getAsEnumValue(CalendarMethod, method) || CalendarMethod.PUBLISH,
		}
	} catch (e) {
		console.log(e)
		return null
	}
}

export async function showEventDetails(event: CalendarEvent, eventBubbleRect: ClientRect, mail: Mail | null): Promise<void> {
	const [latestEvent, { CalendarEventPopup }, { CalendarEventPreviewViewModel }, { htmlSanitizer }] = await Promise.all([
		getLatestEvent(event),
		import("../gui/eventpopup/CalendarEventPopup.js"),
		import("../gui/eventpopup/CalendarEventPreviewViewModel.js"),
		import("../../../common/misc/HtmlSanitizer.js"),
	])

	let eventType: EventType
	let editModelsFactory: (mode: CalendarOperation) => Promise<CalendarEventModel | null>
	let hasBusinessFeature: boolean
	let ownAttendee: CalendarEventAttendee | null = null
	const lazyIndexEntry = async () => (latestEvent.uid != null ? locator.calendarFacade.getEventsByUid(latestEvent.uid) : null)
	if (!locator.logins.getUserController().isInternalUser()) {
		// external users cannot delete/edit events as they have no calendar.
		eventType = EventType.EXTERNAL
		editModelsFactory = () => new Promise(noOp)
		hasBusinessFeature = false
	} else {
		const [calendarInfos, mailboxDetails, customer] = await Promise.all([
			(await locator.calendarModel()).getCalendarInfos(),
			locator.mailboxModel.getUserMailboxDetails(),
			locator.logins.getUserController().loadCustomer(),
		])
		const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const ownMailAddresses = mailboxProperties.mailAddressProperties.map(({ mailAddress }) => mailAddress)
		ownAttendee = findAttendeeInAddresses(latestEvent.attendees, ownMailAddresses)
		eventType = getEventType(latestEvent, calendarInfos, ownMailAddresses, locator.logins.getUserController())
		editModelsFactory = (mode: CalendarOperation) => locator.calendarEventModel(mode, latestEvent, mailboxDetails, mailboxProperties, mail)
		hasBusinessFeature =
			isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) || (await locator.logins.getUserController().isNewPaidPlan())
	}

	const viewModel = new CalendarEventPreviewViewModel(
		latestEvent,
		await locator.calendarModel(),
		eventType,
		hasBusinessFeature,
		ownAttendee,
		lazyIndexEntry,
		editModelsFactory,
	)
	new CalendarEventPopup(viewModel, eventBubbleRect, htmlSanitizer).show()
}

export async function getEventsFromFile(file: TutanotaFile, invitedConfidentially: boolean): Promise<ParsedIcalFileContent> {
	const dataFile = await locator.fileController.getAsDataFile(file)
	const contents = await getParsedEvent(dataFile)
	for (const event of contents?.events ?? []) {
		event.invitedConfidentially = invitedConfidentially
	}
	return contents
}

/**
 * Returns the latest version for the given event by uid and recurrenceId. If the event is not in
 * any calendar (because it has not been stored yet, e.g. in case of invite)
 * the given event is returned.
 */
export async function getLatestEvent(event: CalendarEvent): Promise<CalendarEvent> {
	const uid = event.uid
	if (uid == null) return event
	const existingEvents = await locator.calendarFacade.getEventsByUid(uid)

	// If the file we are opening is newer than the one which we have on the server, update server version.
	// Should not happen normally but can happen when e.g. reply and update were sent one after another before we accepted
	// the invite. Then accepting first invite and then opening update should give us updated version.
	const existingEvent =
		event.recurrenceId == null
			? existingEvents?.progenitor // the progenitor does not have a recurrence id and is always first in uid index
			: existingEvents?.alteredInstances.find((e) => e.recurrenceId === event.recurrenceId)

	if (existingEvent == null) return event

	if (filterInt(existingEvent.sequence) < filterInt(event.sequence)) {
		const calendarModel = await locator.calendarModel()
		return await calendarModel.updateEventWithExternal(existingEvent, event)
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
	 */
	async replyToEventInvitation(
		event: CalendarEvent,
		attendee: CalendarEventAttendee,
		decision: CalendarAttendeeStatus,
		previousMail: Mail,
		mailboxDetails: MailboxDetail,
	): Promise<ReplyResult> {
		const eventClone = clone(event)
		const foundAttendee = assertNotNull(findAttendeeInAddresses(eventClone.attendees, [attendee.address.address]), "attendee was not found in event clone")
		foundAttendee.status = decision

		const notificationModel = new CalendarNotificationModel(this.calendarNotificationSender, this.logins)
		//NOTE: mailDetails are getting passed through because the calendar does not have access to the mail folder structure
		//	which is needed to find mailboxdetails by mail. This may be fixed by static mail ids which are being worked on currently.
		//  This function is only called by EventBanner from the mail app so this should be okay.
		const responseModel = await this.getResponseModelForMail(previousMail, mailboxDetails, attendee.address.address)

		try {
			await notificationModel.send(eventClone, [], { responseModel, inviteModel: null, cancelModel: null, updateModel: null })
		} catch (e) {
			if (e instanceof UserError) {
				await Dialog.message(() => e.message)
				return ReplyResult.ReplyNotSent
			} else {
				throw e
			}
		}
		const calendars = await this.calendarModel.getCalendarInfos()
		const type = getEventType(event, calendars, [attendee.address.address], this.logins.getUserController())
		if (type === EventType.SHARED_RO || type === EventType.LOCKED) {
			// if the Event type is shared read only, the event will be updated by the response, trying to update the calendar here will result in error
			// since there is no write permission. (Same issue can happen with locked, no write permission)
			return ReplyResult.ReplySent
		}
		const calendar = findFirstPrivateCalendar(calendars)
		if (calendar == null) return ReplyResult.ReplyNotSent
		if (decision !== CalendarAttendeeStatus.DECLINED && eventClone.uid != null) {
			const dbEvents = await this.calendarModel.getEventsByUid(eventClone.uid)
			await this.calendarModel.processCalendarEventMessage(
				previousMail.sender.address,
				CalendarMethod.REQUEST,
				eventClone as Require<"uid", CalendarEvent>,
				[],
				dbEvents ?? { ownerGroup: calendar.group._id, progenitor: null, alteredInstances: [] },
			)
		}
		return ReplyResult.ReplySent
	}

	async getResponseModelForMail(previousMail: Mail, mailboxDetails: MailboxDetail, responder: string): Promise<SendMailModel | null> {
		//NOTE: mailDetails are getting passed through because the calendar does not have access to the mail folder structure
		//	which is needed to find mailboxdetails by mail. This may be fixed by static mail ids which are being worked on currently
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const model = await this.sendMailModelFactory(mailboxDetails, mailboxProperties)
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
		await model.addRecipient(RecipientField.TO, previousMail.sender, ResolveMode.Eager)
		// Send confidential reply to confidential mails and the other way around.
		// If the contact is removed or the password is not there the user would see an error but they wouldn't be
		// able to reply anyway (unless they fix it).
		model.setConfidential(previousMail.confidential)
		return model
	}
}
