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

	"CREATE TABLE IF NOT EXISTS search_group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL)",
] as const)

// FIXME: add doc
export class OfflineStoragePersistence {
	constructor(private readonly sqlCipherFacade: SqlCipherFacade) {}

	async init() {
		for (const tableDef of searchTables) {
			await this.sqlCipherFacade.run(tableDef, [])
		}
	}

	async getIndexedGroups(): Promise<readonly Id[]> {
		const { query, params } = sql`SELECT groupId
                                    FROM search_group_data`
		const rows = await this.sqlCipherFacade.all(query, params)
		return rows.map(untagSqlObject).map((row) => row["groupId"] as Id)
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
}
