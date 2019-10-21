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
import {createRecipientInfo, getDefaultSender, getDisplayText, getSenderName} from "../mail/MailUtils"
import {attachDropdown} from "../gui/base/DropdownN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {remove} from "../api/common/utils/ArrayUtils"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {GroupInvitationTypeRef} from "../api/entities/sys/GroupInvitation"
import {GroupTypeRef} from "../api/entities/sys/Group"
import type {ShareCapabilityEnum} from "../api/common/TutanotaConstants"
import {ShareCapability} from "../api/common/TutanotaConstants"
import {isSameId} from "../api/common/EntityFunctions"
import {logins} from "../api/main/LoginController"
import {getCalendarName} from "./CalendarUtils"
import {worker} from "../api/main/WorkerClient"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import {px} from "../gui/size"
import {MailEditor} from "../mail/MailEditor"
import {mailModel} from "../mail/MailModel"


type GroupMemberInfo = {
	member: GroupMember,
	info: GroupInfo
}
type GroupDetails = {
	info: GroupInfo,
	group: Group,
	memberInfos: Array<GroupMemberInfo>,
	invitations: Array<GroupInvitation>
}

type CalendarSharingDialogAttrs = {
	groupDetails: GroupDetails,
	sendInviteHandler(recipients: Array<RecipientInfo>, capability: ShareCapabilityEnum): void,
}


function sendShareNotificationEmail(groupInfo: GroupInfo, recipients: Array<RecipientInfo>) {
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	const subject = lang.get("shareCalendarEmailSubject")
	const body = lang.get("shareCalendarEmailBody", {
		// Sender is displayed like Name <mail.address@tutanota.com>. Less-than and greater-than must be encoded for HTML
		"{senderName}": `${getSenderName(mailModel.getUserMailboxDetails())} &lt;${getDefaultSender(mailModel.getUserMailboxDetails())}&gt;`,
		"{calendarName}": groupInfo.name
	})
	// Sending notifications as bcc so that invited people don't see each other
	const bcc = recipients.map(({name, mailAddress}) => ({
		name,
		address: mailAddress
	}))
	editor.initWithTemplate({bcc}, subject, body, true)
	editor.send(false)
}

export function showCalendarSharingDialog(groupInfo: GroupInfo) {
	showProgressDialog("loading_msg", loadGroupDetails(groupInfo)
		.then(groupDetails => {
			const dialog = Dialog.showActionDialog({
					title: () => lang.get("sharing_label"),
					type: DialogType.EditLarge,
					child: () => m(CalendarSharingDialogContent, {
						groupDetails,
						sendInviteHandler: (recipients, capability) => {
							showProgressDialog("calendarInvitationProgress_msg",
								worker.sendGroupInvitation(groupInfo.group, recipients, capability)
								      .then(() => sendShareNotificationEmail(groupInfo, recipients)))
								.then(() => dialog.close())
						}
					}),
					okAction: null
				}
			)
		}))
}


function loadGroupDetails(groupInfo: GroupInfo): Promise<GroupDetails> {
	return load(GroupTypeRef, groupInfo.group).then(group => {
		return Promise.all([
				loadAll(GroupInvitationTypeRef, group.invitations),
				loadGroupMembers(group)
			]
		).then(([invitations, memberInfos]) => {
			return {group, info: groupInfo, memberInfos, invitations}
		})
	})
}

function loadGroupMembers(group: Group): Promise<Array<GroupMemberInfo>> {
	return loadAll(GroupMemberTypeRef, group.members)
		.then((members) => Promise
			.map(members, (member) =>
				load(GroupInfoTypeRef, member.userGroupInfo)
					.then((userGroupInfo) => {
						return {
							member: member,
							info: userGroupInfo
						}
					})
			))
}


class CalendarSharingDialogContent implements MComponent<CalendarSharingDialogAttrs> {
	_invitePeopleValueTextField: BubbleTextField<RecipientInfo>;
	_capapility: Stream<ShareCapabilityEnum>;


	constructor() {
		this._capapility = stream(ShareCapability.Read)
		this._invitePeopleValueTextField = new BubbleTextField("inviteRecipients_label", new MailAddressBubbleHandler(this))
	}

	view(vnode: Vnode<CalendarSharingDialogAttrs>): ?Children {
		return m(".flex.col", [
			m(".h4.mt-l", lang.get("calendarInvitationLabel", {"{calendarName}": getCalendarName(vnode.attrs.groupDetails.info.name)})),
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
			m(".h4.mt-l", lang.get("pendingInvites_label")),
			m(TableN, {
				columnHeadingTextIds: ["mailAddress_label", "permissions_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				lines: vnode.attrs.groupDetails.invitations.map((invitation) => {
					return {
						cells: [invitation.invitedMailAddress, getCapabilityText(downcast(invitation.capability))], actionButtonAttrs: {
							label: "more_label",
							click: () => {},
							icon: () => Icons.More,
						}
					}
				}),
				showActionButtonColumn: true,
			}),

			m(".h4.mt-l", lang.get("groupMembers_label")),
			m(TableN, {
				columnHeadingTextIds: ["mailAddress_label", "permissions_label"],
				columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
				lines: vnode.attrs.groupDetails.memberInfos.map((memberInfo) => {
					return {
						cells: [
							getMemberText(memberInfo),
							getCapabilityText(downcast(memberInfo.member.capability))
						], actionButtonAttrs: {
							label: "more_label",
							click: () => {

							},
							icon: () => Icons.More,
						}
					}
				}),
				showActionButtonColumn: true,
			})
		])
	}


	createBubble(name: ?string, mailAddress: string, contact: ?Contact): Bubble<RecipientInfo> {
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

function getMemberText(memberInfo: GroupMemberInfo): string {
	return getGroupInfoDisplayName(memberInfo.info)
		+ (isSameId(logins.getUserController().userGroupInfo._id, memberInfo.info._id) ? ` (${lang.get("owner_label")})` : "")
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
