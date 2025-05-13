import { OfflineDbMeta, OfflineStorage } from "./OfflineStorage.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { SqlCipherFacade } from "../../../native/common/generatedipc/SqlCipherFacade.js"
import { OutOfSyncError } from "../../common/error/OutOfSyncError.js"
import { offline5 } from "./migrations/offline-v5.js"
import { offline6 } from "./migrations/offline-v6.js"
import { offline7 } from "./migrations/offline-v7"
import { offline8 } from "./migrations/offline-v8"

export interface OfflineMigration {
	readonly version: number

	migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade): Promise<void>
}

/**
 * List of migrations that will be run when needed. Please add your migrations to the list.
 *
 * Normally you should only add them to the end of the list but with offline ones it can be a bit tricky since they change the db structure itself so sometimes
 * they should rather be in the beginning.
 */
export const OFFLINE_STORAGE_MIGRATIONS: ReadonlyArray<OfflineMigration> = [offline5, offline6, offline7, offline8]

// in cases where the actual migration is not there anymore (we clean up old migrations no client would apply anymore)
// and we create a new offline database, we still need to set the offline version to the current value.
export const CURRENT_OFFLINE_VERSION = 7

/**
 * Migrator for the offline storage between different versions of model. It is tightly couples to the versions of API entities: every time we make an
 * "incompatible" change to the API model we need to update offline database somehow.
 *
 * Migrations are done manually but there are a few checks done:
 *  - compile time check that migration exists and is used in this file
 *  - runtime check that runtime model is compatible to the stored one after all the migrations are done.
 *
 *  To add a new migration create a migration with the filename matching ./migrations/{app}-v{version}.ts and use it in the `migrations` field on this
 *  migrator.
 *
 *  Migrations might read and write to the database and they should use StandardMigrations when needed.
 */
export class OfflineStorageMigrator {
	constructor(private readonly migrations: ReadonlyArray<OfflineMigration>) {}

	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		const meta = await storage.dumpMetadata()

		// We did not write down the "offline" version from the beginning, so we need to figure out if we need to run the migration for the db structure or
		// not. Previously we've been checking that there's something in the meta table which is a pretty decent check. Unfortunately we had multiple bugs
		// which resulted in a state where we would re-create the offline db but not populate the meta table with the versions, the only thing that would be
		// written is lastUpdateTime.
		// {}                                                               -> new db, do not migrate offline
		// {"base-version": 1, "lastUpdateTime": 123, "offline-version": 1} -> up-to-date db, do not migrate offline
		// {"lastUpdateTime": 123}                                          -> broken state after the buggy recreation of db, delete the db
		// {"base-version": 1, "lastUpdateTime": 123}                       -> some very old state where we would actually have to migrate offline
		if (Object.keys(meta).length === 1 && meta.lastUpdateTime != null) {
			throw new OutOfSyncError("Invalid DB state, missing model versions")
		}

		const populatedMeta = await this.populateModelVersions(meta, storage)

		if (this.isDbNewerThanCurrentClient(populatedMeta)) {
			throw new OutOfSyncError(`offline database has newer schema than client`)
		}

		await this.runMigrations(meta, storage, sqlCipherFacade)
	}

	private async runMigrations(meta: Partial<OfflineDbMeta>, storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		for (const { version, migrate } of this.migrations) {
			const storedOfflineVersion = meta[`offline-version`]!
			if (storedOfflineVersion < version) {
				console.log(`running offline db migration from ${storedOfflineVersion} to ${version}`)
				await migrate(storage, sqlCipherFacade)
				console.log("migration finished")
				await storage.setCurrentOfflineSchemaVersion(version)
			}
		}
	}

	private async populateModelVersions(meta: Readonly<Partial<OfflineDbMeta>>, storage: OfflineStorage): Promise<Partial<OfflineDbMeta>> {
		// copy metadata because it's going to be mutated
		const newMeta = { ...meta }
		await this.prepopulateVersionIfAbsent(CURRENT_OFFLINE_VERSION, newMeta, storage)
		return newMeta
	}

	/**
	 * update the metadata table to initialize the row of the app with the given schema version
	 *
	 * NB: mutates meta
	 */
	private async prepopulateVersionIfAbsent(version: number, meta: Partial<OfflineDbMeta>, storage: OfflineStorage) {
		const storedVersion = meta["offline-version"]
		if (storedVersion == null) {
			meta["offline-version"] = version
			await storage.setCurrentOfflineSchemaVersion(version)
		}
	}

	/**
	 * it's possible that the user installed an older client over a newer one.
	 * if the offline schema changed between the clients, it's likely that the old client can't even understand
	 * the structure of the db. we're going to delete it and not migrate at all.
	 * @private
	 *
	 * @returns true if the database we're supposed to migrate has any higher schema versions than our schema version
	 */
	private isDbNewerThanCurrentClient(meta: Partial<OfflineDbMeta>): boolean {
		return assertNotNull(meta[`offline-version`]) > CURRENT_OFFLINE_VERSION
	}
}
