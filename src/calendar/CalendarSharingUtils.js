//@flow


import type {Recipients} from "../mail/MailEditor"
import {MailEditor} from "../mail/MailEditor"
import {mailModel} from "../mail/MailModel"
import {getDefaultSender, getEnabledMailAddresses} from "../mail/MailUtils"
import {getCalendarName} from "./CalendarUtils"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {load, loadAll} from "../api/main/Entity"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {GroupMemberTypeRef} from "../api/entities/sys/GroupMember"


export function sendShareNotificationEmail(sharedGroupInfo: GroupInfo, recipients: Array<RecipientInfo>) {
	const senderMailAddress = getDefaultSender(mailModel.getUserMailboxDetails())
	const replacements = {
		// Sender is displayed like Name <mail.address@tutanota.com>. Less-than and greater-than must be encoded for HTML
		"{inviter}": senderMailAddress,
		"{calendarName}": getCalendarName(sharedGroupInfo.name)
	}
	// Sending notifications as bcc so that invited people don't see each other
	const bcc = recipients.map(({name, mailAddress}) => ({name, address: mailAddress}))
	_sendNotificationEmail({bcc}, "shareCalendarInvitationEmailSubject", "shareCalendarInvitationEmailBody", senderMailAddress, replacements)
}


export function sendAcceptNotificationEmail(invitation: ReceivedGroupInvitation) {
	const replacements = {
		"{invitee}": invitation.inviteeMailAddress,
		"{calendarName}": invitation.sharedGroupName,
		"{recipientName}": invitation.inviterMailAddress
	}
	const to = [{name: invitation.inviterName, address: invitation.inviterMailAddress}]
	const senderMailAddress = invitation.inviteeMailAddress
	_sendNotificationEmail({to}, "shareCalendarAcceptEmailSubject", "shareCalendarAcceptEmailBody", senderMailAddress, replacements)
}

export function sendRejectNotificationEmail(invitation: ReceivedGroupInvitation) {
	const replacements = {
		"{invitee}": invitation.inviteeMailAddress,
		"{calendarName}": invitation.sharedGroupName,
		"{recipientName}": invitation.inviterMailAddress
	}
	const to = [{name: invitation.inviterName, address: invitation.inviterMailAddress}]
	const senderMailAddress = invitation.inviteeMailAddress
	_sendNotificationEmail({to}, "shareCalendarDeclineEmailSubject", "shareCalendarDeclineEmailBody", senderMailAddress, replacements)
}


function _sendNotificationEmail(recipients: Recipients, subject: TranslationKey, body: TranslationKey, senderMailAddress: string, replacements: {[string]: string}) {
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	const sender = getEnabledMailAddresses(mailModel.getUserMailboxDetails()).includes(senderMailAddress) ? senderMailAddress : getDefaultSender(mailModel.getUserMailboxDetails())
	const subjectString = lang.get(subject)
	const bodyString = lang.get(body, replacements)
	editor.initWithTemplate(recipients, subjectString, bodyString, true, sender)
	editor.send(false)
}

export type GroupMemberInfo = {
	member: GroupMember,
	info: GroupInfo
}
export type GroupDetails = {
	info: GroupInfo,
	group: Group,
	memberInfos: Array<GroupMemberInfo>,
	sentGroupInvitations: Array<SentGroupInvitation>
}

export function loadGroupMembers(group: Group): Promise<Array<GroupMemberInfo>> {
	return loadAll(GroupMemberTypeRef, group.members)
		.then((members) => Promise
			.map(members, (member) =>
				loadGroupInfoForMember(member)
			))
}

export function loadGroupInfoForMember(groupMember: GroupMember): Promise<GroupMemberInfo> {
	return load(GroupInfoTypeRef, groupMember.userGroupInfo)
		.then((userGroupInfo) => {
			return {
				member: groupMember,
				info: userGroupInfo
			}
		})
}