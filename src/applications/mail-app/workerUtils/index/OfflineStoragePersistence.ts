import { SqlCipherFacade } from "@tutao/native-bridge/generatedIpc/types"
import { sql } from "../../../../app-kit/local-store/Sql"
import { tagSqlValue, untagSqlObject, untagSqlValue } from "../../../../app-kit/local-store/SqlValue"
import { NOTHING_INDEXED_TIMESTAMP, ProgrammingError } from "@tutao/app-env"
import { MailWithDetailsAndAttachments } from "./MailIndexerBackend"
import {
	CUSTOM_MIN_ID,
	elementIdPart,
	EntityTypeEnum,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	getTypeString,
	ListElementEntity,
	listIdPart,
	ServerTypeModel,
	TypeRef,
} from "@tutao/meta"
import { htmlToText } from "../../../common/api/common/utils/IndexUtils"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { customTypeDecoders, customTypeEncoders, OfflineStorageTable } from "../../../../app-kit/local-store/OfflineStorage"
import { GroupType } from "../../../../entities/sys/Utils"
import { Contact, ContactTypeRef, Mail, MailAddress, MailTypeRef } from "@tutao/entities/tutanota"
import { SqlValue } from "../../../../app-kit/local-store/Types"
import { decode, encode } from "cborg"
import { IncomingServerJson } from "../../../../platform-kit/instance-pipeline/TypeMapper"
import { MailImportType } from "../../../../entities/tutanota/Utils"
import { deduplicate, delay, isEmpty, splitInChunks } from "@tutao/utils"

export const SearchTableDefinitions: Record<string, OfflineStorageTable> = Object.freeze({
	search_group_data: {
		definition:
			"CREATE TABLE IF NOT EXISTS search_group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL, lastIndexedEntityListId TEXT NOT NULL, lastIndexedEntityElementId TEXT NOT NULL)",
		purgedWithCache: true,
	},

	search_metadata: {
		definition: "CREATE TABLE IF NOT EXISTS search_metadata (key TEXT NOT NULL PRIMARY KEY, value)",
		purgedWithCache: true,
	},

	// Full-text index of mails (contentless)
	// list_entities.rowid = mail_index.rowid = content_mail_index = rowid
	mail_index: {
		definition: `CREATE VIRTUAL TABLE IF NOT EXISTS mail_index USING fts5(
subject,
toRecipients,
ccRecipients,
bccRecipients,
sender,
body,
attachments,
content='',
contentless_delete=1,
tokenize='signal_tokenizer'
)`,
		purgedWithCache: true,
	},

	// Used for handling imported emails.
	import_mail_queue: {
		definition: "CREATE TABLE IF NOT EXISTS import_mail_queue (listId TEXT NOT NULL PRIMARY KEY, elementId TEXT NOT NULL, mailImportType TEXT NOT NULL)",
		purgedWithCache: true,
	},

	// Content of the mail that we might need while matching, but that should not be indexed by fts5
	// we would love to use the contentless_unindexed option, but it's only available from SQLite 3.47.0 onwards
	content_mail_index: {
		definition: "CREATE TABLE IF NOT EXISTS content_mail_index (receivedDate NUMBER NOT NULL, sets STRING NOT NULL)",
		purgedWithCache: true,
	},

	// Full-text index of contact names and addresses (NOT contentless)
	// list_entities.rowid = contact_index.rowid
	//
	// This is not contentless because we want to be able to sort search results by first/last name inside the query,
	// itself, while still using the LIMIT clause. This means duplicate data will be stored, but only a small portion of
	// the contact in this case.
	contact_index: {
		definition: `CREATE VIRTUAL TABLE IF NOT EXISTS contact_index USING fts5(
firstName,
lastName,
mailAddresses
)`,
		purgedWithCache: true,
	},

	// Encrypted, encoded mail details blobs.
	//
	// This is for temporary storage to avoid storing all of the user's archives in RAM (which can potentially fail).
	encrypted_mail_details_blobs: {
		definition:
			"CREATE TABLE IF NOT EXISTS encrypted_mail_details_blobs (blobId TEXT NOT NULL PRIMARY KEY, archiveId TEXT NOT NULL, data BLOB NOT NULL, typeref STRING NOT NULL, modelVersion NUMBER NOT NULL)",
		purgedWithCache: true,
	},
})

export interface IndexedGroupData {
	groupId: Id
	type: GroupType
	indexedTimestamp: number
	lastIndexedEntityListId: string
	lastIndexedEntityElementId: string
}

/**
 * Handles directly indexing mail data as well as storing mail groups' indexing timestamps.
 */
export class OfflineStoragePersistence {
	static readonly MAIL_INDEXING_ENABLED = "mailIndexingEnabled"
	static readonly CONTACTS_INDEXED = "contactsIndexed"

	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {}

	async getIndexedGroups(): Promise<readonly IndexedGroupData[]> {
		const { query, params } = sql`SELECT groupId,
											 CAST(groupType as TEXT) as type,
											 indexedTimestamp,
											 lastIndexedEntityListId,
											 lastIndexedEntityElementId
									  FROM search_group_data`
		const rows = await this.sqlCipherFacade.all(query, params)
		return rows.map(untagSqlObject).map((row) => row as unknown as IndexedGroupData)
	}

	async addIndexedGroup(id: Id, groupType: GroupType, indexedTimestamp: number, lastIndexedEntity: IdTuple): Promise<void> {
		const { query, params } = sql`INSERT
									  INTO search_group_data
									  VALUES (${id}, ${groupType}, ${indexedTimestamp}, ${listIdPart(lastIndexedEntity)}, ${elementIdPart(lastIndexedEntity)})`
		await this.sqlCipherFacade.run(query, params)
	}

	async updateIndexingTimestamp(groupId: Id, timestamp: number): Promise<void> {
		const { query, params } = sql`UPDATE search_group_data
									  SET indexedTimestamp = ${timestamp}
									  WHERE groupId = ${groupId}`
		await this.sqlCipherFacade.run(query, params)
	}

	async updateIndexingElement(groupId: Id, lastIndexedEntity: IdTuple): Promise<void> {
		const { query, params } = sql`UPDATE search_group_data
									  SET lastIndexedEntityListId    = ${listIdPart(lastIndexedEntity)},
										  lastIndexedEntityElementId = ${elementIdPart(lastIndexedEntity)}
									  WHERE groupId = ${groupId}`
		await this.sqlCipherFacade.run(query, params)
	}

	async removeIndexedGroup(id: Id): Promise<void> {
		const { query, params } = sql`DELETE
									  FROM search_group_data
									  WHERE groupId =
											${id}`
		await this.sqlCipherFacade.run(query, params)
	}

	/**
	 * WARNING: Do NOT exceed MAX_SAFE_SQL_VARS (this function will not handle this for you)
	 */
	async storeMailData(mailData: readonly MailWithDetailsAndAttachments[]) {
		if (isEmpty(mailData)) {
			return
		}

		let insertMailIndexQuery =
			"INSERT OR REPLACE INTO mail_index(rowid, subject, toRecipients, ccRecipients, bccRecipients, sender, body, attachments) VALUES "
		let insertMailIndexParameters = []

		let insertContentIndexQuery = "INSERT OR REPLACE INTO content_mail_index(rowid, sets, receivedDate) VALUES "
		let insertContentIndexParameters = []

		for (const {
			mail,
			mailDetails: { recipients, body },
			attachments,
		} of mailData) {
			const rowid = await this.getRowid(MailTypeRef, mail._id)
			if (rowid == null) {
				return
			}

			insertMailIndexParameters.push([
				tagSqlValue(rowid),
				tagSqlValue(mail.subject),
				tagSqlValue(serializeMailAddresses(recipients.toRecipients)),
				tagSqlValue(serializeMailAddresses(recipients.ccRecipients)),
				tagSqlValue(serializeMailAddresses(recipients.bccRecipients)),
				tagSqlValue(serializeMailAddresses([mail.sender])),
				tagSqlValue(htmlToText(getMailBodyText(body))),
				tagSqlValue(attachments.map((f) => f.name).join(" ")),
			])

			insertContentIndexParameters.push([tagSqlValue(rowid), tagSqlValue(this.formatSetsValue(mail)), tagSqlValue(mail.receivedDate.getTime())])
		}

		insertMailIndexQuery += insertMailIndexParameters.map((array) => `(${array.map((_) => "?").join(", ")})`)
		insertContentIndexQuery += insertContentIndexParameters.map((array) => `(${array.map((_) => "?").join(", ")})`)

		await this.sqlCipherFacade.run(insertMailIndexQuery, insertMailIndexParameters.flat())
		await this.sqlCipherFacade.run(insertContentIndexQuery, insertContentIndexParameters.flat())
	}

	async updateMailLocation(mail: Mail) {
		const rowid = await this.getRowid(MailTypeRef, mail._id)
		if (rowid == null) {
			return
		}
		const { query, params } = sql`UPDATE content_mail_index
									  SET sets = ${this.formatSetsValue(mail)}
									  WHERE rowid = ${rowid}`
		await this.sqlCipherFacade.run(query, params)
	}

	private formatSetsValue(mail: Mail): string {
		return mail.sets.map(elementIdPart).join(" ")
	}

	async deleteMailData(mailId: IdTuple): Promise<void> {
		const rowid = await this.getRowid(MailTypeRef, mailId)
		{
			const { query, params } = sql`DELETE
										  FROM mail_index
										  WHERE rowId = ${rowid}`
			await this.sqlCipherFacade.run(query, params)
		}
		{
			const { query, params } = sql`DELETE
										  FROM content_mail_index
										  WHERE rowId = ${rowid}`
			await this.sqlCipherFacade.run(query, params)
		}
	}

	async storeContactData(contacts: Contact[]): Promise<void> {
		for (const contact of contacts) {
			const rowid = await this.getRowid(ContactTypeRef, contact._id)
			if (rowid == null) {
				continue
			}

			const { query, params } = sql`
				INSERT
				OR REPLACE INTO contact_index(rowid, firstName, lastName, mailAddresses)
VALUES (
				${rowid},
				${contact.firstName},
				${contact.lastName},
				${contact.mailAddresses.map((a) => a.address).join(" ")}
				)`

			await this.sqlCipherFacade.run(query, params)
		}
	}

	async deleteContactData(contactId: IdTuple): Promise<void> {
		const { query, params } = sql`DELETE
									  FROM contact_index
									  WHERE rowId = (SELECT rowId
													 FROM list_entities
													 WHERE type =
														   ${getTypeString(ContactTypeRef)}
													   AND listId
														 =
														   ${listIdPart(contactId)}
													   AND elementId
														 =
														   ${elementIdPart(contactId)} LIMIT 1)`
		await this.sqlCipherFacade.run(query, params)
	}

	async areContactsIndexed(): Promise<boolean> {
		const { query, params } = sql`SELECT CAST(value as NUMBER) as value
									  FROM search_metadata
									  WHERE key = ${OfflineStoragePersistence.CONTACTS_INDEXED}`
		const value = await this.sqlCipherFacade.get(query, params)
		return value != null && untagSqlObject(value).value === 1
	}

	async setContactsIndexed(indexed: boolean): Promise<void> {
		const { query, params } = sql`INSERT
		OR REPLACE INTO search_metadata (key, value) VALUES (
		${OfflineStoragePersistence.CONTACTS_INDEXED},
		${indexed ? 1 : 0}
		)`
		await this.sqlCipherFacade.run(query, params)
	}

	async getEncryptedMailDetailsBlobsArchives(): Promise<Id[]> {
		const archives = await this.sqlCipherFacade.all("SELECT DISTINCT archiveId FROM encrypted_mail_details_blobs", [])
		return archives.map(({ archiveId }) => untagSqlValue(archiveId) as Id)
	}

	async countEncryptedMailDetailsBlobsInArchives(archivesNeeded: readonly Id[]): Promise<number> {
		const archivesNeededDeduped = deduplicate(archivesNeeded)
		if (isEmpty(archivesNeededDeduped)) {
			return 0
		}

		const query = `SELECT COUNT(*) as total
					   FROM encrypted_mail_details_blobs
					   WHERE ${archivesNeededDeduped.map(() => "archiveId = ?").join(" OR ")}`

		const params = archivesNeededDeduped.map(tagSqlValue)

		const result = await this.sqlCipherFacade.get(query, params)
		if (result == null) {
			return 0
		}

		return untagSqlValue(result["total"]) as number
	}

	async storeEncryptedMailDetailsBlobs(serverTypeModel: ServerTypeModel, blobs: readonly IncomingServerJson[]): Promise<void> {
		if (isEmpty(blobs)) {
			return
		}
		const typeref = `${serverTypeModel.app}/${serverTypeModel.name}`
		if (serverTypeModel.type !== EntityTypeEnum.BlobElement) {
			throw new ProgrammingError(`cannot use OfflineStoragePersistence#storeEncryptedBlobs with ${serverTypeModel.type} (${typeref})`)
		}

		const versionParam = tagSqlValue(serverTypeModel.version)

		for (const blobsChunked of splitInChunks(100, blobs)) {
			let insertQuery = "INSERT OR REPLACE INTO encrypted_mail_details_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES "
			let insertParameters = []
			for (const blob of blobsChunked) {
				const [archiveId, blobId] = blob.getValueByName("_id").asIdTuple()

				const blobJson = blob.getInnerJson()
				const encodedBlob = encode(blobJson, { typeEncoders: customTypeEncoders })
				insertParameters.push([tagSqlValue(blobId), tagSqlValue(archiveId), tagSqlValue(encodedBlob), tagSqlValue(typeref), versionParam])
			}

			insertQuery += insertParameters.map((array) => `(${array.map((_) => "?").join(", ")})`)
			await this.sqlCipherFacade.run(insertQuery, insertParameters.flat())
		}
	}

	private pendingEncryptedMailDetailsBlobRetrieval: Promise<Map<Id, IncomingServerJson>> | null = null
	private pendingEncryptedMailDetailsBlobItems: Set<Id> = new Set()

	retrieveEncryptedMailDetailsBlob(serverTypeModel: ServerTypeModel, blobId: Id): Promise<IncomingServerJson | null> {
		const typeref = `${serverTypeModel.app}/${serverTypeModel.name}`
		if (serverTypeModel.type !== EntityTypeEnum.BlobElement) {
			throw new ProgrammingError(`cannot use OfflineStoragePersistence#retrieveEncryptedBlob with ${serverTypeModel.type} (${typeref})`)
		}

		// if there is a pending request, build onto it (but not too much because we don't want to blow up MAX_SAFE_SQL_VARS or our RAM)
		if (this.pendingEncryptedMailDetailsBlobRetrieval == null || this.pendingEncryptedMailDetailsBlobItems.size > 100) {
			this.pendingEncryptedMailDetailsBlobItems = new Set()

			const blobItems = this.pendingEncryptedMailDetailsBlobItems

			// collect all requests for the current task slice (delay(0) is just setTimeout(0)) to reduce IPC calls
			this.pendingEncryptedMailDetailsBlobRetrieval = delay(0).then(async () => {
				// no more blob IDs will be accepted for this request
				// of course, if we already have a new promise (due to our limit above), skip this step
				if (blobItems === this.pendingEncryptedMailDetailsBlobItems) {
					this.pendingEncryptedMailDetailsBlobItems = new Set()
					this.pendingEncryptedMailDetailsBlobRetrieval = null
				}

				const blobItemsArray = Array.from(blobItems)
				const blobIdQuery = "blobId = ?"
				const baseQuery = `SELECT data, blobId
							 FROM encrypted_mail_details_blobs
							 WHERE typeref = ?
							   AND modelVersion = ?
							   AND (${blobItemsArray.map((_) => blobIdQuery).join(" OR ")})`

				const blobs = await this.sqlCipherFacade.all(baseQuery, [
					tagSqlValue(typeref),
					tagSqlValue(serverTypeModel.version),
					...blobItemsArray.map(tagSqlValue),
				])

				const map: Map<Id, IncomingServerJson> = new Map()

				if (blobs == null) {
					return map
				}

				for (const blob of blobs) {
					const { data, blobId } = untagSqlObject(blob)
					if (!(data instanceof Uint8Array) || typeof blobId !== "string") {
						continue
					}

					const blobJson = decode(data, { tags: customTypeDecoders })
					map.set(blobId, IncomingServerJson.expectSingleMailDetailsBlob(blobJson, serverTypeModel))
				}

				return map
			})
		}

		this.pendingEncryptedMailDetailsBlobItems.add(blobId)

		return this.pendingEncryptedMailDetailsBlobRetrieval.then((result) => result.get(blobId) ?? null)
	}

	async deleteEncryptedMailDetailsBlob(blobId: Id): Promise<void> {
		{
			const { query, params } = sql`DELETE
										  FROM encrypted_mail_details_blobs WHERE blobId = ${blobId}`
			await this.sqlCipherFacade.run(query, params)
		}
	}

	async clearEncryptedMailDetailsBlobs(): Promise<void> {
		{
			const { query, params } = sql`DELETE
										  FROM encrypted_mail_details_blobs`
			await this.sqlCipherFacade.run(query, params)
		}
	}

	private async getRowid<T extends ListElementEntity>(typeRef: TypeRef<T>, id: IdTuple): Promise<SqlValue | null> {
		// Find rowid from the offline storage.
		// We could have done it in a single query but we need to insert into two tables.
		const rowIdQuery = sql`SELECT rowid
							   FROM list_entities
							   WHERE type = ${getTypeString(typeRef)}
								 AND listId = ${listIdPart(id)}
								 AND elementId = ${elementIdPart(id)}`
		const rowIdResult = await this.sqlCipherFacade.get(rowIdQuery.query, rowIdQuery.params)
		if (rowIdResult == null) {
			console.warn(`Did not find row id for ${typeRef.typeId} ${id.join(",")}`)
			return null
		}
		return untagSqlObject(rowIdResult).rowid
	}

	async resetMailIndex() {
		{
			const { query, params } = sql`UPDATE search_group_data
										  SET indexedTimestamp           = ${NOTHING_INDEXED_TIMESTAMP},
											  lastIndexedEntityListId    = ${GENERATED_MAX_ID},
											  lastIndexedEntityElementId = ${GENERATED_MAX_ID}
										  WHERE groupType = ${GroupType.Mail}`
			await this.sqlCipherFacade.run(query, params)
		}
		{
			const { query, params } = sql`DELETE
										  FROM mail_index`
			await this.sqlCipherFacade.run(query, params)
		}
		{
			const { query, params } = sql`DELETE
										  FROM content_mail_index`
			await this.sqlCipherFacade.run(query, params)
		}
	}

	async removeImportQueueEntry(importedMails: Id) {
		const { query, params } = sql`DELETE
									  FROM import_mail_queue
									  WHERE listId = ${importedMails}`
		await this.sqlCipherFacade.run(query, params)
	}

	async updateImportQueueProgress(importedMails: Id, latestMail: Id, mailImportType: MailImportType) {
		const { query, params } = sql`INSERT
		OR REPLACE INTO import_mail_queue VALUES (
		${importedMails},
		${latestMail},
		${mailImportType}
		)`
		await this.sqlCipherFacade.run(query, params)
	}

	async enqueueImport(importedMails: Id, mailImportType: MailImportType) {
		const minimumImportedMailElementId = mailImportType === MailImportType.ImapImport ? CUSTOM_MIN_ID : GENERATED_MIN_ID
		const lastElementId = (await this.getImportQueueProgress(importedMails)) ?? minimumImportedMailElementId
		return await this.updateImportQueueProgress(importedMails, lastElementId, mailImportType)
	}

	async getImportQueueProgress(importedMails: Id): Promise<Id | null> {
		const { query, params } = sql`SELECT elementId FROM import_mail_queue WHERE listId = ${importedMails}`
		const value = await this.sqlCipherFacade.get(query, params)
		return value && (untagSqlValue(value.elementId) as Id)
	}

	async getImportQueueEntries(): Promise<{ listId: Id; mailImportType: MailImportType }[]> {
		const resultRows = await this.sqlCipherFacade.all(`SELECT listId, mailImportType FROM import_mail_queue`, [])
		return resultRows.map(({ listId, mailImportType }) => {
			return { listId: untagSqlValue(listId) as Id, mailImportType: untagSqlValue(mailImportType) as MailImportType }
		})
	}
}

function serializeMailAddresses(recipients: readonly MailAddress[]): string {
	return recipients.map((r) => `${r.name} ${r.address}`).join(", ")
}
