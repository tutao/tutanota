//@flow

import {getDefaultSender} from "../mail/MailUtils"
import {downcast, neverNull} from "../api/common/utils/Utils"
import {mailModel} from "../mail/MailModel"
import {makeInvitationCalendarFile} from "./CalendarImporter"
import {MailEditor} from "../mail/MailEditor"
import {worker} from "../api/main/WorkerClient"

export function showCalendarInviteDialog(groupRoot: CalendarGroupRoot, existingEvent: CalendarEvent, alarms: Array<AlarmInfo>) {
	const sender = getDefaultSender(mailModel.getUserMailboxDetails())

	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	editor.hooks = {
		beforeSent: (editor, recipients) => {
			const attendees = recipients.map(({mailAddress}) => mailAddress)
			const inviteFile = makeInvitationCalendarFile(neverNull(existingEvent), sender, attendees)
			inviteFile.mimeType = "text/calendar; METHOD=REQUEST"
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
