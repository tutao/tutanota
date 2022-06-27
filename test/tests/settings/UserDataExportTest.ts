import o from "ospec"
import {loadUserExportData} from "../../../src/settings/UserDataExporter.js"
import {EntityClient} from "../../../src/api/common/EntityClient.js"
import {UserManagementFacade} from "../../../src/api/worker/facades/UserManagementFacade.js"
import {LoginController} from "../../../src/api/main/LoginController.js"
import {FileController} from "../../../src/file/FileController.js"
import {object, when} from "testdouble"
import {CustomerTypeRef, GroupInfo, GroupInfoTypeRef, GroupTypeRef, User, UserTypeRef} from "../../../src/api/entities/sys/TypeRefs.js"
import {formatDateTimeUTC} from "../../../src/calendar/export/CalendarImporter.js"

o.spec("user data export", function () {
	const customerId = "customerId"
	const userGroupsId = "userGroupsId"
	const user = {
		_id: "userId",
		customer: customerId
	} as User

	let allUserGroupInfos: Array<GroupInfo>

	let entityClientMock: EntityClient
	let userManagementFacadeMock: UserManagementFacade
	let loginsMock: LoginController
	let fileControllerMock: FileController

	o.beforeEach(function () {

		allUserGroupInfos = []

		loginsMock = object<LoginController>()
		when(loginsMock.getUserController()).thenReturn({
			user,
			// we only test the case where we are global admin for now
			isGlobalAdmin: () => true,
			getLocalAdminGroupMemberships: () => []
		})

		entityClientMock = object<EntityClient>()
		when(entityClientMock.load(CustomerTypeRef, customerId)).thenResolve({
			userGroups: userGroupsId
		})
		when(entityClientMock.loadAll(GroupInfoTypeRef, userGroupsId)).thenResolve(allUserGroupInfos)

		userManagementFacadeMock = object<UserManagementFacade>()
		fileControllerMock = object<FileController>()
	})

	o("should load and return correct user data ", async function () {
		const oneCreated = new Date(1655294400000) // 2022-06-15 12:00:00 GMT+0
		const oneDeleted = new Date(1655469000000) // "2022-06-17 12:30:00 GMT +0"
		const twoCreated = new Date(1657886400000) // "2022-07-15 12:00:00 GMT+0"
		addUser("my name", "mail1@mail.com", oneCreated, oneDeleted, 100, ["alias1@alias.com", "alias2@alias.com"], "user1", "group1")
		addUser("eman ym", "mail2@mail.com", twoCreated, null, null, [], "user2", "group2")

		const [first, second] = await loadUserExportData(entityClientMock, userManagementFacadeMock, loginsMock)

		o(first.name).equals("my name")
		o(second.name).equals("eman ym")

		o(first.mailAddress).equals("mail1@mail.com")
		o(second.mailAddress).equals("mail2@mail.com")

		o(formatDateTimeUTC(first.created)).equals("20220615T120000Z")
		o(formatDateTimeUTC(second.created)).equals("20220715T120000Z")

		o(formatDateTimeUTC(first.deleted!)).equals("20220617T123000Z")
		o(second.deleted).equals(null)

		o(first.usedStorage).equals(100)
		o(second.usedStorage).equals(null)

		o(first.aliases).deepEquals(["alias1@alias.com", "alias2@alias.com"])
		o(second.aliases).deepEquals([])
	})

	function addUser(name, mailAddress, created, deleted, usedStorage, aliases, userId, groupId) {
		allUserGroupInfos.push({
			name,
			mailAddress,
			created,
			deleted,
			mailAddressAliases: aliases.map(alias => ({mailAddress: alias})),
			group: groupId
		} as GroupInfo)

		const user = {_id: userId} as User
		when(entityClientMock.load(GroupTypeRef, groupId)).thenResolve({user: userId})
		when(entityClientMock.load(UserTypeRef, userId)).thenResolve(user)
		when(userManagementFacadeMock.readUsedUserStorage(user)).thenResolve(usedStorage)
	}
})