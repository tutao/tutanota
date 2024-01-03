import type { Customer } from "../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef, GroupTypeRef, UserTypeRef } from "../api/entities/sys/TypeRefs.js"
import { groupByAndMap, neverNull, promiseMap, TypeRef } from "@tutao/tutanota-utils"
import { GroupType } from "../api/common/TutanotaConstants"
import { getGroupInfoDisplayName, getUserGroupMemberships } from "../api/common/utils/GroupUtils"
import { locator } from "../api/main/MainLocator"
import { elementIdPart, listIdPart } from "../api/common/utils/EntityUtils"
import { ListElementEntity } from "../api/common/EntityTypes.js"
import { NotAuthorizedError, NotFoundError } from "../api/common/error/RestError.js"
import { EntityClient } from "../api/common/EntityClient.js"

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

/**
 * load multiple instances of the same type concurrently from multiple lists using
 * one request per list if possible
 *
 * @returns an array of all the instances excluding the ones throwing NotFoundError or NotAuthorizedError, in arbitrary order.
 */
export async function loadMultipleFromLists<T extends ListElementEntity>(
	type: TypeRef<T>,
	entityClient: EntityClient,
	toLoad: Array<IdTuple>,
): Promise<Array<T>> {
	if (toLoad.length === 0) {
		return []
	}
	const indexedEventIds = groupByAndMap<IdTuple, Id, Id>(toLoad, listIdPart, elementIdPart)

	return (
		await promiseMap(
			indexedEventIds,
			async ([listId, elementIds]) => {
				try {
					return await entityClient.loadMultiple(type, listId, elementIds)
				} catch (e) {
					// these are thrown if the list itself is inaccessible. elements will just be missing
					// in the loadMultiple result.
					if (e instanceof NotFoundError || e instanceof NotAuthorizedError) {
						console.log(`could not load entities of type ${type} from list ${listId}: ${e.name}`)
						return []
					} else {
						throw e
					}
				}
			},
			{ concurrency: 3 },
		)
	).flat()
}
