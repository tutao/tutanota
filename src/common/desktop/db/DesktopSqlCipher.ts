import { Database } from "@signalapp/sqlcipher"
import { mapNullable, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { OfflineDbClosedError } from "../../api/common/error/OfflineDbClosedError.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"
import { TaggedSqlValue, tagSqlObject, untagSqlValue } from "../../api/worker/offline/SqlValue.js"

export class DesktopSqlCipher implements SqlCipherFacade {
	private _db: Database | null = null
	private get db(): Database {
		if (this._db == null) {
			throw new OfflineDbClosedError()
		}
		return this._db
	}

	/**
	 * @param dbPath the path to the database file to use
	 * @param integrityCheck whether to check the integrity of the db file during initialization
	 */
	constructor(
		private readonly dbPath: string,
		private readonly integrityCheck: boolean,
	) {
		process.on("exit", () => this._db?.close())
	}

	async openDb(userId: string, dbKey: Uint8Array): Promise<void> {
		this._db = new Database(this.dbPath)
		try {
			this.initSqlcipher({ databaseKey: dbKey, enableMemorySecurity: true, integrityCheck: this.integrityCheck })
		} catch (e) {
			// If we can't initialize the database we don't want to be stuck in a state where we hold the file lock, we need to retry the whole process again
			this.db.close()
			this._db = null
			throw e // "file is not a database" is most likely wrong database key
		}
		// must be done *after* SQLCipher is initialized, or it will fail with "database is not a file" error
		this._db.initTokenizer()
	}

	async closeDb(): Promise<void> {
		try {
			// We are performing defragmentation (incremental_vacuum) the database before closing.
			// But if it fails for some reason we don't want ot get stuck with non-closed database that we cannot delete so we close it and rethrow.
			this.db.pragma("incremental_vacuum")
		} finally {
			this.db.close()
			this._db = null
		}
	}

	/**
	 * not implemented because we delete the DB directly from the per-window facade
	 */
	deleteDb(userId: string): Promise<void> {
		throw new ProgrammingError("Not implemented")
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
	private initSqlcipher({
		databaseKey,
		enableMemorySecurity,
		integrityCheck,
	}: {
		databaseKey: Uint8Array
		enableMemorySecurity: boolean
		// integrity check breaks tests
		integrityCheck: boolean
	}) {
		// disable MEMORY sqlcipher logs
		// see https://github.com/tutao/tutanota/issues/8589
		this.db.pragma("cipher_log_source = NONE")
		this.db.pragma("cipher_log_source = CORE")
		this.db.pragma("cipher_log_source = PROVIDER")
		this.db.pragma("cipher_log_source = MUTEX")

		if (enableMemorySecurity) {
			this.db.pragma("cipher_memory_security = ON")
		}

		const key = `x'${uint8ArrayToHex(databaseKey)}'`
		this.db.pragma(`KEY = "${key}"`)

		// We are using the auto_vacuum=incremental mode to allow for a faster vacuum execution
		// After changing the auto_vacuum mode we need to run "vacuum" once
		// auto_vacuum mode: 0 (NONE) | 1 (FULL) | 2 (INCREMENTAL)
		if (this.db.pragma("auto_vacuum", { simple: true }) != 2) {
			this.db.pragma("auto_vacuum = incremental")
			this.db.pragma("vacuum")
		}

		if (integrityCheck) {
			this.checkIntegrity()
		}
	}

	/**
	 * Execute a query
	 */
	async run(query: string, params: TaggedSqlValue[]): Promise<void> {
		this.db.prepare(query).run(params.map(untagSqlValue))
	}

	/**
	 * Execute a query
	 * @returns a single object or undefined if the query returns nothing
	 */
	async get(query: string, params: TaggedSqlValue[]): Promise<Record<string, TaggedSqlValue> | null> {
		const result = this.db.prepare(query).get(params.map(untagSqlValue)) ?? null
		return mapNullable(result, tagSqlObject)
	}

	/**
	 * Execute a query
	 * @returns a list of objects or an empty list if the query returns nothing
	 */
	async all(query: string, params: TaggedSqlValue[]): Promise<Array<Record<string, TaggedSqlValue>>> {
		const result = this.db.prepare(query).all(params.map(untagSqlValue))
		return result.map(tagSqlObject)
	}

	async tokenize(query: string): Promise<ReadonlyArray<string>> {
		return this.db.signalTokenize(query)
	}

	private checkIntegrity() {
		/**
		 * Throws a CryptoError if MAC verification fails
		 */
		const errors = this.db.pragma("cipher_integrity_check")
		if (errors.length > 0) {
			throw new CryptoError(`Integrity check failed with result : ${JSON.stringify(errors)}`)
		}
	}
}
