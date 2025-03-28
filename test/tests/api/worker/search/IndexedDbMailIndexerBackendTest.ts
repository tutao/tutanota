import o from "@tutao/otest"
import { createTestEntity } from "../../../TestUtils"
import {
	BodyTypeRef,
	FileTypeRef,
	Mail,
	MailAddressTypeRef,
	MailDetails,
	MailDetailsTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
	File as TutanotaFile,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs"
import { IndexerCore } from "../../../../../src/mail-app/workerUtils/index/IndexerCore"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions"
import {
	getElementId,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
} from "../../../../../src/common/api/common/utils/EntityUtils"
import { IndexedDbMailIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/IndexedDbMailIndexerBackend"
import { matchers, object, verify, when } from "testdouble"
import { AttributeHandler, SearchIndexEntry } from "../../../../../src/common/api/worker/search/SearchTypes"
import { Metadata } from "../../../../../src/common/api/worker/search/IndexTables"
import { _createNewIndexUpdate, typeRefToTypeInfo } from "../../../../../src/common/api/worker/search/IndexUtils"
import { assertNotNull } from "@tutao/tutanota-utils"

o.spec("IndexedDbMailIndexerBackend", function () {
	let core: IndexerCore
	const userId = "userId1"
	let backend: IndexedDbMailIndexerBackend
	o.beforeEach(() => {
		core = object()
		backend = new IndexedDbMailIndexerBackend(core, userId)
	})

	o.test("enableMailIndexing", async function () {
		await backend.enableIndexing()
		verify(core.storeMetadata(Metadata.mailIndexingEnabled, true))
	})

	o.spec("isMailIndexingEnabled", function () {
		o.test("enabled", async function () {
			when(core.getMetadata(Metadata.mailIndexingEnabled)).thenResolve(true)
			o.check(await backend.isMailIndexingEnabled()).equals(true)
		})

		o.test("disabled", async function () {
			when(core.getMetadata(Metadata.mailIndexingEnabled)).thenResolve(false)
			o.check(await backend.isMailIndexingEnabled()).equals(false)
		})
	})

	o.spec("createMailIndexEntries", function () {
		o.test("without entries", function () {
			let mail = createTestEntity(MailTypeRef)
			let mailDetails = createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef),
				recipients: createTestEntity(RecipientsTypeRef),
			})
			let files = [createTestEntity(FileTypeRef)]
			when(core.createIndexEntriesForAttributes(mail, matchers.anything())).thenReturn(new Map())

			const keyToIndexEntries = backend.createMailIndexEntries(mail, mailDetails, files)
			o.check(keyToIndexEntries.size).equals(0)
		})

		o.test("with one entry", function () {
			let mail = createTestEntity(MailTypeRef)
			let mailDetails = createTestEntity(MailDetailsTypeRef, {
				body: createTestEntity(BodyTypeRef),
				recipients: createTestEntity(RecipientsTypeRef),
			})
			let files = [createTestEntity(FileTypeRef)]
			const returnedEntries: Map<string, SearchIndexEntry[]> = new Map([
				[
					"token",
					[
						{
							id: "1",
							attribute: 2,
							positions: [4, 5, 6],
						},
					],
				],
			])
			when(core.createIndexEntriesForAttributes(mail, matchers.anything())).thenReturn(returnedEntries)
			const keyToIndexEntries = backend.createMailIndexEntries(mail, mailDetails, files)
			o.check(keyToIndexEntries).deepEquals(returnedEntries)
		})

		o.test("contents", async function () {
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
				subject: "Su",
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

	o.spec("entityUpdates", function () {
		const ownerGroup = "mailGroup"
		let mail: Mail
		let mailDetails: MailDetails
		let attachments: [TutanotaFile]
		let indexEntries: Map<string, SearchIndexEntry[]>

		o.beforeEach(function () {
			mail = createTestEntity(MailTypeRef, {
				_id: ["mailLidId", "mailElementId"],
				_ownerGroup: ownerGroup,
			})
			mailDetails = createTestEntity(MailDetailsTypeRef)
			attachments = [createTestEntity(FileTypeRef)]
			indexEntries = new Map([
				[
					"token",
					[
						{
							id: "1",
							attribute: 2,
							positions: [4, 5, 6],
						},
					],
				],
			])
		})

		o.test("onMailCreated", async function () {
			when(core.createIndexEntriesForAttributes(mail, matchers.anything())).thenReturn(indexEntries)

			await backend.onMailCreated({ mail, mailDetails, attachments })

			const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
			verify(core.encryptSearchIndexEntries(mail._id, ownerGroup, indexEntries, indexUpdate))
			verify(core.writeIndexUpdate(indexUpdate))
		})

		o.test("onMailUpdated", async function () {
			const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
			when(core.createIndexEntriesForAttributes(mail, matchers.anything())).thenReturn(indexEntries)

			await backend.onMailUpdated({ mail, mailDetails, attachments })

			verify(core._processDeleted(MailTypeRef, getElementId(mail), indexUpdate))
			verify(core.encryptSearchIndexEntries(mail._id, ownerGroup, indexEntries, indexUpdate))
			verify(core.writeIndexUpdate(indexUpdate))
		})

		o.test("onMailDeleted", async function () {
			const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))

			await backend.onMailDeleted(mail._id)

			verify(core._processDeleted(MailTypeRef, getElementId(mail), indexUpdate))
			verify(core.writeIndexUpdate(indexUpdate))
		})
	})
})
