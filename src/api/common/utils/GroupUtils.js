//@flow
import type {GroupInfo} from "../../entities/sys/GroupInfo"
import type {User} from "../../entities/sys/User"
import type {GroupTypeEnum} from "../TutanotaConstants"
import {GroupType} from "../TutanotaConstants"
import type {GroupMembership} from "../../entities/sys/GroupMembership"

export function getEnabledMailAddressesForGroupInfo(groupInfo: GroupInfo): string[] {
	let aliases = groupInfo.mailAddressAliases.filter(alias => alias.enabled).map(alias => alias.mailAddress)
	if (groupInfo.mailAddress) aliases.unshift(groupInfo.mailAddress)
	return aliases
}

/**
 * Provides the memberships of the user with the given type. In case of area groups all groups are returned.
 */
export function getUserGroupMemberships(user: User, groupType: GroupTypeEnum): GroupMembership[] {
	if (groupType === GroupType.User) {
		return [user.userGroup]
	} else {
		return user.memberships.filter(m => m.groupType === groupType)
	}
}

/**
 * Provides the name if available, otherwise the email address if available, otherwise an empty string.
 */
export function getGroupInfoDisplayName(groupInfo: GroupInfo): string {
	if (groupInfo.name) {
		return groupInfo.name
	} else if (groupInfo.mailAddress) {
		return groupInfo.mailAddress
	} else {
		return ""
	}
}

export function compareGroupInfos(a: GroupInfo, b: GroupInfo): number {
	return getGroupInfoDisplayName(a).localeCompare(getGroupInfoDisplayName(b))
}