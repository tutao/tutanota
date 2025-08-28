/**
 * @file Group settings model: editing group properties, such as name and color.
 *
 * Group name can come from 3 different sources:
 *  - name defined in GroupInfo itself or "shared name". This is shared between all members of the group
 *  - name defined in GroupSettings. This is user customization and is not shared with other members
 *  - Default group name for the group type (e.g. calendars default to "Private" as their name)
 *
 *  When editing the group data there are few possible scenarios:
 *   - current user is the group owner and the group is not shared with other users. In this case we display "shared
 *     name" as the only editable name. (
 *     FIXME: what if groupSettings overrides the name already?
 *   - current user is the group owner and there are other members of the group. In this case we display both "shared
 *     name" and "customized name" and it's possible to edit both.
 *   - current user is not the group owner. In this case we display both names, it is only possible to edit "customized
 *     name"
 */
import { LoginController } from "../../api/main/LoginController"
import { EntityClient } from "../../api/common/EntityClient"
import { GroupInfo, GroupTypeRef } from "../../api/entities/sys/TypeRefs"
import { getCustomSharedGroupName, getNullableSharedGroupName, getSharedGroupName, isSharedGroupOwner, loadGroupMembers } from "../GroupUtils"
import { getEtId, isSameId } from "../../api/common/utils/EntityUtils"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { createGroupSettings, GroupSettings } from "../../api/entities/tutanota/TypeRefs"
import { LockedError } from "../../api/common/error/RestError"

export interface SingleGroupNameData {
	kind: "single"
	name: string
	source: "shared" | "custom"
}

export interface FullGroupNameData {
	kind: "full"
	sharedName: string
	customName: string | null
	editableSharedName: boolean
}

export type NewGroupNameData = Readonly<SingleGroupNameData | FullGroupNameData>

export type SharedNameData = { editable: boolean; name: string }

export interface GroupNameData {
	/** name: Can come from GroupInfo itself (if group is not shared) or group settings (if is shared). The user will always be able to edit this name. */
	readonly name: string
	/** sharedName: The name for the group. This always comes directly from {@link GroupInfo#name}. Can only be edited by the group owner. */
	readonly sharedName: SharedNameData | null
}

export class GroupSettingsModel {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly loginController: LoginController,
	) {}

	async getNewGroupNameData(groupInfo: GroupInfo): Promise<NewGroupNameData> {
		const group = await this.entityClient.load(GroupTypeRef, groupInfo.group)
		const groupMembers = await loadGroupMembers(group, this.entityClient)

		// FIXME: we should probably check groupSettings as well, maybe it was shared before
		const userSettingsGroupRoot = this.loginController.getUserController().userSettingsGroupRoot
		if (groupMembers.length > 1) {
			return {
				kind: "full",
				sharedName: getSharedGroupName(groupInfo, this.loginController.getUserController(), false),
				customName: getNullableSharedGroupName(groupInfo, userSettingsGroupRoot, true),
				editableSharedName: isSharedGroupOwner(group, getEtId(this.loginController.getUserController().user)),
			}
		} else {
			const customName = getCustomSharedGroupName(groupInfo, userSettingsGroupRoot)
			if (customName != null) {
				return {
					kind: "single",
					name: customName,
					source: "custom",
				}
			} else {
				return {
					kind: "single",
					name: getSharedGroupName(groupInfo, this.loginController.getUserController(), false),
					source: "shared",
				}
			}
		}
	}

	async updateGroupNameData(groupInfo: GroupInfo, data: NewGroupNameData): Promise<void> {
		switch (data.kind) {
			case "single": {
				if (data.source === "shared") {
					await this.updateGroupInfoName(groupInfo, data.name)
				} else {
					await this.updateGroupSettings(groupInfo, { name: data.name })
				}

				break
			}
			case "full": {
				const oldGroupName = getSharedGroupName(groupInfo, this.loginController.getUserController(), false)
				if (data.sharedName !== oldGroupName) {
					await this.updateGroupInfoName(groupInfo, data.sharedName)
				}
				const oldCustomName = getCustomSharedGroupName(groupInfo, this.loginController.getUserController().userSettingsGroupRoot)
				if (data.sharedName !== (oldCustomName ?? "")) {
					await this.updateGroupSettings(groupInfo, { name: data.sharedName })
				}

				break
			}
		}
	}

	async getNameData(groupInfo: GroupInfo): Promise<GroupNameData> {
		// we can haz:
		// - one name (that maps to the group info name)
		// - see two, edit one (one that is group info, another that maps to custom name)
		// - see two, edit both (one that is group info, another that maps to custom name)
		const group = await this.entityClient.load(GroupTypeRef, groupInfo.group)
		const groupMembers = await loadGroupMembers(group, this.entityClient)

		// shared group will have more than one member (if one member it is just the own user)
		const sharedName =
			groupMembers.length > 1
				? {
						name: getSharedGroupName(groupInfo, this.loginController.getUserController(), false),
						editable: isSharedGroupOwner(group, getEtId(this.loginController.getUserController().user)),
					}
				: null

		return {
			name: getSharedGroupName(groupInfo, this.loginController.getUserController(), true),
			sharedName: sharedName,
		}
	}

	async updateGroupDataName(groupInfo: GroupInfo, names: { name: string; sharedName: string | null }) {
		if (names.name !== groupInfo.name) {
			// FIXME: this is a falsy check, not nullability check
			if (names.sharedName) {
				// If there is a shared name, this is a shared group and this is changing the group settings name
				this.updateGroupSettings(groupInfo, { name: names.name })
			} else {
				await this.updateGroupInfoName(groupInfo, names.name)
			}
		} else {
			//FIXME: this will get called whenever you change the shared name if the group settings name was already null (since the same is passed through)
			// it doesn't mess up the functionality, it does the right thing from the user's point of view
			// but this extra call is unnecessary
			if (names.sharedName) {
				// This is the case where someone had changed the local name, but are now changing it to be the same as the shared name
				// setting the group settings name to null will allow them to see changes the owner makes to the group name
				this.updateGroupSettings(groupInfo, { name: null })
			}
		}

		if (names.sharedName && groupInfo.name !== names.sharedName) {
			await this.updateGroupInfoName(groupInfo, names.sharedName)
		}
	}

	private async updateGroupInfoName(groupInfo: GroupInfo, newName: string) {
		groupInfo.name = newName
		await this.entityClient.update(groupInfo)
	}

	async updateGroupSettings(groupInfo: GroupInfo, newSettings: Partial<GroupSettings>) {
		const { userSettingsGroupRoot } = this.loginController.getUserController()
		const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => isSameId(gc.group, groupInfo.group)) ?? null

		if (existingGroupSettings) {
			Object.assign(existingGroupSettings, newSettings)
		} else {
			const newGroupSettings = createGroupSettings({
				group: groupInfo.group,
				color: "",
				name: "",
				defaultAlarmsList: [],
				sourceUrl: null,
				...newSettings,
			})
			userSettingsGroupRoot.groupSettings.push(newGroupSettings)
		}

		await this.entityClient.update(userSettingsGroupRoot).catch(ofClass(LockedError, noOp))
	}
}
