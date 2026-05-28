import m, { Children } from "mithril"
import { lang } from "../../../../ui/utils/LanguageViewModel.js"
import { LegacyTextField } from "../../../../ui/base/LegacyTextField.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { downcast, noOp, ofClass } from "../../../../platform-kit/utils"
import { Dialog } from "../../../../ui/base/Dialog.js"
import { sendAcceptNotificationEmail, sendRejectNotificationEmail } from "../GroupSharingUtils.js"
import { getCapabilityText, getDefaultGroupName } from "../GroupUtils.js"
import { showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs.js"
import type { GroupSharingTexts } from "../GroupGuiUtils.js"
import { getTextsForGroupType } from "../GroupGuiUtils.js"
import { locator } from "../../api/main/CommonLocator.js"
import { PrimaryButton } from "../../../../ui/base/buttons/VariantButtons.js"
import { AlarmInterval } from "../../calendar/date/CalendarUtils.js"
import { getMailAddressDisplayText } from "../../mailFunctionality/SharedMailUtils.js"
import { serializeAlarmInterval } from "../../api/common/utils/CommonCalendarUtils.js"
import { ColorPickerView } from "../../../../ui/base/colorPicker/ColorPickerView"
import { LockedError } from "../../../../platform-kit/rest-client/error"
import { ReceivedGroupInvitation } from "@tutao/entities/sys"
import { getInvitationGroupType, GroupType, isTemplateGroup } from "../../../../entities/sys/Utils"
import { isSameId } from "../../../../platform-kit/meta"
import { createDefaultAlarmInfo, createGroupSettings } from "@tutao/entities/tutanota"
import { UpgradePromptType } from "../../../../platform-kit/app-env"

export function showGroupInvitationDialog(invitation: ReceivedGroupInvitation) {
	const groupType = getInvitationGroupType(invitation)
	const texts = getTextsForGroupType(groupType)
	const userSettingsGroupRoot = locator.logins.getUserController().userSettingsGroupRoot
	const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === invitation.sharedGroup)
	const color = existingGroupSettings ? "#" + existingGroupSettings.color : ""
	const colorStream = stream(color)
	const isDefaultGroupName = invitation.sharedGroupName === getDefaultGroupName(getInvitationGroupType(invitation))
	const groupName = isDefaultGroupName ? texts.sharedGroupDefaultCustomName(invitation) : invitation.sharedGroupName
	const nameStream = stream(groupName)
	const alarmsStream: stream<AlarmInterval[]> = stream([])

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
							// If the receiving user does not set a custom name, the name from groupInfo will be used
							name: newName !== groupName ? newName : null,
							defaultAlarmsList: alarmsStream().map((alarm) => createDefaultAlarmInfo({ trigger: serializeAlarmInterval(alarm) })),
							sourceUrl: null,
						})
						userSettingsGroupRoot.groupSettings.push(groupSettings)
					}

					locator.entityClient.update(userSettingsGroupRoot).catch(ofClass(LockedError, noOp))
				})
			}
		})
	}

	dialog = Dialog.showActionDialog({
		title: "invitation_label",
		child: {
			view: () =>
				m(".flex.col", [
					m(".mb-16", [
						m(".pt-16.selectable", isMember ? lang.getTranslationText(texts.alreadyGroupMemberMessage) : texts.receivedGroupInvitationMessage),
						m(LegacyTextField, {
							value: nameStream(),
							oninput: nameStream,
							label: texts.groupNameLabel,
						}),
						m(LegacyTextField, {
							value: getMailAddressDisplayText(invitation.inviterName, invitation.inviterMailAddress, false),
							label: "sender_label",
							isReadOnly: true,
						}),
						m(LegacyTextField, {
							value: invitation.inviteeMailAddress,
							label: "to_label",
							isReadOnly: true,
						}),
						m(LegacyTextField, {
							value: getCapabilityText(downcast(invitation.capability)),
							label: "permissions_label",
							isReadOnly: true,
						}),
						groupType === GroupType.Calendar ? renderCalendarGroupInvitationFields(invitation, colorStream, alarmsStream) : null,
					]),
					isMember
						? null
						: m(PrimaryButton, {
								label: "acceptInvitation_action",
								onclick: onAcceptClicked,
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
	const SubscriptionDialogUtils = await import("../../misc/SubscriptionDialogs.js")
	const allowed = await SubscriptionDialogUtils.checkPaidSubscription(UpgradePromptType.ACCEPT_GROUP_INVITATION)
	if (!allowed) {
		return false
	}
	const planConfig = await locator.logins.getUserController().getPlanConfig()
	if (isTemplateGroup(getInvitationGroupType(invitation)) && !planConfig.templates) {
		const { getAvailablePlansWithTemplates } = await import("../../subscription/utils/SubscriptionUtils.js")
		const plans = await getAvailablePlansWithTemplates()
		return showPlanUpgradeRequiredDialog(UpgradePromptType.ACCEPT_GROUP_INVITATION, plans)
	} else {
		return true
	}
}

function renderCalendarGroupInvitationFields(
	invitation: ReceivedGroupInvitation,
	selectedColourValue: Stream<string>,
	alarmsStream: Stream<AlarmInterval[]>,
): Children {
	let alarms = alarmsStream()
	return [
		m(".small.mt-16.mb-4", lang.get("color_label")),
		m(ColorPickerView, {
			value: selectedColourValue(),
			onselect: selectedColourValue,
		}),
	]
}

function acceptInvite(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts): Promise<void> {
	return locator.shareFacade.acceptGroupInvitation(invitation).then(() => {
		sendAcceptNotificationEmail(invitation, texts)
	})
}

function declineInvite(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts): Promise<void> {
	return locator.shareFacade.rejectOrCancelGroupInvitation(invitation._id).then(() => {
		sendRejectNotificationEmail(invitation, texts)
	})
}
