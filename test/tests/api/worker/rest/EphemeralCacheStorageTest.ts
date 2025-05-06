import o from "@tutao/otest"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage.js"
import { BodyTypeRef, MailDetailsBlobTypeRef, MailDetailsTypeRef, RecipientsTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { clientModelAsServerModel, createTestEntity } from "../../../TestUtils.js"
import { ModelMapper } from "../../../../../src/common/api/worker/crypto/ModelMapper"
import {
	globalClientModelInfo,
	globalServerModelInfo,
	resolveClientTypeReference,
	resolveServerTypeReference,
} from "../../../../../src/common/api/common/EntityFunctions"
import { ServerModelParsedInstance } from "../../../../../src/common/api/common/EntityTypes"

o.spec("EphemeralCacheStorageTest", function () {
	const userId = "userId"
	const archiveId = "archiveId"
	const blobElementId = "blobElementId1"
	const modelMapper = new ModelMapper(resolveClientTypeReference, resolveServerTypeReference)

	clientModelAsServerModel(globalServerModelInfo, globalClientModelInfo)

	const storage = new EphemeralCacheStorage(modelMapper)

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
