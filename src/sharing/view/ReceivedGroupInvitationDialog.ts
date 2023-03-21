import { getMailAddressDisplayText } from "../../mail/model/MailUtils"
import { createGroupSettings } from "../../api/entities/tutanota/TypeRefs.js"
import m, { Children } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { TextField } from "../../gui/base/TextField.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { isCustomizationEnabledForCustomer } from "../../api/common/utils/Utils"
import { downcast } from "@tutao/tutanota-utils"
import { Dialog } from "../../gui/base/Dialog"
import { Button, ButtonType } from "../../gui/base/Button.js"
import type { ReceivedGroupInvitation } from "../../api/entities/sys/TypeRefs.js"
import { isSameId } from "../../api/common/utils/EntityUtils"
import { sendAcceptNotificationEmail, sendRejectNotificationEmail } from "../GroupSharingUtils"
import { getCapabilityText, getDefaultGroupName, getInvitationGroupType, groupRequiresBusinessFeature } from "../GroupUtils"
import { showBusinessFeatureRequiredDialog } from "../../misc/SubscriptionDialogs"
import type { GroupSharingTexts } from "../GroupGuiUtils"
import { getTextsForGroupType } from "../GroupGuiUtils"
import { FeatureType, GroupType } from "../../api/common/TutanotaConstants"
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
	const isMember = !!locator.logins
		.getUserController()
		.getCalendarMemberships()
		.find((ms) => isSameId(ms.group, invitation.sharedGroup))
	let dialog: Dialog

	const onAcceptClicked = () => {
		checkCanAcceptInvitation(invitation).then((canAccept) => {
			if (canAccept) {
				acceptInvite(invitation, texts).then(() => {
					dialog.close()
					const newColor = colorStream().substring(1) // color is stored without #

					const newName = nameStream()

					if (existingGroupSettings) {
						existingGroupSettings.color = newColor
						existingGroupSettings.name = newName
					} else {
						const groupSettings = Object.assign(createGroupSettings(), {
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

async function checkCanAcceptInvitation(invitation: ReceivedGroupInvitation): Promise<boolean> {
	const SubscriptionDialogUtils = await import("../../misc/SubscriptionDialogs")
	const allowed = await SubscriptionDialogUtils.checkPremiumSubscription(false)
	if (!allowed) {
		return false
	}
	const customer = await locator.logins.getUserController().loadCustomer()
	if (groupRequiresBusinessFeature(getInvitationGroupType(invitation)) && !isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled)) {
		return showBusinessFeatureRequiredDialog("businessFeatureRequiredGeneral_msg")
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
