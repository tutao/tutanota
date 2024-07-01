import o from "@tutao/otest"
import { EphemeralCacheStorage } from "../../../../../src/common/api/worker/rest/EphemeralCacheStorage.js"
import { createMailDetailsBlob, MailDetailsBlobTypeRef, MailDetailsTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils.js"

o.spec("EphemeralCacheStorageTest", function () {
	const userId = "userId"
	const archiveId = "archiveId"
	const blobElementId = "blobElementId1"

	const storage = new EphemeralCacheStorage()

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
})
