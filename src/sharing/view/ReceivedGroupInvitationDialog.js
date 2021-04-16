//@flow
import {worker} from "../../api/main/WorkerClient"
import {getDisplayText} from "../../mail/model/MailUtils"
import {logins} from "../../api/main/LoginController"
import {createGroupSettings} from "../../api/entities/tutanota/GroupSettings"
import {update} from "../../api/main/Entity"
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {TextFieldN} from "../../gui/base/TextFieldN"
import stream from "mithril/stream/stream.js"
import {downcast, isCustomizationEnabledForCustomer} from "../../api/common/utils/Utils"
import {Dialog} from "../../gui/base/Dialog"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import type {ReceivedGroupInvitation} from "../../api/entities/sys/ReceivedGroupInvitation"
import {isSameId} from "../../api/common/utils/EntityUtils"
import {sendAcceptNotificationEmail, sendRejectNotificationEmail} from "../GroupSharingUtils"
import {getCapabilityText, getDefaultGroupName, getInvitationGroupType, groupRequiresBusinessFeature,} from "../GroupUtils"
import {showBusinessFeatureRequiredDialog} from "../../misc/SubscriptionDialogs"
import type {GroupSharingTexts} from "../GroupGuiUtils"
import {getTextsForGroupType} from "../GroupGuiUtils"
import {FeatureType, GroupType} from "../../api/common/TutanotaConstants"
import {ColorPicker} from "../../gui/base/ColorPicker"


export function showGroupInvitationDialog(invitation: ReceivedGroupInvitation) {
	const groupType = getInvitationGroupType(invitation)
	const texts = getTextsForGroupType(groupType)

	const userSettingsGroupRoot = logins.getUserController().userSettingsGroupRoot
	const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === invitation.sharedGroup)
	const color = existingGroupSettings
		? existingGroupSettings.color
		: Math.random().toString(16).slice(-6)

	const colorStream = stream("#" + color)

	const isDefaultGroupName = invitation.sharedGroupName === getDefaultGroupName(downcast(invitation.groupType))

	const nameStream = stream(isDefaultGroupName
		? texts.sharedGroupDefaultCustomName(invitation)
		: invitation.sharedGroupName)

	const isMember = !!logins.getUserController().getCalendarMemberships().find((ms) => isSameId(ms.group, invitation.sharedGroup))
	let dialog

	const onAcceptClicked = () => {
		checkCanAcceptInvitation(invitation).then(canAccept => {
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
							name: newName
						})
						userSettingsGroupRoot.groupSettings.push(groupSettings)
					}
					update(userSettingsGroupRoot)
				})
			}
		})
	}

	dialog = Dialog.showActionDialog({
		title: () => lang.get("invitation_label"),
		child: {
			view: () => m(".flex.col", [
				m(".mb", [
					m(".pt.selectable", isMember
						? lang.getMaybeLazy(texts.alreadyGroupMemberMessage)
						: texts.receivedGroupInvitationMessage),
					m(TextFieldN, {
						value: nameStream,
						label: texts.groupNameLabel,
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
					groupType === GroupType.Calendar
						? renderCalendarGroupInvitationFields(invitation, colorStream)
						: null,
				]),
				isMember
					? null
					: m(ButtonN, {
						label: "acceptInvitation_action",
						type: ButtonType.Login,
						click: onAcceptClicked
					})
			])
		},
		okActionTextId: 'decline_action',
		okAction: (dialog) => {
			dialog.close()
			declineInvite(invitation, texts)
		},
		cancelActionTextId: 'close_alt'
	})
}

function checkCanAcceptInvitation(invitation: ReceivedGroupInvitation): Promise<boolean> {
	return import("../../misc/SubscriptionDialogs")
		.then(SubscriptionDialogUtils => SubscriptionDialogUtils.checkPremiumSubscription(false))
		.then(allowed => {
			if (!allowed) {
				return false
			}

			return logins.getUserController().loadCustomer().then(customer => {
				if (groupRequiresBusinessFeature(getInvitationGroupType(invitation)) &&
					!isCustomizationEnabledForCustomer(customer, FeatureType.BusinessFeatureEnabled)
				) {
					return showBusinessFeatureRequiredDialog("businessFeatureRequiredGeneral_msg")
				} else {
					return true
				}
			})
		})
}

function renderCalendarGroupInvitationFields(invitation: ReceivedGroupInvitation, selectedColourValue: Stream<string>): Children {
	return [
		m(".small.mt.mb-xs", lang.get("color_label")),
		m(ColorPicker, {value: selectedColourValue})
	]
}

function acceptInvite(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts): Promise<void> {
	return worker.acceptGroupInvitation(invitation)
	             .then(() => {
		             sendAcceptNotificationEmail(invitation, texts)
	             })
}

function declineInvite(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts): Promise<void> {
	return worker.rejectGroupInvitation(invitation._id)
	             .then(() => {
		             sendRejectNotificationEmail(invitation, texts)
	             })
}