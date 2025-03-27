import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../../common/api/worker/offline/Sql"
import { SqlValue, untagSqlObject, untagSqlValue } from "../../../common/api/worker/offline/SqlValue"
import { GroupType } from "../../../common/api/common/TutanotaConstants"
import { MailWithDetailsAndAttachments } from "./MailIndexerBackend"
import { getTypeId, TypeRef } from "@tutao/tutanota-utils"
import { Contact, ContactTypeRef, MailAddress, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { elementIdPart, getElementId, getListId, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import { htmlToText } from "../../../common/api/worker/search/IndexUtils"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { ListElementEntity } from "../../../common/api/common/EntityTypes"

const searchTables = Object.freeze([
	"CREATE TABLE IF NOT EXISTS search_group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL)",
	"CREATE TABLE IF NOT EXISTS search_metadata (key TEXT NOT NULL PRIMARY KEY, value)",

	// full-text index of mails.
	// list_entities.rowid = mail_index.rowid = content_mail_index = rowid
	`CREATE VIRTUAL TABLE IF NOT EXISTS mail_index USING fts5(
       subject,
       toRecipients,
       ccRecipients,
       bccRecipients,
       sender,
       body,
       attachments,
       content='',
       contentless_delete=1
       )`,
	// Content of the mail that we might need while matching, but that should not be indexed by fts5
	// we would love to use the contentless_unindexed option, but it's only available from SQLite 3.47.0 onwards
	"CREATE TABLE IF NOT EXISTS content_mail_index (receivedDate NUMBER NOT NULL, sets STRING NOT NULL)",

	`CREATE VIRTUAL TABLE IF NOT EXISTS contact_index USING fts5(
       firstName,
       lastName,
       mailAddresses
       )`,
] as const)

export interface IndexedGroupData {
	groupId: Id
	type: GroupType
	indexedTimestamp: number
}

/**
 * Handles directly indexing mail data as well as storing mail groups' indexing timestamps.
 */
export class OfflineStoragePersistence {
	private static readonly MAIL_INDEXING_ENABLED = "mailIndexingEnabled"

	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {}

	async init() {
		for (const tableDef of searchTables) {
			await this.sqlCipherFacade.run(tableDef, [])
		}
	}

	async getIndexedGroups(): Promise<readonly IndexedGroupData[]> {
		const { query, params } = sql`SELECT groupId, groupType, indexedTimestamp
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
		return row != null && untagSqlValue(row["value"]) === 1
	}

	async storeMailData(mailData: readonly MailWithDetailsAndAttachments[]) {
		for (const {
			mail,
			mailDetails: { recipients, body },
			attachments,
		} of mailData) {
			const rowid = await this.getRowid(MailTypeRef, mail)
			if (rowid == null) {
				return
			}

			// FIXME: attachment names is just an empty string right now
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
			const serializedSets = mail.sets.map((set) => set.join("/")).join(" ")
			const contentQuery = sql`INSERT
            OR REPLACE INTO content_mail_index(rowId, sets, receivedDate) VALUES (
            ${rowid},
            ${serializedSets},
            ${mail.receivedDate.getTime()}
            )`
			await this.sqlCipherFacade.run(contentQuery.query, contentQuery.params)
		}
	}

	async deleteMailData(mailId: IdTuple): Promise<void> {
		const { query, params } = sql`DELETE
                                    FROM mail_index
                                    WHERE rowId = (SELECT rowId
                                                   FROM list_entities
                                                   WHERE type =
                                                         ${getTypeId(MailTypeRef)}
                                                     AND listId
                                                       =
                                                         ${listIdPart(mailId)}
                                                     AND elementId
                                                       =
                                                         ${elementIdPart(mailId)} LIMIT 1)`
		await this.sqlCipherFacade.run(query, params)
	}

	async storeContactData(contacts: Contact[]): Promise<void> {
		for (const contact of contacts) {
			const rowid = await this.getRowid(ContactTypeRef, contact)
			if (rowid == null) {
				return
			}

			const { query, params } = sql`
                INSERT
                OR REPLACE INTO contact_index(rowid, firstName, lastName, mailAddresses)
                VALUES (
                ${rowid},
                ${contact.firstName},
                ${contact.lastName},
                ${contact.addresses.join(" ")},
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
                                                         ${getTypeId(ContactTypeRef)}
                                                     AND listId
                                                       =
                                                         ${listIdPart(contactId)}
                                                     AND elementId
                                                       =
                                                         ${elementIdPart(contactId)} LIMIT 1)`
		await this.sqlCipherFacade.run(query, params)
	}

	private async getRowid<T extends ListElementEntity>(typeRef: TypeRef<T>, element: T): Promise<SqlValue | null> {
		// Find rowid from the offline storage.
		// We could have done it in a single query but we need to insert into two tables.
		const rowIdQuery = sql`SELECT rowid
                               FROM list_entities
                               WHERE type = ${getTypeId(typeRef)}
                                 AND listId = ${getListId(element)}
                                 AND elementId = ${getElementId(element)}`
		const rowIdResult = await this.sqlCipherFacade.get(rowIdQuery.query, rowIdQuery.params)
		if (rowIdResult == null) {
			console.warn(`Did not find row id for ${typeRef.type} ${element._id.join(",")}`)
			return null
		}
		return untagSqlObject(rowIdResult).rowid
	}
}

function serializeMailAddresses(recipients: readonly MailAddress[]): string {
	return recipients.map((r) => `${r.name} ${r.address}`).join(", ")
}
