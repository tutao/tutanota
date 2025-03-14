import { File as TutanotaFile, Mail, MailAddress, MailDetails, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import Id from "../../translations/id"
import { sql } from "../../../common/api/worker/offline/Sql"
import { assertNotNull, getTypeId } from "@tutao/tutanota-utils"
import {
	elementIdPart,
	getElementId,
	getListId,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
} from "../../../common/api/common/utils/EntityUtils"
import { _createNewIndexUpdate, getPerformanceTimestamp, htmlToText, typeRefToTypeInfo } from "../../../common/api/worker/search/IndexUtils"
import { getDisplayedSender, getMailBodyText, MailAddressAndName } from "../../../common/api/common/CommonMailUtils"
import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { IndexerCore } from "./IndexerCore"
import { IndexUpdate, SearchIndexEntry } from "../../../common/api/worker/search/SearchTypes"
import { typeModels } from "../../../common/api/entities/tutanota/TypeModels"
import { b64UserIdHash, DbFacade } from "../../../common/api/worker/search/DbFacade"
import { Metadata, MetaDataOS } from "../../../common/api/worker/search/IndexTables"

export interface MailWithDetailsAndAttachments {
	mail: Mail
	mailDetails: MailDetails
	attachments: readonly TutanotaFile[]
}

const enum IndexResult {
	WRITTEN,
	NOT_WRITTEN_YET,
}

export type GroupTimestamps = Map<Id, number>

export interface MailIndexerBackend {
	indexMails(dataPerGroup: GroupTimestamps, mailsWithDetails: readonly MailWithDetailsAndAttachments[]): Promise<void>

	getCurrentIndexTimestamps(groupIds: readonly Id[]): Promise<Map<Id, number>>

	// FIXME: previous model was ensuring atomicity for batch processing by having a single IndexedDB transaction for
	//  the whole batch. We should think how to replicate this with IndexedDB.
	onMailCreated(mailData: MailWithDetailsAndAttachments): Promise<void>

	onMailUpdated(mailData: MailWithDetailsAndAttachments): Promise<void>

	onMailDeleted(mailId: IdTuple): Promise<void>

	enableIndexing(): Promise<boolean>

	deleteIndex(): Promise<void>
}

class IndexedDbMailIndexerBackend implements MailIndexerBackend {
	constructor(private readonly dbFacade: DbFacade, private readonly core: IndexerCore, private readonly userId: Id) {}

	getCurrentIndexTimestamps(groupIds: readonly Id[]): Promise<Map<Id, number>> {
		return this.core.getGroupIndexTimestamps(groupIds)
	}

	async indexMails(dataPerGroup: GroupTimestamps, mailsWithDetails: readonly MailWithDetailsAndAttachments[]): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		for (const element of mailsWithDetails) {
			const keyToIndexEntries = this.createMailIndexEntries(element.mail, element.mailDetails, element.attachments)
			this.core.encryptSearchIndexEntries(element.mail._id, assertNotNull(element.mail._ownerGroup), keyToIndexEntries, indexUpdate)
		}
		await this.core.writeIndexUpdateWithIndexTimestamps(
			Array.from(dataPerGroup).map(([id, timestamp]) => ({
				groupId: id,
				indexTimestamp: timestamp,
			})),
			indexUpdate,
		)
	}

	async onMailCreated({ mail, mailDetails, attachments }: MailWithDetailsAndAttachments): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		const indexEntries = this.createMailIndexEntries(mail, mailDetails, attachments)
		this.core.encryptSearchIndexEntries(mail._id, assertNotNull(mail._ownerGroup), indexEntries, indexUpdate)
		await this.core.writeIndexUpdate(indexUpdate)
	}

	async onMailUpdated({ mail, mailDetails, attachments }: MailWithDetailsAndAttachments): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		await this.core._processDeleted(MailTypeRef, getElementId(mail), indexUpdate)
		const indexEntries = this.createMailIndexEntries(mail, mailDetails, attachments)
		this.core.encryptSearchIndexEntries(mail._id, assertNotNull(mail._ownerGroup), indexEntries, indexUpdate)
		await this.core.writeIndexUpdate(indexUpdate)
	}

	async onMailDeleted(mailId: IdTuple): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		await this.core._processDeleted(MailTypeRef, elementIdPart(mailId), indexUpdate)
		await this.core.writeIndexUpdate(indexUpdate)
	}

	async enableIndexing(): Promise<boolean> {
		const t = await this.dbFacade.createTransaction(true, [MetaDataOS])
		const enabled = await t.get(MetaDataOS, Metadata.mailIndexingEnabled)
		if (!enabled) {
			const t2 = await this.dbFacade.createTransaction(false, [MetaDataOS])
			t2.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
			t2.put(MetaDataOS, Metadata.excludedListIds, [])
			await t2.wait()
		}
		return enabled
	}

	deleteIndex(): Promise<void> {
		return this.dbFacade.deleteDatabase(b64UserIdHash(this.userId))
	}

	private createIndexUpdate(): IndexUpdate {
		return _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
	}

	private createMailIndexEntries(mail: Mail, mailDetails: MailDetails, files: readonly TutanotaFile[]): Map<string, SearchIndexEntry[]> {
		let startTimeIndex = getPerformanceTimestamp()

		// avoid caching system@tutanota.de since the user wouldn't be searching for this
		let senderToIndex: MailAddressAndName

		const hasSender = mail.sender != null
		if (hasSender) senderToIndex = getDisplayedSender(mail)

		const MailModel = typeModels.Mail
		const MailDetailsModel = typeModels.MailDetails
		const RecipientModel = typeModels.Recipients
		let keyToIndexEntries = this.core.createIndexEntriesForAttributes(mail, [
			{
				attribute: MailModel.values["subject"],
				value: () => mail.subject,
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, RecipientModel.associations["toRecipients"], { id: LEGACY_TO_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.toRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, RecipientModel.associations["ccRecipients"], { id: LEGACY_CC_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.ccRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, RecipientModel.associations["bccRecipients"], { id: LEGACY_BCC_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.bccRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				attribute: MailModel.associations["sender"],
				value: () => (hasSender ? senderToIndex.name + " <" + senderToIndex.address + ">" : ""),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, MailDetailsModel.associations["body"], { id: LEGACY_BODY_ID }),
				value: () => htmlToText(getMailBodyText(mailDetails.body)),
			},
			{
				attribute: MailModel.associations["attachments"],
				value: () => files.map((file) => file.name).join(" "),
			},
		])

		this.core._stats.indexingTime += getPerformanceTimestamp() - startTimeIndex
		return keyToIndexEntries
	}
}

class SqliteMailIndexerBackend implements MailIndexerBackend {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {}

	async getCurrentIndexTimestamps(groupIds: readonly []): Promise<Map<Id, number>> {
		// FIXME
		throw new Error("FIXME: not implemented")
	}

	async indexMails(dataPerGroup: GroupTimestamps, mailData: readonly MailWithDetailsAndAttachments[]): Promise<void> {
		for (const {
			mail,
			mailDetails: { recipients, body },
			attachments,
		} of mailData) {
			const foundMailQuery = sql`SELECT rowId
                                       FROM list_entities
                                       WHERE type = ${getTypeId(MailTypeRef)}
                                         AND listId = ${getListId(mail)}
                                         AND elementId = ${getElementId(mail)}`
			const foundMail = await this.sqlCipherFacade.get(foundMailQuery.query, foundMailQuery.params)
			console.log(`found mail for ${mail._id} (${mail.subject}): ${foundMail}`)

			// FIXME: attachment names is just an empty string right now
			// FIXME: not do each email one by one if possible
			// FIXME: write indexing metadata somewhere
			const { query, params } = sql`
                INSERT INTO mail_index(rowId, subject, toRecipients, ccRecipients, bccRecipients, sender,
                                       body, attachments)
                VALUES ((SELECT rowId
                         FROM list_entities
                         WHERE type = ${getTypeId(MailTypeRef)}
                           AND listId = ${getListId(mail)}
                           AND elementId = ${getElementId(mail)}),
                        ${mail.subject},
                        ${serializeMailAddresses(recipients.toRecipients)},
                        ${serializeMailAddresses(recipients.ccRecipients)},
                        ${serializeMailAddresses(recipients.bccRecipients)},
                        ${serializeMailAddresses([mail.sender])},
                        ${htmlToText(getMailBodyText(body))},
                        ${attachments.map((f) => f.name).join(" ")})`
			await this.sqlCipherFacade.run(query, params)
		}
	}

	async enableIndexing(): Promise<boolean> {
		// FIXME: not clear what we want to do here, it should probably be always enabled
		throw new Error("FIXME: not implemented")
	}

	deleteIndex(): Promise<void> {
		throw new Error("FIXME: not implemented")
	}

	async onMailCreated({ mail, mailDetails, attachments }: MailWithDetailsAndAttachments): Promise<void> {
		throw new Error("FIXME: not implemented")
	}

	async onMailUpdated({ mail, mailDetails, attachments }: MailWithDetailsAndAttachments): Promise<void> {
		throw new Error("FIXME: not implemented")
	}

	async onMailDeleted(mailId: IdTuple): Promise<void> {
		throw new Error("FIXME: not implemented")
	}
}

function serializeMailAddresses(recipients: readonly MailAddress[]): string {
	return recipients.map((r) => `${r.name} ${r.address}`).join(", ")
}
