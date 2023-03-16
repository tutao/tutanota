import { parseCalendarFile } from "../export/CalendarImporter"
import type { CalendarEvent, CalendarEventAttendee, File as TutanotaFile, Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { locator } from "../../api/main/MainLocator"
import { CalendarAttendeeStatus, CalendarMethod, getAsEnumValue } from "../../api/common/TutanotaConstants"
import { assertNotNull, clone, filterInt, noOp, ofClass, Thunk } from "@tutao/tutanota-utils"
import { findPrivateCalendar, getEventStart, getTimeZone } from "./CalendarUtils"
import { logins } from "../../api/main/LoginController"
import { calendarUpdateDistributor } from "./CalendarUpdateDistributor"
import { Dialog } from "../../gui/base/Dialog"
import { UserError } from "../../api/main/UserError"
import { NoopProgressMonitor } from "../../api/common/utils/ProgressMonitor"
import { CalendarEventViewModel } from "./CalendarEventViewModel"
import { DataFile } from "../../api/common/DataFile"
import { findAttendeeInAddresses } from "../../api/common/utils/CommonCalendarUtils.js"

function getParsedEvent(fileData: DataFile):
	| {
			method: CalendarMethod
			event: CalendarEvent
			uid: string
	  }
	| null
	| undefined {
	try {
		const { contents, method } = parseCalendarFile(fileData)
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
	const [latestEvent, { CalendarEventPopup }, { htmlSanitizer }] = await Promise.all([
		getLatestEvent(event),
		import("../view/CalendarEventPopup"),
		import("../../misc/HtmlSanitizer"),
	])
	let viewModel: CalendarEventViewModel | null = null
	let onEditEvent: Thunk | null = null

	// Do not create calendar event view model for external users as external users cannot delete/edit a calendar event. They don't have a calendar.
	if (logins.getUserController().isInternalUser()) {
		const calendarInfos = await locator.calendarModel.loadOrCreateCalendarInfo(new NoopProgressMonitor())
		const mailboxDetails = await locator.mailModel.getUserMailboxDetails()
		const mailboxProerties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		viewModel = await locator.calenderEventViewModel(
			getEventStart(latestEvent, getTimeZone()),
			calendarInfos,
			mailboxDetails,
			mailboxProerties,
			latestEvent,
			mail,
			true,
		)

		onEditEvent = async () => {
			const { showCalendarEventDialog } = await import("../view/CalendarEventEditDialog")
			showCalendarEventDialog(latestEvent.startTime, calendarInfos, mailboxDetails, latestEvent, mail ?? undefined)
		}
	}

	new CalendarEventPopup(latestEvent, eventBubbleRect, htmlSanitizer, onEditEvent, viewModel, latestEvent).show()
}

export async function getEventFromFile(file: TutanotaFile): Promise<CalendarEvent | null> {
	const dataFile = await locator.fileController.getAsDataFile(file)
	const parsedEvent = getParsedEvent(dataFile)
	return parsedEvent?.event ?? null
}

/**
 * Returns the latest version for the given event by uid. If the event is not in any calendar (because it has not been stored yet, e.g. in case of invite)
 * the given event is returned.
 */
export function getLatestEvent(event: CalendarEvent): Promise<CalendarEvent> {
	const uid = event.uid

	if (uid) {
		return locator.calendarFacade.getEventByUid(uid).then((existingEvent) => {
			if (existingEvent) {
				// If the file we are opening is newer than the one which we have on the server, update server version.
				// Should not happen normally but can happen when e.g. reply and update were sent one after another before we accepted
				// the invite. Then accepting first invite and then opening update should give us updated version.
				if (filterInt(existingEvent.sequence) < filterInt(event.sequence)) {
					return locator.calendarModel.updateEventWithExternal(existingEvent, event)
				} else {
					return existingEvent
				}
			} else {
				return event
			}
		})
	} else {
		return Promise.resolve(event)
	}
}

/**
 * Sends a quick reply for the given event and saves the event to the first private calendar.
 */
export async function replyToEventInvitation(
	event: CalendarEvent,
	attendee: CalendarEventAttendee,
	decision: CalendarAttendeeStatus,
	previousMail: Mail,
): Promise<void> {
	const eventClone = clone(event)
	const foundAttendee = assertNotNull(findAttendeeInAddresses(eventClone.attendees, [attendee.address.address]), "attendee was not found in event clone")
	foundAttendee.status = decision
	return Promise.all([
		locator.calendarModel.loadOrCreateCalendarInfo(new NoopProgressMonitor()).then(findPrivateCalendar),
		locator.mailModel.getMailboxDetailsForMail(previousMail),
	]).then(async ([calendar, mailboxDetails]) => {
		if (mailboxDetails == null) {
			return
		}
		const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
		const sendMailModel = await locator.sendMailModel(mailboxDetails, mailboxProperties)
		return calendarUpdateDistributor
			.sendResponse(eventClone, sendMailModel, foundAttendee.address.address, previousMail, decision)
			.catch(ofClass(UserError, (e) => Dialog.message(() => e.message)))
			.then(() => {
				if (calendar) {
					// if the owner group is set there is an existing event already so just update
					if (event._ownerGroup) {
						return locator.calendarModel.loadAlarms(event.alarmInfos, logins.getUserController().user).then((alarms) => {
							const alarmInfos = alarms.map((a) => a.alarmInfo)
							return locator.calendarModel.updateEvent(eventClone, alarmInfos, getTimeZone(), calendar.groupRoot, event).then(noOp)
						})
					} else {
						if (decision !== CalendarAttendeeStatus.DECLINED) {
							return locator.calendarModel.createEvent(eventClone, [], getTimeZone(), calendar.groupRoot)
						}
					}
				}
				return Promise.resolve()
			})
	})
}
