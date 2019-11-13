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