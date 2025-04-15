import o from "@tutao/otest"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage.js"
import {
	BodyTypeRef,
	Mail,
	MailDetailsBlob,
	MailDetailsBlobTypeRef,
	MailDetailsTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { clientInitializedTypeModelResolver, createTestEntity, modelMapperFromTypeModelResolver } from "../../../TestUtils.js"
import { ModelMapper } from "../../../../../src/common/api/worker/crypto/ModelMapper"
import { ServerModelParsedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { TypeModelResolver } from "../../../../../src/common/api/common/EntityFunctions"
import { CustomCacheHandler, CustomCacheHandlerMap } from "../../../../../src/common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { GroupMembershipTypeRef, User, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs"
import { object, when } from "testdouble"
import { verify } from "@tutao/tutanota-test-utils"

o.spec("EphemeralCacheStorage", function () {
	const userId = "userId"
	const archiveId = "archiveId"
	const blobElementId = "blobElementId1"
	let typeModelResolver: TypeModelResolver
	let modelMapper: ModelMapper
	let customCacheHandlerMap: CustomCacheHandlerMap
	let storage: EphemeralCacheStorage

	o.beforeEach(() => {
		typeModelResolver = clientInitializedTypeModelResolver()
		modelMapper = modelMapperFromTypeModelResolver(typeModelResolver)
		customCacheHandlerMap = object()
		storage = new EphemeralCacheStorage(modelMapper, typeModelResolver, customCacheHandlerMap)
	})

	o.spec("BlobElementType", function () {
		o("cache roundtrip: put, get, delete", async function () {
			storage.init({ userId })
			const storableMailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, {
				_id: [archiveId, blobElementId],
				_permissions: "permissionId",
				details: createTestEntity(MailDetailsTypeRef, {
					_id: "detailsId1",
					recipients: createTestEntity(RecipientsTypeRef, { _id: "recipeintsId1" }),
					body: createTestEntity(BodyTypeRef, { _id: "bodyId1" }),
				}),
			})

			let mailDetailsBlobFromDb = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlobFromDb).equals(null)

			const mailDetailsBlobParsedInstance = (await modelMapper.mapToClientModelParsedInstance(
				MailDetailsBlobTypeRef,
				storableMailDetailsBlob,
			)) as unknown as ServerModelParsedInstance

			await storage.put(MailDetailsBlobTypeRef, mailDetailsBlobParsedInstance as ServerModelParsedInstance)

			mailDetailsBlobFromDb = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlobFromDb).deepEquals(storableMailDetailsBlob)

			await storage.deleteIfExists(MailDetailsBlobTypeRef, archiveId, blobElementId)

			mailDetailsBlobFromDb = await storage.get(MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlobFromDb).equals(null)
		})

		o("cache roundtrip: put, get, deleteAllOwnedBy", async function () {
			const _ownerGroup = "owenerGroup"
			storage.init({ userId })
			const storableMailDetailsBlob = createTestEntity(MailDetailsBlobTypeRef, {
				_id: [archiveId, blobElementId],
				_permissions: "permissionId",
				_ownerGroup,
				details: createTestEntity(MailDetailsTypeRef, {
					_id: "detailsId1",
					recipients: createTestEntity(RecipientsTypeRef, { _id: "recipeintsId1" }),
					body: createTestEntity(BodyTypeRef, { _id: "bodyId1" }),
				}),
			})

			const mailDetailsBlobParsedInstance = (await modelMapper.mapToClientModelParsedInstance(
				MailDetailsBlobTypeRef,
				storableMailDetailsBlob,
			)) as unknown as ServerModelParsedInstance

			await storage.put(MailDetailsBlobTypeRef, mailDetailsBlobParsedInstance)

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
			const user = createTestEntity(UserTypeRef, { _id: userId, _ownerGroup: "ownerGroup" }, { populateAggregates: true })
			const storableUser = (await modelMapper.mapToClientModelParsedInstance(UserTypeRef, user)) as unknown as ServerModelParsedInstance

			const userCacheHandler: CustomCacheHandler<User> = object()
			when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

			await storage.put(UserTypeRef, storableUser)
			verify(userCacheHandler.onBeforeCacheUpdate?.(user))
		})

		o.test("deleteIfExists calls the cache handler", async function () {
			const user = createTestEntity(UserTypeRef, { _id: userId, _ownerGroup: "ownerGroup" }, { populateAggregates: true })
			const storableUser = (await modelMapper.mapToClientModelParsedInstance(UserTypeRef, user)) as unknown as ServerModelParsedInstance

			const userCacheHandler: CustomCacheHandler<User> = object()
			when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

			await storage.put(UserTypeRef, storableUser)

			await storage.deleteIfExists(UserTypeRef, null, userId)
			verify(userCacheHandler.onBeforeCacheDeletion?.(userId))
		})

		o.spec("deleteAllOwnedBy", function () {
			const userId = "id1"
			const groupId = "groupId"

			o.test("calls the cache handler for element types", async function () {
				const user = createTestEntity(UserTypeRef, { _id: userId, _ownerGroup: groupId }, { populateAggregates: true })
				const storableUser = (await modelMapper.mapToClientModelParsedInstance(UserTypeRef, user)) as unknown as ServerModelParsedInstance

				const userCacheHandler: CustomCacheHandler<User> = object()
				when(customCacheHandlerMap.get(UserTypeRef)).thenReturn(userCacheHandler)

				await storage.put(UserTypeRef, storableUser)

				await storage.deleteAllOwnedBy(groupId)
				verify(userCacheHandler.onBeforeCacheDeletion?.(userId))
			})

			o.test("calls the cache handler for list element types", async function () {
				const id: IdTuple = ["listId", "id1"]
				const entityToStore = createTestEntity(MailTypeRef, { _id: id, _ownerGroup: groupId }, { populateAggregates: true })
				const storableEntity = (await modelMapper.mapToClientModelParsedInstance(MailTypeRef, entityToStore)) as unknown as ServerModelParsedInstance

				const customCacheHandler: CustomCacheHandler<Mail> = object()
				when(customCacheHandlerMap.get(MailTypeRef)).thenReturn(customCacheHandler)

				await storage.put(MailTypeRef, storableEntity)

				await storage.deleteAllOwnedBy(groupId)
				verify(customCacheHandler.onBeforeCacheDeletion?.(id))
			})

			o.test("calls the cache handler for blob element types", async function () {
				const id: IdTuple = ["listId", "id1"]
				const entityToStore = createTestEntity(MailDetailsBlobTypeRef, { _id: id, _ownerGroup: groupId }, { populateAggregates: true })
				const storableEntity = (await modelMapper.mapToClientModelParsedInstance(
					MailDetailsBlobTypeRef,
					entityToStore,
				)) as unknown as ServerModelParsedInstance

				const customCacheHandler: CustomCacheHandler<MailDetailsBlob> = object()
				when(customCacheHandlerMap.get(MailDetailsBlobTypeRef)).thenReturn(customCacheHandler)

				await storage.put(MailDetailsBlobTypeRef, storableEntity)

				await storage.deleteAllOwnedBy(groupId)
				verify(customCacheHandler.onBeforeCacheDeletion?.(id))
			})
		})
	})
})
