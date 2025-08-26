import { LoginController } from "../../api/main/LoginController"
import { EntityClient } from "../../api/common/EntityClient"
import { GroupInfo, GroupTypeRef } from "../../api/entities/sys/TypeRefs"
import { getSharedGroupName, isSharedGroupOwner, loadGroupMembers } from "../GroupUtils"
import { getEtId, isSameId } from "../../api/common/utils/EntityUtils"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { locator } from "../../api/main/CommonLocator"
import { createGroupSettings, GroupSettings } from "../../api/entities/tutanota/TypeRefs"
import { LockedError } from "../../api/common/error/RestError"

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
			if (names.sharedName) {
				// If there is a shared name, this is a shared group and this is changing the group settings name
				this.updateGroupSettings(groupInfo, { name: names.name })
			} else {
				await this.updateGroupInfoName(groupInfo, names.name)
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

	updateGroupSettings(groupInfo: GroupInfo, newSettings: Partial<GroupSettings>) {
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

		locator.entityClient.update(userSettingsGroupRoot).catch(ofClass(LockedError, noOp))
	}
}
