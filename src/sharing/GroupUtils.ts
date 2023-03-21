import type { User } from "../api/entities/sys/TypeRefs.js"
import type { Group } from "../api/entities/sys/TypeRefs.js"
import { GroupType, GroupTypeNameByCode, ShareCapability } from "../api/common/TutanotaConstants"
import type { GroupMembership } from "../api/entities/sys/TypeRefs.js"
import { getEtId, isSameId } from "../api/common/utils/EntityUtils"
import { lang } from "../misc/LanguageViewModel"
import type { GroupInfo } from "../api/entities/sys/TypeRefs.js"
import { GroupInfoTypeRef } from "../api/entities/sys/TypeRefs.js"
import { downcast } from "@tutao/tutanota-utils"
import type { GroupMember } from "../api/entities/sys/TypeRefs.js"
import { GroupMemberTypeRef } from "../api/entities/sys/TypeRefs.js"
import type { EntityClient } from "../api/common/EntityClient"
import { ofClass, promiseMap } from "@tutao/tutanota-utils"
import type { ReceivedGroupInvitation } from "../api/entities/sys/TypeRefs.js"
import { ReceivedGroupInvitationTypeRef } from "../api/entities/sys/TypeRefs.js"
import { UserGroupRootTypeRef } from "../api/entities/sys/TypeRefs.js"
import { NotFoundError } from "../api/common/error/RestError"
import type { UserController } from "../api/main/UserController"
import { locator } from "../api/main/MainLocator.js"

/**
 * Whether or not a user has a given capability for a shared group. If the group type is not shareable, this will always return false
 * @param user
 * @param group
 * @param requiredCapability
 * @returns {boolean}
 */
export function hasCapabilityOnGroup(user: User, group: Group, requiredCapability: ShareCapability): boolean {
	if (!isShareableGroupType(downcast(group.type))) {
		return false
	}

	if (isSharedGroupOwner(group, user._id)) {
		return true
	}

	const membership = user.memberships.find((gm: GroupMembership) => isSameId(gm.group, group._id))

	if (membership) {
		return membership.capability != null && Number(requiredCapability) <= Number(membership.capability)
	}

	return false
}

export function isSharedGroupOwner(sharedGroup: Group, user: Id | User): boolean {
	return !!(sharedGroup.user && isSameId(sharedGroup.user, typeof user === "string" ? user : getEtId(user)))
}

export function getCapabilityText(capability: ShareCapability): string {
	switch (capability) {
		case ShareCapability.Invite:
			return lang.get("groupCapabilityInvite_label")

		case ShareCapability.Write:
			return lang.get("groupCapabilityWrite_label")

		case ShareCapability.Read:
			return lang.get("groupCapabilityRead_label")

		default:
			return lang.get("comboBoxSelectionNone_msg")
	}
}

export function getSharedGroupName(groupInfo: GroupInfo, allowGroupNameOverride: boolean): string {
	const { userSettingsGroupRoot } = locator.logins.getUserController()
	const groupSettings = userSettingsGroupRoot.groupSettings.find((gc) => gc.group === groupInfo.group)
	return (allowGroupNameOverride && groupSettings && groupSettings.name) || groupInfo.name || getDefaultGroupName(downcast(groupInfo.groupType))
}

export type GroupMemberInfo = {
	member: GroupMember
	info: GroupInfo
}

export function getMemberCabability(memberInfo: GroupMemberInfo, group: Group): ShareCapability {
	if (isSharedGroupOwner(group, memberInfo.member.user)) {
		return ShareCapability.Invite
	}

	return downcast(memberInfo.member.capability)
}

export function loadGroupMembers(group: Group, entityClient: EntityClient): Promise<Array<GroupMemberInfo>> {
	return entityClient
		.loadAll(GroupMemberTypeRef, group.members)
		.then((members) => promiseMap(members, (member) => loadGroupInfoForMember(member, entityClient)))
}

export function loadGroupInfoForMember(groupMember: GroupMember, entityClient: EntityClient): Promise<GroupMemberInfo> {
	return entityClient.load(GroupInfoTypeRef, groupMember.userGroupInfo).then((userGroupInfo) => {
		return {
			member: groupMember,
			info: userGroupInfo,
		}
	})
}

export function getDefaultGroupName(groupType: GroupType): string {
	switch (groupType) {
		case GroupType.Calendar:
			return lang.get("privateCalendar_label")
		case GroupType.Template:
			return lang.get("templateGroupDefaultName_label")
		default:
			return GroupTypeNameByCode[groupType]
	}
}

export function loadReceivedGroupInvitations(
	userController: UserController,
	entityClient: EntityClient,
	type: GroupType,
): Promise<Array<ReceivedGroupInvitation>> {
	return entityClient
		.load(UserGroupRootTypeRef, userController.userGroupInfo.group)
		.then((userGroupRoot) => entityClient.loadAll(ReceivedGroupInvitationTypeRef, userGroupRoot.invitations))
		.then((invitations) => invitations.filter((invitation) => getInvitationGroupType(invitation) === type))
		.catch(ofClass(NotFoundError, () => []))
}

// Group invitations without a type set were sent when Calendars were the only shareable kind of user group
const DEFAULT_GROUP_TYPE = GroupType.Calendar

export function getInvitationGroupType(invitation: ReceivedGroupInvitation): GroupType {
	return invitation.groupType === null ? DEFAULT_GROUP_TYPE : downcast(invitation.groupType)
}

export function groupRequiresBusinessFeature(groupType: GroupType): boolean {
	return groupType === GroupType.Template
}

export function isShareableGroupType(groupType: GroupType): boolean {
	// Should be synchronised with GroupType::isShareableGroup in tutadb
	return groupType === GroupType.Calendar || groupType === GroupType.Template
}

export const TemplateGroupPreconditionFailedReason = Object.freeze({
	BUSINESS_FEATURE_REQUIRED: "templategroup.business_feature_required",
})
