import o from "ospec"
import {OfflineDb} from "../../../../src/desktop/db/OfflineDb"
import {ContactTypeRef} from "../../../../src/api/entities/tutanota/Contact"
import {GENERATED_MAX_ID, GENERATED_MIN_ID} from "../../../../src/api/common/utils/EntityUtils"
import {UserTypeRef} from "../../../../src/api/entities/sys/User"
import {concat, stringToUtf8Uint8Array} from "@tutao/tutanota-utils"
import {calendarGroupId} from "../../calendar/CalendarTestUtils"
import * as fs from "fs"
import * as cborg from "cborg"
import {CryptoError} from "@tutao/tutanota-crypto"
//some tests will not work wit in-memory database so we crate a file and delete it afterwards
const database = "./testdatabase.sqlite"

export const offlineDatabaseTestKey = [3957386659, 354339016, 3786337319, 3366334248]

// Added by sqliteNativeBannerPlugin
const nativePath = globalThis.buildOptions.sqliteNativePath

o.spec("OfflineDb ", function () {
	let db: OfflineDb
	const listId = "listId"
	// they are
	const id1 = "---------id1"
	const id2 = "---------id2"
	const id3 = "---------id3"

	o.beforeEach(function () {
		db = new OfflineDb(nativePath)
		db.init(database, offlineDatabaseTestKey)
	})
	o.afterEach(function () {
		db.close()
		fs.rmSync(database)
	})

	o.spec("test put", function () {
		o("put and get works", function () {
			const entity = createEntity(listId, id1)
			db.put({type: ContactTypeRef.type, listId, elementId: id1, entity})
			const receivedEntity = db.get(ContactTypeRef.type, listId, id1)
			o(receivedEntity!).deepEquals(entity)
		})
		o("put overwrites list entity", function () {
			const entity = createEntity(listId, id1)
			db.put({type: ContactTypeRef.type, listId, elementId: id1, entity})
			const updatedEntity = new Buffer(concat(entity, new Uint8Array([1])))
			db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: updatedEntity})
			const receivedEntity = db.get(ContactTypeRef.type, listId, id1)
			o(receivedEntity!).deepEquals(updatedEntity)
		})

		o("put and get element type", function () {
			const entity = createElementEntity(id1)
			db.put({type: UserTypeRef.type, listId: null, elementId: id1, entity})
			const receivedEntity = db.get(UserTypeRef.type, null, id1)
			o(receivedEntity!).deepEquals(entity)
		})

		o("put overwrites element entity", function () {
			const entity = createElementEntity(id1)
			db.put({type: UserTypeRef.type, listId: null, elementId: id1, entity})
			const updatedEntity = new Buffer(concat(entity, new Uint8Array([1])))
			db.put({type: UserTypeRef.type, listId: null, elementId: id1, entity: updatedEntity})

			const receivedEntity = db.get(UserTypeRef.type, null, id1)
			o(receivedEntity!).deepEquals(updatedEntity)
		})
	})


	o("set new range works", function () {
		db.setNewRange(ContactTypeRef.type, listId, "lowerId", "upperId")
		const received = db.getRange(ContactTypeRef.type, listId)
		o(received!).deepEquals({lower: "lowerId", upper: "upperId"})
	})

	o("set lower range works", function () {
		db.setNewRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, GENERATED_MAX_ID)
		db.setLowerRange(ContactTypeRef.type, listId, "lowerId")
		const received = db.getRange(ContactTypeRef.type, listId)
		o(received!).deepEquals({lower: "lowerId", upper: GENERATED_MAX_ID})
	})

	o("set upper range works", function () {
		db.setNewRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, GENERATED_MAX_ID)
		db.setUpperRange(ContactTypeRef.type, listId, "upperId")
		const received = db.getRange(ContactTypeRef.type, listId)
		o(received!).deepEquals({lower: GENERATED_MIN_ID, upper: "upperId"})
	})

	o.spec("get ids in range", function () {
		o("works", function () {
			const entity1 = createEntity(listId, id1)
			const entity2 = createEntity(listId, id2)
			db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
			db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			db.setNewRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, GENERATED_MAX_ID)
			const received = db.getIdsInRange(ContactTypeRef.type, listId)
			o(received).deepEquals([id1, id2])
		})

		o("correctly filters out by length", function () {
			const entity1 = createEntity(listId, id1)
			const entity2 = createEntity(listId, id2)
			db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
			db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			db.setNewRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, "-----------------") // like maxId but longer than normal id, therefore bigger
			const received = db.getIdsInRange(ContactTypeRef.type, listId)
			o(received).deepEquals([id1, id2])
		})
	})

	o.spec("provideFromRange", function () {
		o.spec("non-reverse", function () {
			o("works", function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)

				db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 3, false)
				o(received).deepEquals([entity1, entity2])
			})

			o("filters by list", function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				const anotherListId = "anotherListId"
				const entity3 = createEntity(anotherListId, id3)
				db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				db.put({type: ContactTypeRef.type, listId: anotherListId, elementId: id3, entity: entity3})
				const received = db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 3, false)
				o(received).deepEquals([entity1, entity2])
			})

			o("does not include start", function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = db.provideFromRange(ContactTypeRef.type, listId, id1, 3, false)
				o(received).deepEquals([entity2])
			})

			o("limit", function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 1, false)
				o(received).deepEquals([entity1])
			})

			o("compares ids by length first", function () {
				const shortId = "------shortId"
				// this is actually longer than normal IDs
				const longId = "------loooongId"
				const entity1 = createEntity(listId, shortId)
				const entity2 = createEntity(listId, longId)
				db.put({type: ContactTypeRef.type, listId, elementId: shortId, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: longId, entity: entity2})

				const received = db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 2, false)
				o(received).deepEquals([entity1, entity2])
			})

			o("filters out by id first", function () {
				// this is actually shorter than normal IDs
				const shortId = "----shortId"
				const longId = "---loooongId"
				const entity1 = createEntity(listId, shortId)
				const entity2 = createEntity(listId, longId)
				db.put({type: ContactTypeRef.type, listId, elementId: shortId, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: longId, entity: entity2})

				const received = db.provideFromRange(ContactTypeRef.type, listId, shortId, 2, false)
				o(received).deepEquals([entity2])
			})
		})

		o.spec("reverse", function () {
			o("works", function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MAX_ID, 3, true)
				o(received).deepEquals([entity2, entity1])
			})

			o("does not include start", function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = db.provideFromRange(ContactTypeRef.type, listId, id2, 3, true)
				o(received).deepEquals([entity1])
			})

			o("limit", function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				const received = db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MAX_ID, 1, true)
				o(received).deepEquals([entity2])
			})

			o("filters by list", function () {
				const entity1 = createEntity(listId, id1)
				const entity2 = createEntity(listId, id2)
				const anotherListId = "anotherListId"
				const entity3 = createEntity(anotherListId, id3)
				db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
				db.put({type: ContactTypeRef.type, listId: anotherListId, elementId: id3, entity: entity3})
				const received = db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MAX_ID, 3, true)
				o(received).deepEquals([entity2, entity1])
			})

			o("compares ids by length first", function () {
				// this is actually shorter than normal IDs
				const shortId = "----shortId"
				const longId = "---loooongId"
				const entity1 = createEntity(listId, shortId)
				const entity2 = createEntity(listId, longId)
				db.put({type: ContactTypeRef.type, listId, elementId: shortId, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: longId, entity: entity2})

				const received = db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MAX_ID, 2, true)
				o(received).deepEquals([entity2, entity1])
			})

			o("filters out by id first", function () {
				// this is actually shorter than normal IDs
				const shortId = "----shortId"
				const longId = "---loooongId"
				const entity1 = createEntity(listId, shortId)
				const entity2 = createEntity(listId, longId)
				db.put({type: ContactTypeRef.type, listId, elementId: shortId, entity: entity1})
				db.put({type: ContactTypeRef.type, listId, elementId: longId, entity: entity2})

				const received = db.provideFromRange(ContactTypeRef.type, listId, longId, 2, true)
				o(received).deepEquals([entity1])
			})
		})
	})

	o.spec("delete", function () {
		o("deleting single element works", function () {
			const entity1 = createEntity(listId, id1)
			const entity2 = createEntity(listId, id2)
			db.put({type: ContactTypeRef.type, listId, elementId: id1, entity: entity1})
			db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			db.delete(ContactTypeRef.type, listId, id1)
			const received = db.provideFromRange(ContactTypeRef.type, listId, GENERATED_MIN_ID, 3, false)
			o(received).deepEquals([entity2])
		})
		o("delete all works", function () {
			const entity1 = createElementEntity(id1)
			const entity2 = createEntity(listId, id2)
			db.put({type: ContactTypeRef.type, listId: null, elementId: id1, entity: entity1})
			db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			db.putLastBatchIdForGroup(calendarGroupId, "batchId")
			db.setNewRange(ContactTypeRef.type, listId, id1, id2)
			db.putMetadata("lastUpdateTime", cborg.encode(1234))

			db.purge()
			o(db.get(ContactTypeRef.type, null, id1)).equals(null)("element entities was deleted")
			o(db.get(ContactTypeRef.type, listId, id2)).equals(null)("list entities was deleted")
			o(db.getRange(ContactTypeRef.type, listId)).equals(null)("range was deleted")
			o(db.getLastBatchIdForGroup(calendarGroupId)).equals(null)("last batch id per group was deleted")
			o(db.getMetadata("lastUpdateTime")).equals(null)("metadata was deleted")

		})
		o("delete all then write works", function() {
			const entity1 = createEntity(listId, id1)
			const entity2 = createEntity(listId, id2)

			db.put({type: ContactTypeRef.type, listId: null, elementId: id1, entity: entity1})
			db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			db.putLastBatchIdForGroup(calendarGroupId, "batchId")
			db.setNewRange(ContactTypeRef.type, listId, id1, id2)
			db.putMetadata("lastUpdateTime", cborg.encode(123))

			db.purge()

			db.put({type: ContactTypeRef.type, listId: null, elementId: id1, entity: entity1})
			db.put({type: ContactTypeRef.type, listId, elementId: id2, entity: entity2})
			db.putLastBatchIdForGroup(calendarGroupId, "batchId")
			db.setNewRange(ContactTypeRef.type, listId, id1, id2)
			db.putMetadata("lastUpdateTime", cborg.encode(123))

			o(db.get(ContactTypeRef.type, null, id1)!).deepEquals(entity1)
			o(db.get(ContactTypeRef.type, listId, id2)!).deepEquals(entity2)
			o(db.getLastBatchIdForGroup(calendarGroupId)).equals("batchId")
			o(db.getIdsInRange(ContactTypeRef.type, listId)).deepEquals([id2])
			o(cborg.decode(db.getMetadata("lastUpdateTime")!)).equals(123)
		})
	})


	o.spec("getBatchId", function () {

		o("returns null when nothing is written", function () {
			o(db.getLastBatchIdForGroup("groupId")).equals(null)
		})

		o("returns correct value when written", function () {
			const groupId = "groupId"
			const batchId = "batchId"
			db.putLastBatchIdForGroup(groupId, batchId)
			o(db.getLastBatchIdForGroup(groupId)).equals(batchId)
		})

		o("returns correct value when overwritten", function () {
			const groupId = "groupId"
			const batchId = "batchId"
			const newBatchId = "newBatchId"
			db.putLastBatchIdForGroup(groupId, batchId)
			db.putLastBatchIdForGroup(groupId, newBatchId)
			o(db.getLastBatchIdForGroup(groupId)).equals(newBatchId)
		})
	})
	o.spec("metadata", function() {
		o("get a value that was written should  return the same value", function () {
			const time = 123456789
			db.putMetadata("lastUpdateTime", cborg.encode(time))
			const read = db.getMetadata("lastUpdateTime")
			o(cborg.decode(read!)).equals(time)
		})

		o("get a value that wasn't written should just return null", function() {
			const read = db.getMetadata("lastUpdateTime")
			o(read).equals(null)
		})
	})
	o.spec("Test encryption", function () {
		const time = new Date().getTime()
		const encodedDate = cborg.encode(time)
		o("can create new database", function () {
			//save something
			db.putMetadata("lastUpdateTime", encodedDate)
			o(cborg.decode(db.getMetadata("lastUpdateTime")!)).equals(time)
		})

		o("can open existing database", function () {
			//save something
			db.putMetadata("lastUpdateTime", encodedDate)
			db.close()

			db = new OfflineDb(nativePath)
			db.init(database, offlineDatabaseTestKey)

			o(cborg.decode(db.getMetadata("lastUpdateTime")!)).equals(time)
		})

		o("can't read from existing database if password is wrong", function () {
			//save something
			db.putMetadata("lastUpdateTime", encodedDate)
			db.close()

			db = new OfflineDb(nativePath)
			const theWrongKey = [3957386659, 354339016, 3786337319, 3366334249]

			//with integrity check (performed first)
			o(() => db.init(database, theWrongKey)).throws(Error)

			//without integrity check
			o(() => db.init(database, theWrongKey, false)).throws(Error)
		})
		o("Integrity check works", function () {
			//save something
			db.putMetadata("lastUpdateTime", encodedDate)
			o(() => db.checkIntegrity()).notThrows(Error)

			//flip byte in database
			let fileBuffer = new Uint8Array(fs.readFileSync(database))
			fileBuffer[fileBuffer.length - 1] ^= fileBuffer[fileBuffer.length - 1]
			fs.writeFileSync(database, fileBuffer)

			o(() => db.checkIntegrity()).throws(Error)
		})
		o("Integrity of the database is checked on initialization", function () {
			//save something
			db.putMetadata("lastUpdateTime", encodedDate)
			db.close()


			//flip byte in database
			let fileBuffer = new Uint8Array(fs.readFileSync(database))
			fileBuffer[fileBuffer.length - 1] ^= fileBuffer[fileBuffer.length - 1]
			fs.writeFileSync(database, fileBuffer)

			db = new OfflineDb(nativePath)

			//does not throw if integrity check is turned of
			db.init(database, offlineDatabaseTestKey, false)

			//throws if integrity check is turned on
			o(() => db.init(database, offlineDatabaseTestKey)).throws(CryptoError)
		})
	})
})

function createEntity(listId: string, elementId: string): Buffer {
	return new Buffer(stringToUtf8Uint8Array(listId + elementId))
}

function createElementEntity(elementId: string): Buffer {
	return new Buffer(stringToUtf8Uint8Array(elementId))
}