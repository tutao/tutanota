//@flow

import {getDefaultSender} from "../mail/MailUtils"
import {downcast, neverNull} from "../api/common/utils/Utils"
import {mailModel} from "../mail/MailModel"
import {makeInvitationCalendarFile} from "./CalendarImporter"
import {MailEditor} from "../mail/MailEditor"
import {worker} from "../api/main/WorkerClient"
import {formatEventDuration} from "./CalendarUtils"
import {theme} from "../gui/theme"
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "../api/common/utils/Encoding"

export function showCalendarInviteDialog(groupRoot: CalendarGroupRoot, existingEvent: CalendarEvent, alarms: Array<AlarmInfo>) {
	const sender = getDefaultSender(mailModel.getUserMailboxDetails())

	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	editor.initWithTemplate(null, null, `You're invited to "${existingEvent.summary}"`, makeInviteEmailBody(existingEvent), false)
	editor.hooks = {
		beforeSent: (editor, recipients) => {
			const attendees = recipients.map(({mailAddress}) => mailAddress)
			const inviteFile = makeInvitationCalendarFile(neverNull(existingEvent), sender, attendees)
			inviteFile.mimeType = "text/calendar"
			editor.attachFiles([inviteFile])
		},
		afterSent: (editor) => {
			const draft = neverNull(editor.draft)
			const newAttendees = draft.toRecipients.concat(draft.ccRecipients).concat(draft.bccRecipients)
			const newEvent: CalendarEvent = downcast(Object.assign({}, existingEvent, {
				attendees: existingEvent.attendees.concat(newAttendees),
				_ownerEncSessionKey: null,
				_permissions: null,
			}))
			worker.createCalendarEvent(groupRoot, newEvent, alarms, existingEvent)
		}
	}

	editor.show()
}

function makeInviteEmailBody(event: CalendarEvent) {
	return `<div style="max-width: 685px; margin: 0 auto">
  <h2 style="text-align: center">You're invited to the "${event.summary}"</h2>
  <div style="margin: 0 auto">
    <p>When: ${formatEventDuration(event)}</p>
  </div>
  <hr style="border: 0; height: 1px; background-color: #ddd">
  <img style="max-height: 38px; display: block; background-color: white; padding: 4px 8px; border-radius: 4px; margin: 16px auto 0;"
  		src="data:image/svg+xml;base64,${uint8ArrayToBase64(stringToUtf8Uint8Array(theme.logo))}"/>
</div>`
}
