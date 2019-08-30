//@flow

import {getDefaultSender} from "../mail/MailUtils"
import {neverNull} from "../api/common/utils/Utils"
import {mailModel} from "../mail/MailModel"
import {makeInvitationCalendarFile} from "./CalendarImporter"
import {MailEditor} from "../mail/MailEditor"
import {worker} from "../api/main/WorkerClient"
import {calendarAttendeeStatusDescription, copyEvent, formatEventDuration} from "./CalendarUtils"
import {theme} from "../gui/theme"
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {createCalendarEventAttendee} from "../api/entities/tutanota/CalendarEventAttendee"
import {CalendarAttendeeStatus, getAttendeeStatus} from "../api/common/TutanotaConstants"
import {createMailAddress} from "../api/entities/tutanota/MailAddress"

export function showCalendarInviteDialog(existingEvent: CalendarEvent, alarms: Array<AlarmInfo>) {
	const sender = getDefaultSender(mailModel.getUserMailboxDetails())

	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	editor.initWithTemplate(null, null, `You're invited to "${existingEvent.summary}"`, "", false)
	let newEvent: CalendarEvent
	editor.hooks = {
		beforeSent: (editor, recipients, html) => {
			const newAttendees = recipients
				.filter((recipientInfo: RecipientInfo) =>
					existingEvent.attendees.find((attendee) => attendee.address.address === recipientInfo.mailAddress) == null)
				.map((recipientInfo) => createCalendarEventAttendee({
					address: createMailAddress({
						address: recipientInfo.mailAddress,
						name: recipientInfo.name,
						contact: recipientInfo.contact && recipientInfo.contact._id
					}),
					status: CalendarAttendeeStatus.NEEDS_ACTION
				}))
			// TODO: should send another id here, otherwise it's very buggy with entity updates
			newEvent = copyEvent(existingEvent, {
				attendees: existingEvent.attendees.concat(newAttendees),
				organizer: existingEvent.organizer || sender,
			})

			const inviteFile = makeInvitationCalendarFile(neverNull(newEvent), "REQUEST")

			inviteFile.mimeType = "text/calendar"
			editor.attachFiles([inviteFile])
			return makeInviteEmailBody(newEvent, html)
		},
		afterSent: () => {
			worker.createCalendarEvent(newEvent, alarms, existingEvent)
		}
	}

	editor.show()
}

function makeInviteEmailBody(event: CalendarEvent, message: string) {
	return `<div style="max-width: 685px; margin: 0 auto">
  <h2 style="text-align: center">You're invited to the "${event.summary}"</h2>
  ${message}
  <div style="margin: 0 auto">
    <div style="display: flex"><div style="min-width: 80px">When:</div>${formatEventDuration(event)}</div>
    <div style="display: flex"><div style="min-width: 80px">Who:</div>${event.organizer ? event.organizer + " (organizer)" : ""}</div>
    ${event.attendees.map((a) =>
		"<div style='margin-left: 80px'>" + a.address.name + " " + a.address.address + " "
		+ calendarAttendeeStatusDescription(getAttendeeStatus(a)) + "</div>")
	       .join("\n")}
  </div>
  <hr style="border: 0; height: 1px; background-color: #ddd">
  <img style="max-height: 38px; display: block; background-color: white; padding: 4px 8px; border-radius: 4px; margin: 16px auto 0"
  		src="data:image/svg+xml;base64,${uint8ArrayToBase64(stringToUtf8Uint8Array(theme.logo))}"/>
</div>`
}
