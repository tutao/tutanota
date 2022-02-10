import o from "ospec"
import {OfflineDb} from "../../../../src/desktop/db/OfflineDb"
import {ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {GENERATED_MAX_ID, GENERATED_MIN_ID} from "../../../../src/api/common/utils/EntityUtils"
import {UserTypeRef} from "../../../../src/api/entities/sys/User"
import {assertNotNull, concat, stringToUtf8Uint8Array} from "@tutao/tutanota-utils"
import {calendarGroupId} from "../../calendar/CalendarTestUtils"
import * as fs from "fs"
import * as cborg from "cborg"
import {assertThrows} from "@tutao/tutanota-test-utils"
import {CryptoError} from "@tutao/tutanota-crypto"
//some tests will not work wit in-memory database so we crate a file and delete it afterwards
const database = "./testdatabase.sqlite"

export const offlineDatabaseTestKey = [3957386659, 354339016, 3786337319, 3366334248]

// Added by sqliteNativeBannerPlugin
const nativePath = globalThis.buildOptions.sqliteNativePath

o.spec("Offline DB ", function () {
	let db: OfflineDb
	const listId = "listId"
	// they are
	const id1 = "---------id1"
	const id2 = "---------id2"
	const id3 = "---------id3"

	o.beforeEach(async function () {
		db = new OfflineDb(nativePath)
		await db.init(database, offlineDatabaseTestKey)
	})
	o.afterEach(async function () {
		await db.close()
		fs.rmSync(database)
	})

	o.spec("test put", function () {
		o("put and get works", async function () {
			const entity = createEntity(listId, id1)
			await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity})
			const receivedEntity = await db.get(ContactTypeRef.type, listId, id1)
			o(receivedEntity!).deepEquals(entity)
		})
		o("put overwrites list entity", async function () {
			const entity = createEntity(listId, id1)
			await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity})
			const updatedEntity = new Buffer(concat(entity, new Uint8Array([1])))
			await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: updatedEntity})
			const receivedEntity = await db.get(ContactTypeRef.type, listId, id1)
			o(receivedEntity!).deepEquals(updatedEntity)
		})

		o("put and get element type", async function () {
			const entity = createElementEntity(id1)
			await db.put({type: UserTypeRef.type, listId: null, elementId: id1, entity})
			const receivedEntity = await db.get(UserTypeRef.type, null, id1)
			o(receivedEntity!).deepEquals(entity)
		})

		o("put overwrites element entity", async function () {
			const entity = createElementEntity(id1)
			await db.put({type: UserTypeRef.type, listId: null, elementId: id1, entity})
			const updatedEntity = new Buffer(concat(entity, new Uint8Array([1])))
			await db.put({type: UserTypeRef.type, listId: null, elementId: id1, entity: updatedEntity})

			const receivedEntity = await db.get(UserTypeRef.type, null, id1)
			o(receivedEntity!).deepEquals(updatedEntity)
		})
	})


	o("set new range works", async function () {
		await db.setNewRange(ContactTypeRef.type, listId, "lowerId", "upperId")
		const received = await db.getRange(ContactTypeRef.type, listId)
		o(received!).deepEquals({lower: "lowerId", upper: "upperId"})
	})

	o("set lower range works", async function () {
		await db.setNewRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, GENERATED_MAX_ID)
		await db.setLowerRange(ContactTypeRef.type, listId, "lowerId")
		const received = await db.getRange(ContactTypeRef.type, listId)
		o(received!).deepEquals({lower: "lowerId", upper: GENERATED_MAX_ID})
	})

	o("set upper range works", async function () {
		await db.setNewRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, GENERATED_MAX_ID)
		await db.setUpperRange(ContactTypeRef.type, listId, "upperId")
		const received = await db.getRange(ContactTypeRef.type, listId)
		o(received!).deepEquals({lower: GENERATED_MIN_ID, upper: "upperId"})
	})

	o.spec("get ids in range", function () {
		o("works", async function () {
			const entity1 = createEntity(listId, id1)
			const entity2 = createEntity(listId, id2)
			await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
			await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			await db.setNewRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, GENERATED_MAX_ID)
			const received = await db.getIdsInRange(ContactTypeRef.type, listId)
			o(received).deepEquals([id1, id2])
		})

		o("correctly filters out by length", async function () {
			const entity1 = createEntity(listId, id1)
			const entity2 = createEntity(listId, id2)
			await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
			await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			await db.setNewRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, "-----------------") // like maxId but longer than normal id, therefore bigger
			const received = await db.getIdsInRange(ContactTypeRef.type, listId)
			o(received).deepEquals([id1, id2])
		})
	})

	o.spec("provideFromRange", function () {
		o.spec("non-reverse", function () {
			o("works", async function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)

				await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = await db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 3, false)
				o(received).deepEquals([entity1, entity2])
			})

			o("filters by list", async function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				const anotherListId = "anotherListId"
				const entity3 = createEntity(anotherListId, id3)
				await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				await db.put({type: ContactTypeRef.type, listId: anotherListId, elementId: id3, entity: entity3})
				const received = await db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 3, false)
				o(received).deepEquals([entity1, entity2])
			})

			o("does not include start", async function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = await db.provideFromRange(ContactTypeRef.type, listId, id1, 3, false)
				o(received).deepEquals([entity2])
			})

			o("limit", async function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = await db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 1, false)
				o(received).deepEquals([entity1])
			})

			o("compares ids by length first", async function () {
				const shortId = "------shortId"
				// this is actually longer than normal IDs
				const longId = "------loooongId"
				const entity1 = createEntity(listId, shortId)
				const entity2 = createEntity(listId, longId)
				await db.put({type: ContactTypeRef.type, listId, elementId: shortId, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: longId, entity: entity2})

				const received = await db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 2, false)
				o(received).deepEquals([entity1, entity2])
			})

			o("filters out by id first", async function () {
				// this is actually shorter than normal IDs
				const shortId = "----shortId"
				const longId = "---loooongId"
				const entity1 = createEntity(listId, shortId)
				const entity2 = createEntity(listId, longId)
				await db.put({type: ContactTypeRef.type, listId, elementId: shortId, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: longId, entity: entity2})

				const received = await db.provideFromRange(ContactTypeRef.type, listId, shortId, 2, false)
				o(received).deepEquals([entity2])
			})
		})

		o.spec("reverse", async function () {
			o("works", async function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = await db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MAX_ID, 3, true)
				o(received).deepEquals([entity2, entity1])
			})

			o("does not include start", async function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = await db.provideFromRange(ContactTypeRef.type, listId, id2, 3, true)
				o(received).deepEquals([entity1])
			})

			o("limit", async function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = await db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MAX_ID, 1, true)
				o(received).deepEquals([entity2])
			})

			o("filters by list", async function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				const anotherListId = "anotherListId"
				const entity3 = createEntity(anotherListId, id3)
				await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				await db.put({type: ContactTypeRef.type, listId: anotherListId, elementId: id3, entity: entity3})
				const received = await db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MAX_ID, 3, true)
				o(received).deepEquals([entity2, entity1])
			})

			o("compares ids by length first", async function () {
				// this is actually shorter than normal IDs
				const shortId = "----shortId"
				const longId = "---loooongId"
				const entity1 = createEntity(listId, shortId)
				const entity2 = createEntity(listId, longId)
				await db.put({type: ContactTypeRef.type, listId, elementId: shortId, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: longId, entity: entity2})

				const received = await db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MAX_ID, 2, true)
				o(received).deepEquals([entity2, entity1])
			})

			o("filters out by id first", async function () {
				// this is actually shorter than normal IDs
				const shortId = "----shortId"
				const longId = "---loooongId"
				const entity1 = createEntity(listId, shortId)
				const entity2 = createEntity(listId, longId)
				await db.put({type: ContactTypeRef.type, listId, elementId: shortId, entity: entity1})
				await db.put({type: ContactTypeRef.type, listId, elementId: longId, entity: entity2})

				const received = await db.provideFromRange(ContactTypeRef.type, listId, longId, 2, true)
				o(received).deepEquals([entity1])
			})
		})
	})

	o.spec("delete", function () {
		o("deleting single element works", async function () {
			const entity1 = createEntity(listId, id1)
			const entity2 = createEntity(listId, id2)
			await db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
			await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			await db.delete(ContactTypeRef.type, listId, id1)
			const received = await db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 3, false)
			o(received).deepEquals([entity2])
		})
		o("delete all works", async function () {
			const entity1 = createElementEntity(id1)
			const entity2 = createEntity(listId, id2)
			await db.put({type: ContactTypeRef.type, listId: null, elementId: id1, entity: entity1})
			await db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			await db.putLastBatchIdForGroup(calendarGroupId, "batchId")
			await db.setNewRange(ContactTypeRef.type, listId, id1, id2)

			await db.deleteAll()
			o(await db.get(ContactTypeRef.type, null, id1)).equals(null)("element entities was deleted")
			o(await db.get(ContactTypeRef.type, listId, id2)).equals(null)("list entities was deleted")
			o(await db.getRange(ContactTypeRef.type, listId)).equals(null)("range was deleted")
			o(await db.getLastBatchIdForGroup(calendarGroupId)).equals(null)("metadata was deleted")
		})
	})


	o.spec("getBatchId", async function () {

		o("returns null when nothing is written", async function () {
			o(await db.getLastBatchIdForGroup("groupId")).equals(null)
		})

		o("returns correct value when written", async function () {
			const groupId = "groupId"
			const batchId = "batchId"
			await db.putLastBatchIdForGroup(groupId, batchId)
			o(await db.getLastBatchIdForGroup(groupId)).equals(batchId)
		})

		o("returns correct value when overwritten", async function () {
			const groupId = "groupId"
			const batchId = "batchId"
			const newBatchId = "newBatchId"
			await db.putLastBatchIdForGroup(groupId, batchId)
			await db.putLastBatchIdForGroup(groupId, newBatchId)
			o(await db.getLastBatchIdForGroup(groupId)).equals(newBatchId)
		})
	})
	o("put and get Metadata", async function () {
		const time = new Date().getTime()
		const encodedDate = cborg.encode(time)
		await db.putMetadata("lastUpdateTime", encodedDate)
		const receivedEntity = await db.getMetadata("lastUpdateTime")
		o(cborg.decode(assertNotNull(receivedEntity))).equals(time)
	})
	o.spec("Test encryption", function () {
		const time = new Date().getTime()
		const encodedDate = cborg.encode(time)
		o("can create new database", async function () {
			//save something
			await db.putMetadata("lastUpdateTime", encodedDate)
			const receivedEntity = await db.getMetadata("lastUpdateTime")
			o(cborg.decode(assertNotNull(receivedEntity))).equals(time)
		})

		o("can open existing database", async function () {
			//save something
			await db.putMetadata("lastUpdateTime", encodedDate)
			await db.close()

			db = new OfflineDb(nativePath)
			await db.init(database, offlineDatabaseTestKey)

			const receivedEntity = await db.getMetadata("lastUpdateTime")
			o(cborg.decode(assertNotNull(receivedEntity))).equals(time)
		})

		o("can't read from existing database if password is wrong", async function () {
			//save something
			await db.putMetadata("lastUpdateTime", encodedDate)
			await db.close()

			db = new OfflineDb(nativePath)
			const theWrongKey = [3957386659, 354339016, 3786337319, 3366334249]
			//with integrity check (performed first)
			await assertThrows(Error, () => db.init(database, theWrongKey))
			//without integrity check
			await assertThrows(Error, () => db.init(database, theWrongKey, false))
		})
		o("Integrity check works", async function () {
			//save something
			await db.putMetadata("lastUpdateTime", encodedDate)
			o(() => db.checkIntegrity()).notThrows(Error)

			//flip byte in database
			let fileBuffer = new Uint8Array(fs.readFileSync(database))
			fileBuffer[fileBuffer.length - 1] ^= fileBuffer[fileBuffer.length - 1]
			fs.writeFileSync(database, fileBuffer)

			o(() => db.checkIntegrity()).throws(Error)
		})
		o("Integrity of the database is checked on initialization", async function () {
			//save something
			await db.putMetadata("lastUpdateTime", encodedDate)
			await db.close()


			//flip byte in database
			let fileBuffer = new Uint8Array(fs.readFileSync(database))
			fileBuffer[fileBuffer.length - 1] ^= fileBuffer[fileBuffer.length - 1]
			fs.writeFileSync(database, fileBuffer)

			db = new OfflineDb(nativePath)

			//does not throw if integrity check is turned of
			await db.init(database, offlineDatabaseTestKey, false)

			//throws if integrity check is turned on
			const error = await assertThrows(CryptoError, () => db.init(database, offlineDatabaseTestKey))
		})
	})
})

function createEntity(listId: string, elementId: string) {
	return new Buffer(stringToUtf8Uint8Array(listId + elementId))
}

function createElementEntity(elementId: string) {
	return new Buffer(stringToUtf8Uint8Array(elementId))
}