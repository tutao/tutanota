import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import { Dialog, DialogType } from "../../gui/base/Dialog"
import type { TableLineAttrs } from "../../gui/base/Table.js"
import { ColumnWidth, Table } from "../../gui/base/Table.js"
import { assert, assertNotNull, contains, downcast, findAndRemove, neverNull, remove } from "@tutao/tutanota-utils"
import { Icons } from "../../gui/base/icons/Icons"
import { lang } from "../../misc/LanguageViewModel"
import { ButtonType } from "../../gui/base/Button.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog"
import { GroupType, ShareCapability } from "../../api/common/TutanotaConstants"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import { PreconditionFailedError, TooManyRequestsError } from "../../api/common/error/RestError"
import { TextField } from "../../gui/base/TextField.js"
import type { GroupInfo } from "../../api/entities/sys/TypeRefs.js"
import { getCapabilityText, getMemberCapability, getSharedGroupName, hasCapabilityOnGroup, isShareableGroupType, isSharedGroupOwner } from "../GroupUtils"
import { sendShareNotificationEmail } from "../GroupSharingUtils"
import { GroupSharingModel } from "../model/GroupSharingModel"
import { locator } from "../../api/main/CommonLocator"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { getConfirmation } from "../../gui/base/GuiUtils"
import type { GroupSharingTexts } from "../GroupGuiUtils"
import { getTextsForGroupType } from "../GroupGuiUtils"
import { ResolvableRecipient } from "../../api/main/RecipientsModel"
import { MailRecipientsTextField } from "../../gui/MailRecipientsTextField.js"
import { cleanMailAddress, findRecipientWithAddress } from "../../api/common/utils/CommonCalendarUtils.js"
import { showPlanUpgradeRequiredDialog } from "../../misc/SubscriptionDialogs.js"
import { getMailAddressDisplayText } from "../../mailFunctionality/SharedMailUtils.js"
import { IconButtonAttrs } from "../../gui/base/IconButton.js"
import { KeyVerificationMismatchError } from "../../api/common/error/KeyVerificationMismatchError"

export async function showGroupSharingDialog(groupInfo: GroupInfo, allowGroupNameOverride: boolean) {
	const groupType = downcast(assertNotNull(groupInfo.groupType))
	assert(isShareableGroupType(groupInfo.groupType as GroupType), `Group type "${groupType}" must be shareable`)
	const texts = getTextsForGroupType(groupType)
	const recipientsModel = await locator.recipientsModel()
	showProgressDialog(
		"loading_msg",
		GroupSharingModel.newAsync(
			groupInfo,
			locator.eventController,
			locator.entityClient,
			locator.logins,
			locator.mailFacade,
			locator.shareFacade,
			locator.groupManagementFacade,
			recipientsModel,
			locator.groupSettingsModel,
		),
	).then((model) => {
		model.onEntityUpdate.map(m.redraw.bind(m))
		let dialog = Dialog.showActionDialog({
			title: "sharing_label",
			type: DialogType.EditMedium,
			child: () =>
				m(GroupSharingDialogContent, {
					model,
					allowGroupNameOverride,
					texts,
					dialog,
				}),
			okAction: null,
			cancelAction: () => model.dispose(),
			cancelActionTextId: "close_alt",
		})
	})
}

type GroupSharingDialogAttrs = {
	model: GroupSharingModel
	allowGroupNameOverride: boolean
	texts: GroupSharingTexts
	dialog: Dialog
}

class GroupSharingDialogContent implements Component<GroupSharingDialogAttrs> {
	view(vnode: Vnode<GroupSharingDialogAttrs>): Children {
		const { model, texts, dialog } = vnode.attrs
		return m(".flex.col.pt-8", [
			m(Table, {
				columnHeading: [
					{
						label: lang.makeTranslation("column_heading", texts.participantsLabel(model.groupNameData.name)),
						//Only show help text if the shared name is different from the local name
						helpText:
							model.groupNameData.kind === "shared" && model.groupNameData.customName
								? lang.makeTranslation("column_heading", texts.yourCustomNameLabel(model.groupNameData.customName))
								: undefined,
					},
				],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				lines: this._renderMemberInfos(model, texts, model.groupNameData.name, dialog).concat(
					this._renderGroupInvitations(model, texts, model.groupNameData.name),
				),
				showActionButtonColumn: true,
				addButtonAttrs: hasCapabilityOnGroup(locator.logins.getUserController().user, model.group, ShareCapability.Invite)
					? {
							title: "addParticipant_action",
							click: () => showAddParticipantDialog(model, texts),
							icon: Icons.Add,
						}
					: null,
			}),
		])
	}

	_renderGroupInvitations(model: GroupSharingModel, texts: GroupSharingTexts, groupName: string): Array<TableLineAttrs> {
		return model.sentGroupInvitations.map((sentGroupInvitation) => {
			let iconBtn: IconButtonAttrs = {
				title: "remove_action",
				click: () => {
					getConfirmation(
						lang.makeTranslation("confirmation_msg", texts.removeMemberMessage(groupName, sentGroupInvitation.inviteeMailAddress)),
					).confirmed(async () => {
						await model.cancelInvitation(sentGroupInvitation)
						m.redraw()
					})
				},
				icon: Icons.Cancel,
			}
			return {
				cells: () => [
					{
						main: sentGroupInvitation.inviteeMailAddress,
						info: [`${lang.get("invited_label")}, ${getCapabilityText(downcast(sentGroupInvitation.capability))}`],
						mainStyle: ".i",
					},
				],
				actionButtonAttrs: model.canCancelInvitation(sentGroupInvitation) ? iconBtn : null,
			}
		})
	}

	_renderMemberInfos(model: GroupSharingModel, texts: GroupSharingTexts, groupName: string, dialog: Dialog): Array<TableLineAttrs> {
		return model.memberInfos.map((memberInfo) => {
			return {
				cells: () => [
					{
						main: getMailAddressDisplayText(memberInfo.info.name, neverNull(memberInfo.info.mailAddress), false),
						info: [
							(isSharedGroupOwner(model.group, memberInfo.member.user) ? lang.get("owner_label") : lang.get("participant_label")) +
								", " +
								getCapabilityText(getMemberCapability(memberInfo, model.group)),
						],
					},
				],
				actionButtonAttrs: model.canRemoveGroupMember(memberInfo.member)
					? {
							title: "delete_action",
							icon: Icons.Cancel,
							click: () => {
								getConfirmation(
									lang.makeTranslation("confirmation_msg", texts.removeMemberMessage(groupName, downcast(memberInfo.info.mailAddress))),
								).confirmed(async () => {
									await model.removeGroupMember(memberInfo.member)
									if (model.memberIsSelf(memberInfo.member)) {
										dialog.close()
									}
									m.redraw()
								})
							},
						}
					: null,
			}
		})
	}
}

async function showAddParticipantDialog(model: GroupSharingModel, texts: GroupSharingTexts) {
	const recipientsText = stream("")
	const recipients = [] as Array<ResolvableRecipient>
	const capability = stream<ShareCapability>(ShareCapability.Read)
	const realGroupName = getSharedGroupName(model.info, locator.logins.getUserController().userSettingsGroupRoot, false)
	const customGroupName = getSharedGroupName(model.info, locator.logins.getUserController().userSettingsGroupRoot, true)

	const search = await locator.recipientsSearchModel()
	const recipientsModel = await locator.recipientsModel()

	let dialog = Dialog.showActionDialog({
		type: DialogType.EditMedium,
		title: "addParticipant_action",
		child: () => [
			m(
				".rel",
				m(MailRecipientsTextField, {
					label: "shareWithEmailRecipient_label",
					text: recipientsText(),
					recipients: recipients,
					disabled: false,
					getRecipientClickedDropdownAttrs: async (address) => [
						{
							info: address,
							center: false,
							bold: false,
						},
						{
							label: "remove_action",
							type: ButtonType.Secondary,
							click: () => {
								const bubbleToRemove = findRecipientWithAddress(recipients, address)
								if (bubbleToRemove) {
									remove(recipients, bubbleToRemove)
								}
							},
						},
					],
					onRecipientAdded: (address, name, contact) =>
						recipients.push(
							recipientsModel
								.initialize({
									address,
									name,
									contact,
								})
								.whenResolved(() => m.redraw()),
						),
					onRecipientRemoved: (address) =>
						findAndRemove(recipients, (recipient) => cleanMailAddress(recipient.address) === cleanMailAddress(address)),
					onTextChanged: recipientsText,
					search,
					maxSuggestionsToShow: 3,
				}),
			),
			m(DropDownSelector, {
				label: "permissions_label",
				items: [
					{
						name: getCapabilityText(ShareCapability.Invite),
						value: ShareCapability.Invite,
					},
					{
						name: getCapabilityText(ShareCapability.Write),
						value: ShareCapability.Write,
					},
					{
						name: getCapabilityText(ShareCapability.Read),
						value: ShareCapability.Read,
					},
				],
				selectedValue: capability(),
				selectionChangedHandler: capability,
				dropdownWidth: 300,
			}),
			m(TextField, {
				value: realGroupName,
				label: texts.groupNameLabel,
				isReadOnly: true,
				helpLabel: () => {
					return m("", customGroupName === realGroupName ? null : texts.yourCustomNameLabel(customGroupName))
				},
			}),
			m(".pt-16", texts.addMemberMessage(customGroupName || realGroupName)),
		],
		okAction: async () => {
			if (recipients.length === 0) {
				return Dialog.message("noRecipients_msg")
			}

			const { checkPaidSubscription, showPlanUpgradeRequiredDialog } = await import("../../misc/SubscriptionDialogs")
			if (await checkPaidSubscription()) {
				try {
					const invitedMailAddresses = await showProgressDialog(
						"calendarInvitationProgress_msg",
						model.sendGroupInvitation(model.info, recipients, capability()),
					)
					dialog.close()
					await sendShareNotificationEmail(model.info, invitedMailAddresses, texts)
				} catch (e) {
					if (e instanceof KeyVerificationMismatchError) {
						const failedRecipients: ResolvableRecipient[] = []

						// Mark all recipients that have a KeyVerificationMismatch after hitting "Send"
						for (const recipient of recipients) {
							if (contains(e.data, recipient.address)) {
								await recipient.markAsKeyVerificationMismatch()
								failedRecipients.push(recipient)
							}
						}

						await import("../../settings/keymanagement/KeyVerificationRecoveryDialog.js").then(
							({ showMultiRecipientsKeyVerificationRecoveryDialog }) => showMultiRecipientsKeyVerificationRecoveryDialog(failedRecipients),
						)
					} else if (e instanceof PreconditionFailedError) {
						if (locator.logins.getUserController().isGlobalAdmin()) {
							const { getAvailablePlansWithSharing } = await import("../../subscription/utils/SubscriptionUtils.js")
							const plans = await getAvailablePlansWithSharing()
							await showPlanUpgradeRequiredDialog(plans)
						} else {
							Dialog.message("contactAdmin_msg")
						}
					} else if (e instanceof UserError) {
						showUserError(e)
					} else if (e instanceof TooManyRequestsError) {
						Dialog.message("tooManyAttempts_msg")
					} else {
						throw e
					}
				}
			}
		},
		okActionTextId: "invite_alt",
	}).setCloseHandler(() => {
		dialog.close()
	})
}
