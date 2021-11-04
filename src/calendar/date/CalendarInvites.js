//@flow
import {parseCalendarFile} from "../export/CalendarImporter"
import type {CalendarEvent} from "../../api/entities/tutanota/CalendarEvent"
import type {File as TutanotaFile} from "../../api/entities/tutanota/File"
import {locator} from "../../api/main/MainLocator"
import type {CalendarEventAttendee} from "../../api/entities/tutanota/CalendarEventAttendee"
import type {CalendarAttendeeStatusEnum, CalendarMethodEnum} from "../../api/common/TutanotaConstants"
import {CalendarMethod, getAsEnumValue} from "../../api/common/TutanotaConstants"
import {assertNotNull, clone, filterInt, noOp} from "@tutao/tutanota-utils"
import {findPrivateCalendar, getEventStart, getTimeZone} from "./CalendarUtils"
import {logins} from "../../api/main/LoginController"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {calendarUpdateDistributor} from "./CalendarUpdateDistributor"
import {Dialog} from "../../gui/base/Dialog"
import {UserError} from "../../api/main/UserError"
import {NoopProgressMonitor} from "../../api/common/utils/ProgressMonitor"
import {ofClass} from "@tutao/tutanota-utils"
import {createCalendarEventViewModel} from "./CalendarEventViewModel"

function getParsedEvent(fileData: DataFile): ?{method: CalendarMethodEnum, event: CalendarEvent, uid: string} {
	try {
		const {contents, method} = parseCalendarFile(fileData)
		const verifiedMethod = getAsEnumValue(CalendarMethod, method) || CalendarMethod.PUBLISH
		const parsedEventWithAlarms = contents[0]
		if (parsedEventWithAlarms && parsedEventWithAlarms.event.uid) {
			return {event: parsedEventWithAlarms.event, uid: parsedEventWithAlarms.event.uid, method: verifiedMethod}
		} else {
			return null
		}
	} catch (e) {
		console.log(e)
		return null
	}
}

export async function showEventDetails(event: CalendarEvent, eventBubbleRect: ClientRect, mail: ?Mail): Promise<void> {
	const [latestEvent, {CalendarEventPopup}, {htmlSanitizer}] = await Promise.all([
		getLatestEvent(event),
		import("../view/CalendarEventPopup"),
		import("../../misc/HtmlSanitizer")
	])
	let viewModel = null
	let onEditEvent = null
	// Do not create calendar event view model for external users as external users cannot delete/edit a calendar event. They don't have a calendar.
	if (logins.getUserController().isInternalUser()) {
		const calendarInfos = await locator.calendarModel.loadOrCreateCalendarInfo(new NoopProgressMonitor())
		const mailboxDetails = await locator.mailModel.getUserMailboxDetails()
		viewModel = await createCalendarEventViewModel(getEventStart(latestEvent, getTimeZone()), calendarInfos, mailboxDetails, latestEvent, mail, true)
		onEditEvent = async () => {
			const {showCalendarEventDialog} = await import("../view/CalendarEventEditDialog")
			showCalendarEventDialog(latestEvent.startTime, calendarInfos, mailboxDetails, latestEvent, mail)
		}
	}
	new CalendarEventPopup(latestEvent, eventBubbleRect, htmlSanitizer, onEditEvent, viewModel).show()
}

export function getEventFromFile(file: TutanotaFile): Promise<?CalendarEvent> {
	return locator.fileFacade.downloadFileContent(file).then((fileData) => {
		const parsedEvent = getParsedEvent(fileData)
		return parsedEvent && parsedEvent.event
	})
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
export function replyToEventInvitation(
	event: CalendarEvent,
	attendee: CalendarEventAttendee,
	decision: CalendarAttendeeStatusEnum,
	previousMail: Mail
): Promise<void> {
	const eventClone = clone(event)
	const foundAttendee = assertNotNull(eventClone.attendees.find((a) => a.address.address === attendee.address.address))
	foundAttendee.status = decision

	return Promise.all([
		locator.calendarModel.loadOrCreateCalendarInfo(new NoopProgressMonitor()).then(findPrivateCalendar),
		locator.mailModel.getMailboxDetailsForMail(previousMail)
	]).then(([calendar, mailboxDetails]) => {

		return import("../../mail/editor/SendMailModel").then(({SendMailModel}) => {
			const sendMailModel = new SendMailModel(locator.mailFacade, logins, locator.mailModel, locator.contactModel, locator.eventController, locator.entityClient, mailboxDetails)
			return calendarUpdateDistributor
				.sendResponse(eventClone, sendMailModel, foundAttendee.address.address, previousMail, decision)
				.catch(ofClass(UserError, (e) => Dialog.error(() => e.message)))
				.then(() => {
					if (calendar) {
						// if the owner group is set there is an existing event already so just update
						if (event._ownerGroup) {
							return locator.calendarModel.loadAlarms(event.alarmInfos, logins.getUserController().user)
							              .then((alarms) => {
									              const alarmInfos = alarms.map((a) => a.alarmInfo)
									              return locator.calendarModel.updateEvent(eventClone, alarmInfos, getTimeZone(), calendar.groupRoot, event)
									                            .then(noOp)
								              }
							              )
						} else {
							return locator.calendarModel.createEvent(eventClone, [], getTimeZone(), calendar.groupRoot)
						}
					} else {
						return Promise.resolve()
					}
				})
		})
	})
}