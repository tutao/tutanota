import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../../common/api/worker/offline/Sql"
import { untagSqlObject, untagSqlValue } from "../../../common/api/worker/offline/SqlValue"
import { GroupType } from "../../../common/api/common/TutanotaConstants"
import { MailWithDetailsAndAttachments } from "./MailIndexerBackend"
import { getTypeId } from "@tutao/tutanota-utils"
import { MailAddress, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { elementIdPart, getElementId, getListId, listIdPart } from "../../../common/api/common/utils/EntityUtils"
import { htmlToText } from "../../../common/api/worker/search/IndexUtils"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"

const searchTables = Object.freeze([
	// // plus ownerGroup added in a migration
	// list_entities:
	// 	"type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId)",
	// // plus ownerGroup added in a migration
	// element_entities: "type TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, elementId)",
	// ranges: "type TEXT NOT NULL, listId TEXT NOT NULL, lower TEXT NOT NULL, upper TEXT NOT NULL, PRIMARY KEY (type, listId)",
	// lastUpdateBatchIdPerGroupId: "groupId TEXT NOT NULL, batchId TEXT NOT NULL, PRIMARY KEY (groupId)",
	// metadata: "key TEXT NOT NULL, value BLOB, PRIMARY KEY (key)",
	// blob_element_entities:
	// 	"type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, ownerGroup TEXT, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId)",

	"CREATE TABLE IF NOT EXISTS search_group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL)",
	"CREATE TABLE IF NOT EXISTS search_metadata (key TEXT NOT NULL PRIMARY KEY, value)",
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
] as const)

export interface IndexedGroupData {
	groupId: Id
	type: GroupType
	indexedTimestamp: number
}

// FIXME: add doc
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

	async removeIndexedGroup(id: Id): Promise<void> {
		const { query, params } = sql`REMOVE
        FROM search_group_data WHERE groupId =
        ${id}
        LIMIT
        1`
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
                INSERT
                OR REPLACE INTO mail_index(rowId, subject, toRecipients, ccRecipients, bccRecipients, sender,
                                       body, attachments)
                VALUES ((SELECT rowId
                         FROM list_entities
                         WHERE type =
                ${getTypeId(MailTypeRef)}
                AND
                listId
                =
                ${getListId(mail)}
                AND
                elementId
                =
                ${getElementId(mail)}
                ),
                ${mail.subject},
                ${serializeMailAddresses(recipients.toRecipients)},
                ${serializeMailAddresses(recipients.ccRecipients)},
                ${serializeMailAddresses(recipients.bccRecipients)},
                ${serializeMailAddresses([mail.sender])},
                ${htmlToText(getMailBodyText(body))},
                ${attachments.map((f) => f.name).join(" ")}
                )`
			await this.sqlCipherFacade.run(query, params)
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
}

function serializeMailAddresses(recipients: readonly MailAddress[]): string {
	return recipients.map((r) => `${r.name} ${r.address}`).join(", ")
}
