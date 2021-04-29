// @flow

import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog, DialogType} from "../../gui/base/Dialog"
import type {TableLineAttrs} from "../../gui/base/TableN"
import {ColumnWidth, TableN} from "../../gui/base/TableN"
import {assert, assertNotNull, downcast, neverNull} from "../../api/common/utils/Utils"
import {Icons} from "../../gui/base/icons/Icons"
import {lang} from "../../misc/LanguageViewModel"
import {Bubble, BubbleTextField} from "../../gui/base/BubbleTextField"
import {RecipientInfoBubbleHandler} from "../../misc/RecipientInfoBubbleHandler"
import {createRecipientInfo, getDisplayText, resolveRecipientInfoContact} from "../../mail/model/MailUtils"
import {attachDropdown} from "../../gui/base/DropdownN"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonType} from "../../gui/base/ButtonN"
import {remove} from "../../api/common/utils/ArrayUtils"
import {showProgressDialog} from "../../gui/ProgressDialog"
import type {ShareCapabilityEnum} from "../../api/common/TutanotaConstants"
import {ShareCapability} from "../../api/common/TutanotaConstants"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import {PreconditionFailedError, TooManyRequestsError} from "../../api/common/error/RestError"
import {TextFieldN} from "../../gui/base/TextFieldN"
import type {GroupInfo} from "../../api/entities/sys/GroupInfo"
import type {Contact} from "../../api/entities/tutanota/Contact"
import type {RecipientInfo} from "../../api/common/RecipientInfo"
import {
	getCapabilityText,
	getMemberCabability,
	getSharedGroupName,
	hasCapabilityOnGroup,
	isShareableGroupType,
	isSharedGroupOwner,
} from "../GroupUtils"
import {sendShareNotificationEmail} from "../GroupSharingUtils"
import {GroupSharingModel} from "../model/GroupSharingModel"
import {logins} from "../../api/main/LoginController"
import {locator} from "../../api/main/MainLocator"
import {worker} from "../../api/main/WorkerClient"
import {UserError} from "../../api/main/UserError"
import {showUserError} from "../../misc/ErrorHandlerImpl"
import {getConfirmation} from "../../gui/base/GuiUtils"
import type {GroupSharingTexts} from "../GroupGuiUtils"
import {getTextsForGroupType} from "../GroupGuiUtils"

export function showGroupSharingDialog(groupInfo: GroupInfo,
                                       allowGroupNameOverride: boolean) {

	const groupType = downcast(assertNotNull(groupInfo.groupType))
	assert(isShareableGroupType(downcast(groupInfo.groupType)), `Group type "${groupType}" must be shareable`)

	const texts = getTextsForGroupType(groupType)

	showProgressDialog("loading_msg", GroupSharingModel.newAsync(groupInfo, locator.eventController, locator.entityClient, logins, worker))
		.then(model => {
			model.onEntityUpdate.map(m.redraw.bind(m))
			const contentAttrs: GroupSharingDialogAttrs = {
				model,
				allowGroupNameOverride,
				texts
			}

			Dialog.showActionDialog({
					title: lang.get("sharing_label"),
					type: DialogType.EditMedium,
					child: () => m(GroupSharingDialogContent, contentAttrs),
					okAction: null,
					cancelAction: () => model.dispose(),
					cancelActionTextId: 'close_alt'
				}
			)
		})
}


type GroupSharingDialogAttrs = {
	model: GroupSharingModel,
	allowGroupNameOverride: boolean,
	texts: GroupSharingTexts
}

class GroupSharingDialogContent implements MComponent<GroupSharingDialogAttrs> {

	view(vnode: Vnode<GroupSharingDialogAttrs>): Children {
		const {model, allowGroupNameOverride, texts} = vnode.attrs
		const groupName = getSharedGroupName(model.info, allowGroupNameOverride)
		return m(".flex.col.pt-s", [
			m(TableN, {
				columnHeading: [() => texts.participantsLabel(groupName)],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				lines: this._renderMemberInfos(model, texts, groupName)
				           .concat(this._renderGroupInvitations(model, texts, groupName)),
				showActionButtonColumn: true,
				addButtonAttrs: {
					label: "addParticipant_action",
					click: () => showAddParticipantDialog(model, texts),
					icon: () => Icons.Add,
					isVisible: () => hasCapabilityOnGroup(logins.getUserController().user, model.group, ShareCapability.Invite)
				},
			})
		])
	}

	_renderGroupInvitations(model: GroupSharingModel, texts: GroupSharingTexts, groupName: string): Array<TableLineAttrs> {
		return model.sentGroupInvitations.map((sentGroupInvitation) => {
			return {
				cells: () => [
					{
						main: sentGroupInvitation.inviteeMailAddress,
						info: [`${lang.get("invited_label")}, ${getCapabilityText(downcast(sentGroupInvitation.capability))}`],
						mainStyle: ".i"
					}
				],
				actionButtonAttrs: {
					label: "remove_action",
					click: () => {
						getConfirmation(() => texts.removeMemberMessage(groupName, sentGroupInvitation.inviteeMailAddress))
							.confirmed(() => model.cancelInvitation(sentGroupInvitation))
					},
					icon: () => Icons.Cancel,
					isVisible: () => model.canCancelInvitation(sentGroupInvitation)
				}
			}
		})
	}

	_renderMemberInfos(model: GroupSharingModel, texts: GroupSharingTexts, groupName: string): Array<TableLineAttrs> {
		return model.memberInfos.map((memberInfo) => {
			return {
				cells: () => [
					{
						main: getDisplayText(memberInfo.info.name, neverNull(memberInfo.info.mailAddress), false),
						info: [
							(isSharedGroupOwner(model.group, memberInfo.member.user)
								? lang.get("owner_label")
								: lang.get("participant_label")) + ", " + getCapabilityText(getMemberCabability(memberInfo, model.group))
						]
					}
				], actionButtonAttrs: {
					label: "delete_action",
					icon: () => Icons.Cancel,
					click: () => {
						getConfirmation(() => texts.removeMemberMessage(groupName, downcast(memberInfo.info.mailAddress)))
							.confirmed(() => model.removeGroupMember(memberInfo.member))
					},
					isVisible: () => model.canRemoveGroupMember(memberInfo.member)
				}
			}
		})
	}
}

function showAddParticipantDialog(model: GroupSharingModel, texts: GroupSharingTexts) {
	const invitePeopleValueTextField: BubbleTextField<RecipientInfo> = new BubbleTextField("shareWithEmailRecipient_label", new RecipientInfoBubbleHandler({
		createBubble(name: ? string, mailAddress: string, contact: ? Contact): Bubble<RecipientInfo> {
			let recipientInfo = createRecipientInfo(mailAddress, name, contact)
			recipientInfo.resolveContactPromise =
				resolveRecipientInfoContact(recipientInfo, locator.contactModel, logins.getUserController().user)
			let bubbleWrapper = {}
			bubbleWrapper.buttonAttrs = attachDropdown({
				label: () => getDisplayText(recipientInfo.name, mailAddress, false),
				type: ButtonType.TextBubble,
				isSelected: () => false,
			}, () => {
				return this._createBubbleContextButtons(recipientInfo.name, mailAddress)
			})
			bubbleWrapper.bubble = new Bubble(recipientInfo, neverNull(bubbleWrapper.buttonAttrs), mailAddress)
			return bubbleWrapper.bubble
		},

		_createBubbleContextButtons(name: string, mailAddress: string): Array<ButtonAttrs | string> {
			let buttonAttrs = [mailAddress]
			buttonAttrs.push({
				label: "remove_action",
				type: ButtonType.Secondary,
				click: () => {
					const bubbleToRemove = invitePeopleValueTextField.bubbles.find((bubble) => bubble.entity.mailAddress === mailAddress)
					if (bubbleToRemove) {
						remove(invitePeopleValueTextField.bubbles, bubbleToRemove)
					}
				}
			})
			return buttonAttrs
		}
	}, locator.contactModel))
	const capability: Stream<ShareCapabilityEnum> = stream(ShareCapability.Read)
	const realGroupName = getSharedGroupName(model.info, false)
	const customGroupName = getSharedGroupName(model.info, true)

	let dialog = Dialog.showActionDialog({

		type: DialogType.EditMedium,
		title: () => lang.get("addParticipant_action"),
		child: () => [
			m(".pt", texts.addMemberMessage(customGroupName || realGroupName)),
			m(invitePeopleValueTextField),
			m(DropDownSelectorN, {
				label: "permissions_label",
				items: [
					{name: getCapabilityText(ShareCapability.Invite), value: ShareCapability.Invite},
					{name: getCapabilityText(ShareCapability.Write), value: ShareCapability.Write},
					{name: getCapabilityText(ShareCapability.Read), value: ShareCapability.Read},
				],
				selectedValue: capability,
				dropdownWidth: 300
			}),
			m(TextFieldN, {
				value: stream(realGroupName),
				label: texts.groupNameLabel,
				disabled: true,
				helpLabel: () => {
					return m("",
						customGroupName === realGroupName
							? null
							: texts.yourCustomNameLabel(customGroupName))
				}
			})
		],
		okAction: () => {
			invitePeopleValueTextField.createBubbles()
			if (invitePeopleValueTextField.bubbles.length === 0) {
				return Dialog.error("noRecipients_msg")

			} else {
				const recipients = invitePeopleValueTextField.bubbles.map(b => b.entity)
				return import("../../misc/SubscriptionDialogs")
					.then((SubscriptionDialogUtils) => SubscriptionDialogUtils.checkPremiumSubscription(false))
					.then(ok => {
						if (ok) {

							showProgressDialog("calendarInvitationProgress_msg",
								model.sendGroupInvitation(model.info, recipients, capability()))
								.then(invitedMailAddresses => {
									dialog.close()
									sendShareNotificationEmail(model.info,
										invitedMailAddresses.map(ma => createRecipientInfo(ma.address, null, null)),
										texts)
								})
								.catch(PreconditionFailedError, e => {
									if (logins.getUserController().isGlobalAdmin()) {
										getConfirmation(() => texts.sharingNotOrderedAdmin)
											.confirmed(() =>
												import("../../subscription/BuyDialog")
													.then((BuyDialog) => BuyDialog.showSharingBuyDialog(true)))
									} else {
										Dialog.error(() => `${texts.sharingNotOrderedUser} ${lang.get("contactAdmin_msg")}`)
									}
								})
								.catch(UserError, showUserError)
								.catch(TooManyRequestsError, e => Dialog.error("tooManyAttempts_msg"))
						}
					})
			}
		},
		okActionTextId: 'invite_alt'
	}).setCloseHandler(() => {
		dialog.close()
	})
}


