import { GroupSettingsModel } from "../../../src/common/sharing/model/GroupSettingsModel"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { LoginController } from "../../../src/common/api/main/LoginController"
import { object, when } from "testdouble"
import { clientInitializedTypeModelResolver, createTestEntity } from "../TestUtils"
import { GroupInfoTypeRef, GroupMemberTypeRef, GroupTypeRef, UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock"
import o from "@tutao/otest"
import { UserController } from "../../../src/common/api/main/UserController"
import { createGroupSettings, UserSettingsGroupRoot, UserSettingsGroupRootTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"

o.spec("GroupSettingsModel", function () {
	let groupSettingsModel: GroupSettingsModel
	let entityRestClient: EntityRestClientMock
	let entityClient: EntityClient
	let loginController: LoginController
	let userController: Writeable<UserController>
	let userSettingsGroupRoot: UserSettingsGroupRoot

	const ownUserID = "userID"
	const sharedUserId = "sharedUserId"

	o.beforeEach(function () {
		entityRestClient = new EntityRestClientMock()
		entityClient = new EntityClient(entityRestClient, clientInitializedTypeModelResolver())
		loginController = object()
		userController = object()
		userSettingsGroupRoot = createTestEntity(UserSettingsGroupRootTypeRef)

		userController.userSettingsGroupRoot = userSettingsGroupRoot

		when(loginController.getUserController()).thenReturn(userController)

		groupSettingsModel = new GroupSettingsModel(entityClient, loginController)
	})

	o.spec("getNameData", function () {
		o.test("only returns name when group is not shared", async function () {
			const groupId = "groupId"
			const groupName = "Test Name"
			const group = createTestEntity(GroupTypeRef, { members: "groupMembersId", _id: groupId })
			const groupInfo = createTestEntity(GroupInfoTypeRef, { name: groupName, group: groupId })
			entityRestClient.addElementInstances(group)
			entityRestClient.addListInstances(groupInfo)

			const nameDataOutput = await groupSettingsModel.getNameData(groupInfo)
			o.check(nameDataOutput).deepEquals({ name: groupName, sharedName: null })
		})

		o.test("returns shared name with shared group and editable if owner", async function () {
			const groupId = "groupId"
			const groupName = "Test Name"
			const groupSettingsName = "My Name"
			userController.user = createTestEntity(UserTypeRef, { _id: ownUserID })
			const sharedMemberId: IdTuple = ["userInfoId", "another"]
			const groupMembersListId = "groupMembersId"
			const groupMember = createTestEntity(GroupMemberTypeRef, {
				_id: [groupMembersListId, "groupMemberId"],
				userGroupInfo: sharedMemberId,
			})
			const userGroupInfo = createTestEntity(GroupInfoTypeRef, { _id: sharedMemberId })

			const group = createTestEntity(GroupTypeRef, { members: groupMembersListId, _id: groupId, user: ownUserID })
			const groupInfo = createTestEntity(GroupInfoTypeRef, { name: groupName, group: groupId })
			userSettingsGroupRoot.groupSettings.push(
				createGroupSettings({
					group: groupInfo.group,
					color: "",
					name: groupSettingsName,
					defaultAlarmsList: [],
					sourceUrl: null,
				}),
			)
			entityRestClient.addElementInstances(group)
			entityRestClient.addListInstances(groupInfo, groupMember, userGroupInfo)

			const nameDataOutput = await groupSettingsModel.getNameData(groupInfo)
			o.check(nameDataOutput).deepEquals({ name: groupSettingsName, sharedName: { name: groupName, editable: true } })
		})

		o.test("returns shared name with shared group and not editable if not owner", async function () {
			const groupId = "groupId"
			const groupName = "Test Name"
			const groupSettingsName = "My Name"
			userController.user = createTestEntity(UserTypeRef, { _id: sharedUserId })
			const sharedMemberId: IdTuple = ["userInfoId", "another"]
			const groupMembersListId = "groupMembersId"
			const groupMember = createTestEntity(GroupMemberTypeRef, {
				_id: [groupMembersListId, "groupMemberId"],
				userGroupInfo: sharedMemberId,
			})
			const userGroupInfo = createTestEntity(GroupInfoTypeRef, { _id: sharedMemberId })

			const group = createTestEntity(GroupTypeRef, { members: groupMembersListId, _id: groupId, user: ownUserID })
			const groupInfo = createTestEntity(GroupInfoTypeRef, { name: groupName, group: groupId })
			userSettingsGroupRoot.groupSettings.push(
				createGroupSettings({
					group: groupInfo.group,
					color: "",
					name: groupSettingsName,
					defaultAlarmsList: [],
					sourceUrl: null,
				}),
			)
			entityRestClient.addElementInstances(group)
			entityRestClient.addListInstances(groupInfo, groupMember, userGroupInfo)

			const nameDataOutput = await groupSettingsModel.getNameData(groupInfo)
			o.check(nameDataOutput).deepEquals({
				name: groupSettingsName,
				sharedName: { name: groupName, editable: false },
			})
		})
	})
})
