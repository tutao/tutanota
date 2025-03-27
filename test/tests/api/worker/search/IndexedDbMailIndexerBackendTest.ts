import o from "@tutao/otest"
import { createTestEntity } from "../../../TestUtils"
import {
	BodyTypeRef,
	FileTypeRef,
	MailAddressTypeRef,
	MailDetailsTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { IndexerCore } from "../../../../../src/mail-app/workerUtils/index/IndexerCore"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions"
import {
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
} from "../../../../../src/common/api/common/utils/EntityUtils"
import { IndexedDbMailIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/IndexedDbMailIndexerBackend"
import { DbFacade, IndexedDbTransaction } from "../../../../../src/common/api/worker/search/DbFacade"
import { matchers, object, verify, when } from "testdouble"
import { AttributeHandler } from "../../../../../src/common/api/worker/search/SearchTypes"
import { Metadata, MetaDataOS } from "../../../../../src/common/api/worker/search/IndexTables"

o.spec("IndexedDbMailIndexerBackend", function () {
	let dbFacade: DbFacade
	let core: IndexerCore
	const userId = "userId1"
	let backend: IndexedDbMailIndexerBackend
	o.beforeEach(() => {
		dbFacade = object()
		core = object()
		backend = new IndexedDbMailIndexerBackend(dbFacade, core, userId)
	})

	o.spec("enableMailIndexing", function () {
		o.test("when wasn't enabled it enables it", async function () {
			const readTransaction = object<IndexedDbTransaction>()
			when(dbFacade.createTransaction(true, [MetaDataOS])).thenResolve(readTransaction)
			when(readTransaction.get(MetaDataOS, Metadata.mailIndexingEnabled)).thenResolve(false)

			const writeTransaction = object<IndexedDbTransaction>()
			when(dbFacade.createTransaction(false, [MetaDataOS])).thenResolve(writeTransaction)

			// // There was a timezone shift in Germany in this time range
			// const now = 1554720827674 // 2019-04-08T10:53:47.674Z

			// const beforeNowInterval = 1552262400000 // 2019-03-11T00:00:00.000Z
			//
			// const dateProvider = new FixedDateProvider(now)
			await backend.enableIndexing()
			verify(writeTransaction.put(MetaDataOS, Metadata.mailIndexingEnabled, true))
		})
	})

	// FIXME: isMailIndexingEnabled()
	// o.test("when was enabled it does nothing", async function () {
	// 	const readTransaction = object<IndexedDbTransaction>()
	// 	when(dbFacade.createTransaction(true, [MetaDataOS])).thenResolve(readTransaction)
	// 	when(readTransaction.get(MetaDataOS, Metadata.mailIndexingEnabled)).thenResolve(false)
	//
	// 	const wasEnabled = await backend.enableIndexing()
	// 	o.check(wasEnabled).equals(true)
	// 	verify(dbFacade.createTransaction(matchers.anything(), matchers.anything()), { times: 1 })
	// })

	o.spec("createMailIndexEntries", function () {
		o.test("createMailIndexEntries without entries", function () {
			let mail = createTestEntity(MailTypeRef)
			let mailDetails = createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef),
				recipients: createTestEntity(RecipientsTypeRef),
			})
			let files = [createTestEntity(FileTypeRef)]

			const keyToIndexEntries = backend.createMailIndexEntries(mail, mailDetails, files)
			o.check(keyToIndexEntries.size).equals(0)
		})

		o.test("createMailIndexEntries with one entry", function () {
			let mail = createTestEntity(MailTypeRef)
			mail.subject = "Hello"
			let mailDetails = createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef),
				recipients: createTestEntity(RecipientsTypeRef),
			})
			let files = [createTestEntity(FileTypeRef)]
			const keyToIndexEntries = backend.createMailIndexEntries(mail, mailDetails, files)
			o(keyToIndexEntries.size).equals(1)
		})

		o.test("createMailIndexEntries", async function () {
			const toRecipients = [
				createTestEntity(MailAddressTypeRef, {
					address: "tr0A",
					name: "tr0N",
				}),
				createTestEntity(MailAddressTypeRef, {
					address: "tr1A",
					name: "tr1N",
				}),
			]
			const ccRecipients = [
				createTestEntity(MailAddressTypeRef, {
					address: "ccr0A",
					name: "ccr0N",
				}),
				createTestEntity(MailAddressTypeRef, {
					address: "ccr1A",
					name: "ccr1N",
				}),
			]
			const bccRecipients = [
				createTestEntity(MailAddressTypeRef, {
					address: "bccr0A",
					name: "bccr0N",
				}),
				createTestEntity(MailAddressTypeRef, {
					address: "bccr1A",
					name: "bccr1N",
				}),
			]
			const replyTo = createTestEntity(MailAddressTypeRef, {
				address: "rToA",
				name: "rToN",
			})
			const sender = createTestEntity(MailAddressTypeRef, {
				address: "SA",
				name: "SN",
			})

			const mail = createTestEntity(MailTypeRef, {
				differentEnvelopeSender: "ES", // not indexed
				subject: "Se",
				sender,
				mailDetails: ["details-list-id", "details-id"],
			})
			const recipients = createTestEntity(RecipientsTypeRef, {
				bccRecipients,
				ccRecipients,
				toRecipients,
			})
			const mailDetails = createTestEntity(MailDetailsTypeRef, {
				_id: "details-id",
				body: createTestEntity(BodyTypeRef, { text: "BT" }),
				recipients,
				replyTos: [replyTo],
			})
			const files = [
				createTestEntity(FileTypeRef, {
					mimeType: "binary", // not indexed
					name: "FN",
				}),
			]

			backend.createMailIndexEntries(mail, mailDetails, files)
			const captor = matchers.captor()
			verify(core.createIndexEntriesForAttributes(mail, captor.capture()))
			const attrHandlers: AttributeHandler[] = captor.value
			const resolvedAttrs = attrHandlers.map(({ id, value }) => ({ id, value: value() }))
			const MailModel = await resolveTypeReference(MailTypeRef)
			o.check(resolvedAttrs).deepEquals([
				{
					id: MailModel.values["subject"].id,
					value: "Su",
				},
				{
					id: LEGACY_TO_RECIPIENTS_ID,
					value: "tr0N <tr0A>,tr1N <tr1A>",
				},
				{
					id: LEGACY_CC_RECIPIENTS_ID,
					value: "ccr0N <ccr0A>,ccr1N <ccr1A>",
				},
				{
					id: LEGACY_BCC_RECIPIENTS_ID,
					value: "bccr0N <bccr0A>,bccr1N <bccr1A>",
				},
				{
					id: MailModel.associations["sender"].id,
					value: "SN <SA>",
				},
				{
					id: LEGACY_BODY_ID,
					value: "BT",
				},
				{
					id: MailModel.associations["attachments"].id,
					value: "FN",
				},
			])
		})
	})
})
