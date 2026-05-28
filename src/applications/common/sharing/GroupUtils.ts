import { UserSettingsGroupRoot } from "@tutao/entities/tutanota"
import {
	Group,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMember,
	GroupMemberTypeRef,
	ReceivedGroupInvitation,
	ReceivedGroupInvitationTypeRef,
	UserGroupRootTypeRef,
} from "@tutao/entities/sys"
import { getInvitationGroupType, GroupMemberInfo, GroupType, GroupTypeNameByCode } from "../../../entities/sys/Utils"
import { ShareCapability } from "@tutao/app-env"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { downcast, ofClass, promiseMap } from "@tutao/utils"
import type { EntityClient } from "../../../platform-kit/network/EntityClient"
import * as restError from "@tutao/rest-client/error"
import { UserController } from "../api/main/UserController"
import { NotFoundError } from "@tutao/rest-client/error"

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

export const TemplateGroupPreconditionFailedReason = Object.freeze({
	BUSINESS_FEATURE_REQUIRED: "templategroup.business_feature_required",
	UNLIMITED_REQUIRED: "templategroup.unlimited_required",
})

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

/**
 * Get the name of a (possibly) shared group.
 * Will return custom name, if any, group name, if any or default name for the group type.
 */
export function getSharedGroupName(groupInfo: GroupInfo, userSettingsGroupRoot: UserSettingsGroupRoot, allowGroupNameOverride: boolean): string {
	return getNullableSharedGroupName(groupInfo, userSettingsGroupRoot, allowGroupNameOverride) ?? getDefaultGroupName(downcast(groupInfo.groupType))
}

/**
 * Get shared group name or default to null.
 * Needed in order to make translations of default template group names work in SettingsView
 */
export function getNullableSharedGroupName(groupInfo: GroupInfo, userSettingsGroupRoot: UserSettingsGroupRoot, allowGroupNameOverride: boolean): string | null {
	return (allowGroupNameOverride && getCustomSharedGroupName(groupInfo, userSettingsGroupRoot)) || groupInfo.name || null
}

/** Get custom group name, if any is configured via GroupSettings */
export function getCustomSharedGroupName(groupInfo: GroupInfo, userSettingsGroupRoot: UserSettingsGroupRoot): string | null {
	return userSettingsGroupRoot.groupSettings.find((gc) => gc.group === groupInfo.group)?.name ?? null
}
