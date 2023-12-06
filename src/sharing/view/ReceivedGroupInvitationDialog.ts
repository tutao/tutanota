import { getMailAddressDisplayText } from "../../mail/model/MailUtils"
import { createGroupSettings } from "../../api/entities/tutanota/TypeRefs.js"
import m, { Children } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { TextField } from "../../gui/base/TextField.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { downcast } from "@tutao/tutanota-utils"
import { Dialog } from "../../gui/base/Dialog"
import { Button, ButtonType } from "../../gui/base/Button.js"
import type { ReceivedGroupInvitation } from "../../api/entities/sys/TypeRefs.js"
import { isSameId } from "../../api/common/utils/EntityUtils"
import { sendAcceptNotificationEmail, sendRejectNotificationEmail } from "../GroupSharingUtils"
import { getCapabilityText, getDefaultGroupName, getInvitationGroupType, isTemplateGroup } from "../GroupUtils"
import { showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs"
import type { GroupSharingTexts } from "../GroupGuiUtils"
import { getTextsForGroupType } from "../GroupGuiUtils"
import { GroupType } from "../../api/common/TutanotaConstants"
import { ColorPicker } from "../../gui/base/ColorPicker"
import { locator } from "../../api/main/MainLocator"

export function showGroupInvitationDialog(invitation: ReceivedGroupInvitation) {
	const groupType = getInvitationGroupType(invitation)
	const texts = getTextsForGroupType(groupType)
	const userSettingsGroupRoot = locator.logins.getUserController().userSettingsGroupRoot
	const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === invitation.sharedGroup)
	const color = existingGroupSettings ? existingGroupSettings.color : Math.random().toString(16).slice(-6)
	const colorStream = stream("#" + color)
	const isDefaultGroupName = invitation.sharedGroupName === getDefaultGroupName(downcast(invitation.groupType))
	const nameStream = stream(isDefaultGroupName ? texts.sharedGroupDefaultCustomName(invitation) : invitation.sharedGroupName)
	const isMember = locator.logins
		.getUserController()
		.getCalendarMemberships()
		.some((ms) => isSameId(ms.group, invitation.sharedGroup))
	let dialog: Dialog

	const onAcceptClicked = () => {
		checkCanAcceptGroupInvitation(invitation).then((canAccept) => {
			if (canAccept) {
				acceptInvite(invitation, texts).then(() => {
					dialog.close()
					const newColor = colorStream().substring(1) // color is stored without #

					const newName = nameStream()

					if (existingGroupSettings) {
						existingGroupSettings.color = newColor
						existingGroupSettings.name = newName
					} else {
						const groupSettings = createGroupSettings({
							group: invitation.sharedGroup,
							color: newColor,
							name: newName,
						})
						userSettingsGroupRoot.groupSettings.push(groupSettings)
					}

					locator.entityClient.update(userSettingsGroupRoot)
				})
			}
		})
	}

	dialog = Dialog.showActionDialog({
		title: () => lang.get("invitation_label"),
		child: {
			view: () =>
				m(".flex.col", [
					m(".mb", [
						m(".pt.selectable", isMember ? lang.getMaybeLazy(texts.alreadyGroupMemberMessage) : texts.receivedGroupInvitationMessage),
						m(TextField, {
							value: nameStream(),
							oninput: nameStream,
							label: texts.groupNameLabel,
						}),
						m(TextField, {
							value: getMailAddressDisplayText(invitation.inviterName, invitation.inviterMailAddress, false),
							label: "sender_label",
							disabled: true,
						}),
						m(TextField, {
							value: invitation.inviteeMailAddress,
							label: "to_label",
							disabled: true,
						}),
						m(TextField, {
							value: getCapabilityText(downcast(invitation.capability)),
							label: "permissions_label",
							disabled: true,
						}),
						groupType === GroupType.Calendar ? renderCalendarGroupInvitationFields(invitation, colorStream) : null,
					]),
					isMember
						? null
						: m(Button, {
								label: "acceptInvitation_action",
								type: ButtonType.Login,
								click: onAcceptClicked,
						  }),
				]),
		},
		okActionTextId: "decline_action",
		okAction: (dialog: Dialog) => {
			dialog.close()
			declineInvite(invitation, texts)
		},
		cancelActionTextId: "close_alt",
	})
}

/**
 * Checks if the logged-in user is able to accept the group invitation.
 * This is necessary because to be part of some kinds of groups you must have certain features.
 * Currently, there are two kinds of group invitations:
 * 1. Calendar: any paid account can accept invitations
 * 2. Template: only accounts with the templates feature can accept invitations
 * @param invitation
 */
async function checkCanAcceptGroupInvitation(invitation: ReceivedGroupInvitation): Promise<boolean> {
	const SubscriptionDialogUtils = await import("../../misc/SubscriptionDialogs")
	const allowed = await SubscriptionDialogUtils.checkPaidSubscription()
	if (!allowed) {
		return false
	}
	const planConfig = await locator.logins.getUserController().getPlanConfig()
	if (isTemplateGroup(getInvitationGroupType(invitation)) && !planConfig.templates) {
		const { getAvailablePlansWithTemplates } = await import("../../subscription/SubscriptionUtils.js")
		const plans = await getAvailablePlansWithTemplates()
		return showPlanUpgradeRequiredDialog(plans)
	} else {
		return true
	}
}

function renderCalendarGroupInvitationFields(invitation: ReceivedGroupInvitation, selectedColourValue: Stream<string>): Children {
	return [
		m(".small.mt.mb-xs", lang.get("color_label")),
		m(ColorPicker, {
			value: selectedColourValue(),
			onValueChange: selectedColourValue,
		}),
	]
}

function acceptInvite(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts): Promise<void> {
	return locator.shareFacade.acceptGroupInvitation(invitation).then(() => {
		sendAcceptNotificationEmail(invitation, texts)
	})
}

function declineInvite(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts): Promise<void> {
	return locator.shareFacade.rejectGroupInvitation(invitation._id).then(() => {
		sendRejectNotificationEmail(invitation, texts)
	})
}
