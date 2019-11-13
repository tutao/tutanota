//@flow
import {worker} from "../api/main/WorkerClient"
import {createRecipientInfo, getDisplayText} from "../mail/MailUtils"
import {logins} from "../api/main/LoginController"
import {createGroupColor} from "../api/entities/tutanota/GroupColor"
import {update} from "../api/main/Entity"
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {TextFieldN} from "../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import {getCapabilityText} from "./CalendarUtils"
import {downcast} from "../api/common/utils/Utils"
import {Dialog} from "../gui/base/Dialog"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {isSameId} from "../api/common/EntityFunctions"


export function showInvitationDialog(invitation: ReceivedGroupInvitation) {
	const userSettingsGroupRoot = logins.getUserController().userSettingsGroupRoot
	const existingGroupColor = userSettingsGroupRoot.groupColors.find((gc) => gc.group === invitation.sharedGroup)
	const color = existingGroupColor ? existingGroupColor.color : Math.random().toString(16).slice(-6)

	let colorPickerDom: ?HTMLInputElement
	const colorStream = stream("#" + color)

	const isMember = logins.getUserController().getCalendarMemberships().find((ms) => isSameId(ms.group, invitation.sharedGroup))

	const dialog = Dialog.showActionDialog({
		title: () => lang.get("invitation_label"),
		child: {
			view: () => m(".flex.col", [
				m(".pt.selectable", isMember ? lang.get("alreadyMember_msg") : lang.get("shareCalendarWarning_msg")),
				m(TextFieldN, {
					value: stream(invitation.sharedGroupName),
					label: "calendarName_label",
					disabled: true
				}),
				m(TextFieldN, {
					value: stream(getDisplayText(invitation.inviterName, invitation.inviterMailAddress, false)),
					label: "sender_label",
					disabled: true
				}),
				m(TextFieldN, {
					value: stream(invitation.inviteeMailAddress),
					label: "to_label",
					disabled: true
				}),
				m(TextFieldN, {
					value: stream(getCapabilityText(downcast(invitation.capability))),
					label: "permissions_label",
					disabled: true
				}),
				m(".small.mt.mb-xs", lang.get("color_label")),
				m("input.mb.color-picker", {
					oncreate: ({dom}) => colorPickerDom = dom,
					type: "color",
					value: colorStream(),
					oninput: (inputEvent) => {
						console.log("new color", inputEvent.target.value)
						colorStream(inputEvent.target.value)
					}
				}),
				isMember ? null : m(ButtonN, {
					label: "join_action",
					type: ButtonType.Login,
					click: () => {

						if (logins.getUserController().isFreeAccount()) {
							showNotAvailableForFreeDialog(true)
						} else {
							acceptInvite(invitation).then(() => {
								dialog.close()
								const newColor = colorStream().substring(1) // color is stored without #
								if (existingGroupColor) {
									existingGroupColor.color = newColor
									console.log("existing group color", newColor)
								} else {
									const groupColor = Object.assign(createGroupColor(), {
										group: invitation.sharedGroup,
										color: newColor
									})
									userSettingsGroupRoot.groupColors.push(groupColor)
									console.log("existing group color", newColor)
								}

								return update(userSettingsGroupRoot)
							})
						}
					}
				})
			])
		},
		okActionTextId: 'decline_action',
		okAction: (dialog) => {
			dialog.close()
			declineInvite(invitation)

		},
		cancelActionTextId: 'close_alt'
	})
}


function acceptInvite(invitation: ReceivedGroupInvitation): Promise<void> {
	return worker.acceptGroupInvitation(invitation)
}

function declineInvite(invitation: ReceivedGroupInvitation): Promise<void> {
	return worker.rejectGroupInvitation(invitation._id)
}