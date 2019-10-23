//@flow

import {getDefaultSender} from "../mail/MailUtils"
import {mailModel} from "../mail/MailModel"
import {calendarAttendeeStatusDescription, formatEventDuration} from "./CalendarUtils"
import {theme} from "../gui/theme"
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "../api/common/utils/Encoding"
import type {CalendarAttendeeStatusEnum, CalendarMethodEnum} from "../api/common/TutanotaConstants"
import {CalendarMethod, getAttendeeStatus, IcalendarCalendarMethod} from "../api/common/TutanotaConstants"
import {makeInvitationCalendarFile, parseCalendarFile} from "./CalendarImporter"
import {MailEditor} from "../mail/MailEditor"
import {worker} from "../api/main/WorkerClient"
import {all as promiseAll} from "../api/common/utils/PromiseUtils"
import {showCalendarEventDialog} from "./CalendarEventDialog"
import m from "mithril"
import {DateTime} from "luxon"
import {Dialog} from "../gui/base/Dialog"
import {ParserError} from "../misc/parsing"
import {loadCalendarInfo} from "./CalendarModel"
import {CalendarEventTypeRef} from "../api/entities/tutanota/CalendarEvent"
import {load, loadMultiple} from "../api/main/Entity"
import type {CalendarInfo} from "./CalendarView"
import {AlarmInfoTypeRef} from "../api/entities/sys/AlarmInfo"
import {elementIdPart, listIdPart} from "../api/common/EntityFunctions"
import {lang} from "../misc/LanguageViewModel"


export function sendCalendarInvite(existingEvent: CalendarEvent, alarms: Array<AlarmInfo>, recipients: $ReadOnlyArray<MailAddress>) {
	existingEvent.organizer = existingEvent.organizer || getDefaultSender(mailModel.getUserMailboxDetails())

	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	const message = lang.get("eventInviteMail_msg", {"{event}": existingEvent.summary})
	editor.initWithTemplate(recipients.map(({name, address}) => ({name, address})),
		message,
		makeInviteEmailBody(existingEvent, message),
		false)
	const inviteFile = makeInvitationCalendarFile(existingEvent, IcalendarCalendarMethod.REQUEST)
	sendCalendarFile(editor, inviteFile, CalendarMethod.REQUEST)
}

export function sendCalendarInviteResponse(event: CalendarEvent, sender: MailAddress, status: CalendarAttendeeStatusEnum) {
	const {organizer} = event
	if (organizer == null) {
		throw new Error("Cannot send calendar invitation response without organizer")
	}
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	const message = lang.get("repliedToEventInvite_msg", {"{sender}": sender.name || sender.address})
	editor.initWithTemplate([{name: "", address: organizer}],
		message,
		makeResponseEmailBody(event, message, sender, status), false)
	const responseFile = makeInvitationCalendarFile(event, IcalendarCalendarMethod.REPLY)
	sendCalendarFile(editor, responseFile, CalendarMethod.REPLY)
}

export function sendCalendarUpdate(event: CalendarEvent, recipients: $ReadOnlyArray<MailAddress>) {
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	editor.initWithTemplate(recipients.map(({name, address}) => ({name, address})), lang.get("eventUpdated_msg", {"event": event.summary}),
		makeInviteEmailBody(event, ""))

	const file = makeInvitationCalendarFile(event, IcalendarCalendarMethod.PUBLISH)
	sendCalendarFile(editor, file, CalendarMethod.PUBLISH)
}

export function sendCalendarCancellation(event: CalendarEvent, recipients: $ReadOnlyArray<MailAddress>) {
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	// TODO: pass as bcc
	editor.initWithTemplate(recipients.map(({name, address}) => ({
			name,
			address
		})), lang.get("eventCancelled_msg", {"event": event.summary}),
		makeInviteEmailBody(event, ""))

	const file = makeInvitationCalendarFile(event, IcalendarCalendarMethod.CANCEL)
	sendCalendarFile(editor, file, CalendarMethod.CANCEL)
}

function sendCalendarFile(editor: MailEditor, responseFile: DataFile, method: CalendarMethodEnum) {
	editor.attachFiles([responseFile])
	editor.hooks = {
		beforeSent(editor: MailEditor, attachments: Array<TutanotaFile>) {
			return {calendarFileMethods: [[attachments[0]._id, method]]}
		}
	}
	editor.send()
}

function organizerLine(event: CalendarEvent) {
	return `<div style="display: flex"><div style="min-width: 80px">${lang.get("who_label")}:</div>${
		event.organizer ? `${event.organizer} (${lang.get("organizer_label")})` : ""}</div>`
}

function whenLine(event: CalendarEvent): string {
	return `<div style="display: flex"><div style="min-width: 80px">${lang.get("when_label")}:</div>${formatEventDuration(event)}</div>`
}

function makeInviteEmailBody(event: CalendarEvent, message: string) {
	return `<div style="max-width: 685px; margin: 0 auto">
  <h2 style="text-align: center">${message}</h2>
  <div style="margin: 0 auto">
    ${whenLine(event)}
    ${organizerLine(event)}
    ${event.attendees.map((a) =>
		"<div style='margin-left: 80px'>" + (a.address.name || "") + " " + a.address.address + " "
		+ calendarAttendeeStatusDescription(getAttendeeStatus(a)) + "</div>")
	       .join("\n")}
  </div>
  <hr style="border: 0; height: 1px; background-color: #ddd">
  <img style="max-height: 38px; display: block; background-color: white; padding: 4px 8px; border-radius: 4px; margin: 16px auto 0"
  		src="data:image/svg+xml;base64,${uint8ArrayToBase64(stringToUtf8Uint8Array(theme.logo))}"
  		alt="logo"/>
</div>`
}

function makeResponseEmailBody(event: CalendarEvent, message: string, sender: MailAddress, status: CalendarAttendeeStatusEnum): string {
	return `<div style="max-width: 685px; margin: 0 auto">
  <h2 style="text-align: center">${message}</h2>
  <div style="margin: 0 auto">
  <div style="display: flex">${lang.get("who_label")}:<div style='margin-left: 80px'>${sender.name + " " + sender.address
	} ${calendarAttendeeStatusDescription(status)}</div></div>
  </div>
  <hr style="border: 0; height: 1px; background-color: #ddd">
  <img style="max-height: 38px; display: block; background-color: white; padding: 4px 8px; border-radius: 4px; margin: 16px auto 0"
  		src="data:image/svg+xml;base64,${uint8ArrayToBase64(stringToUtf8Uint8Array(theme.logo))}"
  		alt="logo"/>
</div>`
}

function loadOrCreateCalendarInfo() {
	return loadCalendarInfo()
		.then((calendarInfo) =>
			calendarInfo.size && calendarInfo || worker.addCalendar("").then(() => loadCalendarInfo()))
}

export function showEventDetailsFromFile(firstCalendarFile: TutanotaFile) {
	worker.downloadFileContent(firstCalendarFile)
	      .then((fileData) => {
		      try {
			      const {contents} = parseCalendarFile(fileData)
			      const parsedEventWithAlarms = contents[0]
			      if (parsedEventWithAlarms && parsedEventWithAlarms.event.uid) {
				      const parsedEvent = parsedEventWithAlarms.event
				      return promiseAll(
					      worker.getEventByUid(parsedEventWithAlarms.event.uid),
					      loadOrCreateCalendarInfo(),
				      ).then(([existingEvent, calendarInfo]: [?CalendarEvent, Map<Id, CalendarInfo>]) => {
					      if (!existingEvent) {
						      showCalendarEventDialog(parsedEvent.startTime, calendarInfo, parsedEvent)
					      } else {
						      m.route.set(`/calendar/month/${DateTime.fromJSDate(existingEvent.startTime).toISODate()}`)
						      if (parsedEvent.sequence > existingEvent.sequence) {
							      parsedEvent._id = existingEvent._id
							      parsedEvent._ownerGroup = existingEvent._ownerGroup
							      Promise.resolve(
								      existingEvent.alarmInfos.length
									      ? loadMultiple(AlarmInfoTypeRef,
									      listIdPart(existingEvent.alarmInfos[0]), existingEvent.alarmInfos.map(elementIdPart))
									      : []
							      ).then((alarmInfos) => {
								      worker.createCalendarEvent(parsedEvent, alarmInfos, existingEvent)
								            .then(() => load(CalendarEventTypeRef, existingEvent._id))
								            .then(() => showCalendarEventDialog(parsedEvent.startTime, calendarInfo, parsedEvent))
							      })

						      } else {
							      showCalendarEventDialog(existingEvent.startTime, calendarInfo, existingEvent)
						      }
					      }
				      })
			      } else {
				      Dialog.error("cannotOpenEvent_msg")
			      }
		      } catch (e) {
			      if (e instanceof ParserError) {
				      Dialog.error("cannotOpenEvent_msg")
			      } else {
				      throw e
			      }
		      }
	      })
}