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


export function sendCalendarInvite(existingEvent: CalendarEvent, alarms: Array<AlarmInfo>, recipients: $ReadOnlyArray<MailAddress>) {
	existingEvent.organizer = existingEvent.organizer || getDefaultSender(mailModel.getUserMailboxDetails())

	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	// TODO: translate
	editor.initWithTemplate(recipients.map(({name, address}) => ({name, address})),
		`You're invited to "${existingEvent.summary}"`,
		makeInviteEmailBody(existingEvent, `You are invited to ${existingEvent.summary}`), false)
	const inviteFile = makeInvitationCalendarFile(existingEvent, IcalendarCalendarMethod.REQUEST)
	sendCalendarFile(editor, inviteFile, CalendarMethod.REQUEST)
}

export function sendCalendarInviteResponse(event: CalendarEvent, sender: MailAddress, status: CalendarAttendeeStatusEnum) {
	const {organizer} = event
	if (organizer == null) {
		throw new Error("Cannot send calendar invitation response without organizer")
	}
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	editor.initWithTemplate([{name: "", address: organizer}], `${sender.name || sender.address} replied to calendar invitation`,
		makeResponseEmailBody(event, sender, status), false)
	const responseFile = makeInvitationCalendarFile(event, IcalendarCalendarMethod.REPLY)
	sendCalendarFile(editor, responseFile, CalendarMethod.REPLY)
}

export function sendCalendarUpdate(event: CalendarEvent, recipients: $ReadOnlyArray<MailAddress>) {
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	editor.initWithTemplate(recipients.map(({name, address}) => ({name, address})), `Event update: ${event.summary}`,
		makeInviteEmailBody(event, ""))

	const file = makeInvitationCalendarFile(event, IcalendarCalendarMethod.PUBLISH)
	sendCalendarFile(editor, file, CalendarMethod.PUBLISH)
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

function makeInviteEmailBody(event: CalendarEvent, message: string) {
	return `<div style="max-width: 685px; margin: 0 auto">
  <h2 style="text-align: center">${message}</h2>
  <div style="margin: 0 auto">
    <div style="display: flex"><div style="min-width: 80px">When:</div>${formatEventDuration(event)}</div>
    <div style="display: flex"><div style="min-width: 80px">Who:</div>${event.organizer ? event.organizer + " (organizer)" : ""}</div>
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

function makeResponseEmailBody(event: CalendarEvent, sender: MailAddress, status: CalendarAttendeeStatusEnum): string {
	return `<div style="max-width: 685px; margin: 0 auto">
  <h2 style="text-align: center">Response to the "${event.summary}"</h2>
  <div style="margin: 0 auto">
  <div style="display: flex">Who:<div style='margin-left: 80px'>${sender.name + " " + sender.address
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
				      // TODO translate
				      Dialog.error(() => "Couldn't open event")
			      }
		      } catch (e) {
			      if (e instanceof ParserError) {
				      // TODO translate
				      Dialog.error(() => "Couldn't open event")
			      } else {
				      throw e
			      }
		      }
	      })
}