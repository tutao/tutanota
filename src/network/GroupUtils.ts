import { sysTypeRefs } from "@tutao/typerefs"
import { GroupType } from "@tutao/app-env"

export function getEnabledMailAddressesForGroupInfo(groupInfo: sysTypeRefs.GroupInfo): string[] {
	let aliases = groupInfo.mailAddressAliases.filter((alias) => alias.enabled).map((alias) => alias.mailAddress)
	if (groupInfo.mailAddress) aliases.unshift(groupInfo.mailAddress)
	return aliases
}

export function isAliasEnabledForGroupInfo(groupInfo: sysTypeRefs.GroupInfo, aliasAddress: string): boolean {
	return (
		(groupInfo.mailAddress && groupInfo.mailAddress === aliasAddress) ||
		(groupInfo.mailAddressAliases.find((alias) => alias.mailAddress === aliasAddress)?.enabled ?? false)
	)
}

/**
 * Provides the memberships of the user with the given type. In case of area groups all groups are returned.
 */
export function getUserGroupMemberships(user: sysTypeRefs.User, groupType: GroupType): sysTypeRefs.GroupMembership[] {
	if (groupType === GroupType.User) {
		return [user.userGroup]
	} else {
		return user.memberships.filter((m) => m.groupType === groupType)
	}
}

/**
 * Provides the name if available, otherwise the email address if available, otherwise an empty string.
 */
export function getGroupInfoDisplayName(groupInfo: sysTypeRefs.GroupInfo): string {
	if (groupInfo.name) {
		return groupInfo.name
	} else if (groupInfo.mailAddress) {
		return groupInfo.mailAddress
	} else {
		return ""
	}
}

export function compareGroupInfos(a: sysTypeRefs.GroupInfo, b: sysTypeRefs.GroupInfo): number {
	return getGroupInfoDisplayName(a).localeCompare(getGroupInfoDisplayName(b))
}
