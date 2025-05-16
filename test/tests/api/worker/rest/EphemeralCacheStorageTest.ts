import o from "@tutao/otest"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage.js"
import { BodyTypeRef, MailDetailsBlobTypeRef, MailDetailsTypeRef, RecipientsTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { clientInitializedTypeModelResolver, createTestEntity, modelMapperFromTypeModelResolver } from "../../../TestUtils.js"
import { ModelMapper } from "../../../../../src/common/api/worker/crypto/ModelMapper"
import { ServerModelParsedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { TypeModelResolver } from "../../../../../src/common/api/common/EntityFunctions"

o.spec("EphemeralCacheStorageTest", function () {
	const userId = "userId"
	const archiveId = "archiveId"
	const blobElementId = "blobElementId1"
	let typeModelResolver: TypeModelResolver
	let modelMapper: ModelMapper
	let storage: EphemeralCacheStorage

	o.beforeEach(() => {
		typeModelResolver = clientInitializedTypeModelResolver()
		modelMapper = modelMapperFromTypeModelResolver(typeModelResolver)
		storage = new EphemeralCacheStorage(modelMapper, typeModelResolver)
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
})
