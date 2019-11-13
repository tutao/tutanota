//@flow


import {MailEditor} from "../mail/MailEditor"
import {mailModel} from "../mail/MailModel"
import {getDefaultSender, getEnabledMailAddresses, getSenderName} from "../mail/MailUtils"
import {getCalendarName} from "./CalendarUtils"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {load, loadAll} from "../api/main/Entity"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {GroupMemberTypeRef} from "../api/entities/sys/GroupMember"

export function sendAcceptNotificationEmail(sharedGroupName: string, recipient: RecipientInfo, senderMailAddress: string) {
	_sendNotificationEmail(sharedGroupName, [recipient], "acceptCalendarEmailSubject", "acceptCalendarEmailBody", senderMailAddress)
}

export function sendRejectNotificationEmail(sharedGroupName: string, recipient: RecipientInfo, senderMailAddress: string) {
	_sendNotificationEmail(sharedGroupName, [recipient], "rejectCalendarEmailSubject", "rejectCalendarEmailBody", senderMailAddress)
}

export function sendDeletionNotificationEmail(sharedGroupName: string, recipients: Array<RecipientInfo>, senderMailAddress: string) {
	_sendNotificationEmail(sharedGroupName, recipients, "deleteCalendarEmailSubject", "deleteCalendarEmailBody", senderMailAddress)
}

function _sendNotificationEmail(sharedGroupName: string, recipients: Array<RecipientInfo>, subject: TranslationKey, body: TranslationKey, senderMailAddress: string) {
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	const sender = getEnabledMailAddresses(mailModel.getUserMailboxDetails()).includes(senderMailAddress) ? senderMailAddress : getDefaultSender(mailModel.getUserMailboxDetails())

	const replacements = {
		// Sender is displayed like Name <mail.address@tutanota.com>. Less-than and greater-than must be encoded for HTML
		"{user}": `${getSenderName(mailModel.getUserMailboxDetails())} &lt;${sender}&gt;`,
		"{calendarName}": getCalendarName(sharedGroupName)
	}
	const subjectString = lang.get(subject)
	const bodyString = lang.get(body, replacements)
// Sending notifications as bcc so that invited people don't see each other
	const to = recipients.map(({name, mailAddress}) => ({name, address: mailAddress}))
	editor.initWithTemplate({to}, subjectString, bodyString, true, sender)
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