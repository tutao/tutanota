import o from "@tutao/otest"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage.js"
import { Mail, MailDetailsBlob, MailDetailsBlobTypeRef, MailDetailsTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils.js"
import { CustomCacheHandler, CustomCacheHandlerMap } from "../../../../../src/common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { User, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { object, when } from "testdouble"
import { verify } from "@tutao/tutanota-test-utils"

o.spec("EphemeralCacheStorage", function () {
	const userId = "userId"
	const archiveId = "archiveId"
	const blobElementId = "blobElementId1"

	let customCacheHandlerMap: CustomCacheHandlerMap
	let storage: EphemeralCacheStorage

	o.beforeEach(() => {
		customCacheHandlerMap = object()
		storage = new EphemeralCacheStorage(customCacheHandlerMap)
	})

	o.spec("BlobElementType", function () {
		o("cache roundtrip: put, get, delete", async function () {
			storage.init({ userId })
			const storableMailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, {
				_id: [archiveId, blobElementId],
				details: createTestEntity(MailDetailsTypeRef),
			})
			let mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlob).equals(null)

			await storage.put(storableMailDetailsBlob)

			mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlob).deepEquals(storableMailDetailsBlob)

			await storage.deleteIfExists(MailDetailsBlobTypeRef, archiveId, blobElementId)

			mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlob).equals(null)
		})

		o("cache roundtrip: put, get, deleteAllOwnedBy", async function () {
			const _ownerGroup = "owenerGroup"
			storage.init({ userId })
			const storableMailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, {
				_id: [archiveId, blobElementId],
				_ownerGroup,
				details: createTestEntity(MailDetailsTypeRef),
			})

			await storage.put(storableMailDetailsBlob)

			await storage.deleteAllOwnedBy(_ownerGroup)

			const mailDetailsBlob = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlob).equals(null)
		})
	})

	o.spec("custom cache handlers", function () {
		const userId = "userId1"

		o.beforeEach(async function () {
			await storage.init({ userId })
		})

		o.test("put calls the cache handler", async function () {
			const storableUser = createTestEntity(UserTypeRef, { _id: userId })

			const userCacheHandler: CustomCacheHandler<User> = object()
			when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

			await storage.put(storableUser)
			verify(userCacheHandler.onBeforeUpdate?.(storableUser))
		})

		o.test("deleteIfExists calls the cache handler", async function () {
			const storableUser = createTestEntity(UserTypeRef, { _id: userId })

			const userCacheHandler: CustomCacheHandler<User> = object()
			when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

			await storage.put(storableUser)

			await storage.deleteIfExists(UserTypeRef, null, userId)
			verify(userCacheHandler.onBeforeDelete?.(userId))
		})

		o.spec("deleteAllOwnedBy", function () {
			const userId = "id1"
			const groupId = "groupId"

			o.test("calls the cache handler for element types", async function () {
				const storableUser = createTestEntity(UserTypeRef, { _id: userId, _ownerGroup: groupId })

				const userCacheHandler: CustomCacheHandler<User> = object()
				when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

				await storage.put(storableUser)

				await storage.deleteAllOwnedBy(groupId)
				verify(userCacheHandler.onBeforeDelete?.(userId))
			})

			o.test("calls the cache handler for list element types", async function () {
				const id: IdTuple = ["listId", "id1"]
				const entityToStore = createTestEntity(MailTypeRef, { _id: id, _ownerGroup: groupId })

				const customCacheHandler: CustomCacheHandler<Mail> = object()
				when(customCacheHandlerMap.get(MailTypeRef)).thenReturn(customCacheHandler)

				await storage.put(entityToStore)

				await storage.deleteAllOwnedBy(groupId)
				verify(customCacheHandler.onBeforeDelete?.(id))
			})

			o.test("calls the cache handler for blob element types", async function () {
				const id: IdTuple = ["listId", "id1"]
				const entityToStore = createTestEntity(MailDetailsBlobTypeRef, { _id: id, _ownerGroup: groupId })

				const customCacheHandler: CustomCacheHandler<MailDetailsBlob> = object()
				when(customCacheHandlerMap.get(MailDetailsBlobTypeRef)).thenReturn(customCacheHandler)

				await storage.put(entityToStore)

				await storage.deleteAllOwnedBy(groupId)
				verify(customCacheHandler.onBeforeDelete?.(id))
			})
		})
	})
})
