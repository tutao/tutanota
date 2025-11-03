import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../../common/api/worker/offline/Sql"
import { SqlValue, untagSqlObject, untagSqlValue } from "../../../common/api/worker/offline/SqlValue"
import { GroupType } from "../../../common/api/common/TutanotaConstants"
import { MailWithDetailsAndAttachments } from "./MailIndexerBackend"
import { getTypeString, TypeRef } from "@tutao/tutanota-utils"
import { Contact, ContactTypeRef, Mail, MailAddress, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { elementIdPart, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import { htmlToText } from "../../../common/api/common/utils/IndexUtils"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { ListElementEntity } from "../../../common/api/common/EntityTypes"
import type { OfflineStorageTable } from "../../../common/api/worker/offline/OfflineStorage"

export const SearchTableDefinitions: Record<string, OfflineStorageTable> = Object.freeze({
	search_group_data: {
		definition:
			"CREATE TABLE IF NOT EXISTS search_group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL)",
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
})

export interface IndexedGroupData {
	groupId: Id
	type: GroupType
	indexedTimestamp: number
}

/**
 * Handles directly indexing mail data as well as storing mail groups' indexing timestamps.
 */
export class OfflineStoragePersistence {
	static readonly MAIL_INDEXING_ENABLED = "mailIndexingEnabled"
	static readonly CONTACTS_INDEXED = "contactsIndexed"

	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {}

	async getIndexedGroups(): Promise<readonly IndexedGroupData[]> {
		const { query, params } = sql`SELECT groupId, CAST(groupType as TEXT) as type, indexedTimestamp
                                    FROM search_group_data`
		const rows = await this.sqlCipherFacade.all(query, params)
		return rows.map(untagSqlObject).map((row) => row as unknown as IndexedGroupData)
	}

	async addIndexedGroup(id: Id, groupType: GroupType, indexedTimestamp: number): Promise<void> {
		const { query, params } = sql`INSERT
                                    INTO search_group_data
                                    VALUES (${id}, ${groupType}, ${indexedTimestamp})`
		await this.sqlCipherFacade.run(query, params)
	}

	async updateIndexingTimestamp(groupId: Id, timestamp: number): Promise<void> {
		const { query, params } = sql`UPDATE search_group_data
                                    SET indexedTimestamp = ${timestamp}
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

	async setMailIndexingEnabled(enabled: boolean): Promise<void> {
		const { query, params } = sql`INSERT
        OR REPLACE INTO search_metadata VALUES (
        ${OfflineStoragePersistence.MAIL_INDEXING_ENABLED},
        ${enabled ? 1 : 0}
        )`
		await this.sqlCipherFacade.run(query, params)
	}

	async isMailIndexingEnabled(): Promise<boolean> {
		const { query, params } = sql`SELECT CAST(value as NUMBER) as value
                                    FROM search_metadata
                                    WHERE key = ${OfflineStoragePersistence.MAIL_INDEXING_ENABLED}`
		const row = await this.sqlCipherFacade.get(query, params)
		return row != null && untagSqlValue(row.value) === 1
	}

	async storeMailData(mailData: readonly MailWithDetailsAndAttachments[]) {
		for (const {
			mail,
			mailDetails: { recipients, body },
			attachments,
		} of mailData) {
			const rowid = await this.getRowid(MailTypeRef, mail._id)
			if (rowid == null) {
				return
			}

			const { query, params } = sql`
                INSERT
                OR REPLACE INTO mail_index(rowid, subject, toRecipients, ccRecipients, bccRecipients, sender,
                                       body, attachments)
                VALUES (
                ${rowid},
                ${mail.subject},
                ${serializeMailAddresses(recipients.toRecipients)},
                ${serializeMailAddresses(recipients.ccRecipients)},
                ${serializeMailAddresses(recipients.bccRecipients)},
                ${serializeMailAddresses([mail.sender])},
                ${htmlToText(getMailBodyText(body))},
                ${attachments.map((f) => f.name).join(" ")}
                )`
			await this.sqlCipherFacade.run(query, params)

			// Sets are element IDs surrounded with spaces
			const serializedSets = this.formatSetsValue(mail)

			const contentQuery = sql`INSERT
            OR REPLACE INTO content_mail_index(rowid, sets, receivedDate) VALUES (
            ${rowid},
            ${serializedSets},
            ${mail.receivedDate.getTime()}
            )`
			await this.sqlCipherFacade.run(contentQuery.query, contentQuery.params)
		}
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
}

function serializeMailAddresses(recipients: readonly MailAddress[]): string {
	return recipients.map((r) => `${r.name} ${r.address}`).join(", ")
}
