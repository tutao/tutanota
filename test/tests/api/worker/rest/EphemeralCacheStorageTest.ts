import o, { verify } from "@tutao/otest"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage.js"
import { ServerModelParsedInstance, TypeModelResolver } from "@tutao/typerefs"
import { clientInitializedTypeModelResolver, createTestEntity, modelMapperFromTypeModelResolver, removeOriginals } from "../../../TestUtils.js"
import { ModelMapper } from "@tutao/instance-pipeline"
import { CustomCacheHandler, CustomCacheHandlerMap } from "../../../../../src/common/api/worker/rest/cacheHandler/CustomCacheHandler"
import { object, when } from "testdouble"
import { tutanotaTypeRefs, sysTypeRefs } from "@tutao/typerefs"

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
			const storableMailDetailsBlob = createTestEntity(tutanotaTypeRefs.MailDetailsBlobTypeRef, {
				_id: [archiveId, blobElementId],
				_permissions: "permissionId",
				details: createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
					_id: "detailsId1",
					recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, { _id: "recipeintsId1" }),
					body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { _id: "bodyId1" }),
				}),
			})

			let mailDetailsBlobFromDb = await storage.get(tutanotaTypeRefs.MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlobFromDb).equals(null)

			const mailDetailsBlobParsedInstance = (await modelMapper.mapToClientModelParsedInstance(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				storableMailDetailsBlob,
			)) as unknown as ServerModelParsedInstance

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, mailDetailsBlobParsedInstance as ServerModelParsedInstance)

			mailDetailsBlobFromDb = await storage.get(tutanotaTypeRefs.MailDetailsBlobTypeRef, archiveId, blobElementId)
			removeOriginals(mailDetailsBlobFromDb)
			o(mailDetailsBlobFromDb).deepEquals(storableMailDetailsBlob)

			await storage.deleteIfExists(tutanotaTypeRefs.MailDetailsBlobTypeRef, archiveId, blobElementId)

			mailDetailsBlobFromDb = await storage.get(tutanotaTypeRefs.MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlobFromDb).equals(null)
		})

		o("cache roundtrip: putMultiple, provideMultiple, delete", async function () {
			storage.init({ userId })
			const storableMailDetailsBlob = createTestEntity(tutanotaTypeRefs.MailDetailsBlobTypeRef, {
				_id: [archiveId, blobElementId],
				_permissions: "permissionId",
				details: createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
					_id: "detailsId1",
					recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, { _id: "recipeintsId1" }),
					body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { _id: "bodyId1" }),
				}),
			})

			let mailDetailsBlobFromDb = await storage.provideMultiple(tutanotaTypeRefs.MailDetailsBlobTypeRef, archiveId, [blobElementId])
			o(mailDetailsBlobFromDb).deepEquals([])

			const mailDetailsBlobParsedInstance = (await modelMapper.mapToClientModelParsedInstance(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				storableMailDetailsBlob,
			)) as unknown as ServerModelParsedInstance

			await storage.putMultiple(tutanotaTypeRefs.MailDetailsBlobTypeRef, [mailDetailsBlobParsedInstance as ServerModelParsedInstance])

			mailDetailsBlobFromDb = await storage.provideMultiple(tutanotaTypeRefs.MailDetailsBlobTypeRef, archiveId, [blobElementId])
			removeOriginals(mailDetailsBlobFromDb[0])
			o(mailDetailsBlobFromDb[0]).deepEquals(storableMailDetailsBlob)

			await storage.deleteIfExists(tutanotaTypeRefs.MailDetailsBlobTypeRef, archiveId, blobElementId)

			mailDetailsBlobFromDb = await storage.provideMultiple(tutanotaTypeRefs.MailDetailsBlobTypeRef, archiveId, [blobElementId])
			o(mailDetailsBlobFromDb).deepEquals([])
		})

		o("cache roundtrip: put, get, deleteAllOwnedBy", async function () {
			const _ownerGroup = "owenerGroup"
			storage.init({ userId })
			const storableMailDetailsBlob = createTestEntity(tutanotaTypeRefs.MailDetailsBlobTypeRef, {
				_id: [archiveId, blobElementId],
				_permissions: "permissionId",
				_ownerGroup,
				details: createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
					_id: "detailsId1",
					recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, { _id: "recipeintsId1" }),
					body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { _id: "bodyId1" }),
				}),
			})

			const mailDetailsBlobParsedInstance = (await modelMapper.mapToClientModelParsedInstance(
				tutanotaTypeRefs.MailDetailsBlobTypeRef,
				storableMailDetailsBlob,
			)) as unknown as ServerModelParsedInstance

			await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, mailDetailsBlobParsedInstance)

			await storage.deleteAllOwnedBy(_ownerGroup)

			const mailDetailsBlob = await storage.get(tutanotaTypeRefs.MailDetailsBlobTypeRef, archiveId, blobElementId)
			o(mailDetailsBlob).equals(null)
		})
	})

	o.spec("custom cache handlers", function () {
		const userId = "userId1"

		o.beforeEach(async function () {
			await storage.init({ userId })
		})

		o.test("put calls the cache handler", async function () {
			const user = createTestEntity(
				sysTypeRefs.UserTypeRef,
				{
					_id: userId,
					_ownerGroup: "ownerGroup",
				},
				{ populateAggregates: true },
			)
			const storableUser = (await modelMapper.mapToClientModelParsedInstance(sysTypeRefs.UserTypeRef, user)) as unknown as ServerModelParsedInstance
			user.userGroup._original = structuredClone(user.userGroup)
			user._original = structuredClone(user)
			const userCacheHandler: CustomCacheHandler<sysTypeRefs.User> = object()
			when(customCacheHandlerMap.get(sysTypeRefs.UserTypeRef)).thenReturn(userCacheHandler)

			await storage.put(sysTypeRefs.UserTypeRef, storableUser)
			verify(userCacheHandler.onBeforeCacheUpdate?.(user))
		})

		o.test("deleteIfExists calls the cache handler", async function () {
			const user = createTestEntity(
				sysTypeRefs.UserTypeRef,
				{
					_id: userId,
					_ownerGroup: "ownerGroup",
				},
				{ populateAggregates: true },
			)
			const storableUser = (await modelMapper.mapToClientModelParsedInstance(sysTypeRefs.UserTypeRef, user)) as unknown as ServerModelParsedInstance

			const userCacheHandler: CustomCacheHandler<sysTypeRefs.User> = object()
			when(customCacheHandlerMap.get(sysTypeRefs.UserTypeRef)).thenReturn(userCacheHandler)

			await storage.put(sysTypeRefs.UserTypeRef, storableUser)

			await storage.deleteIfExists(sysTypeRefs.UserTypeRef, null, userId)
			verify(userCacheHandler.onBeforeCacheDeletion?.(userId))
		})

		o.test("deleteRange deletes instances for the listId", async function () {
			const mailSetEntryListId = "mseListId"
			const mailSetEntryListElementIdOne = "mseElement1"
			const mailSetEntryListElementIdTwo = "mseElement2"
			const mailSetEntryOtherListId = "mseOtherListId"
			const mailSetEntryOtherElementId = "mseOtherElement"
			storage.init({ userId })

			const mailSetEntryListOne = createTestEntity(
				tutanotaTypeRefs.MailSetEntryTypeRef,
				{
					_id: [mailSetEntryListId, mailSetEntryListElementIdOne],
					_ownerGroup: "ownerGroup",
				},
				{ populateAggregates: true },
			)
			const mailSetEntryListTwo = createTestEntity(
				tutanotaTypeRefs.MailSetEntryTypeRef,
				{
					_id: [mailSetEntryListId, mailSetEntryListElementIdTwo],
					_ownerGroup: "ownerGroup",
				},
				{ populateAggregates: true },
			)
			const mailSetEntryOther = createTestEntity(
				tutanotaTypeRefs.MailSetEntryTypeRef,
				{
					_id: [mailSetEntryOtherListId, mailSetEntryOtherElementId],
					_ownerGroup: "ownerGroup",
				},
				{ populateAggregates: true },
			)
			let mailSetEntryFromDb = await storage.get(tutanotaTypeRefs.MailSetEntryTypeRef, mailSetEntryListId, mailSetEntryListElementIdOne)
			o(mailSetEntryFromDb).equals(null)

			const storableMailSetEntry = (await modelMapper.mapToClientModelParsedInstance(
				tutanotaTypeRefs.MailSetEntryTypeRef,
				mailSetEntryListOne,
			)) as unknown as ServerModelParsedInstance
			await storage.put(tutanotaTypeRefs.MailSetEntryTypeRef, storableMailSetEntry)

			const storableMailSetEntryTwo = (await modelMapper.mapToClientModelParsedInstance(
				tutanotaTypeRefs.MailSetEntryTypeRef,
				mailSetEntryListTwo,
			)) as unknown as ServerModelParsedInstance
			await storage.put(tutanotaTypeRefs.MailSetEntryTypeRef, storableMailSetEntryTwo)

			const storableMailSetEntryOther = (await modelMapper.mapToClientModelParsedInstance(
				tutanotaTypeRefs.MailSetEntryTypeRef,
				mailSetEntryOther,
			)) as unknown as ServerModelParsedInstance
			await storage.put(tutanotaTypeRefs.MailSetEntryTypeRef, storableMailSetEntryOther)

			mailSetEntryFromDb = await storage.get(tutanotaTypeRefs.MailSetEntryTypeRef, mailSetEntryListId, mailSetEntryListElementIdOne)
			removeOriginals(mailSetEntryFromDb)
			o(mailSetEntryFromDb).deepEquals(mailSetEntryListOne)
			mailSetEntryFromDb = await storage.get(tutanotaTypeRefs.MailSetEntryTypeRef, mailSetEntryListId, mailSetEntryListElementIdTwo)
			removeOriginals(mailSetEntryFromDb)
			o(mailSetEntryFromDb).deepEquals(mailSetEntryListTwo)
			mailSetEntryFromDb = await storage.get(tutanotaTypeRefs.MailSetEntryTypeRef, mailSetEntryOtherListId, mailSetEntryOtherElementId)
			removeOriginals(mailSetEntryFromDb)
			o(mailSetEntryFromDb).deepEquals(mailSetEntryOther)

			await storage.deleteRange(tutanotaTypeRefs.MailSetEntryTypeRef, mailSetEntryListId)

			mailSetEntryFromDb = await storage.get(tutanotaTypeRefs.MailSetEntryTypeRef, mailSetEntryListId, mailSetEntryListElementIdOne)
			o(mailSetEntryFromDb).deepEquals(null)
			mailSetEntryFromDb = await storage.get(tutanotaTypeRefs.MailSetEntryTypeRef, mailSetEntryListId, mailSetEntryListElementIdTwo)
			o(mailSetEntryFromDb).deepEquals(null)
			mailSetEntryFromDb = await storage.get(tutanotaTypeRefs.MailSetEntryTypeRef, mailSetEntryOtherListId, mailSetEntryOtherElementId)
			removeOriginals(mailSetEntryFromDb)
			o(mailSetEntryFromDb).deepEquals(mailSetEntryOther)
		})

		o.spec("deleteAllOwnedBy", function () {
			const userId = "id1"
			const groupId = "groupId"

			o.test("calls the cache handler for element types", async function () {
				const user = createTestEntity(
					sysTypeRefs.UserTypeRef,
					{
						_id: userId,
						_ownerGroup: groupId,
					},
					{ populateAggregates: true },
				)
				const storableUser = (await modelMapper.mapToClientModelParsedInstance(sysTypeRefs.UserTypeRef, user)) as unknown as ServerModelParsedInstance

				const userCacheHandler: CustomCacheHandler<sysTypeRefs.User> = object()
				when(customCacheHandlerMap.get(sysTypeRefs.UserTypeRef)).thenReturn(userCacheHandler)

				await storage.put(sysTypeRefs.UserTypeRef, storableUser)

				await storage.deleteAllOwnedBy(groupId)
				verify(userCacheHandler.onBeforeCacheDeletion?.(userId))
			})

			o.test("calls the cache handler for list element types", async function () {
				const id: IdTuple = ["listId", "id1"]
				const entityToStore = createTestEntity(
					tutanotaTypeRefs.MailTypeRef,
					{
						_id: id,
						_ownerGroup: groupId,
					},
					{ populateAggregates: true },
				)
				const storableEntity = (await modelMapper.mapToClientModelParsedInstance(
					tutanotaTypeRefs.MailTypeRef,
					entityToStore,
				)) as unknown as ServerModelParsedInstance

				const customCacheHandler: CustomCacheHandler<tutanotaTypeRefs.Mail> = object()
				when(customCacheHandlerMap.get(tutanotaTypeRefs.MailTypeRef)).thenReturn(customCacheHandler)

				await storage.put(tutanotaTypeRefs.MailTypeRef, storableEntity)

				await storage.deleteAllOwnedBy(groupId)
				verify(customCacheHandler.onBeforeCacheDeletion?.(id))
			})

			o.test("calls the cache handler for blob element types", async function () {
				const id: IdTuple = ["listId", "id1"]
				const entityToStore = createTestEntity(
					tutanotaTypeRefs.MailDetailsBlobTypeRef,
					{
						_id: id,
						_ownerGroup: groupId,
					},
					{ populateAggregates: true },
				)
				const storableEntity = (await modelMapper.mapToClientModelParsedInstance(
					tutanotaTypeRefs.MailDetailsBlobTypeRef,
					entityToStore,
				)) as unknown as ServerModelParsedInstance

				const customCacheHandler: CustomCacheHandler<tutanotaTypeRefs.MailDetailsBlob> = object()
				when(customCacheHandlerMap.get(tutanotaTypeRefs.MailDetailsBlobTypeRef)).thenReturn(customCacheHandler)

				await storage.put(tutanotaTypeRefs.MailDetailsBlobTypeRef, storableEntity)

				await storage.deleteAllOwnedBy(groupId)
				verify(customCacheHandler.onBeforeCacheDeletion?.(id))
			})
		})
	})
})
