import o from "ospec"
import {loadUserExportData, renderExportDataCsv, USER_CSV_FILENAME, USER_EXPORT_CSV_HEADER} from "../../../src/settings/UserDataExporter.js"
import {EntityClient} from "../../../src/api/common/EntityClient.js"
import {UserManagementFacade} from "../../../src/api/worker/facades/UserManagementFacade.js"
import {LoginController} from "../../../src/api/main/LoginController.js"
import {FileController} from "../../../src/file/FileController.js"
import {object, when} from "testdouble"
import {CustomerTypeRef, Group, GroupInfo, GroupInfoTypeRef, GroupMembership, GroupTypeRef, User, UserTypeRef} from "../../../src/api/entities/sys/TypeRefs.js"
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

		addUser("my name", "mail1@mail.com", new Date("2022-06-15 12:00:00 GMT+0"), new Date("2022-06-17 12:30:00 GMT +0"), 100, ["alias1@alias.com", "alias2@alias.com"], "user1", "group1")
		addUser("eman ym", "mail2@mail.com", new Date("2022-07-15 12:00:00 GMT+0"), null, null, [], "user2", "group2")

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

	o("should correctly render csv", async function () {
		const data = [
			{
				name: "my name",
				mailAddress: "mail1@mail.com",
				created: new Date("2022-06-15 12:00:00 GMT+0"),
				deleted: new Date("2022-06-17 12:30:00 GMT +0"),
				usedStorage: 100,
				aliases: ["alias1@alias.com", "alias2@alias.com"]
			},
			{
				name: "eman ym",
				mailAddress: "mail2@mail.com",
				created: new Date("2022-07-15 12:00:00 GMT+0"),
				deleted: null,
				usedStorage: null,
				aliases: []
			},
		]

		o(renderExportDataCsv(data)).equals(
			USER_EXPORT_CSV_HEADER + "\n"
			+ "my name; mail1@mail.com; 20220615T120000Z; 20220617T123000Z; 100MB; alias1@alias.com alias2@alias.com\n"
			+ "eman ym; mail2@mail.com; 20220715T120000Z; null; null; "
		)
	})

	o.only("should escape semicolons in names", function() {
		const data = [
			{
				name: "mr; semicolon",
				mailAddress: "mail1@mail.com",
				created: new Date("2022-06-15 12:00:00 GMT+0"),
				deleted: new Date("2022-06-17 12:30:00 GMT +0"),
				usedStorage: 100,
				aliases: ["alias1@alias.com", "alias2@alias.com"]
			}
		]

		o(renderExportDataCsv(data)).equals(
			USER_EXPORT_CSV_HEADER + "\n"
			+ "mr\\; semicolon; mail1@mail.com; 20220615T120000Z; 20220617T123000Z; 100MB; alias1@alias.com alias2@alias.com"
		)
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

		const user = { _id: userId } as User
		when(entityClientMock.load(GroupTypeRef, groupId)).thenResolve({ user: userId })
		when(entityClientMock.load(UserTypeRef, userId)).thenResolve(user)
		when(userManagementFacadeMock.readUsedUserStorage(user)).thenResolve(usedStorage)
	}
})