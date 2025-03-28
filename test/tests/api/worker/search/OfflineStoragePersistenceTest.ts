import o from "@tutao/otest"
import { IndexedGroupData, OfflineStoragePersistence } from "../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { DesktopSqlCipher } from "../../../../../src/common/desktop/db/DesktopSqlCipher"
import { assertNotNull, getTypeId } from "@tutao/tutanota-utils"
import { untagSqlObject, untagSqlValue } from "../../../../../src/common/api/worker/offline/SqlValue"
import { GroupType } from "../../../../../src/common/api/common/TutanotaConstants"
import { sql } from "../../../../../src/common/api/worker/offline/Sql"
import { getElementId, getListId } from "../../../../../src/common/api/common/utils/EntityUtils"
import { createTestEntity } from "../../../TestUtils"
import {
	BodyTypeRef,
	FileTypeRef,
	MailAddressTypeRef,
	MailDetailsTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { MailWithDetailsAndAttachments } from "../../../../../src/mail-app/workerUtils/index/MailIndexerBackend"
import { ListElementEntity } from "../../../../../src/common/api/common/EntityTypes"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions"
import { ensureBase64Ext } from "../../../../../src/common/api/worker/offline/OfflineStorage"

const offlineDatabaseTestKey = new Uint8Array([3957386659, 354339016, 3786337319, 3366334248])

o.spec("OfflineStoragePersistence test", () => {
	let persistence: OfflineStoragePersistence
	let sqlCipherFacade: SqlCipherFacade
	const userId = "my user id"

	o.beforeEach(async () => {
		sqlCipherFacade = new DesktopSqlCipher(__NODE_GYP_better_sqlite3, ":memory:", false)
		persistence = new OfflineStoragePersistence(sqlCipherFacade)
		await sqlCipherFacade.openDb(userId, offlineDatabaseTestKey)
		await persistence.init()

		// everything except entity data
		await sqlCipherFacade.run(
			`CREATE TABLE list_entities
             (
                 type       TEXT NOT NULL,
                 listId     TEXT NOT NULL,
                 elementId  TEXT NOT NULL,
                 ownerGroup TEXT,
                 PRIMARY KEY (type, listId, elementId)
             )
            `,
			[],
		)
	})

	o.spec("isMailIndexingEnabled", () => {
		o.test("on fresh db", async () => {
			o.check(await persistence.isMailIndexingEnabled()).equals(false)
		})
		o.test("when mail indexing was enabled", async () => {
			const query = `INSERT INTO search_metadata
                           VALUES ('${OfflineStoragePersistence.MAIL_INDEXING_ENABLED}', 1)`
			await sqlCipherFacade.run(query, [])
			o.check(await persistence.isMailIndexingEnabled()).equals(true)
		})
		o.test("when mail indexing was disabled", async () => {
			const query = `INSERT INTO search_metadata
                           VALUES ('${OfflineStoragePersistence.MAIL_INDEXING_ENABLED}', 0)`
			await sqlCipherFacade.run(query, [])
			o.check(await persistence.isMailIndexingEnabled()).equals(false)
		})
	})

	o.spec("areContactsIndexed", () => {
		o.test("on fresh db", async () => {
			o.check(await persistence.areContactsIndexed()).equals(false)
		})
		o.test("when contacts were indexed", async () => {
			const query = `INSERT INTO search_metadata
                           VALUES ('${OfflineStoragePersistence.CONTACTS_INDEXED}', 1)`
			await sqlCipherFacade.run(query, [])
			o.check(await persistence.areContactsIndexed()).equals(true)
		})
		o.test("when contacts were somehow unindexed", async () => {
			const query = `INSERT INTO search_metadata
                           VALUES ('${OfflineStoragePersistence.CONTACTS_INDEXED}', 0)`
			await sqlCipherFacade.run(query, [])
			o.check(await persistence.areContactsIndexed()).equals(false)
		})
	})

	o.spec("setMailIndexingEnabled", () => {
		o.test("enable indexing", async () => {
			await persistence.setMailIndexingEnabled(true)
			const query = `SELECT value
                           FROM search_metadata
                           WHERE key ='${OfflineStoragePersistence.MAIL_INDEXING_ENABLED}'`
			const record = untagSqlValue(assertNotNull(await sqlCipherFacade.get(query, [])).value)
			o.check(record).equals(1)
		})
		o.test("disable indexing", async () => {
			await persistence.setMailIndexingEnabled(false)
			const query = `SELECT value
                           FROM search_metadata
                           WHERE key ='${OfflineStoragePersistence.MAIL_INDEXING_ENABLED}'`
			const record = untagSqlValue(assertNotNull(await sqlCipherFacade.get(query, [])).value)
			o.check(record).equals(0)
		})
	})

	o.test("getIndexedGroups", async () => {
		const { mailGroupData, contactGroupData } = await prepareIndexedGroups(sqlCipherFacade)
		o.check(await persistence.getIndexedGroups()).deepEquals([mailGroupData, contactGroupData])
	})

	o.test("addIndexedGroup", async () => {
		const mailGroupData: IndexedGroupData = {
			groupId: "mailGroup",
			type: GroupType.Mail,
			indexedTimestamp: 123456,
		}
		const contactGroupData: IndexedGroupData = {
			groupId: "contactGroup",
			type: GroupType.Contact,
			indexedTimestamp: 123456,
		}
		await persistence.addIndexedGroup(mailGroupData.groupId, mailGroupData.type, mailGroupData.indexedTimestamp)
		await persistence.addIndexedGroup(contactGroupData.groupId, contactGroupData.type, contactGroupData.indexedTimestamp)

		const indexedGroups = await getAllIndexedGroups(sqlCipherFacade)
		o.check(indexedGroups).deepEquals([mailGroupData, contactGroupData])
	})

	o.test("updateIndexingTimestamp", async () => {
		const { mailGroupData, contactGroupData } = await prepareIndexedGroups(sqlCipherFacade)
		await persistence.updateIndexingTimestamp(mailGroupData.groupId, 9999)

		const indexedGroups = await getAllIndexedGroups(sqlCipherFacade)
		o.check(indexedGroups).deepEquals([{ ...mailGroupData, indexedTimestamp: 9999 }, contactGroupData])
	})

	o.test("removeIndexedGroup", async () => {
		const { mailGroupData, contactGroupData } = await prepareIndexedGroups(sqlCipherFacade)
		await persistence.removeIndexedGroup(contactGroupData.groupId)

		const indexedGroups = await getAllIndexedGroups(sqlCipherFacade)
		o.check(indexedGroups).deepEquals([mailGroupData])
	})

	o.test("storeMailData", async () => {
		const data = {
			mail: createTestEntity(MailTypeRef, {
				_id: ["I am a list", "z-z-z-z-z-z-z-z-z"],
				_ownerGroup: "I am a group",
				subject: "very very very important email",
				sender: createTestEntity(MailAddressTypeRef, {
					name: "I am a sender",
					address: "testtesttest@test.test",
				}),
				receivedDate: new Date(1234),
				sets: [["mySets", "myFavoriteSet"]],
			}),
			mailDetails: createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef, {
					compressedText: "I am squishy smol text!",
				}),
				recipients: createTestEntity(RecipientsTypeRef, {
					toRecipients: [],
					ccRecipients: [],
					bccRecipients: [],
				}),
			}),
			attachments: [createTestEntity(FileTypeRef)],
		}
		await fakeStoreMailDataInOfflineDb(sqlCipherFacade, data)
		await persistence.storeMailData([data])

		const content = untagSqlObject(
			assertNotNull(
				await sqlCipherFacade.get(
					`SELECT rowid, receivedDate, sets
                     FROM content_mail_index`,
					[],
				),
			),
		)
		o.check(content.rowid).equals(1)
		o.check(content.receivedDate).equals(1234)
		o.check(content.sets).equals("mySets/myFavoriteSet")

		const assertFound = async (what: string) => {
			const { query, params } = sql`SELECT rowid
                                        from mail_index
                                        where mail_index = ${what}`
			const search = untagSqlObject(assertNotNull(await sqlCipherFacade.get(query, params)))
			o.check(search.rowid).equals(1)
		}

		const assertNotFound = async (what: string) => {
			const { query, params } = sql`SELECT rowid
                                        from mail_index
                                        where mail_index = ${what}`
			o.check(await sqlCipherFacade.get(query, params)).equals(null)
		}

		await assertFound("i am smol squishy text")
		await assertFound("very important email")
		await assertFound("very squishy email")
		await assertFound("sender i am")

		await assertNotFound("i am not smol squishy text")
		await assertNotFound('"sender i am"')
		await assertNotFound("very squishyy email")
	})

	o.test("deleteMailData", async () => {
		const data = {
			mail: createTestEntity(MailTypeRef, {
				_id: ["I am a list", "z-z-z-z-z-z-z-z-z"],
				_ownerGroup: "I am a group",
				subject: "very very very important email",
				sender: createTestEntity(MailAddressTypeRef, {
					name: "I am a sender",
					address: "testtesttest@test.test",
				}),
				receivedDate: new Date(1234),
				sets: [["mySets", "myFavoriteSet"]],
			}),
			mailDetails: createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef, {
					compressedText: "I am squishy smol text!",
				}),
				recipients: createTestEntity(RecipientsTypeRef, {
					toRecipients: [],
					ccRecipients: [],
					bccRecipients: [],
				}),
			}),
			attachments: [],
		}
		await fakeStoreMailDataInOfflineDb(sqlCipherFacade, data)

		const mailIndexInsert = sql`INSERT INTO mail_index(rowid, subject, body)
                                    VALUES (${1},
                                            ${data.mail.subject},
                                            ${data.mailDetails.body.compressedText})`
		await sqlCipherFacade.run(mailIndexInsert.query, mailIndexInsert.params)

		const contentIndexInsert = sql`INSERT INTO content_mail_index(rowid, receivedDate, sets)
                                       VALUES (${1},
                                               ${data.mail.receivedDate.getTime()},
                                               ${data.mail.sets[0].join("/")})`
		await sqlCipherFacade.run(contentIndexInsert.query, contentIndexInsert.params)

		const contentTableSearch = `SELECT rowid
                                    FROM content_mail_index`
		const indexSearch = `SELECT rowid
                             FROM mail_index
                             WHERE mail_index = 'i am squishy'`

		o.check(await sqlCipherFacade.get(indexSearch, [])).notEquals(null)
		o.check(await sqlCipherFacade.get(contentTableSearch, [])).notEquals(null)
		await persistence.deleteMailData(data.mail._id)
		o.check(await sqlCipherFacade.get(indexSearch, [])).equals(null)
		o.check(await sqlCipherFacade.get(contentTableSearch, [])).equals(null)
	})
})

async function fakeStoreMailDataInOfflineDb(sqlCipherFacade: SqlCipherFacade, mailData: MailWithDetailsAndAttachments) {
	const { query, params } = sql`INSERT INTO list_entities
                                VALUES (${getTypeId(mailData.mail._type)}, ${getListId(mailData.mail)},
                                        ${await getElementIdB64ExtEnsured(mailData.mail)},
                                        ${assertNotNull(mailData.mail._ownerGroup)})`
	await sqlCipherFacade.run(query, params)
}

async function getElementIdB64ExtEnsured(l: ListElementEntity) {
	const typeModel = await resolveTypeReference(l._type)
	return ensureBase64Ext(typeModel, getElementId(l))
}

async function prepareIndexedGroups(sqlCipherFacade: SqlCipherFacade) {
	const mailGroupData: IndexedGroupData = {
		groupId: "mailGroup",
		type: GroupType.Mail,
		indexedTimestamp: 123456,
	}
	const contactGroupData: IndexedGroupData = {
		groupId: "contactGroup",
		type: GroupType.Contact,
		indexedTimestamp: 123456,
	}
	const query = `INSERT INTO search_group_data
                   VALUES ('${mailGroupData.groupId}', ${mailGroupData.type},
                           ${mailGroupData.indexedTimestamp}),
                          ('${contactGroupData.groupId}', ${contactGroupData.type},
                           ${contactGroupData.indexedTimestamp})`
	await sqlCipherFacade.run(query, [])
	return { mailGroupData, contactGroupData }
}

async function getAllIndexedGroups(sqlCipherFacade: SqlCipherFacade) {
	const query = `SELECT groupId, CAST(groupType as TEXT) as type, indexedTimestamp
                   FROM search_group_data`
	const rows = await sqlCipherFacade.all(query, [])
	return rows.map(untagSqlObject).map((row) => row as unknown as IndexedGroupData)
}
