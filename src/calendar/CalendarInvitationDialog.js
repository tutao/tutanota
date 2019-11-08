//@flow
import {worker} from "../api/main/WorkerClient"
import {sendAcceptNotificationEmail, sendRejectNotificationEmail} from "./CalendarSharingUtils"
import {createRecipientInfo, getDisplayText} from "../mail/MailUtils"
import {logins} from "../api/main/LoginController"
import {showEditCalendarDialog} from "./EditCalendarDialog"
import {createGroupColor} from "../api/entities/tutanota/GroupColor"
import {update} from "../api/main/Entity"
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {TextFieldN} from "../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import {getCapabilityText} from "./CalendarUtils"
import {downcast} from "../api/common/utils/Utils"


export function showInvitationDialog(invitation: ReceivedGroupInvitation) {
	const userSettingsGroupRoot = logins.getUserController().userSettingsGroupRoot
	const existingGroupColor = userSettingsGroupRoot.groupColors.find((gc) => gc.group === invitation.sharedGroup)
	const color = existingGroupColor ? existingGroupColor.color : Math.random().toString(16).slice(-6)

	showEditCalendarDialog({
		name: invitation.sharedGroupName,
		color: color
	}, "invitation_label", true, (dialog, properties) => {
		dialog.close()
		this._acceptInvite(invitation).then(() => {
			// color always set for existing calendar
			if (existingGroupColor) {
				existingGroupColor.color = properties.color
			} else {
				const groupColor = Object.assign(createGroupColor(), {
					group: invitation.sharedGroup,
					color: properties.color
				})
				userSettingsGroupRoot.groupColors.push(groupColor)
			}

			return update(userSettingsGroupRoot)
		})
	}, 'accept_action', () => {
		return [
			m(".pt.selectable", lang.get("shareCalendarWarning_msg")),
			m(TextFieldN, {
				value: stream(getDisplayText(invitation.inviterName, invitation.inviterMailAddress, false)),
				label: "sender_label",
				disabled: true
			}),
			m(TextFieldN, {
				value: stream(getCapabilityText(downcast(invitation.capability))),
				label: "permissions_label",
				disabled: true
			})
		]
	})
}


function _acceptInvite(invitation: ReceivedGroupInvitation): Promise<void> {
	return worker.acceptGroupInvitation(invitation)
	             .then(() => {
		             sendAcceptNotificationEmail(invitation.sharedGroupName,
			             createRecipientInfo(invitation.inviterMailAddress, null, null, true))
	             })
}

function _rejectInvite(invitation: ReceivedGroupInvitation): Promise<void> {
	return worker.rejectGroupInvitation(invitation._id)
	             .then(() => {
		             sendRejectNotificationEmail(invitation.sharedGroupName,
			             createRecipientInfo(invitation.inviterMailAddress, null, null, true))
	             })
}