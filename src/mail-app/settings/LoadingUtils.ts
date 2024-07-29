import type { Customer } from "../../common/api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, GroupTypeRef, UserTypeRef } from "../../common/api/entities/sys/TypeRefs.js"
import { neverNull, promiseMap } from "@tutao/tutanota-utils"
import { GroupType } from "../../common/api/common/TutanotaConstants"
import { getGroupInfoDisplayName, getUserGroupMemberships } from "../../common/api/common/utils/GroupUtils"
import { locator } from "../../common/api/main/CommonLocator"

/**
 * As users personal mail group infos do not contain name and mail address we use this wrapper to store group ids together with name and mail address.
 */
export class GroupData {
	groupId: Id
	displayName: string

	constructor(groupId: Id, displayName: string) {
		this.groupId = groupId
		this.displayName = displayName
	}
}

export function loadGroupDisplayName(groupId: Id): Promise<Id> {
	return locator.entityClient
		.load(GroupTypeRef, groupId)
		.then((group) => {
			if (group.user && group.type !== GroupType.User) {
				// the users personal mail group does not have a name, so show the user name
				return locator.entityClient.load(UserTypeRef, group.user).then((user) => {
					return locator.entityClient.load(GroupInfoTypeRef, user.userGroup.groupInfo)
				})
			} else {
				return locator.entityClient.load(GroupInfoTypeRef, group.groupInfo)
			}
		})
		.then((groupInfo) => {
			return getGroupInfoDisplayName(groupInfo)
		})
}

export async function loadEnabledTeamMailGroups(customer: Customer): Promise<GroupData[]> {
	const infos = await locator.entityClient.loadAll(GroupInfoTypeRef, customer.teamGroups)
	return infos
		.filter((teamGroupInfo) => {
			if (teamGroupInfo.deleted) {
				return false
			} else {
				return locator.entityClient.load(GroupTypeRef, teamGroupInfo.group).then((teamGroup) => teamGroup.type === GroupType.Mail)
			}
		})
		.map((mailTeamGroupInfo) => new GroupData(mailTeamGroupInfo.group, getGroupInfoDisplayName(mailTeamGroupInfo)))
}

export async function loadEnabledUserMailGroups(customer: Customer): Promise<GroupData[]> {
	const groupInfos = await locator.entityClient.loadAll(GroupInfoTypeRef, customer.userGroups)
	return promiseMap(
		groupInfos.filter((g) => !g.deleted),
		async (userGroupInfo) => {
			const userGroup = await locator.entityClient.load(GroupTypeRef, userGroupInfo.group)
			const user = await locator.entityClient.load(UserTypeRef, neverNull(userGroup.user))
			return new GroupData(getUserGroupMemberships(user, GroupType.Mail)[0].group, getGroupInfoDisplayName(userGroupInfo))
		},
	)
}
