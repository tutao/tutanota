import { SqlCipherFacade } from "../../../common/native/common/generatedipc/SqlCipherFacade"
import { sql } from "../../../common/api/worker/offline/Sql"
import { untagSqlObject, untagSqlValue } from "../../../common/api/worker/offline/SqlValue"
import { GroupType } from "../../../common/api/common/TutanotaConstants"

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

	"CREATE TABLE IF NOT EXISTS search.group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL)",
	"CREATE TABLE IF NOT EXISTS search.metadata (key TEXT NOT NULL PRIMARY KEY, value)",
] as const)

// FIXME: add doc
export class OfflineStoragePersistence {
	private static readonly MAIL_INDEXING_ENABLED = "mailIndexingEnabled"

	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {}

	async init() {
		for (const tableDef of searchTables) {
			await this.sqlCipherFacade.run(tableDef, [])
		}
	}

	async isMailIndexingEnabled(): Promise<boolean> {
		const { query, params } = sql`SELECT CAST(VALUE as NUMBER)
                                    FROM search.metadata
                                    WHERE key = ${OfflineStoragePersistence.MAIL_INDEXING_ENABLED}`
		const row = await this.sqlCipherFacade.get(query, params)
		return row != null && untagSqlValue(row["value"]) === 1
	}

	async setMailIndexingEnabled(enabled: boolean): Promise<void> {
		const { query, params } = sql`INSERT
        OR REPLACE INTO search.metadata VALUES (
        ${OfflineStoragePersistence.MAIL_INDEXING_ENABLED},
        ${enabled ? 1 : 0}
        )`
		await this.sqlCipherFacade.run(query, params)
	}

	async getIndexedGroups(): Promise<readonly Id[]> {
		const { query, params } = sql`SELECT groupId
                                    FROM search.group_data`
		const rows = await this.sqlCipherFacade.all(query, params)
		return rows.map(untagSqlObject).map((row) => row["groupId"] as Id)
	}

	async addIndexedGroup(id: Id, groupType: GroupType, indexedTimestamp: number): Promise<void> {
		const { query, params } = sql`INSERT
                                    INTO search.group_data
                                    VALUES (${id}, ${groupType}, ${indexedTimestamp})`
		await this.sqlCipherFacade.run(query, params)
	}

	async removeIndexedGroup(id: Id): Promise<void> {
		const { query, params } = sql`REMOVE
        FROM search.group_data WHERE groupId =
        ${id}
        LIMIT
        1`
		await this.sqlCipherFacade.run(query, params)
	}
}
