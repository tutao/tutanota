import { parseCalendarFile } from "../export/CalendarImporter"
import type { CalendarEvent, CalendarEventAttendee, File as TutanotaFile, Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { locator } from "../../api/main/MainLocator"
import { CalendarAttendeeStatus, CalendarMethod, FeatureType, getAsEnumValue } from "../../api/common/TutanotaConstants"
import { assertNotNull, clone, filterInt, lazy, noOp } from "@tutao/tutanota-utils"
import { findPrivateCalendar, getEventType, getTimeZone, resolveCalendarEventProgenitor } from "./CalendarUtils"
import { calendarUpdateDistributor } from "./CalendarUpdateDistributor"
import { Dialog } from "../../gui/base/Dialog"
import { UserError } from "../../api/main/UserError"
import { NoopProgressMonitor } from "../../api/common/utils/ProgressMonitor"
import { DataFile } from "../../api/common/DataFile"
import { findAttendeeInAddresses } from "../../api/common/utils/CommonCalendarUtils.js"
import { Recipient } from "../../api/common/recipients/Recipient.js"
import { isCustomizationEnabledForCustomer } from "../../api/common/utils/Utils.js"
import { SendMailModel } from "../../mail/editor/SendMailModel.js"
import { CalendarEventModel, EventType } from "./eventeditor/CalendarEventModel.js"

// not picking the status directly from CalendarEventAttendee because it's a NumberString
export type Guest = Recipient & { status: CalendarAttendeeStatus }

export type ParsedIcalFileContent =
	| {
			method: CalendarMethod
			event: CalendarEvent
			uid: string
	  }
	| None

async function getParsedEvent(fileData: DataFile): Promise<ParsedIcalFileContent> {
	try {
		const { contents, method } = await parseCalendarFile(fileData)
		const verifiedMethod = getAsEnumValue(CalendarMethod, method) || CalendarMethod.PUBLISH
		const parsedEventWithAlarms = contents[0]

		if (parsedEventWithAlarms && parsedEventWithAlarms.event.uid) {
			return {
				event: parsedEventWithAlarms.event,
				uid: parsedEventWithAlarms.event.uid,
				method: verifiedMethod,
			}
		} else {
			return null
		}
	} catch (e) {
		console.log(e)
		return null
	}
}

export async function showEventDetails(event: CalendarEvent, eventBubbleRect: ClientRect, mail: Mail | null): Promise<void> {
	const [latestEvent, { CalendarEventPopup }, { CalendarEventPopupViewModel }, { htmlSanitizer }] = await Promise.all([
		getLatestEvent(event),
		import("../view/eventpopup/CalendarEventPopup.js"),
		import("../view/eventpopup/CalendarEventPopupViewModel.js"),
		import("../../misc/HtmlSanitizer"),
	])

	let eventType: EventType
	let editModelsFactory: lazy<Promise<CalendarEventModel>>
	let hasBusinessFeature: boolean
	let ownAttendee: CalendarEventAttendee | null = null
	const lazyProgenitor = () => resolveCalendarEventProgenitor(latestEvent, locator.entityClient)
	if (!locator.logins.getUserController().isInternalUser()) {
		// external users cannot delete/edit events as they have no calendar.
		eventType = EventType.EXTERNAL
		editModelsFactory = () => new Promise(noOp)
		hasBusinessFeature = false
	} else {
		const [calendarInfos, mailboxDetails, customer] = await Promise.all([
			locator.calendarModel.loadOrCreateCalendarInfo(new NoopProgressMonitor()),
			locator.mailModel.getUserMailboxDetails(),
			locator.logins.getUserController().loadCustomer(),
		])
		const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const ownMailAddresses = mailboxProperties.mailAddressProperties.map(({ mailAddress }) => mailAddress)
		ownAttendee = findAttendeeInAddresses(latestEvent.attendees, ownMailAddresses)
		eventType = getEventType(latestEvent, calendarInfos, ownMailAddresses, locator.logins.getUserController().user)
		editModelsFactory = () => locator.calendarEventModel(latestEvent, mailboxDetails, mailboxProperties, mail)
		hasBusinessFeature =
			isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled) || (await locator.logins.getUserController().isNewPaidPlan())
	}

	const viewModel = new CalendarEventPopupViewModel(
		latestEvent,
		locator.calendarModel,
		eventType,
		hasBusinessFeature,
		ownAttendee,
		lazyProgenitor,
		editModelsFactory,
	)
	new CalendarEventPopup(viewModel, eventBubbleRect, htmlSanitizer).show()
}

export async function getEventFromFile(file: TutanotaFile): Promise<CalendarEvent | null> {
	const dataFile = await locator.fileController.getAsDataFile(file)
	const parsedEvent = await getParsedEvent(dataFile)
	return parsedEvent?.event ?? null
}

/**
 * Returns the latest version for the given event by uid. If the event is not in
 * any calendar (because it has not been stored yet, e.g. in case of invite)
 * the given event is returned.
 */
export async function getLatestEvent(event: CalendarEvent): Promise<CalendarEvent> {
	const uid = event.uid
	if (uid == null) return event
	const existingEvent = await locator.calendarFacade.getEventByUid(uid)
	if (existingEvent == null) return event
	// If the file we are opening is newer than the one which we have on the server, update server version.
	// Should not happen normally but can happen when e.g. reply and update were sent one after another before we accepted
	// the invite. Then accepting first invite and then opening update should give us updated version.
	if (filterInt(existingEvent.sequence) < filterInt(event.sequence)) {
		return await locator.calendarModel.updateEventWithExternal(existingEvent, event)
	} else {
		return existingEvent
	}
}

/**
 * Sends a quick reply for the given event and saves the event to the first private calendar.
 */
export async function replyToEventInvitation(
	event: CalendarEvent,
	attendee: CalendarEventAttendee,
	decision: CalendarAttendeeStatus,
	previousMail: Mail | null,
	sendMailModel: SendMailModel | null = null,
): Promise<void> {
	const eventClone = clone(event)
	const foundAttendee = assertNotNull(findAttendeeInAddresses(eventClone.attendees, [attendee.address.address]), "attendee was not found in event clone")
	foundAttendee.status = decision
	const [calendar, responseModel] = await Promise.all([
		locator.calendarModel.loadOrCreateCalendarInfo(new NoopProgressMonitor()).then(findPrivateCalendar),
		previousMail != null ? getResponseModelForMail(previousMail) : sendMailModel,
	])
	if (responseModel == null) return
	try {
		await calendarUpdateDistributor.sendResponse(eventClone, responseModel, previousMail)
	} catch (e) {
		if (e instanceof UserError) {
			await Dialog.message(() => e.message)
		} else {
			throw e
		}
	}

	if (calendar == null) return
	// if the owner group is set there is an existing event already so just update
	if (event._ownerGroup) {
		const alarms = await locator.calendarModel.loadAlarms(event.alarmInfos, locator.logins.getUserController().user)
		const alarmInfos = alarms.map((a) => a.alarmInfo)
		await locator.calendarModel.updateEvent(eventClone, alarmInfos, getTimeZone(), calendar.groupRoot, event)
	} else if (decision !== CalendarAttendeeStatus.DECLINED) {
		await locator.calendarModel.createEvent(eventClone, [], getTimeZone(), calendar.groupRoot)
	}
}

export async function getResponseModelForMail(mail: Mail): Promise<SendMailModel | null> {
	const mailboxDetails = await locator.mailModel.getMailboxDetailsForMail(mail)
	if (mailboxDetails == null) return null
	const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	return await locator.sendMailModel(mailboxDetails, mailboxProperties)
}
