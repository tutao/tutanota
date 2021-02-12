// @flow
import {GroupTypeRef} from "../api/entities/sys/Group"
import {load, loadAll, loadMultiple} from "../api/main/Entity"
import {UserTypeRef} from "../api/entities/sys/User"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {neverNull} from "../api/common/utils/Utils"
import {GroupType} from "../api/common/TutanotaConstants"
import {flat} from "../api/common/utils/ArrayUtils"
import type {Customer} from "../api/entities/sys/Customer"
import {getGroupInfoDisplayName, getUserGroupMemberships} from "../api/common/utils/GroupUtils";

/**
 * As users personal mail group infos do not contain name and mail address we use this wrapper to store group ids together with name and mail address.
 */
export class GroupData {

	groupId: Id;
	displayName: string;

	constructor(groupId: Id, displayName: string) {
		this.groupId = groupId
		this.displayName = displayName
	}
}

export function loadGroupDisplayName(groupId: Id): Promise<string> {
	return load(GroupTypeRef, groupId).then(group => {
		if (group.user && group.type !== GroupType.User) {
			// the users personal mail group does not have a name, so show the user name
			return load(UserTypeRef, group.user).then(user => {
				return load(GroupInfoTypeRef, user.userGroup.groupInfo)
			})
		} else {
			return load(GroupInfoTypeRef, group.groupInfo)
		}
	}).then(groupInfo => {
		return getGroupInfoDisplayName(groupInfo)
	})
}

export async function loadEnabledTeamMailGroups(customer: Customer): Promise<GroupData[]> {
	const infos = await loadAll(GroupInfoTypeRef, customer.teamGroups)
	return infos.filter(teamGroupInfo => {
		if (teamGroupInfo.deleted) {
			return false
		} else {
			return load(GroupTypeRef, teamGroupInfo.group).then(teamGroup => teamGroup.type === GroupType.Mail)
		}
	}).map(mailTeamGroupInfo => new GroupData(mailTeamGroupInfo.group, getGroupInfoDisplayName(mailTeamGroupInfo)))
}

export async function loadEnabledUserMailGroups(customer: Customer): Promise<GroupData[]> {
	const groupInfos = await loadAll(GroupInfoTypeRef, customer.userGroups)
	return Promise.mapSeries(groupInfos.filter(g => !g.deleted), async (userGroupInfo) => {
		const userGroup = await load(GroupTypeRef, userGroupInfo.group)
		const user = await load(UserTypeRef, neverNull(userGroup.user))
		return new GroupData(getUserGroupMemberships(user, GroupType.Mail)[0].group, getGroupInfoDisplayName(userGroupInfo))
	})
}

export function loadGroupInfos(groupInfoIds: IdTuple[]): Promise<GroupInfo[]> {
	let groupedParticipantGroupInfos = _groupByListId(groupInfoIds)
	return Promise
		.map(Object.keys(groupedParticipantGroupInfos), (listId) => {
			return loadMultiple(GroupInfoTypeRef, listId, groupedParticipantGroupInfos[listId])
		}, {concurrency: 5})
		.then(flat)
}

function _groupByListId(array: IdTuple[]): {[key: Id]: Id[]} {
	let result = {}
	array.forEach(entry => {
		if (result[entry[0]] == null) {
			result[entry[0]] = []
		}
		result[entry[0]].push(entry[1])
	})
	return result
}