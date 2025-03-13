import { File as TutanotaFile, Mail, MailAddress, MailDetails, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import Id from "../../translations/id"
import { sql } from "../../../common/api/worker/offline/Sql"
import { assertNotNull, getTypeId } from "@tutao/tutanota-utils"
import {
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
import { MailWithMailDetails } from "./BulkMailLoader"
import { IndexerCore } from "./IndexerCore"
import { SearchIndexEntry } from "../../../common/api/worker/search/SearchTypes"
import { typeModels } from "../../../common/api/entities/tutanota/TypeModels"
import { EntityUpdate } from "../../../common/api/entities/sys/TypeRefs"

interface MailWithDetails {
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
	enoughForUpdate(mails: readonly MailWithMailDetails[]): boolean

	indexMails(dataPerGroup: GroupTimestamps, mailsWithDetails: readonly MailWithDetails[]): Promise<void>

	// FIXME: previous model was ensuring atomicity for batch processing by having a single IndexedDB transaction for
	//  the whole batch. We should think how to replicate this with IndexedDB.
	onMailCreated(mailId: IdTuple): Promise<void>

	onMailUpdated(mailId: IdTuple): Promise<void>

	onMailDeleted(mailId: IdTuple): Promise<void>
}

class IndexedDbMailIndexerBackend implements MailIndexerBackend {
	constructor(private readonly core: IndexerCore) {}

	enoughForUpdate(mails: readonly MailWithMailDetails[]): boolean {
		return mails.length > 500
	}

	async indexMails(dataPerGroup: GroupTimestamps, mailsWithDetails: readonly MailWithDetails[]): Promise<void> {
		const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
		for (const element of mailsWithDetails) {
			const keyToIndexEntries = this.createMailIndexEntries(element.mail, element.mailDetails, element.attachments)
			this.core.encryptSearchIndexEntries(element.mail._id, assertNotNull(element.mail._ownerGroup), keyToIndexEntries, indexUpdate)
		}
		await this.core.writeIndexUpdate(
			Array.from(dataPerGroup).map(([id, timestamp]) => ({
				groupId: id,
				indexTimestamp: timestamp,
			})),
			indexUpdate,
		)
	}

	async onMailCreated(mailId: IdTuple): Promise<void> {}

	async onMailUpdated(mailId: IdTuple): Promise<void> {}

	async onMailDeleted(mailId: IdTuple): Promise<void> {}

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

	enoughForUpdate(_: readonly MailWithMailDetails[]): boolean {
		// assume it's always enough for now
		return true
	}

	async indexMails(dataPerGroup: GroupTimestamps, mailData: readonly MailWithDetails[]): Promise<void> {
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

	async onMailCreated(mailId: IdTuple): Promise<void> {}

	async onMailUpdated(mailId: IdTuple): Promise<void> {}

	async onMailDeleted(mailId: IdTuple): Promise<void> {}
}

function serializeMailAddresses(recipients: readonly MailAddress[]): string {
	return recipients.map((r) => `${r.name} ${r.address}`).join(", ")
}
