import { OfflineDbMeta, OfflineStorage, VersionMetadataBaseKey } from "./OfflineStorage.js"
import { ModelInfos } from "../../common/EntityFunctions.js"
import { assertNotNull, typedEntries, typedKeys } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { sys75 } from "./migrations/sys-v75.js"
import { sys76 } from "./migrations/sys-v76.js"
import { tutanota54 } from "./migrations/tutanota-v54.js"
import { sys79 } from "./migrations/sys-v79.js"
import { sys80 } from "./migrations/sys-v80.js"
import { SqlCipherFacade } from "../../../native/common/generatedipc/SqlCipherFacade.js"
import { offline1 } from "./migrations/offline-v1.js"
import { tutanota56 } from "./migrations/tutanota-v56.js"
import { tutanota58 } from "./migrations/tutanota-v58.js"
import { storage6 } from "./migrations/storage-v6.js"
import { tutanota57 } from "./migrations/tutanota-v57.js"
import { OutOfSyncError } from "../../common/error/OutOfSyncError.js"
import { sys83 } from "./migrations/sys-v83.js"
import { tutanota60 } from "./migrations/tutanota-v60.js"
import { sys84 } from "./migrations/sys-v84.js"
import { tutanota61 } from "./migrations/tutanota-v61.js"
import { sys85 } from "./migrations/sys-v85.js"
import { accounting5 } from "./migrations/accounting-v5.js"
import { sys86 } from "./migrations/sys-v86.js"
import { sys87 } from "./migrations/sys-v87.js"
import { sys88 } from "./migrations/sys-v88.js"
import { tutanota62 } from "./migrations/tutanota-v62.js"
import { sys89 } from "./migrations/sys-v89.js"

export interface OfflineMigration {
	readonly app: VersionMetadataBaseKey
	readonly version: number

	migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade): Promise<void>
}

/**
 * List of migrations that will be run when needed. Please add your migrations to the list.
 *
 * Normally you should only add them to the end of the list but with offline ones it can be a bit tricky since they change the db structure itself so sometimes
 * they should rather be in the beginning.
 */
export const OFFLINE_STORAGE_MIGRATIONS: ReadonlyArray<OfflineMigration> = [
	offline1,
	sys75, // DB dropped in offline1
	sys76, // DB dropped in offline1
	sys79, // DB dropped in offline1
	sys80, // DB dropped in offline1
	tutanota54, // DB dropped in offline1
	tutanota56,
	tutanota57,
	tutanota58,
	tutanota60,
	storage6,
	sys83,
	accounting5,
	sys84,
	tutanota61,
	sys85,
	sys86,
	sys87,
	sys88,
]

const CURRENT_OFFLINE_VERSION = 1

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
	constructor(private readonly migrations: ReadonlyArray<OfflineMigration>, private readonly modelInfos: ModelInfos) {}

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
		await this.checkStateAfterMigrations(storage)
	}

	private async checkStateAfterMigrations(storage: OfflineStorage) {
		// Check that all the necessary migrations have been run, at least to the point where we are compatible.
		const meta = await storage.dumpMetadata()
		for (const app of typedKeys(this.modelInfos)) {
			const compatibleSince = this.modelInfos[app].compatibleSince
			let metaVersion = meta[`${app}-version`]!
			if (metaVersion < compatibleSince) {
				throw new ProgrammingError(
					`You forgot to migrate your databases! ${app}.version should be >= ${this.modelInfos[app].compatibleSince} but in db it is ${metaVersion}`,
				)
			}
		}
	}

	private async runMigrations(meta: Partial<OfflineDbMeta>, storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		for (const { app, version, migrate } of this.migrations) {
			const storedVersion = meta[`${app}-version`]!
			if (storedVersion < version) {
				console.log(`running offline db migration for ${app} from ${storedVersion} to ${version}`)
				await migrate(storage, sqlCipherFacade)
				console.log("migration finished")
				await storage.setStoredModelVersion(app, version)
			}
		}
	}

	private async populateModelVersions(meta: Readonly<Partial<OfflineDbMeta>>, storage: OfflineStorage): Promise<Partial<OfflineDbMeta>> {
		// We did not write down the "offline" version from the beginning, so we need to figure out if we need to run the migration for the db structure or
		// not. New DB will have up-to-date table definition but no metadata keys.
		const isNewDb = Object.keys(meta).length === 0

		// copy metadata because it's going to be mutated
		const newMeta = { ...meta }
		// Populate model versions if they haven't been written already
		for (const app of typedKeys(this.modelInfos)) {
			await this.prepopulateVersionIfNecessary(app, this.modelInfos[app].version, newMeta, storage)
		}

		if (isNewDb) {
			console.log(`new db, setting "offline" version to ${CURRENT_OFFLINE_VERSION}`)
			// this migration is not necessary for new databases and we want our canonical table definitions to represent the current state
			await this.prepopulateVersionIfNecessary("offline", CURRENT_OFFLINE_VERSION, newMeta, storage)
		} else {
			// we need to put 0 in because we expect all versions to be populated
			await this.prepopulateVersionIfNecessary("offline", 0, newMeta, storage)
		}
		return newMeta
	}

	/**
	 * update the metadata table to initialize the row of the app with the given model version
	 *
	 * NB: mutates meta
	 */
	private async prepopulateVersionIfNecessary(app: VersionMetadataBaseKey, version: number, meta: Partial<OfflineDbMeta>, storage: OfflineStorage) {
		const key = `${app}-version` as const
		const storedVersion = meta[key]
		if (storedVersion == null) {
			meta[key] = version
			await storage.setStoredModelVersion(app, version)
		}
	}

	/**
	 * it's possible that the user installed an older client over a newer one, and we don't have backwards migrations.
	 * in that case, it's likely that the client can't even understand the contents of the db.
	 * we're going to delete it and not migrate at all.
	 * @private
	 *
	 * @returns true if the database we're supposed to migrate has any higher model versions than our highest migration for that model, false otherwise
	 */
	private isDbNewerThanCurrentClient(meta: Partial<OfflineDbMeta>): boolean {
		for (const [app, { version }] of typedEntries(this.modelInfos)) {
			const storedVersion = meta[`${app}-version`]!
			if (storedVersion > version) {
				return true
			}
		}

		return assertNotNull(meta[`offline-version`]) > CURRENT_OFFLINE_VERSION
	}
}
