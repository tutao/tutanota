import o from "@tutao/otest"
import { clientInitializedTypeModelResolver, createTestEntity } from "../../../TestUtils"
import {
	AttributeModel,
	ClientModelInfo,
	getElementId,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
} from "@tutao/typeRefs"
import { IndexerCore } from "../../../../../src/mail-app/workerUtils/index/IndexerCore"
import { IndexedDbMailIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/IndexedDbMailIndexerBackend"
import { matchers, object, verify, when } from "testdouble"
import { AttributeHandler, SearchIndexEntry } from "../../../../../src/common/api/worker/search/SearchTypes"
import { Metadata } from "../../../../../src/common/api/worker/search/IndexTables"
import { _createNewIndexUpdate, typeRefToTypeInfo } from "../../../../../src/common/api/common/utils/IndexUtils"
import { assertNotNull } from "@tutao/utils"
import { tutanotaTypeRefs } from "@tutao/typeRefs"

o.spec("IndexedDbMailIndexerBackend", () => {
	let core: IndexerCore
	const userId = "userId1"
	let backend: IndexedDbMailIndexerBackend
	o.beforeEach(() => {
		core = object()
		backend = new IndexedDbMailIndexerBackend(core, userId, clientInitializedTypeModelResolver())
	})

	o.test("enableMailIndexing", async () => {
		await backend.enableIndexing()
		verify(core.storeMetadata(Metadata.mailIndexingEnabled, true))
	})

	o.spec("isMailIndexingEnabled", () => {
		o.test("enabled", async () => {
			when(core.getMetadata(Metadata.mailIndexingEnabled)).thenResolve(true)
			o.check(await backend.isMailIndexingEnabled()).equals(true)
		})

		o.test("disabled", async () => {
			when(core.getMetadata(Metadata.mailIndexingEnabled)).thenResolve(false)
			o.check(await backend.isMailIndexingEnabled()).equals(false)
		})
	})

	o.spec("createMailIndexEntries", () => {
		o.test("without entries", async () => {
			let mail = createTestEntity(tutanotaTypeRefs.MailTypeRef)
			let mailDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef),
				recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef),
			})
			let files = [createTestEntity(tutanotaTypeRefs.FileTypeRef)]
			when(core.createIndexEntriesForAttributes(mail, matchers.anything())).thenReturn(new Map())

			const keyToIndexEntries = await backend.createMailIndexEntries(mail, mailDetails, files)
			o.check(keyToIndexEntries.size).equals(0)
		})

		o.test("with one entry", async () => {
			let mail = createTestEntity(tutanotaTypeRefs.MailTypeRef)
			let mailDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef),
				recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef),
			})
			let files = [createTestEntity(tutanotaTypeRefs.FileTypeRef)]
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
			const keyToIndexEntries = await backend.createMailIndexEntries(mail, mailDetails, files)
			o.check(keyToIndexEntries).deepEquals(returnedEntries)
		})

		o.test("contents", async () => {
			const toRecipients = [
				createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "tr0A",
					name: "tr0N",
				}),
				createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "tr1A",
					name: "tr1N",
				}),
			]
			const ccRecipients = [
				createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "ccr0A",
					name: "ccr0N",
				}),
				createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "ccr1A",
					name: "ccr1N",
				}),
			]
			const bccRecipients = [
				createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "bccr0A",
					name: "bccr0N",
				}),
				createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "bccr1A",
					name: "bccr1N",
				}),
			]
			const replyTo = createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
				address: "rToA",
				name: "rToN",
			})
			const sender = createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
				address: "SA",
				name: "SN",
			})

			const mail = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
				differentEnvelopeSender: "ES", // not indexed
				subject: "Su",
				sender,
				mailDetails: ["details-list-id", "details-id"],
			})
			const recipients = createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
				bccRecipients,
				ccRecipients,
				toRecipients,
			})
			const mailDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				_id: "details-id",
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { text: "BT" }),
				recipients,
				replyTos: [replyTo],
			})
			const files = [
				createTestEntity(tutanotaTypeRefs.FileTypeRef, {
					mimeType: "binary", // not indexed
					name: "FN",
				}),
			]

			await backend.createMailIndexEntries(mail, mailDetails, files)
			const captor = matchers.captor()
			verify(core.createIndexEntriesForAttributes(mail, captor.capture()))
			const attrHandlers: AttributeHandler[] = captor.value
			const resolvedAttrs = attrHandlers.map(({ id, value }) => ({ id, value: value() }))
			const MailModel = await ClientModelInfo.getNewInstanceForTestsOnly().resolveClientTypeReference(tutanotaTypeRefs.MailTypeRef)
			o.check(resolvedAttrs).deepEquals([
				{
					id: assertNotNull(AttributeModel.getAttributeId(MailModel, "subject")),
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
					id: assertNotNull(AttributeModel.getAttributeId(MailModel, "sender")),
					value: "SN <SA>",
				},
				{
					id: LEGACY_BODY_ID,
					value: "BT",
				},
				{
					id: assertNotNull(AttributeModel.getAttributeId(MailModel, "attachments")),
					value: "FN",
				},
			])
		})
	})

	o.spec("entityUpdates", () => {
		const ownerGroup = "mailGroup"
		let mail: tutanotaTypeRefs.Mail
		let mailDetails: tutanotaTypeRefs.MailDetails
		let attachments: [tutanotaTypeRefs.File]
		let indexEntries: Map<string, SearchIndexEntry[]>

		o.beforeEach(() => {
			mail = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
				_id: ["mailLidId", "mailElementId"],
				_ownerGroup: ownerGroup,
			})
			mailDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef)
			attachments = [createTestEntity(tutanotaTypeRefs.FileTypeRef)]
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

		o.test("onMailCreated", async () => {
			when(core.createIndexEntriesForAttributes(mail, matchers.anything())).thenReturn(indexEntries)

			await backend.onMailCreated({ mail, mailDetails, attachments })

			const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(tutanotaTypeRefs.MailTypeRef))
			verify(core.encryptSearchIndexEntries(mail._id, ownerGroup, indexEntries, indexUpdate))
			verify(core.writeIndexUpdate(indexUpdate))
		})

		o.test("onMailUpdated", async () => {
			const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(tutanotaTypeRefs.MailTypeRef))
			when(core.createIndexEntriesForAttributes(mail, matchers.anything())).thenReturn(indexEntries)

			await backend.onMailUpdated({ mail, mailDetails, attachments })

			verify(core._processDeleted(tutanotaTypeRefs.MailTypeRef, getElementId(mail), indexUpdate))
			verify(core.encryptSearchIndexEntries(mail._id, ownerGroup, indexEntries, indexUpdate))
			verify(core.writeIndexUpdate(indexUpdate))
		})

		o.test("onMailDeleted", async () => {
			const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(tutanotaTypeRefs.MailTypeRef))

			await backend.onMailDeleted(mail._id)

			verify(core._processDeleted(tutanotaTypeRefs.MailTypeRef, getElementId(mail), indexUpdate))
			verify(core.writeIndexUpdate(indexUpdate))
		})
	})
})
