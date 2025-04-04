import o from "@tutao/otest"
import { createTestEntity } from "../../../TestUtils"
import { GroupMembershipTypeRef, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { GroupType } from "../../../../../src/common/api/common/TutanotaConstants"
import { matchers, object, verify, when } from "testdouble"
import { CacheStorage } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { CustomUserCacheHandler } from "../../../../../src/common/api/worker/rest/cacheHandler/CustomUserCacheHandler"

o.spec("CustomUserCacheHandler", () => {
	let storage: CacheStorage
	let cache: CustomUserCacheHandler

	o.beforeEach(async function () {
		storage = object()
		cache = new CustomUserCacheHandler(storage)
	})

	o.test("no membership change does not call deleteAllOwnedBy", async function () {
		const userId = "userId"
		const calendarGroupId = "calendarGroupId"
		const initialUser = createTestEntity(UserTypeRef, {
			_id: userId,
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					_id: "mailShipId",
					groupType: GroupType.Mail,
				}),
				createTestEntity(GroupMembershipTypeRef, {
					_id: "calendarShipId",
					group: calendarGroupId,
					groupType: GroupType.Calendar,
				}),
			],
		})

		when(storage.getUserId()).thenReturn(userId)
		when(storage.get(UserTypeRef, null, userId)).thenResolve(initialUser)

		await cache.onBeforeUpdate(initialUser)

		verify(storage.deleteAllOwnedBy(matchers.anything()), { times: 0 })
	})

	o.test("membership change deletes calls deleteAllOwnedBy", async function () {
		const userId = "userId"
		const calendarGroupId = "calendarGroupId"
		const initialUser = createTestEntity(UserTypeRef, {
			_id: userId,
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					_id: "mailShipId",
					groupType: GroupType.Mail,
				}),
				createTestEntity(GroupMembershipTypeRef, {
					_id: "calendarShipId",
					group: calendarGroupId,
					groupType: GroupType.Calendar,
				}),
			],
		})

		const updatedUser = createTestEntity(UserTypeRef, {
			_id: userId,
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					_id: "mailShipId",
					groupType: GroupType.Mail,
				}),
			],
		})

		when(storage.getUserId()).thenReturn(userId)
		when(storage.get(UserTypeRef, null, userId)).thenResolve(initialUser)

		await cache.onBeforeUpdate(updatedUser)

		verify(storage.deleteAllOwnedBy(calendarGroupId), { times: 1 })
	})

	o.test("membership change but for another user does nothing", async function () {
		const userId = "userId"
		const calendarGroupId = "calendarGroupId"
		const initialUser = createTestEntity(UserTypeRef, {
			_id: userId,
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					_id: "mailShipId",
					groupType: GroupType.Mail,
				}),
				createTestEntity(GroupMembershipTypeRef, {
					_id: "calendarShipId",
					group: calendarGroupId,
					groupType: GroupType.Calendar,
				}),
			],
		})

		const updatedUser = createTestEntity(UserTypeRef, {
			_id: userId,
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					_id: "mailShipId",
					groupType: GroupType.Mail,
				}),
			],
		})

		when(storage.getUserId()).thenReturn("anotherUser")
		when(storage.get(UserTypeRef, null, userId)).thenResolve(initialUser)

		await cache.onBeforeUpdate(updatedUser)

		verify(storage.deleteAllOwnedBy(matchers.anything()), { times: 0 })
	})
})
