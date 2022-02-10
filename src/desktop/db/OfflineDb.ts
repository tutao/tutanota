import {Database, default as sqlite} from "better-sqlite3"
import {firstBiggerThanSecond} from "../../api/common/utils/EntityUtils"
import {uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {bitArrayToUint8Array, CryptoError} from "@tutao/tutanota-crypto"
import {OfflineDbMeta} from "../../api/worker/rest/OfflineStorage"

export interface PersistedEntity {
	type: string,
	listId: Id | null,
	elementId: Id,
	entity: Uint8Array,
}

/*
	TABLE list_entities:
	| type*     | listId*      | elementId*   | entity*
	---------------------------------------------------
	| app/type1 | -----------a | -----------1 | (blob)
	| app/type1 | -----------a | -----------2 | (blob)
	| app/type1 | -----------a | -----------3 | (blob)
	| app/type1 | -----------a | ----------10 | (blob)
	| app/type1 | -----------b | -----------4 | (blob)
	| app/type1 | -----------b | -----------5 | (blob)
	| app/type1 | -----------b | -----------6 | (blob)

	TABLE element_entities:
	| type*     | elementId*   | entity*
	------------------------------------
	| app/type1 | -----------1 | (blob)
	| app/type1 | -----------2 | (blob)
	| app/type1 | -----------3 | (blob)
	| app/type1 | ----------10 | (blob)
	| app/type1 | -----------4 | (blob)
	| app/type1 | -----------5 | (blob)
	| app/type1 | -----------6 | (blob)

	TABLE ranges
	| listId^*     | lowerId      | upperId      |
	----------------------------------------------
	| -----------a | ------------ | -----------3 |
	| -----------b | -----------4 | zzzzzzzzzzzz |

	TABLE lastUpdateBatchIdByGroupId:
	| groupId^*     | batchId      |
	--------------------------------
	| -----------a | -----------b |

	Two options:
		TABLE metadata
		| lastUpdateTime   | id (0) |
		|------------------|--------|
		| 1234567890       | 0      |
		|---------------------------|

		TABLE metadata						<---- We use the second one for now
		| key (PRIMARY KEY) | value     |
		|-------------------|-----------|
		| lastUpdateTime    | some date |
 */

/**
 * Wrapper around SQLite database. Used to cache entities for offline.
 */
export class OfflineDb {
	private db!: Database

	constructor(
		private readonly nativeBindingPath: string
	) {
	}

	async init(dbPath: string, databaseKey: Aes256Key, integrityCheck: boolean = true) {
		await this.openDatabase(dbPath)
		await this.initSqlcipher(databaseKey, integrityCheck, true)
		await this.createTables()
	}

	private async openDatabase(dbPath: string) {
		this.db = new sqlite(dbPath, {
			//TODO remove ts-ignore once proper definition of Options exists, see https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/59049#
			// @ts-ignore missing type
			nativeBinding: this.nativeBindingPath,
			// verbose: (message, args) => {
			// 	console.log("DB", message, args)
			// }
		})
	}

	/**
	 * FIXME configuration needs to be discussed still
	 * Initialise sqlcipher with a database key, configuration:
	 * - Sqlcipher always uses aes-256 for encryption.
	 * - Sqlcipher always creates per page hmac for integrity with sha512.
	 * - Sqlcipher generates a database salt value randomly and stores in the first 16 bytes of the database.
	 * - We pass the database key directly to sqlcipher rather than using a password and therefore do not configure key derivation.
	 * - we assume that adding entropy to entropy pool of the crypto provide (cipher_add_random) "is not necessary [...], since [openssl] does (re-)seed itself automatically using trusted system entropy sources", https://www.openssl.org/docs/man1.1.1/man3/RAND_add.html
	 * TODO migrate database if needed
	 * @param databaseKey
	 * @param wipe if true the the memory security option (that was default until 4.5, https://www.zetetic.net/blog/2021/10/28/sqlcipher-4.5.0-release/) to wipe memory allocated by SQLite internally, including the page cache is enabled.
	 * @param integrity check: if true the hmac stored with each page of the database is verified to detect modification.
	 * @throws if an error is detected during the integrity check
	 */
	private async initSqlcipher(databaseKey: Aes256Key, integrityCheck: boolean, wipe: boolean) {
		if (wipe) {
			this.db.pragma("cipher_memory_security = ON")
		}
		const bytes = bitArrayToUint8Array(databaseKey)
		const b64 = `x'${uint8ArrayToBase64(bytes)};`
		this.db.pragma(`KEY = "${b64}"`)

		if (integrityCheck) {
			this.checkIntegrity()
		}
	}

	private async createTables() {
		if (this.db === undefined) {
			throw new Error("No database")
		} else {
			await this.db.exec("CREATE TABLE IF NOT EXISTS list_entities (type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId))")
			await this.db.exec("CREATE TABLE IF NOT EXISTS element_entities (type TEXT NOT NULL, elementId TEXT NOT NULL, entity BLOB NOT NULL, PRIMARY KEY (type, elementId))")
			await this.db.exec("CREATE TABLE IF NOT EXISTS ranges (type TEXT NOT NULL, listId TEXT NOT NULL, lower TEXT NOT NULL, upper TEXT NOT NULL, PRIMARY KEY (type, listId))")
			await this.db.exec("CREATE TABLE IF NOT EXISTS lastUpdateBatchIdPerGroupId (groupId TEXT NOT NULL, batchId TEXT NOT NULL, PRIMARY KEY (groupId))")
			await this.db.exec("CREATE TABLE IF NOT EXISTS metadata (key TEXT NOT NULL, value BLOB, PRIMARY KEY (key))")
			// Register user-defined functions for comparing ids because we need to compare length first and lexicographically second
			await this.db.function("firstIdBigger", (l, r) => {
				return boolToSqlite(firstBiggerThanSecond(l, r))
			})
			await this.db.function("firstIdBiggerOrEq", (l, r) => {
				return boolToSqlite(l == r || firstBiggerThanSecond(l, r))
			})
		}
	}

	async close() {
		await this.db.close()
	}

	async put({type, listId, elementId, entity}: PersistedEntity): Promise<void> {
		if (listId == null) {
			this.db.prepare("INSERT OR REPLACE INTO element_entities VALUES (:type,:elementId,:entity)")
				.run({type, elementId, entity})
		} else {
			this.db.prepare("INSERT OR REPLACE INTO list_entities VALUES (:type,:listId,:elementId,:entity)")
				.run({type, listId, elementId, entity})
		}
	}

	async setNewRange(type: string, listId: Id, lower: Id, upper: Id): Promise<void> {
		this.db.prepare("INSERT INTO ranges VALUES (:type,:listId,:lower,:upper)").run({type, listId, lower, upper})
	}

	async setUpperRange(type: string, listId: Id, upper: Id): Promise<void> {
		const {changes} = this.db.prepare("UPDATE ranges SET upper = :upper WHERE type = :type AND listId = :listId").run({upper, type, listId})
		if (changes != 1) {
			throw new Error("Did not update row")
		}
	}

	async setLowerRange(type: string, listId: Id, lower: Id): Promise<void> {
		const {changes} = this.db.prepare("UPDATE ranges SET lower = :lower WHERE type = :type AND listId = :listId").run({lower, type, listId})
		if (changes != 1) {
			throw new Error("Did not update row")
		}
	}

	async getRange(type: string, listId: Id): Promise<{lower: string, upper: string} | null> {
		return this.db.prepare("SELECT upper, lower FROM ranges WHERE type = :type AND listId = :listId")?.get({type, listId}) ?? null
	}

	async getIdsInRange(type: string, listId: Id): Promise<Array<Id>> {
		const range = await this.getRange(type, listId)
		if (range == null) {
			throw new Error(`no range exists for ${type} and list ${listId}`)
		}
		const {lower, upper} = range
		return this.db.prepare("SELECT elementId FROM list_entities WHERE type = :type AND listId = :listId AND firstIdBiggerOrEq(elementId, :lower) AND NOT(firstIdBigger(elementId, :upper))")
				   .all({type, listId, lower, upper})
				   .map((row) => row.elementId)
	}

	//start is not included in range queries
	async provideFromRange(type: string, listId: Id, start: Id, count: number, reverse: boolean): Promise<Buffer[]> {
		if (reverse) {
			return this.db.prepare("SELECT entity FROM list_entities WHERE type = :type AND listId = :listId AND firstIdBigger(:start, elementId) ORDER BY LENGTH(elementId) DESC, elementId DESC LIMIT :count")
					   .all({type, listId, start, count})
					   .map((row) => row.entity)
		} else {
			return this.db.prepare("SELECT entity FROM list_entities WHERE type = :type AND listId = :listId AND firstIdBigger(elementId, :start) ORDER BY LENGTH(elementId) ASC, elementId ASC LIMIT :count")
					   .all({type, listId, start, count})
					   .map((row) => row.entity)
		}
	}

	async get(type: string, listId: string | null, elementId: string): Promise<Buffer | null> {
		let result
		if (listId == null) {
			result = this.db.prepare("SELECT entity from element_entities WHERE type = :type AND elementId = :elementId")
						 .get({type, elementId})
		} else {
			result = this.db.prepare("SELECT entity from list_entities WHERE type = :type AND listId = :listId AND elementId = :elementId")
						 .get({type, listId, elementId})
		}

		return result?.entity ?? null
	}

	async delete(type: string, listId: string | null, elementId: string): Promise<void> {
		if (listId == null) {
			this.db.prepare("DELETE FROM element_entities WHERE type = :type AND elementId = :elementId")
				.run({type, elementId})
		} else {
			this.db.prepare("DELETE FROM list_entities WHERE type = :type AND listId = :listId AND elementId = :elementId")
				.run({type, listId, elementId})
		}
	}

	async deleteAll() {
		this.db.prepare("DELETE FROM list_entities").run()
		this.db.prepare("DELETE FROM element_entities").run()
		this.db.prepare("DELETE FROM ranges").run()
		this.db.prepare("DELETE FROM lastUpdateBatchIdPerGroupId").run()
		this.db.prepare("DELETE FROM metadata").run()
	}


	async getLastBatchIdForGroup(groupId: Id): Promise<Id | null> {
		return this.db.prepare("SELECT batchId from lastUpdateBatchIdPerGroupId WHERE groupId = :groupId ")
				   .get({groupId})?.batchId ?? null
	}

	async putLastBatchIdForGroup(groupId: Id, batchId: Id): Promise<void> {
		this.db.prepare("INSERT OR REPLACE INTO lastUpdateBatchIdPerGroupId VALUES (:groupId,:batchId)")
			.run({groupId, batchId})
	}

	async getMetadata<K extends keyof OfflineDbMeta>(key: K): Promise<Uint8Array | null> {
		const value = this.db.prepare("SELECT value from metadata WHERE key = :key ")
						  .get({key})?.value ?? null
		return new Uint8Array(value.buffer)
	}

	async putMetadata<K extends keyof OfflineDbMeta>(key: K, value: Uint8Array): Promise<void> {
		this.db.prepare("INSERT OR REPLACE INTO metadata VALUES (:key,:value)")
			.run({key, value})
	}

	printDatabaseInfo() {
		console.log("sqlcipher version: ", this.getSqlCipherVersion())
		console.log("sqlcipher configuration: ", this.getSqlCipherConfiguration())
		this.printCipherproviderInfo()

	}

	getSqlCipherVersion() {
		return this.db.pragma("cipher_version")
	}

	getSqlCipherConfiguration() {
		return this.db.pragma("cipher_settings")
	}

	printCipherproviderInfo() {
		console.log("cipher provider: ", this.db.pragma("cipher_provider"))
		console.log("cipher provider version: ", this.db.pragma("cipher_provider_version"))

	}

	/**
	 * Throws a CryptoError if MAC verification fails
	 */
	checkIntegrity() {
		const errors: [] = this.db.pragma("cipher_integrity_check")
		if (errors.length > 0) {
			throw new CryptoError(`Integrity check failed with result : ${JSON.stringify(errors)}`)
		}
	}
}

enum SqliteBool {
	TRUE = 1,
	FALSE = 0,
}

function boolToSqlite(bool: boolean): SqliteBool {
	return bool ? SqliteBool.TRUE : SqliteBool.FALSE
}