import o from "@tutao/otest"
import { loadUserExportData } from "../../../src/common/settings/UserDataExporter.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { FileController } from "../../../src/common/file/FileController.js"
import { object, when } from "testdouble"
import { CustomerTypeRef, Group, GroupInfo, GroupInfoTypeRef, GroupTypeRef, User } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { formatDateTimeUTC } from "../../../src/calendar-app/calendar/export/CalendarExporter.js"
import { CounterFacade } from "../../../src/common/api/worker/facades/lazy/CounterFacade.js"
import { CounterType } from "../../../src/common/api/common/TutanotaConstants.js"
import { CounterValueTypeRef } from "../../../src/common/api/entities/monitor/TypeRefs.js"
import { createTestEntity } from "../TestUtils.js"

o.spec("user data export", function () {
	const customerId = "customerId"
	const userGroupsId = "userGroupsId"
	const user = {
		_id: "userId",
		customer: customerId,
	} as User

	let allUserGroupInfos: Array<GroupInfo>

	let entityClientMock: EntityClient
	let counterFacadeMock: CounterFacade
	let loginsMock: LoginController
	let fileControllerMock: FileController

	o.beforeEach(function () {
		allUserGroupInfos = []

		loginsMock = object()
		when(loginsMock.getUserController()).thenReturn({
			user,
			// we only test the case where we are global admin for now
			isGlobalAdmin: () => true,
		})

		entityClientMock = object()
		when(entityClientMock.load(CustomerTypeRef, customerId)).thenResolve({
			userGroups: userGroupsId,
		})
		when(entityClientMock.loadAll(GroupInfoTypeRef, userGroupsId)).thenResolve(allUserGroupInfos)

		counterFacadeMock = object()
		fileControllerMock = object()
	})

	o("should load and return correct user data ", async function () {
		const oneCreated = new Date(1655294400000) // 2022-06-15 12:00:00 GMT+0
		const oneDeleted = new Date(1655469000000) // "2022-06-17 12:30:00 GMT +0"
		const twoCreated = new Date(1657886400000) // "2022-07-15 12:00:00 GMT+0"
		addUser("my name", "mail1@mail.com", oneCreated, oneDeleted, 100, ["alias1@alias.com", "alias2@alias.com"], "user1", "group1", "storage1")
		addUser("eman ym", "mail2@mail.com", twoCreated, null, null, [], "user2", "group2", "storage2")

		when(counterFacadeMock.readAllCustomerCounterValues(CounterType.UserStorageLegacy, customerId)).thenResolve([
			createTestEntity(CounterValueTypeRef, { counterId: "storage1", value: "100" }),
			createTestEntity(CounterValueTypeRef, { counterId: "wrongId", value: "42" }), // some other counter
			// missing counter for second user!
		])

		const [first, second] = await loadUserExportData(entityClientMock, loginsMock, counterFacadeMock)

		o(first.name).equals("my name")
		o(second.name).equals("eman ym")

		o(first.mailAddress).equals("mail1@mail.com")
		o(second.mailAddress).equals("mail2@mail.com")

		o(formatDateTimeUTC(first.created)).equals("20220615T120000Z")
		o(formatDateTimeUTC(second.created)).equals("20220715T120000Z")

		o(formatDateTimeUTC(first.deleted!)).equals("20220617T123000Z")
		o(second.deleted).equals(null)

		o(first.usedStorage).equals(100)
		o(second.usedStorage).equals(0)

		o(first.aliases).deepEquals(["alias1@alias.com", "alias2@alias.com"])
		o(second.aliases).deepEquals([])
	})

	function addUser(name, mailAddress, created, deleted, usedStorage, aliases, userId, groupId, storageCounterId) {
		allUserGroupInfos.push({
			name,
			mailAddress,
			created,
			deleted,
			mailAddressAliases: aliases.map((alias) => ({ mailAddress: alias })),
			group: groupId,
		} as GroupInfo)

		const group = { storageCounter: storageCounterId } as Group
		when(entityClientMock.load(GroupTypeRef, groupId)).thenResolve({ storageCounter: group.storageCounter })
	}
})
