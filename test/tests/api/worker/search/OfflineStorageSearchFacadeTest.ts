import o from "@tutao/otest"
import { DesktopSqlCipher } from "../../../../../src/common/desktop/db/DesktopSqlCipher"
import { OfflineStoragePersistence, SearchTableDefinitions } from "../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade"
import { OfflineStorageSearchFacade } from "../../../../../src/mail-app/workerUtils/index/OfflineStorageSearchFacade"
import { ContactIndexer } from "../../../../../src/mail-app/workerUtils/index/ContactIndexer"
import { MailIndexer } from "../../../../../src/mail-app/workerUtils/index/MailIndexer"
import { object } from "testdouble"
import { sql } from "../../../../../src/common/api/worker/offline/Sql"
import { assertNotNull, getTypeString, typedValues } from "@tutao/tutanota-utils"
import { getElementId, getListId } from "../../../../../src/common/api/common/utils/EntityUtils"
import { MailWithDetailsAndAttachments } from "../../../../../src/mail-app/workerUtils/index/MailIndexerBackend"
import {
	BodyTypeRef,
	Contact,
	ContactMailAddressTypeRef,
	ContactTypeRef,
	FileTypeRef,
	MailAddressTypeRef,
	MailDetailsTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { createTestEntity } from "../../../TestUtils"
import { CacheStorage } from "../../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { MoreResultsIndexEntry, SearchResult } from "../../../../../src/common/api/worker/search/SearchTypes"

const offlineDatabaseTestKey = new Uint8Array([3957386659, 354339016, 3786337319, 3366334248])

o.spec("OfflineStorageSearchFacade", () => {
	let sqlCipherFacade: SqlCipherFacade
	let persistence: OfflineStoragePersistence
	let cacheStorage: CacheStorage
	let offlineStorageSearchFacade: OfflineStorageSearchFacade
	let contactIndexer: ContactIndexer
	let mailIndexer: MailIndexer
	const userId = "my id"

	o.beforeEach(async () => {
		sqlCipherFacade = new DesktopSqlCipher(":memory:", false)
		await sqlCipherFacade.openDb(userId, offlineDatabaseTestKey)
		cacheStorage = object()
		// Unfortunately, this is pretty tightly coupled with real persistence
		persistence = new OfflineStoragePersistence(sqlCipherFacade)

		// Needs to be done manually since OfflineStorage would have done this
		for (const { definition } of typedValues(SearchTableDefinitions)) {
			await sqlCipherFacade.run(definition, [])
		}

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

		mailIndexer = object()
		contactIndexer = object()

		offlineStorageSearchFacade = new OfflineStorageSearchFacade(sqlCipherFacade, mailIndexer, contactIndexer)
	})

	o.spec("mail search", () => {
		const testMail1: MailWithDetailsAndAttachments = {
			mail: createTestEntity(MailTypeRef, {
				_id: ["I am a list", "z-z-z-z-z-z-z-z-a"],
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
					compressedText: "I am squishy smol text! common",
				}),
				recipients: createTestEntity(RecipientsTypeRef, {
					toRecipients: [],
					ccRecipients: [
						createTestEntity(MailAddressTypeRef, {
							name: "Important Recipient",
							address: "important.recipient@yes.com",
						}),
					],
					bccRecipients: [],
				}),
			}),
			attachments: [createTestEntity(FileTypeRef)],
		}

		const testMail2: MailWithDetailsAndAttachments = {
			mail: createTestEntity(MailTypeRef, {
				_id: ["I am a list", "z-z-z-z-z-z-z-z-b"],
				_ownerGroup: "I am a group",
				subject: "you do not need to worry about this email",
				sender: createTestEntity(MailAddressTypeRef, {
					name: "I am a sender",
					address: "testtesttest@test.test",
				}),
				receivedDate: new Date(1235),
				sets: [
					["mySets", "myFavoriteSet"],
					["mySets", "yourFavoriteSet"],
				],
			}),
			mailDetails: createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef, {
					compressedText: "Here is more body data common",
				}),
				recipients: createTestEntity(RecipientsTypeRef, {
					toRecipients: [
						createTestEntity(MailAddressTypeRef, {
							name: "Important Recipient",
							address: "important.recipient@yes.com",
						}),
					],
					ccRecipients: [],
					bccRecipients: [],
				}),
			}),
			attachments: [createTestEntity(FileTypeRef)],
		}

		const spamMail: MailWithDetailsAndAttachments = {
			mail: createTestEntity(MailTypeRef, {
				_id: ["I am a list", "z-z-z-z-z-z-z-z-c"],
				_ownerGroup: "I am a group",
				subject: "SPAM SPAM SPAM SPAM SPAM",
				sender: createTestEntity(MailAddressTypeRef, {
					name: "Important spam sender",
					address: "important.spammer@spamland.zzz",
				}),
				receivedDate: new Date(1236),
				sets: [["mySets", "spamFolder"]],
			}),
			mailDetails: createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef, {
					compressedText: "SPAAAAAAAAAAAAAAAAAAAAAAM common",
				}),
				recipients: createTestEntity(RecipientsTypeRef, {
					toRecipients: [],
					ccRecipients: [],
					bccRecipients: [],
				}),
			}),
			attachments: [createTestEntity(FileTypeRef)],
		}
		const testMail3: MailWithDetailsAndAttachments = {
			mail: createTestEntity(MailTypeRef, {
				_id: ["I am a list", "z-z-z-z-z-z-z-z-d"],
				_ownerGroup: "I am a group",
				subject: "this email will change your life",
				sender: createTestEntity(MailAddressTypeRef, {
					name: "Me",
					address: "so.many.tests.wow.this.is.amazing@test.test",
				}),
				receivedDate: new Date(1237),
				sets: [["mySets", "myFavoriteSet"]],
			}),
			mailDetails: createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef, {
					compressedText: "WOW! THIS IMPORTANT EMAIL IS AMAZING!",
				}),
				recipients: createTestEntity(RecipientsTypeRef, {
					toRecipients: [],
					ccRecipients: [],
					bccRecipients: [
						createTestEntity(MailAddressTypeRef, {
							name: "Important Recipient",
							address: "important.recipient@yes.com",
						}),
					],
				}),
			}),
			attachments: [
				createTestEntity(FileTypeRef, {
					name: "common.zip",
				}),
			],
		}

		o.test("all folders", async () => {
			await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
			const result = await offlineStorageSearchFacade.search(
				"common",
				{
					type: MailTypeRef,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					folderIds: [],
					eventSeries: null,
				},
				0,
			)
			o.check(result.results).deepEquals([testMail3.mail._id, spamMail.mail._id, testMail2.mail._id, testMail1.mail._id])
		})

		o.test("maxResults is used", async () => {
			await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
			const result = await offlineStorageSearchFacade.search(
				"common",
				{
					type: MailTypeRef,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					folderIds: [],
					eventSeries: null,
				},
				0,
				2,
			)
			o.check(result.results).deepEquals([testMail3.mail._id, spamMail.mail._id])
			o.check(result.moreResultsEntries).deepEquals([testMail2.mail._id, testMail1.mail._id])
		})

		o.test("getMoreSearchResults does not make another request", async () => {
			await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
			const result = {
				results: [testMail3.mail._id, spamMail.mail._id],
				moreResultsEntries: [testMail2.mail._id, testMail1.mail._id],
			} satisfies Partial<SearchResult> as SearchResult

			await offlineStorageSearchFacade.getMoreSearchResults(result, 1)
			o.check(result.results).deepEquals([testMail3.mail._id, spamMail.mail._id, testMail2.mail._id])
			o.check(result.moreResultsEntries).deepEquals([testMail1.mail._id])

			await offlineStorageSearchFacade.getMoreSearchResults(result, 1)
			o.check(result.results).deepEquals([testMail3.mail._id, spamMail.mail._id, testMail2.mail._id, testMail1.mail._id])
			o.check(result.moreResultsEntries).deepEquals([])
		})

		o.spec("matching mails in set", () => {
			o.test("single mail", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const resultSpam = await offlineStorageSearchFacade.search(
					"common",
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: ["spamFolder"],
						eventSeries: null,
					},
					0,
				)
				o.check(resultSpam.results).deepEquals([spamMail.mail._id])
			})
			o.test("multiple mails", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const resultMyFavoriteSet = await offlineStorageSearchFacade.search(
					"common",
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: ["myFavoriteSet"],
						eventSeries: null,
					},
					0,
				)
				o.check(resultMyFavoriteSet.results).deepEquals([testMail3.mail._id, testMail2.mail._id, testMail1.mail._id])
			})
			o.test("secondary set", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const resultYourFavoriteSet = await offlineStorageSearchFacade.search(
					"common",
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: ["yourFavoriteSet"],
						eventSeries: null,
					},
					0,
				)
				o.check(resultYourFavoriteSet.results).deepEquals([testMail2.mail._id])
			})
			o.test("is case sensitive", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])

				const resultMyFavoriteSetUppercase = await offlineStorageSearchFacade.search(
					"common",
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: ["MyFavoriteSet"],
						eventSeries: null,
					},
					0,
				)
				o.check(resultMyFavoriteSetUppercase.results).deepEquals([])
			})
		})

		o.test("body token prefix", async () => {
			await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
			const result = await offlineStorageSearchFacade.search(
				"worr",
				{
					type: MailTypeRef,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					folderIds: [],
					eventSeries: null,
				},
				0,
			)
			o.check(result.results).deepEquals([testMail2.mail._id])
		})

		o.test("sender token prefix", async () => {
			await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
			const result = await offlineStorageSearchFacade.search(
				"spamme",
				{
					type: MailTypeRef,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					folderIds: [],
					eventSeries: null,
				},
				0,
			)
			o.check(result.results).deepEquals([spamMail.mail._id])
		})

		o.spec("date", () => {
			o.test("end only", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const result = await offlineStorageSearchFacade.search(
					"common",
					{
						type: MailTypeRef,
						start: null,
						end: 1235,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(result.results).deepEquals([testMail3.mail._id, spamMail.mail._id, testMail2.mail._id])
			})

			o.test("start only", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const result = await offlineStorageSearchFacade.search(
					"common",
					{
						type: MailTypeRef,
						start: 1235,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(result.results).deepEquals([testMail2.mail._id, testMail1.mail._id])
			})

			o.test("start and end", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const result = await offlineStorageSearchFacade.search(
					"common",
					{
						type: MailTypeRef,
						start: 1235,
						end: 1235,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(result.results).deepEquals([testMail2.mail._id])
			})
		})

		o.spec("search by field", () => {
			o.test("sender", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const result = await offlineStorageSearchFacade.search(
					"important",
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: "from",
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(result.results).deepEquals([spamMail.mail._id])
			})
			o.test("recipient", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const result = await offlineStorageSearchFacade.search(
					"important",
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: "to",
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(result.results).deepEquals([testMail3.mail._id, testMail2.mail._id, testMail1.mail._id])
			})
			o.test("exact match", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])

				const resultFound = await offlineStorageSearchFacade.search(
					`"important spam sender"`,
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultFound.results).deepEquals([spamMail.mail._id])

				const resultNotFound = await offlineStorageSearchFacade.search(
					`"important sender"`,
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultNotFound.results).deepEquals([])

				const resultWithQuotesAndWords = await offlineStorageSearchFacade.search(
					`"THIS IMPORTANT EMAIL" AMAZING`,
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultWithQuotesAndWords.results).deepEquals([testMail3.mail._id])

				const resultWithOpenQuote = await offlineStorageSearchFacade.search(
					`"`,
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultWithOpenQuote.results).deepEquals([])

				const resultWithEmptyQuotes = await offlineStorageSearchFacade.search(
					`""`,
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultWithEmptyQuotes.results).deepEquals([])
			})
			o.test("when looking for Japanese text it will find any kanji", async () => {
				const testMail1: MailWithDetailsAndAttachments = {
					mail: createTestEntity(MailTypeRef, {
						_id: ["I am a list", "z-z-z-z-z-z-z-z-a"],
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
							compressedText: "を中心に発生した",
						}),
						recipients: createTestEntity(RecipientsTypeRef, {
							toRecipients: [],
							ccRecipients: [
								createTestEntity(MailAddressTypeRef, {
									name: "Important Recipient",
									address: "important.recipient@yes.com",
								}),
							],
							bccRecipients: [],
						}),
					}),
					attachments: [createTestEntity(FileTypeRef)],
				}
				await storeAndIndexMail([testMail1])

				const result = await offlineStorageSearchFacade.search(
					`発`,
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(result.results).deepEquals([testMail1.mail._id])
			})
			o.test("subject", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const result = await offlineStorageSearchFacade.search(
					"important",
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: "subject",
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(result.results).deepEquals([testMail1.mail._id])
			})
			o.test("body", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const result = await offlineStorageSearchFacade.search(
					"important",
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: "body",
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(result.results).deepEquals([testMail3.mail._id])
			})
			o.test("attachment", async () => {
				await storeAndIndexMail([testMail1, testMail2, testMail3, spamMail])
				const result = await offlineStorageSearchFacade.search(
					"common",
					{
						type: MailTypeRef,
						start: null,
						end: null,
						field: "attachment",
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(result.results).deepEquals([testMail3.mail._id])
			})
		})

		async function storeAndIndexMail(mails: MailWithDetailsAndAttachments[]) {
			for (const mailData of mails) {
				let listEntitiesQuery = sql`
                    INSERT INTO list_entities
                    VALUES (${getTypeString(mailData.mail._type)}, ${getListId(mailData.mail)},
                            ${getElementId(mailData.mail)},
                            ${assertNotNull(mailData.mail._ownerGroup)})
                `
				await sqlCipherFacade.run(listEntitiesQuery.query, listEntitiesQuery.params)
			}
			await persistence.storeMailData(mails)
		}
	})

	o.spec("contact search", () => {
		const alice = createTestEntity(ContactTypeRef, {
			_id: ["wow a list", "alice"],
			_ownerGroup: "AAAAAA",
			firstName: "Alice",
			lastName: "Robinson",
			mailAddresses: [
				createTestEntity(ContactMailAddressTypeRef, {
					address: "alice@tutanota.com",
				}),
				createTestEntity(ContactMailAddressTypeRef, {
					address: "alicepremium@tuta.io",
				}),
			],
		})
		const bob = createTestEntity(ContactTypeRef, {
			_id: ["wow a list", "bob"],
			_ownerGroup: "AAAAAA",
			firstName: "Bob",
			lastName: "Smith",
			mailAddresses: [
				createTestEntity(ContactMailAddressTypeRef, {
					address: "bob@tutanota.com",
				}),
				createTestEntity(ContactMailAddressTypeRef, {
					address: "bobpremium@tuta.io",
				}),
			],
		})
		const carter = createTestEntity(ContactTypeRef, {
			_id: ["wow a list", "carter"],
			_ownerGroup: "AAAAAA",
			firstName: "Carter",
			lastName: "Robinson",
			mailAddresses: [
				createTestEntity(ContactMailAddressTypeRef, {
					address: "carter@nottutanota.com", // :(
				}),
			],
		})
		const drStrange = createTestEntity(ContactTypeRef, {
			_id: ["wow a list", "strange"],
			_ownerGroup: "AAAAAA",
			firstName: "Stephen Vincent",
			lastName: "Strange",
			mailAddresses: [
				createTestEntity(ContactMailAddressTypeRef, {
					address: "dr.strange@alsonottutanota.com", // :(
				}),
			],
		})

		o.test("search by mail address with mailAddress field", async () => {
			await storeAndIndexContact([drStrange])

			const anyFieldRestriction = {
				type: ContactTypeRef,
				start: null,
				end: null,
				field: null,
				attributeIds: null,
				folderIds: [],
				eventSeries: null,
			}

			const mailAddressRestriction = {
				type: ContactTypeRef,
				start: null,
				end: null,
				field: "mailAddresses",
				attributeIds: null,
				folderIds: [],
				eventSeries: null,
			}

			// This, without a field, finds Dr. Strange
			const stephenVincentNoField = await offlineStorageSearchFacade.search("stephen vincent strange", anyFieldRestriction, 0)
			o.check(stephenVincentNoField.results).deepEquals([drStrange._id])

			// But if we search by just mail address, now it won't be found!
			const stephenVincentMailAddressOnly = await offlineStorageSearchFacade.search("stephen vincent strange", mailAddressRestriction, 0)
			o.check(stephenVincentMailAddressOnly.results).deepEquals([])

			// So, we need to search for "dr.strange" as that is actually in the email address
			const drStrangeMailAddressOnly = await offlineStorageSearchFacade.search("dr.strange", mailAddressRestriction, 0)
			o.check(drStrangeMailAddressOnly.results).deepEquals([drStrange._id])
		})

		o.test("search by mail address domain", async () => {
			await storeAndIndexContact([alice, bob, carter])
			const result = await offlineStorageSearchFacade.search(
				"tutanota",
				{
					type: ContactTypeRef,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					folderIds: [],
					eventSeries: null,
				},
				0,
			)
			o.check(result.results).deepEquals([alice._id, bob._id])
		})

		o.test("search by mail address local part", async () => {
			await storeAndIndexContact([alice, bob, carter])
			const result = await offlineStorageSearchFacade.search(
				"bobpremium",
				{
					type: ContactTypeRef,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					folderIds: [],
					eventSeries: null,
				},
				0,
			)
			o.check(result.results).deepEquals([bob._id])
		})

		o.test("search by first name", async () => {
			await storeAndIndexContact([alice, bob, carter])
			const result = await offlineStorageSearchFacade.search(
				"alice",
				{
					type: ContactTypeRef,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					folderIds: [],
					eventSeries: null,
				},
				0,
			)
			o.check(result.results).deepEquals([alice._id])
		})

		o.test("search by last name", async () => {
			await storeAndIndexContact([alice, bob, carter])
			const result = await offlineStorageSearchFacade.search(
				"robinson",
				{
					type: ContactTypeRef,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					folderIds: [],
					eventSeries: null,
				},
				0,
			)
			o.check(result.results).deepEquals([alice._id, carter._id])
		})

		o.test("sorts by name with first name taking precedence", async () => {
			const noLastName = createTestEntity(ContactTypeRef, {
				_id: ["wow a list", "noLastName"],
				_ownerGroup: "AAAAAA",
				firstName: "NoLastName",
				lastName: "",
				mailAddresses: [
					createTestEntity(ContactMailAddressTypeRef, {
						address: "nolastname@nottutanota.com", // :(
					}),
				],
			})
			const noFirstName = createTestEntity(ContactTypeRef, {
				_id: ["wow a list", "noFirstName"],
				_ownerGroup: "AAAAAA",
				firstName: "",
				lastName: "noFirstName",
				mailAddresses: [
					createTestEntity(ContactMailAddressTypeRef, {
						address: "nofirstname@nottutanota.com", // :(
					}),
				],
			})

			await storeAndIndexContact([alice, bob, carter, noFirstName, noLastName])
			const result = await offlineStorageSearchFacade.search(
				"com",
				{
					type: ContactTypeRef,
					start: null,
					end: null,
					field: null,
					attributeIds: null,
					folderIds: [],
					eventSeries: null,
				},
				0,
			)
			o.check(result.results).deepEquals([noFirstName._id, alice._id, bob._id, carter._id, noLastName._id])
		})
		o.spec("exact match", () => {
			o.test("empty quotes", async () => {
				const resultWithOpenQuote = await offlineStorageSearchFacade.search(
					`"`,
					{
						type: ContactTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultWithOpenQuote.results).deepEquals([])

				const resultWithEmptyQuotes = await offlineStorageSearchFacade.search(
					`""`,
					{
						type: ContactTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultWithEmptyQuotes.results).deepEquals([])
			})
			o.test("name", async () => {
				await storeAndIndexContact([alice, bob, carter, drStrange])

				const resultFound = await offlineStorageSearchFacade.search(
					`"stephen vincent"`,
					{
						type: ContactTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultFound.results).deepEquals([drStrange._id])

				const resultNotFound = await offlineStorageSearchFacade.search(
					`"stephen strange"`,
					{
						type: ContactTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultNotFound.results).deepEquals([])

				const resultWithQuotesAndWords = await offlineStorageSearchFacade.search(
					`"stephen vincent" strange`,
					{
						type: ContactTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultWithQuotesAndWords.results).deepEquals([drStrange._id])
			})
			o.test("email", async () => {
				await storeAndIndexContact([alice, bob, carter, drStrange])

				const resultFound = await offlineStorageSearchFacade.search(
					`"dr.strange@alsonottutanota.com"`,
					{
						type: ContactTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultFound.results).deepEquals([drStrange._id])

				const resultNotFound = await offlineStorageSearchFacade.search(
					`"dr.strange@alsonottutanota.co"`,
					{
						type: ContactTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultNotFound.results).deepEquals([])

				const resultWithQuotesAndWords = await offlineStorageSearchFacade.search(
					`"dr.strange" "alsonottutanota.com"`,
					{
						type: ContactTypeRef,
						start: null,
						end: null,
						field: null,
						attributeIds: null,
						folderIds: [],
						eventSeries: null,
					},
					0,
				)
				o.check(resultWithQuotesAndWords.results).deepEquals([drStrange._id])
			})
		})

		async function storeAndIndexContact(contacts: Contact[]) {
			for (const contactData of contacts) {
				let listEntitiesQuery = sql`
                    INSERT INTO list_entities
                    VALUES (${getTypeString(contactData._type)}, ${getListId(contactData)},
                            ${getElementId(contactData)},
                            ${assertNotNull(contactData._ownerGroup)})
                `
				await sqlCipherFacade.run(listEntitiesQuery.query, listEntitiesQuery.params)
			}
			await persistence.storeContactData(contacts)
		}
	})

	o.spec("tokenize", () => {
		o.test("empty string returns empty query", async () => {
			o.check(await offlineStorageSearchFacade.tokenize("")).deepEquals([])
		})
		o.test("empty quotes are excluded", async () => {
			o.check(await offlineStorageSearchFacade.tokenize('""')).deepEquals([])
			o.check(await offlineStorageSearchFacade.tokenize('"hello" "" "world"')).deepEquals([
				{ token: "hello", exact: true },
				{ token: "world", exact: true },
			])
		})
		o.test("mixed exact and partial", async () => {
			o.check(await offlineStorageSearchFacade.tokenize('unquoted "quoted" unquoted again "quoted again"')).deepEquals([
				{ token: "unquoted", exact: false },
				{ token: "quoted", exact: true },
				{ token: "unquoted", exact: false },
				{ token: "again", exact: false },
				{ token: "quoted again", exact: true },
			])
		})
		o.test("extra characters are tokenized without being normalized", async () => {
			o.check(await offlineStorageSearchFacade.tokenize("Das Franzbrötchen ist lecker!")).deepEquals([
				{ token: "Das", exact: false },
				{ token: "Franzbrötchen", exact: false },
				{ token: "ist", exact: false },
				{ token: "lecker", exact: false },
			])
			o.check(await offlineStorageSearchFacade.tokenize("오래 살면서 감자튀김 먹기")).deepEquals([
				{ token: "오래", exact: false },
				{ token: "살면서", exact: false },
				{ token: "감자튀김", exact: false },
				{ token: "먹기", exact: false },
			])
			o.check(await offlineStorageSearchFacade.tokenize("le premier jour de l’année")).deepEquals([
				{ token: "le", exact: false },
				{ token: "premier", exact: false },
				{ token: "jour", exact: false },
				{ token: "de", exact: false },
				{ token: "l", exact: false },
				{ token: "année", exact: false },
			])
			o.check(await offlineStorageSearchFacade.tokenize("le premier jour de l'année")).deepEquals([
				{ token: "le", exact: false },
				{ token: "premier", exact: false },
				{ token: "jour", exact: false },
				{ token: "de", exact: false },
				{ token: "l", exact: false },
				{ token: "année", exact: false },
			])
		})
	})

	o.spec("normalizeQuery", () => {
		o.test("empty query returns empty string", async () => {
			o.check(offlineStorageSearchFacade.normalizeQuery([])).equals("")
		})
		o.test("mixed exact and partial", async () => {
			o.check(
				offlineStorageSearchFacade.normalizeQuery([
					{ token: "partial", exact: false },
					{ token: "exact", exact: true },
					{ token: "partial", exact: false },
					{ token: "again", exact: false },
					{ token: "exact again", exact: true },
				]),
			).equals('"partial"* "exact" "partial"* "again"* "exact again"')
		})
	})
})
