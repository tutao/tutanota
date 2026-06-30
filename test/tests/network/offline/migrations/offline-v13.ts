import o from "@tutao/otest"
import { offline13 } from "../../../../../src/app-kit/local-store/migrations/offline-v13"
import { SqlCipherFacade } from "../../../../../src/app-kit/native-bridge/common/generatedipc/types"
import { DesktopSqlCipher } from "../../../../../src/applications/common/desktop/db/DesktopSqlCipher"

o.spec("offline-v13", () => {
	let migration: offline13
	let sqlCipherFacade: SqlCipherFacade

	o.beforeEach(async () => {
		const offlineDatabaseTestKey = new Uint8Array([3957386659, 354339016, 3786337319, 3366334248])
		sqlCipherFacade = new DesktopSqlCipher(":memory:", false)
		await sqlCipherFacade.openDb("user id", offlineDatabaseTestKey)
		migration = new offline13(sqlCipherFacade)
	})

	o.test("no table", async () => {
		await migration.migrate()
	})

	o.test("full migration", async () => {
		await sqlCipherFacade.run(
			"CREATE TABLE IF NOT EXISTS search_group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL)",
			[],
		)
		await migration.migrate()
	})

	o.spec("partial migration", () => {
		o.test("list but no element", async () => {
			await sqlCipherFacade.run(
				"CREATE TABLE IF NOT EXISTS search_group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL, lastIndexedEntityListId TEXT NOT NULL)",
				[],
			)
			await migration.migrate()
		})
		o.test("element but no list", async () => {
			await sqlCipherFacade.run(
				"CREATE TABLE IF NOT EXISTS search_group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL, lastIndexedEntityElementId TEXT NOT NULL)",
				[],
			)
			await migration.migrate()
		})
	})

	o.test("no migration", async () => {
		await sqlCipherFacade.run(
			"CREATE TABLE IF NOT EXISTS search_group_data (groupId TEXT NOT NULL PRIMARY KEY, groupType NUMBER NOT NULL, indexedTimestamp NUMBER NOT NULL, lastIndexedEntityListId TEXT NOT NULL, lastIndexedEntityElementId TEXT NOT NULL)",
			[],
		)
		await migration.migrate()
	})
})
