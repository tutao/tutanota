import { OfflineDbMeta, OfflineStorage, VersionMetadataBaseKey } from "./OfflineStorage.js"
import { ModelInfos } from "../../common/EntityFunctions.js"
import { assertNotNull, typedEntries, typedKeys } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { SqlCipherFacade } from "../../../native/common/generatedipc/SqlCipherFacade.js"
import { OutOfSyncError } from "../../common/error/OutOfSyncError.js"
import { sys94 } from "./migrations/sys-v94.js"
import { tutanota66 } from "./migrations/tutanota-v66.js"
import { sys92 } from "./migrations/sys-v92.js"
import { tutanota65 } from "./migrations/tutanota-v65.js"
import { sys91 } from "./migrations/sys-v91.js"
import { sys90 } from "./migrations/sys-v90.js"
import { tutanota64 } from "./migrations/tutanota-v64.js"
import { tutanota67 } from "./migrations/tutanota-v67.js"
import { sys96 } from "./migrations/sys-v96.js"
import { tutanota69 } from "./migrations/tutanota-v69.js"
import { sys97 } from "./migrations/sys-v97.js"
import { tutanota71 } from "./migrations/tutanota-v71.js"
import { sys99 } from "./migrations/sys-v99.js"
import { sys101 } from "./migrations/sys-v101.js"
import { sys102 } from "./migrations/sys-v102.js"
import { tutanota72 } from "./migrations/tutanota-v72.js"
import { sys103 } from "./migrations/sys-v103.js"
import { tutanota73 } from "./migrations/tutanota-v73.js"
import { sys104 } from "./migrations/sys-v104.js"
import { sys105 } from "./migrations/sys-v105.js"
import { sys106 } from "./migrations/sys-v106.js"
import { tutanota74 } from "./migrations/tutanota-v74.js"
import { sys107 } from "./migrations/sys-v107.js"
import { tutanota75 } from "./migrations/tutanota-v75.js"
import { sys111 } from "./migrations/sys-v111.js"

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
	sys90,
	tutanota64,
	sys91,
	tutanota65,
	sys92,
	tutanota66,
	sys94,
	tutanota67,
	sys96,
	tutanota69,
	sys97,
	tutanota71,
	sys99,
	sys101,
	sys102,
	tutanota72,
	sys103,
	tutanota73,
	sys104,
	sys105,
	sys106,
	tutanota74,
	tutanota75,
	sys107,
	tutanota75,
	sys111,
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
		// copy metadata because it's going to be mutated
		const newMeta = { ...meta }
		// Populate model versions if they haven't been written already
		for (const app of typedKeys(this.modelInfos)) {
			await this.prepopulateVersionIfAbsent(app, this.modelInfos[app].version, newMeta, storage)
		}

		await this.prepopulateVersionIfAbsent("offline", CURRENT_OFFLINE_VERSION, newMeta, storage)
		return newMeta
	}

	/**
	 * update the metadata table to initialize the row of the app with the given model version
	 *
	 * NB: mutates meta
	 */
	private async prepopulateVersionIfAbsent(app: VersionMetadataBaseKey, version: number, meta: Partial<OfflineDbMeta>, storage: OfflineStorage) {
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
