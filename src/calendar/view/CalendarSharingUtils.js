//@flow
import type {Recipients} from "../../mail/editor/SendMailModel"
import {getDefaultSender, getEnabledMailAddresses} from "../../mail/model/MailUtils"
import {getCalendarName} from "../CalendarUtils"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {load, loadAll} from "../../api/main/Entity"
import type {GroupInfo} from "../../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../../api/entities/sys/GroupInfo"
import type {GroupMember} from "../../api/entities/sys/GroupMember"
import {GroupMemberTypeRef} from "../../api/entities/sys/GroupMember"
import type {ReceivedGroupInvitation} from "../../api/entities/sys/ReceivedGroupInvitation"
import type {Group} from "../../api/entities/sys/Group"
import type {SentGroupInvitation} from "../../api/entities/sys/SentGroupInvitation"
import {locator} from "../../api/main/MainLocator"
import type {RecipientInfo} from "../../api/common/RecipientInfo"
import {logins} from "../../api/main/LoginController"
import {MailMethod} from "../../api/common/TutanotaConstants"
import {showProgressDialog} from "../../gui/ProgressDialog"

export function sendShareNotificationEmail(sharedGroupInfo: GroupInfo, recipients: Array<RecipientInfo>) {
	locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
		const senderMailAddress = getDefaultSender(logins, mailboxDetails)
		const replacements = {
			// Sender is displayed like Name <mail.address@tutanota.com>. Less-than and greater-than must be encoded for HTML
			"{inviter}": senderMailAddress,
			"{calendarName}": getCalendarName(sharedGroupInfo, false)
		}
		// Sending notifications as bcc so that invited people don't see each other
		const bcc = recipients.map(({name, mailAddress}) => ({name, address: mailAddress}))
		_sendNotificationEmail({bcc}, "shareCalendarInvitationEmailSubject_msg", "shareCalendarInvitationEmailBody_msg", senderMailAddress,
			replacements)
	})
}


export function sendAcceptNotificationEmail(invitation: ReceivedGroupInvitation) {
	const replacements = {
		"{invitee}": invitation.inviteeMailAddress,
		"{calendarName}": invitation.sharedGroupName,
		"{recipientName}": invitation.inviterMailAddress
	}
	const to = [{name: invitation.inviterName, address: invitation.inviterMailAddress}]
	const senderMailAddress = invitation.inviteeMailAddress
	_sendNotificationEmail({to}, "shareCalendarAcceptEmailSubject_msg", "shareCalendarAcceptEmailBody_msg", senderMailAddress, replacements)
}

export function sendRejectNotificationEmail(invitation: ReceivedGroupInvitation) {
	const replacements = {
		"{invitee}": invitation.inviteeMailAddress,
		"{calendarName}": invitation.sharedGroupName,
		"{recipientName}": invitation.inviterMailAddress
	}
	const to = [{name: invitation.inviterName, address: invitation.inviterMailAddress}]
	const senderMailAddress = invitation.inviteeMailAddress
	_sendNotificationEmail({to}, "shareCalendarDeclineEmailSubject_msg", "shareCalendarDeclineEmailBody_msg", senderMailAddress, replacements)
}


function _sendNotificationEmail(recipients: Recipients, subject: TranslationKey, body: TranslationKey, senderMailAddress: string,
                                replacements: {[string]: string}) {
	locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
		const sender = getEnabledMailAddresses(mailboxDetails).includes(senderMailAddress)
			? senderMailAddress
			: getDefaultSender(logins, mailboxDetails)
		const subjectString = lang.get(subject)
		const bodyString = lang.get(body, replacements)
		const confirm = _ => Promise.resolve(true)
		const wait = showProgressDialog
		import("../../mail/editor/SendMailModel").then(({defaultSendMailModel}) => {
			return defaultSendMailModel(mailboxDetails)
				.initWithTemplate(recipients, subjectString, bodyString, [], true, sender)
				.then(model => model.send(MailMethod.NONE, confirm, wait, "tooManyMailsAuto_msg"))
		})

	})

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