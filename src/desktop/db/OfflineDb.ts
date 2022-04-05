import {Database, default as sqlite} from "better-sqlite3"
import {firstBiggerThanSecond} from "../../api/common/utils/EntityUtils"
import {bitArrayToUint8Array, CryptoError} from "@tutao/tutanota-crypto"
import {OfflineDbMeta} from "../../api/worker/rest/OfflineStorage"
import {uint8ArrayToBase64} from "@tutao/tutanota-utils"

export interface PersistedEntity {
	type: string,
	listId: Id | null,
	elementId: Id,
	entity: Uint8Array,
}

const TableDefinitions = Object.freeze({
	list_entities: "(type TEXT NOT NULL, listId TEXT NOT NULL, elementId TEXT NOT NULL, entity BLOB NOT NULL, PRIMARY KEY (type, listId, elementId))",
	element_entities: "(type TEXT NOT NULL, elementId TEXT NOT NULL, entity BLOB NOT NULL, PRIMARY KEY (type, elementId))",
	ranges: "(type TEXT NOT NULL, listId TEXT NOT NULL, lower TEXT NOT NULL, upper TEXT NOT NULL, PRIMARY KEY (type, listId))",
	lastUpdateBatchIdPerGroupId: "(groupId TEXT NOT NULL, batchId TEXT NOT NULL, PRIMARY KEY (groupId))",
	metadata: "(key TEXT NOT NULL, value BLOB, PRIMARY KEY (key))",
} as const)

/**
 * Wrapper around SQLite database. Used to cache entities for offline.
 */
export class OfflineDb {
	private db!: Database

	constructor(
		private readonly nativeBindingPath: string
	) {
	}

	init(dbPath: string, databaseKey: Aes256Key, integrityCheck: boolean = true) {
		this.openDatabase(dbPath)
		this.initSqlcipher(databaseKey, integrityCheck, true)
		this.createTables()
	}

	private openDatabase(dbPath: string) {
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
	 * @param integrityCheck: if true the hmac stored with each page of the database is verified to detect modification.
	 * @throws if an error is detected during the integrity check
	 */
	private initSqlcipher(databaseKey: Aes256Key, integrityCheck: boolean, wipe: boolean) {
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

	private createTables() {
		if (this.db === undefined) {
			throw new Error("No database")
		} else {

			for (let [name, definition] of Object.entries(TableDefinitions)) {
				this.db.exec(`CREATE TABLE IF NOT EXISTS ${name} ${definition}`)
			}

			// Register user-defined functions for comparing ids because we need to compare length first and lexicographically second
			this.db.function("firstIdBigger", (l, r) => {
				return boolToSqlite(firstBiggerThanSecond(l, r))
			})
			this.db.function("firstIdBiggerOrEq", (l, r) => {
				return boolToSqlite(l == r || firstBiggerThanSecond(l, r))
			})
		}
	}

	purge() {
		for (let name of Object.keys(TableDefinitions)) {
			this.db.exec(`DELETE FROM ${name}`)
		}
	}

	close() {
		this.db.close()
	}

	put({type, listId, elementId, entity}: PersistedEntity) {
		if (listId == null) {
			this.db.prepare("INSERT OR REPLACE INTO element_entities VALUES (:type,:elementId,:entity)")
				.run({type, elementId, entity})
		} else {
			this.db.prepare("INSERT OR REPLACE INTO list_entities VALUES (:type,:listId,:elementId,:entity)")
				.run({type, listId, elementId, entity})
		}
	}

	setNewRange(type: string, listId: Id, lower: Id, upper: Id) {
		this.db.prepare("INSERT INTO ranges VALUES (:type,:listId,:lower,:upper)").run({type, listId, lower, upper})
	}

	setUpperRange(type: string, listId: Id, upper: Id) {
		const {changes} = this.db.prepare("UPDATE ranges SET upper = :upper WHERE type = :type AND listId = :listId").run({upper, type, listId})
		if (changes != 1) {
			throw new Error("Did not update row")
		}
	}

	setLowerRange(type: string, listId: Id, lower: Id) {
		const {changes} = this.db.prepare("UPDATE ranges SET lower = :lower WHERE type = :type AND listId = :listId").run({lower, type, listId})
		if (changes != 1) {
			throw new Error("Did not update row")
		}
	}

	getRange(type: string, listId: Id): {lower: string, upper: string} | null {
		return this.db.prepare("SELECT upper, lower FROM ranges WHERE type = :type AND listId = :listId")?.get({type, listId}) ?? null
	}

	getIdsInRange(type: string, listId: Id): Array<Id> {
		const range = this.getRange(type, listId)
		if (range == null) {
			throw new Error(`no range exists for ${type} and list ${listId}`)
		}
		const {lower, upper} = range
		return this.db.prepare("SELECT elementId FROM list_entities WHERE type = :type AND listId = :listId AND firstIdBiggerOrEq(elementId, :lower) AND NOT(firstIdBigger(elementId, :upper))")
				   .all({type, listId, lower, upper})
				   .map((row) => row.elementId)
	}

	//start is not included in range queries
	provideFromRange(type: string, listId: Id, start: Id, count: number, reverse: boolean): Buffer[] {
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

	get(type: string, listId: string | null, elementId: string): Buffer | null {
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

	delete(type: string, listId: string | null, elementId: string) {
		if (listId == null) {
			this.db.prepare("DELETE FROM element_entities WHERE type = :type AND elementId = :elementId")
				.run({type, elementId})
		} else {
			this.db.prepare("DELETE FROM list_entities WHERE type = :type AND listId = :listId AND elementId = :elementId")
				.run({type, listId, elementId})
		}
	}

	getLastBatchIdForGroup(groupId: Id): Id | null {
		return this.db.prepare("SELECT batchId from lastUpdateBatchIdPerGroupId WHERE groupId = :groupId ")
				   .get({groupId})?.batchId ?? null
	}

	putLastBatchIdForGroup(groupId: Id, batchId: Id) {
		this.db.prepare("INSERT OR REPLACE INTO lastUpdateBatchIdPerGroupId VALUES (:groupId,:batchId)")
			.run({groupId, batchId})
	}

	getMetadata<K extends keyof OfflineDbMeta>(key: K): Uint8Array | null {
		const value: Buffer | null = this.db.prepare("SELECT value from metadata WHERE key = :key ")
										 .get({key})?.value ?? null

		if (value) {
			return new Uint8Array(value.buffer)
		} else {
			return null
		}
	}

	putMetadata<K extends keyof OfflineDbMeta>(key: K, value: Uint8Array) {
		this.db.prepare("INSERT OR REPLACE INTO metadata VALUES (:key,:value)")
			.run({key, value})
	}

	printDatabaseInfo() {
		console.log("sqlcipher version: ", this.db.pragma("cipher_version"))
		console.log("sqlcipher configuration: ", this.db.pragma("cipher_settings"))
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