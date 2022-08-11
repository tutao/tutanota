import {Database, default as sqlite} from "better-sqlite3";
import {CryptoError} from "@tutao/tutanota-crypto"
import {assertNotNull, mapNullable, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import {SqlCipherFacade} from "../native/common/generatedipc/SqlCipherFacade.js"
import {TaggedSqlValue, tagSqlObject, untagSqlObject, untagSqlValue} from "../api/worker/offline/SqlValue.js"
import {firstBiggerThanSecond} from "../api/common/utils/EntityUtils.js"

export class DesktopSqlCipher implements SqlCipherFacade {
	private _db: Database | null = null
	private get db(): Database {
		return assertNotNull(this._db)
	}

	/**
	 * @param nativeBindingPath the path to the sqlite native module
	 */
	constructor(
		private readonly nativeBindingPath: string,
		private readonly dbPath: string,
		private readonly integrityCheck: boolean,
	) {
	}


	async openDb(userId: string, dbKey: Uint8Array): Promise<void> {
		this._db = new sqlite(this.dbPath, {
			// Remove ts-ignore once proper definition of Options exists, see https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/59049#
			// @ts-ignore missing type
			nativeBinding: this.nativeBindingPath,
			// verbose: (message, args) => {
			// 	console.log("DB", message, args)
			// }
		})
		this.initSqlcipher({databaseKey: dbKey, enableMemorySecurity: true, integrityCheck: this.integrityCheck})
		// FIXME: move me away
		this.function("firstIdBigger", (l, r) => {
			return boolToSqlite(firstBiggerThanSecond(l, r))
		})
		this.function("firstIdBiggerOrEq", (l, r) => {
			return boolToSqlite(l == r || firstBiggerThanSecond(l, r))
		})
	}

	async closeDb(): Promise<void> {
		this.db.close()
	}

	deleteDb(userId: string): Promise<void> {
		throw new Error("Not implemented")
	}

	/**
	 * Initialise sqlcipher with a database key, configuration:
	 * - Sqlcipher always uses aes-256 for encryption.
	 * - Sqlcipher always creates per page hmac for integrity with sha512.
	 * - Sqlcipher generates a database salt value randomly and stores in the first 16 bytes of the database.
	 * - We pass the database key directly to sqlcipher rather than using a password and therefore do not configure key derivation.
	 * - we assume that adding entropy to entropy pool of the crypto provide (cipher_add_random) "is not necessary [...], since [openssl] does (re-)seed itself automatically using trusted system entropy sources", https://www.openssl.org/docs/man1.1.1/man3/RAND_add.html
	 * @param databaseKey
	 * @param enableMemorySecurity if true the the memory security option (that was default until 4.5, https://www.zetetic.net/blog/2021/10/28/sqlcipher-4.5.0-release/) to wipe memory allocated by SQLite internally, including the page cache is enabled.
	 * @param integrityCheck: if true the hmac stored with each page of the database is verified to detect modification.
	 * @throws if an error is detected during the integrity check
	 */
	private initSqlcipher(
		{databaseKey, enableMemorySecurity, integrityCheck}: {
			databaseKey: Uint8Array,
			enableMemorySecurity: boolean,
			// integrity check breaks tests
			integrityCheck: boolean
		}
	) {
		if (enableMemorySecurity) {
			this.db.pragma("cipher_memory_security = ON")
		}
		const key = `x'${uint8ArrayToBase64(databaseKey)};`
		this.db.pragma(`KEY = "${key}"`)

		if (integrityCheck) {
			this.checkIntegrity()
		}
	}

	/**
	 * Define a function that can be used in queries
	 */
	function(functionName: string, functionCallback: (...params: any[]) => any) {
		this.db.function(functionName, functionCallback)
	}

	/**
	 * Execute a query
	 */
	async run(
		query: string,
		params: TaggedSqlValue[],
	): Promise<void> {
		this.db.prepare(query).run(params.map(untagSqlValue))
	}

	/**
	 * Execute a query
	 * @returns a single object or undefined if the query returns nothing
	 */
	async get(
		query: string,
		params: TaggedSqlValue[],
	): Promise<Record<string, TaggedSqlValue> | null> {
		const result = this.db.prepare(query).get(params.map(untagSqlValue)) ?? null
		return mapNullable(result, tagSqlObject)
	}

	/**
	 * Execute a query
	 * @returns a list of objects or an empty list if the query returns nothing
	 */
	async all(
		query: string,
		params: TaggedSqlValue[],
		): Promise<Array<Record<string, TaggedSqlValue>>> {
		const result = this.db.prepare(query).all(params.map(untagSqlValue))
		return result.map(tagSqlObject)
	}

	private checkIntegrity() {
		/**
		 * Throws a CryptoError if MAC verification fails
		 */
		const errors: [] = this.db.pragma("cipher_integrity_check")
		if (errors.length > 0) {
			throw new CryptoError(`Integrity check failed with result : ${JSON.stringify(errors)}`)
		}
	}
}

function boolToSqlite(bool: boolean): SqliteBool {
	return bool ? SqliteBool.TRUE : SqliteBool.FALSE
}

enum SqliteBool {
	TRUE = 1,
	FALSE = 0,
}