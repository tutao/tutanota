// @flow

import {Dialog, DialogType} from "../gui/base/Dialog"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {GroupMemberTypeRef} from "../api/entities/sys/GroupMember"
import {load, loadAll} from "../api/main/Entity"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {ColumnWidth, TableN} from "../gui/base/TableN"
import {downcast, getGroupInfoDisplayName, neverNull} from "../api/common/utils/Utils"
import {Icons} from "../gui/base/icons/Icons"
import {lang} from "../misc/LanguageViewModel"
import {Bubble, BubbleTextField} from "../gui/base/BubbleTextField"
import {MailAddressBubbleHandler} from "../misc/MailAddressBubbleHandler"
import {createRecipientInfo, getDisplayText} from "../mail/MailUtils"
import {attachDropdown} from "../gui/base/DropdownN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {findAndRemove, remove} from "../api/common/utils/ArrayUtils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {GroupTypeRef} from "../api/entities/sys/Group"
import type {ShareCapabilityEnum} from "../api/common/TutanotaConstants"
import {OperationType, ShareCapability} from "../api/common/TutanotaConstants"
import {getElementId, isSameId} from "../api/common/EntityFunctions"
import {getCalendarName, hasCapabilityOnGroup} from "./CalendarUtils"
import {worker} from "../api/main/WorkerClient"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {px} from "../gui/size"
import {SentGroupInvitationTypeRef} from "../api/entities/sys/SentGroupInvitation"
import {NotFoundError, PreconditionFailedError} from "../api/common/error/RestError"
import {showSharingBuyDialog} from "../subscription/WhitelabelAndSharingBuyDialog"
import {logins} from "../api/main/LoginController"
import {RecipientsNotFoundError} from "../api/common/error/RecipientsNotFoundError"
import type {EntityEventsListener} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import {locator} from "../api/main/MainLocator"


type GroupMemberInfo = {
	member: GroupMember,
	info: GroupInfo
}
type GroupDetails = {
	info: GroupInfo,
	group: Group,
	memberInfos: Array<GroupMemberInfo>,
	sentGroupInvitations: Array<SentGroupInvitation>
}

type CalendarSharingDialogAttrs = {
	groupDetails: GroupDetails,
	sendInviteHandler(recipients: Array<RecipientInfo>, capability: ShareCapabilityEnum): void,
}


export function showCalendarSharingDialog(groupInfo: GroupInfo) {
	showProgressDialog("loading_msg", loadGroupDetails(groupInfo)
		.then(groupDetails => {

			const eventListener: EntityEventsListener = (updates, eventOwnerGroupId) => {
				updates.forEach(update => {
						if (!isSameId(eventOwnerGroupId, groupDetails.group._id)) {
							//ignore events of differen group here
							console.log("received update for different group", eventOwnerGroupId)
							return
						}
						if (isUpdateForTypeRef(SentGroupInvitationTypeRef, update)) {
							if (update.operation === OperationType.CREATE
								&& isSameId(update.instanceListId, groupDetails.group.invitations)) {
								load(SentGroupInvitationTypeRef, [update.instanceListId, update.instanceId]).then(instance => {
									if (instance) {
										groupDetails.sentGroupInvitations.push(instance)
										m.redraw()
									}
								}).catch(NotFoundError, e => console.log("sent invitation not found", update))
							}
							if (update.operation === OperationType.DELETE) {
								findAndRemove(groupDetails.sentGroupInvitations, (sentGroupInvitation) => isSameId(getElementId(sentGroupInvitation), update.instanceId))
								m.redraw()
							}
						} else if (isUpdateForTypeRef(GroupMemberTypeRef, update)) {
							console.log("update received in share dialog", update)
							if (update.operation === OperationType.CREATE
								&& isSameId(update.instanceListId, groupDetails.group.members)) {
								load(GroupMemberTypeRef, [update.instanceListId, update.instanceId]).then(instance => {
									if (instance) {
										return loadGroupInfoForMember(instance).then(groupMemberInfo => {
											console.log("new member", groupMemberInfo)
											groupDetails.memberInfos.push(groupMemberInfo)
											m.redraw()
										})
									}
								}).catch(NotFoundError, e => console.log("group member not found", update))
							}
							if (update.operation === OperationType.DELETE) {
								findAndRemove(groupDetails.memberInfos, (memberInfo) => isSameId(getElementId(memberInfo.member), update.instanceId))
								m.redraw()
							}
						}
					}
				)
			}
			locator.eventController.addEntityListener(eventListener)

			const unsubscribeEventListener = () => {
				locator.eventController.removeEntityListener(eventListener)
			}


			const dialog = Dialog.showActionDialog({
					title: () => getCalendarName(groupInfo.name),
					type: DialogType.EditLarge,
					child: () => m(CalendarSharingDialogContent, {
						groupDetails,
						sendInviteHandler: (recipients, capability) => {
							showProgressDialog("calendarInvitationProgress_msg",
								worker.sendGroupInvitation(groupInfo, getCalendarName(groupInfo.name), recipients, capability)
							).catch(PreconditionFailedError, e => {
								if (logins.getUserController().isGlobalAdmin()) {
									Dialog.confirm("sharingFeatureNotOrderedAdmin_msg")
									      .then(confirmed => {
										      if (confirmed) {
											      showSharingBuyDialog(true)
										      }
									      })
								} else {
									Dialog.error("sharingFeatureNotOrderedUser_msg")
								}

							}).catch(RecipientsNotFoundError, e => {
								let invalidRecipients = e.message.join("\n")
								return Dialog.error(() => lang.get("invalidRecipients_msg") + "\n"
									+ invalidRecipients)
							})
						}
					}),
					okAction: null,
					cancelAction: () => unsubscribeEventListener()
				}
			)

		}))

}


function loadGroupDetails(groupInfo: GroupInfo): Promise<GroupDetails> {
	return load(GroupTypeRef, groupInfo.group).then(group => {
		return Promise.all([
				loadAll(SentGroupInvitationTypeRef, group.invitations),
				loadGroupMembers(group)
			]
		).then(([invitations, memberInfos]) => {
			return {group, info: groupInfo, memberInfos, sentGroupInvitations: invitations}
		})
	})
}

function loadGroupMembers(group: Group): Promise<Array<GroupMemberInfo>> {
	return loadAll(GroupMemberTypeRef, group.members)
		.then((members) => Promise
			.map(members, (member) =>
				loadGroupInfoForMember(member)
			))
}

function loadGroupInfoForMember(groupMember: GroupMember): Promise<GroupMemberInfo> {
	return load(GroupInfoTypeRef, groupMember.userGroupInfo)
		.then((userGroupInfo) => {
			return {
				member: groupMember,
				info: userGroupInfo
			}
		})
}


class CalendarSharingDialogContent implements MComponent<CalendarSharingDialogAttrs> {
	_invitePeopleValueTextField: BubbleTextField<RecipientInfo>;
	_capapility: Stream<ShareCapabilityEnum>;

	constructor() {
		this._capapility = stream(ShareCapability.Read)
		this._invitePeopleValueTextField = new BubbleTextField("shareWithEmailRecipient_label", new MailAddressBubbleHandler(this))
	}

	view(vnode: Vnode<CalendarSharingDialogAttrs>): ?Children {
		return m(".flex.col", [
			m(this._invitePeopleValueTextField),
			m(DropDownSelectorN, {
				label: "permissions_label",
				items: [
					{name: getCapabilityText(ShareCapability.Invite), value: ShareCapability.Invite},
					{name: getCapabilityText(ShareCapability.Write), value: ShareCapability.Write},
					{name: getCapabilityText(ShareCapability.Read), value: ShareCapability.Read},
				],
				selectedValue: this._capapility,
				dropdownWidth: 300
			}),
			m(".flex-center.full-width.pt",
				m("", {
						style: {
							width: px(260)
						}
					},
					m(ButtonN, {
						label: "send_action",
						click: () => vnode.attrs.sendInviteHandler(this._invitePeopleValueTextField.bubbles.map(b => b.entity), this._capapility()),
						type: ButtonType.Login
					})
				)
			),
			m(".h4.mt-l", lang.get("pendingShare_label")),
			m(TableN, {
				columnHeadingTextIds: ["recipients_label", "permissions_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				lines: vnode.attrs.groupDetails.sentGroupInvitations.map((sentGroupInvitation) => {
					return {
						cells: [sentGroupInvitation.inviteeMailAddress, getCapabilityText(downcast(sentGroupInvitation.capability))],
						actionButtonAttrs: {
							label: "remove_action",
							click: () => {
								worker.rejectGroupInvitation(neverNull(sentGroupInvitation.receivedInvitation))
							},
							icon: () => Icons.Cancel,
							isVisible: () => this._isDeleteInvitationButtonVisible(vnode.attrs.groupDetails.group, sentGroupInvitation)
						}
					}
				}),
				showActionButtonColumn: true,
			}),

			m(".h4.mt-l", lang.get("sharing_label")),
			m(TableN, {
				columnHeadingTextIds: ["recipients_label", "permissions_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				lines: vnode.attrs.groupDetails.memberInfos.map((memberInfo) => {
					return {
						cells: [
							getMemberText(vnode.attrs.groupDetails.group, memberInfo),
							getCapabilityText(downcast(memberInfo.member.capability))
						], actionButtonAttrs: {
							label: "delete_action",
							icon: () => Icons.Cancel,
							click: () => {
								worker.removeUserFromGroup(memberInfo.member.user, vnode.attrs.groupDetails.group._id)
							},
							isVisible: () => this._isDeleteMembershipVisible(vnode.attrs.groupDetails.group, memberInfo)
						}
					}
				}),
				showActionButtonColumn: true,
			})
		])
	}


	_isDeleteInvitationButtonVisible(group: Group, sentGroupInvitation: SentGroupInvitation): boolean {
		return hasCapabilityOnGroup(logins.getUserController().user, group, ShareCapability.Invite)
			|| isSharedGroupOwner(group, logins.getUserController().user._id)
	}

	_isDeleteMembershipVisible(group: Group, memberInfo: GroupMemberInfo): boolean {
		return (hasCapabilityOnGroup(logins.getUserController().user, group, ShareCapability.Invite)
			|| isSameId(logins.getUserController().user._id, memberInfo.member.user))
			&& !isSharedGroupOwner(group, memberInfo.member.user)
	}

	createBubble(name: ? string, mailAddress: string, contact: ? Contact): Bubble<RecipientInfo> {
		let recipientInfo = createRecipientInfo(mailAddress, name, contact, false)
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
	}


	_createBubbleContextButtons(name: string, mailAddress: string): Array<ButtonAttrs | string> {
		let buttonAttrs = [mailAddress]
		buttonAttrs.push({
			label: "remove_action",
			type: ButtonType.Secondary,
			click: () => {
				const bubbleToRemove = this._invitePeopleValueTextField.bubbles.find((bubble) => bubble.entity.mailAddress == mailAddress)
				if (bubbleToRemove) {
					remove(this._invitePeopleValueTextField.bubbles, bubbleToRemove)
				}
			}
		})
		return buttonAttrs
	}


}

function getMemberText(sharedGroup: Group, memberInfo: GroupMemberInfo): string {
	return getGroupInfoDisplayName(memberInfo.info)
		+ (isSharedGroupOwner(sharedGroup, memberInfo.member.user) ? ` (${lang.get("owner_label")})` : "")
}

function isSharedGroupOwner(sharedGroup: Group, userId: Id): boolean {
	return !!(sharedGroup.user && isSameId(sharedGroup.user, userId))
}


function getCapabilityText(capability: ShareCapabilityEnum): string {
	switch (capability) {
		case ShareCapability.Invite:
			return lang.get("calendarShareCapabilityInvite_label")
		case ShareCapability.Write:
			return lang.get("calendarShareCapabilityWrite_label")
		case ShareCapability.Read:
			return lang.get("calendarShareCapabilityRead_label")
		default:
			return String(capability)
	}
}
