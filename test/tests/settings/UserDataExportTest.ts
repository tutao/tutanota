import o from "@tutao/otest"
import { loadUserExportData } from "../../../src/common/settings/UserDataExporter.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { matchers, object, when } from "testdouble"
import { formatDateTimeUTC } from "../../../src/calendar-app/calendar/export/CalendarExporter.js"
import { CounterFacade } from "../../../src/common/api/worker/facades/lazy/CounterFacade.js"
import { CounterType } from "../../../src/app-env"
import { createTestEntity } from "../TestUtils.js"
import { monitorTypeRefs, sysTypeRefs, TypeRef } from "@tutao/typerefs"

o.spec("user data export", function () {
	const customerId = "customerId"
	const userGroupsId = "userGroupsId"
	const user = {
		_id: "userId",
		customer: customerId,
	} as sysTypeRefs.User

	let allUserGroupInfos: sysTypeRefs.GroupInfo[]

	let entityClientMock: EntityClient
	let counterFacadeMock: CounterFacade
	let loginsMock: LoginController
	let allGroups: sysTypeRefs.Group[]

	o.beforeEach(function () {
		allUserGroupInfos = []

		loginsMock = object()
		when(loginsMock.getUserController()).thenReturn({
			reloadCustomer: () =>
				Promise.resolve(
					createTestEntity(sysTypeRefs.CustomerTypeRef, {
						userGroups: userGroupsId,
						_id: customerId,
					}),
				),
			// we only test the case where we are global admin for now
			isGlobalAdmin: () => true,
		})

		entityClientMock = object()
		when(entityClientMock.loadAll(sysTypeRefs.GroupInfoTypeRef, userGroupsId)).thenResolve(allUserGroupInfos)
		when(entityClientMock.loadMultiple(sysTypeRefs.GroupTypeRef, null, matchers.anything())).thenDo(
			(_typeref: TypeRef<sysTypeRefs.Group>, _list: Id | null, groups: readonly Id[]) => {
				return Promise.resolve(allGroups.filter((g) => groups.includes(g._id)))
			},
		)

		counterFacadeMock = object()
		allGroups = []
	})

	o.test("should load and return correct user data ", async function () {
		const oneCreated = new Date(1655294400000) // 2022-06-15 12:00:00 GMT+0
		const oneDeleted = new Date(1655469000000) // "2022-06-17 12:30:00 GMT +0"
		const twoCreated = new Date(1657886400000) // "2022-07-15 12:00:00 GMT+0"
		addUser("my name", "mail1@mail.com", oneCreated, oneDeleted, 100, ["alias1@alias.com", "alias2@alias.com"], "user1", "group1", "storage1")
		addUser("eman ym", "mail2@mail.com", twoCreated, null, null, [], "user2", "group2", "storage2")

		when(counterFacadeMock.readAllCustomerCounterValues(CounterType.UserStorageLegacy, customerId)).thenResolve([
			createTestEntity(monitorTypeRefs.CounterValueTypeRef, { counterId: "storage1", value: "100" }),
			createTestEntity(monitorTypeRefs.CounterValueTypeRef, { counterId: "wrongId", value: "42" }), // some other counter
			// missing counter for second user!
		])

		let onProgressLastComplete: number | undefined
		let onProgressLastTotal: number | undefined
		let onProgressCalledTimes = 0

		const [first, second] = await loadUserExportData(entityClientMock, loginsMock, counterFacadeMock, (complete, total) => {
			if (onProgressLastComplete != null) {
				o.check(complete > onProgressLastComplete).equals(true)
			} else {
				o.check(complete).equals(0)
			}
			if (onProgressLastTotal != null) {
				o.check(total).equals(onProgressLastTotal)
			}
			onProgressLastComplete = complete
			onProgressLastTotal = total
			onProgressCalledTimes += 1
		})

		o.check(first.name).equals("my name")
		o.check(second.name).equals("eman ym")

		o.check(first.mailAddress).equals("mail1@mail.com")
		o.check(second.mailAddress).equals("mail2@mail.com")

		o.check(formatDateTimeUTC(first.created)).equals("20220615T120000Z")
		o.check(formatDateTimeUTC(second.created)).equals("20220715T120000Z")

		o.check(formatDateTimeUTC(first.deleted!)).equals("20220617T123000Z")
		o.check(second.deleted).equals(null)

		o.check(first.usedStorage).equals(100)
		o.check(second.usedStorage).equals(0)

		o.check(first.aliases).deepEquals(["alias1@alias.com", "alias2@alias.com"])
		o.check(second.aliases).deepEquals([])

		o.check(onProgressLastComplete).equals(2)
		o.check(onProgressLastTotal).equals(2)
		o.check(onProgressCalledTimes).equals(2)
	})

	function addUser(name, mailAddress, created, deleted, usedStorage, aliases, userId, groupId, storageCounterId) {
		allUserGroupInfos.push(
			createTestEntity(sysTypeRefs.GroupInfoTypeRef, {
				name,
				mailAddress,
				created,
				deleted,
				mailAddressAliases: aliases.map((alias) => ({ mailAddress: alias })),
				group: groupId,
			}),
		)

		const group = createTestEntity(sysTypeRefs.GroupTypeRef, { storageCounter: storageCounterId, _id: groupId })
		allGroups.push(group)
	}
})
