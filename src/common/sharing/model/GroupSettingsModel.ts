/**
 * @file Group settings model: editing group properties, such as name and color.
 *
 * Group name can come from 3 different sources:
 *  - name defined in GroupInfo itself. This is shared between all members of the group
 *  - name defined in GroupSettings or "custom name". This is user customization and is not shared with other members
 *  - Default group name for the group type (e.g. calendars default to "Private" as their name)
 *
 *  When editing the group data there are few possible scenarios:
 *   - current user is the group owner and the group is not shared with other users. In this case we display groupInfo name as the only editable name
 *   - current user is the group owner and the group used to be shared leaving the user with a groupInfo and groupSettings name (this is very rare)
 *   - current user is the group owner and there are other members of the group. In this case we display both name and "custom name" and it's possible to edit both.
 *   - current user is not the group owner. In this case we display both names, it is only possible to edit "customized
 *     name"
 */
import { LoginController } from "../../api/main/LoginController"
import { EntityClient } from "../../api/common/EntityClient"
import { getEtId, isSameId, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { getCustomSharedGroupName, getSharedGroupName, isSharedGroupOwner, loadGroupMembers } from "../GroupUtils"
import { noOp, ofClass } from "@tutao/utils"
import * as restError from "@tutao/rest-client/error"

/** When there is only a single name that can be edited */
export interface SingleGroupNameData {
	kind: "single"
	name: string
}

/** When there is a shared/GroupInfo name and also possible custom name from GroupSettings */
export interface SharedGroupNameData {
	kind: "shared"
	name: string
	customName: string | null
	editableName: boolean
}

export type GroupNameData = SingleGroupNameData | SharedGroupNameData

export class GroupSettingsModel {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly loginController: LoginController,
	) {}

	async getGroupNameData(groupInfo: sysTypeRefs.GroupInfo): Promise<Readonly<GroupNameData>> {
		const group = await this.entityClient.load(sysTypeRefs.GroupTypeRef, groupInfo.group)
		const groupMembers = await loadGroupMembers(group, this.entityClient)

		const userSettingsGroupRoot = this.loginController.getUserController().userSettingsGroupRoot
		const customName = getCustomSharedGroupName(groupInfo, userSettingsGroupRoot)
		// It is possible that the group has been shared in the past, but now we are the only member. We still want
		// to give the user the ability to see and edit both names that are stored on the server.
		if (groupMembers.length > 1 || (customName && customName !== groupInfo.name)) {
			return {
				kind: "shared",
				name: getSharedGroupName(groupInfo, this.loginController.getUserController().userSettingsGroupRoot, false),
				customName: getCustomSharedGroupName(groupInfo, userSettingsGroupRoot),
				editableName: isSharedGroupOwner(group, getEtId(this.loginController.getUserController().user)),
			}
		} else {
			if (customName) {
				return {
					kind: "single",
					name: customName,
				}
			} else {
				return {
					kind: "single",
					name: getSharedGroupName(groupInfo, this.loginController.getUserController().userSettingsGroupRoot, false),
				}
			}
		}
	}

	async updateGroupNameData(groupInfo: sysTypeRefs.GroupInfo, data: GroupNameData): Promise<void> {
		switch (data.kind) {
			case "single": {
				await this.updateGroupInfoName(groupInfo, data.name)

				break
			}
			case "shared": {
				const oldGroupName = getSharedGroupName(groupInfo, this.loginController.getUserController().userSettingsGroupRoot, false)
				if (data.name !== oldGroupName) {
					await this.updateGroupInfoName(groupInfo, data.name)
				}
				const oldCustomName = getCustomSharedGroupName(groupInfo, this.loginController.getUserController().userSettingsGroupRoot)
				if ((data.customName ?? "") !== (oldCustomName ?? "")) {
					await this.updateGroupSettings(groupInfo, { name: data.customName })
				}

				break
			}
		}
	}

	async updateGroupInfoName(groupInfo: sysTypeRefs.GroupInfo, newName: string) {
		groupInfo.name = newName
		await this.entityClient.update(groupInfo)
	}

	async updateGroupSettings(groupInfo: sysTypeRefs.GroupInfo, newSettings: Partial<tutanotaTypeRefs.GroupSettings>) {
		const { userSettingsGroupRoot } = this.loginController.getUserController()
		const existingGroupSettings = userSettingsGroupRoot.groupSettings.find((gc) => isSameId(gc.group, groupInfo.group)) ?? null

		if (existingGroupSettings) {
			Object.assign(existingGroupSettings, newSettings)
		} else {
			const newGroupSettings = tutanotaTypeRefs.createGroupSettings({
				group: groupInfo.group,
				color: "",
				name: "",
				defaultAlarmsList: [],
				sourceUrl: null,
				...newSettings,
			})
			userSettingsGroupRoot.groupSettings.push(newGroupSettings)
		}

		await this.entityClient.update(userSettingsGroupRoot).catch(ofClass(restError.LockedError, noOp))
	}
}
