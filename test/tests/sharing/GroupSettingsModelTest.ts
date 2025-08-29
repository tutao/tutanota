import { GroupNameData, GroupSettingsModel } from "../../../src/common/sharing/model/GroupSettingsModel"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { LoginController } from "../../../src/common/api/main/LoginController"
import { object, when } from "testdouble"
import { clientInitializedTypeModelResolver, createTestEntity } from "../TestUtils"
import { Group, GroupInfo, GroupInfoTypeRef, GroupMemberTypeRef, GroupTypeRef, UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock"
import o from "@tutao/otest"
import { UserController } from "../../../src/common/api/main/UserController"
import { createGroupSettings, UserSettingsGroupRoot, UserSettingsGroupRootTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils"

o.spec("GroupSettingsModel", function () {
	let groupSettingsModel: GroupSettingsModel
	let entityRestClient: EntityRestClientMock
	let entityClient: EntityClient
	let loginController: LoginController
	let userController: Writeable<UserController>
	let userSettingsGroupRoot: UserSettingsGroupRoot
	let group: Group
	let groupInfo: GroupInfo

	const groupId = "groupId"
	const ownerUserID: string = "userID"
	const ownerGroupInfoID: IdTuple = ["ownerGroupUserInfoId", "owner"]
	const participantUserID: string = "sharedUsedId"
	const participantGroupInfoID: IdTuple = ["sharedUserGroupInfoId", "participant"]
	const groupMembersListId = "groupMembersId"
	const groupName = "Test Name"

	o.beforeEach(function () {
		entityRestClient = new EntityRestClientMock()
		entityClient = new EntityClient(entityRestClient, clientInitializedTypeModelResolver())
		loginController = object()
		userController = object()
		userSettingsGroupRoot = createTestEntity(UserSettingsGroupRootTypeRef)
		group = createTestEntity(GroupTypeRef, { members: groupMembersListId, _id: groupId, user: ownerUserID })
		groupInfo = createTestEntity(GroupInfoTypeRef, { name: groupName, group: groupId })
		const ownerGroupMember = createTestEntity(GroupMemberTypeRef, {
			_id: [groupMembersListId, "groupMemberId1"],
			userGroupInfo: ownerGroupInfoID,
		})
		const ownerGroupInfo = createTestEntity(GroupInfoTypeRef, { _id: ownerGroupInfoID })

		entityRestClient.addElementInstances(group)
		entityRestClient.addListInstances(groupInfo, ownerGroupMember, ownerGroupInfo)

		userController.userSettingsGroupRoot = userSettingsGroupRoot

		when(loginController.getUserController()).thenReturn(userController)

		groupSettingsModel = new GroupSettingsModel(entityClient, loginController)
	})

	o.spec("getNameData", function () {
		o.test("only returns one name when group is not shared", async function () {
			userController.user = createTestEntity(UserTypeRef, { _id: ownerUserID })

			const nameDataOutput = await groupSettingsModel.getGroupNameData(groupInfo)
			o.check(nameDataOutput).deepEquals({ kind: "single", name: groupName })
		})

		o.test("only returns group name when the group is not shared and the custom name is empty", async function () {
			userController.user = createTestEntity(UserTypeRef, { _id: ownerUserID })
			userSettingsGroupRoot.groupSettings.push(
				createGroupSettings({
					group: groupId,
					color: "",
					name: "",
					defaultAlarmsList: [],
					sourceUrl: null,
				}),
			)

			const nameDataOutput = await groupSettingsModel.getGroupNameData(groupInfo)
			o.check(nameDataOutput).deepEquals({ kind: "single", name: groupName })
		})

		o.test("returns both names when the group is not shared but there is custom name", async function () {
			const customName = "Custom Name"

			userController.user = createTestEntity(UserTypeRef, { _id: ownerUserID })
			userSettingsGroupRoot.groupSettings.push(
				createGroupSettings({
					group: groupId,
					color: "",
					name: customName,
					defaultAlarmsList: [],
					sourceUrl: null,
				}),
			)

			const nameDataOutput = await groupSettingsModel.getGroupNameData(groupInfo)
			o.check(nameDataOutput).deepEquals({
				kind: "shared",
				name: groupName,
				customName: customName,
				editableName: true,
			})
		})

		o.test("returns null custom name if there are no group settings", async function () {
			userController.user = createTestEntity(UserTypeRef, { _id: ownerUserID })

			const participantGroupMember = createTestEntity(GroupMemberTypeRef, {
				_id: [groupMembersListId, "groupMemberId"],
				userGroupInfo: participantGroupInfoID,
			})
			const participantGroupInfo = createTestEntity(GroupInfoTypeRef, { _id: participantGroupInfoID })

			entityRestClient.addListInstances(participantGroupMember, participantGroupInfo)

			const nameDataOutput = await groupSettingsModel.getGroupNameData(groupInfo)
			o.check(nameDataOutput).deepEquals({
				kind: "shared",
				name: groupName,
				customName: null,
				editableName: true,
			})
		})

		o.test("returns custom name with shared group and editable if owner", async function () {
			const groupSettingsName = "My Name"
			userController.user = createTestEntity(UserTypeRef, { _id: ownerUserID })

			const participantGroupMember = createTestEntity(GroupMemberTypeRef, {
				_id: [groupMembersListId, "groupMemberId"],
				userGroupInfo: participantGroupInfoID,
			})
			const participantGroupInfo = createTestEntity(GroupInfoTypeRef, { _id: participantGroupInfoID })

			userSettingsGroupRoot.groupSettings.push(
				createGroupSettings({
					group: groupInfo.group,
					color: "",
					name: groupSettingsName,
					defaultAlarmsList: [],
					sourceUrl: null,
				}),
			)
			entityRestClient.addListInstances(participantGroupMember, participantGroupInfo)

			const nameDataOutput = await groupSettingsModel.getGroupNameData(groupInfo)
			o.check(nameDataOutput).deepEquals({
				kind: "shared",
				name: groupName,
				customName: groupSettingsName,
				editableName: true,
			})
		})

		o.test("returns custom name with shared group and not editable if not owner", async function () {
			const groupSettingsName = "My Name"
			userController.user = createTestEntity(UserTypeRef, { _id: participantUserID })

			const participantGroupMember = createTestEntity(GroupMemberTypeRef, {
				_id: [groupMembersListId, "groupMemberId"],
				userGroupInfo: participantGroupInfoID,
			})
			const participantGroupInfo = createTestEntity(GroupInfoTypeRef, { _id: participantGroupInfoID })

			userSettingsGroupRoot.groupSettings.push(
				createGroupSettings({
					group: groupInfo.group,
					color: "",
					name: groupSettingsName,
					defaultAlarmsList: [],
					sourceUrl: null,
				}),
			)

			entityRestClient.addListInstances(participantGroupInfo, participantGroupMember)

			const nameDataOutput = await groupSettingsModel.getGroupNameData(groupInfo)
			o.check(nameDataOutput).deepEquals({
				kind: "shared",
				name: groupName,
				customName: groupSettingsName,
				editableName: false,
			})
		})
	})

	o.spec("updateGroupNameData", function () {
		o.test("When nameData is single, groupInfo is updated", async function () {
			userController.user = createTestEntity(UserTypeRef, { _id: ownerUserID })

			const newName = "newName"
			const updateData: GroupNameData = { kind: "single", name: newName }

			await groupSettingsModel.updateGroupNameData(groupInfo, updateData)

			const updatedGroupInfo = entityRestClient.getUpdatedInstance(groupInfo)
			o.check(updatedGroupInfo.name).equals(newName)
			// did not get updated
			o.check(() => entityRestClient.getUpdatedInstance(userSettingsGroupRoot)).throws(Error)
		})

		o.test("When nameData is shared, and owner changes name groupInfo is updated", async function () {
			userController.user = createTestEntity(UserTypeRef, { _id: ownerUserID })

			const newName = "newName"
			const updateData: GroupNameData = { kind: "shared", name: newName, editableName: true, customName: null }

			await groupSettingsModel.updateGroupNameData(groupInfo, updateData)

			const updatedGroupInfo = entityRestClient.getUpdatedInstance(groupInfo)
			o.check(updatedGroupInfo.name).equals(newName)
			// did not get updated
			o.check(() => entityRestClient.getUpdatedInstance(userSettingsGroupRoot)).throws(Error)
		})

		o.test("When nameData is shared, and owner can change groupInfo and groupSetting name at the same time", async function () {
			userController.user = createTestEntity(UserTypeRef, { _id: ownerUserID })

			const newName = "newName"
			const newCustomName = "newCustomName"
			const updateData: GroupNameData = {
				kind: "shared",
				name: newName,
				editableName: true,
				customName: newCustomName,
			}

			await groupSettingsModel.updateGroupNameData(groupInfo, updateData)

			const updatedGroupInfo = entityRestClient.getUpdatedInstance(groupInfo)
			o.check(updatedGroupInfo.name).equals(newName)

			const updatedGroupSettings = entityRestClient.getUpdatedInstance(userSettingsGroupRoot)
			o.check(updatedGroupSettings.groupSettings.find((setting) => isSameId(setting.group, groupId))?.name).equals(newCustomName)
		})

		o.test("When nameData is shared, and owner changes name custom name groupSettings is updated", async function () {
			userController.user = createTestEntity(UserTypeRef, { _id: ownerUserID })

			const newName = "Custom name"
			const updateData: GroupNameData = {
				kind: "shared",
				name: groupName,
				editableName: true,
				customName: newName,
			}

			await groupSettingsModel.updateGroupNameData(groupInfo, updateData)

			const updatedGroupSettings = entityRestClient.getUpdatedInstance(userSettingsGroupRoot)

			o.check(updatedGroupSettings.groupSettings.find((setting) => isSameId(setting.group, groupId))?.name).equals(newName)

			// We want to make sure that GroupInfo did NOT get updated (throws because there is nothing there)
			o.check(() => entityRestClient.getUpdatedInstance(groupInfo)).throws(Error)
		})

		o.test("When nameData is shared, and participant changes name custom name groupSettings is updated", async function () {
			userController.user = createTestEntity(UserTypeRef, { _id: participantUserID })

			const newName = "Custom name"
			const updateData: GroupNameData = {
				kind: "shared",
				name: groupName,
				editableName: false,
				customName: newName,
			}

			await groupSettingsModel.updateGroupNameData(groupInfo, updateData)

			const updatedGroupSettings = entityRestClient.getUpdatedInstance(userSettingsGroupRoot)

			o.check(updatedGroupSettings.groupSettings.find((setting) => isSameId(setting.group, groupId))?.name).equals(newName)

			// We want to make sure that GroupInfo did NOT get updated (throws because there is nothing there)
			o.check(() => entityRestClient.getUpdatedInstance(groupInfo)).throws(Error)
		})

		o.test("When nameData is shared, and participant changes name custom name existing groupSettings is updated", async function () {
			userController.user = createTestEntity(UserTypeRef, { _id: participantUserID })

			userSettingsGroupRoot.groupSettings.push(
				createGroupSettings({
					group: groupInfo.group,
					color: "",
					name: "First name",
					defaultAlarmsList: [],
					sourceUrl: null,
				}),
			)

			const newName = "Custom name"
			const updateData: GroupNameData = {
				kind: "shared",
				name: groupName,
				editableName: false,
				customName: newName,
			}

			await groupSettingsModel.updateGroupNameData(groupInfo, updateData)

			const updatedSettingsGroupRoot = entityRestClient.getUpdatedInstance(userSettingsGroupRoot)

			// check that we did not add two groupSettings for the same group
			const updatedGroupSettingsList = updatedSettingsGroupRoot.groupSettings.filter((setting) => isSameId(setting.group, groupId))
			o.check(updatedGroupSettingsList.length).equals(1)
			o.check(updatedGroupSettingsList[0].name).equals(newName)

			// We want to make sure that GroupInfo did NOT get updated (throws because there is nothing there)
			o.check(() => entityRestClient.getUpdatedInstance(groupInfo)).throws(Error)
		})
	})
})
