import { log } from "../DesktopLog.js"
import { makeDbPath } from "./DbUtils.js"
import { Database, default as Sqlite } from "better-sqlite3"
import fs from "node:fs"
import { OfflineDbClosedError } from "../../api/common/error/OfflineDbClosedError.js"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { app } from "electron"
import { SqlCipherFacade } from "../../native/common/generatedipc/SqlCipherFacade.js"
import { TaggedSqlValue, tagSqlObject, untagSqlValue } from "../../api/worker/offline/SqlValue.js"
import { mapNullable } from "@tutao/tutanota-utils"

const TableDefinitions = Object.freeze({
	credentials:
		"login TEXT NOT NULL, userId TEXT NOT NULL, type TEXT NOT NULL, accessToken TEXT NOT NULL, databaseKey TEXT," +
		" encryptedPassword TEXT NOT NULL, PRIMARY KEY (userId), UNIQUE(login)",
} as const)

/**
 * Sql database for storing already encrypted user credentials
 * FIXME use worker
 * FIXME maybe a different interface
 */
export class DesktopCredentialsSqlDb implements SqlCipherFacade {
	private _db: Database | null = null
	private get db(): Database {
		if (this._db == null) {
			throw new OfflineDbClosedError() // FIXME different error
		}
		return this._db
	}

	private readonly _sqliteNativePath: string | null = null
	public static readonly dbPath: string = makeDbPath("credentials")

	constructor(sqliteNativePath: string) {
		this._sqliteNativePath = sqliteNativePath
		if (this._db == null) {
			this.create().then(() => {
				app.on("will-quit", () => this.closeDb())
			})
		}
	}

	async create(retry: boolean = true): Promise<void> {
		try {
			await this.openDb()
			await this.createTables()
		} catch (e) {
			if (!retry) throw e
			log.debug("retrying to create credentials db")
			await this.deleteDb()
			return this.create(false)
		}
	}

	async openDb(): Promise<void> {
		this._db = new Sqlite(DesktopCredentialsSqlDb.dbPath, {
			// Remove ts-ignore once proper definition of Options exists, see https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/59049#
			// @ts-ignore missing type
			nativeBinding: this._sqliteNativePath,
			// verbose: (message, args) => console.log("DB", message, args),
		})
		try {
			this.initSql()
		} catch (e) {
			// If we can't initialize the database we don't want to be stuck in a state where we hold the file lock, we need to retry the whole process again
			this.db.close()
			this._db = null
			throw e
		}
	}

	private initSql() {
		this.db.pragma("cipher_memory_security = ON")

		const errors: [] = this.db.pragma("cipher_integrity_check")
		if (errors.length > 0) {
			throw new CryptoError(`Integrity check failed with result : ${JSON.stringify(errors)}`)
		}
	}

	async closeDb(): Promise<void> {
		this.db.close()
		this._db = null
	}

	async deleteDb(): Promise<void> {
		log.debug("deleting credentials db")
		await fs.promises.rm(DesktopCredentialsSqlDb.dbPath, { maxRetries: 3, force: true })
	}

	private async createTables() {
		for (let [name, definition] of Object.entries(TableDefinitions)) {
			await this.run(`CREATE TABLE IF NOT EXISTS ${name} (${definition})`, [])
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

	lockRangesDbAccess(): Promise<void> {
		throw new Error("Method not implemented.")
	}
	unlockRangesDbAccess(): Promise<void> {
		throw new Error("Method not implemented.")
	}
}
