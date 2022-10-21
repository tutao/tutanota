import {OfflineDbMeta, OfflineStorage, VersionMetadataBaseKey} from "./OfflineStorage.js"
import {ModelInfos} from "../../common/EntityFunctions.js"
import {typedKeys} from "@tutao/tutanota-utils"
import {ProgrammingError} from "../../common/error/ProgrammingError.js"
import {sys75} from "./migrations/sys-v75.js"
import {sys76} from "./migrations/sys-v76.js"
import {tutanota54} from "./migrations/tutanota-v54.js"
import {sys79} from "./migrations/sys-v79.js"
import {sys80} from "./migrations/sys-v80.js"
import {SqlCipherFacade} from "../../../native/common/generatedipc/SqlCipherFacade.js"
import {offline1} from "./migrations/offline-v1.js"

export interface OfflineMigration {
	readonly app: VersionMetadataBaseKey
	readonly version: number

	migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade): Promise<void>
}

/** List of migrations that will be run when needed. Please add your migrations to the list. */
export const OFFLINE_STORAGE_MIGRATIONS: ReadonlyArray<OfflineMigration> = [
	sys75,
	sys76,
	sys79,
	sys80,
	tutanota54,
	offline1,
]

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

	constructor(
		private readonly migrations: ReadonlyArray<OfflineMigration>,
		private readonly modelInfos: ModelInfos
	) {
	}

	async migrate(storage: OfflineStorage, sqlCipherFacade: SqlCipherFacade) {
		let meta = await storage.dumpMetadata()
		const isNewDb = Object.keys(meta).length === 0

		// Populate model versions if they haven't been written already
		for (const app of typedKeys(this.modelInfos)) {
			await this.prepopulateVersionIfNecessary(app, this.modelInfos[app].version, meta, storage)
		}

		if (isNewDb) {
			console.log(`new db, populating "offline" version`)
			// this migration is not necessary for new databases and we want our canonical table definitions to represent the current state
			await this.prepopulateVersionIfNecessary("offline", 1, meta, storage)
		}

		// Run the migrations
		for (const {app, version, migrate} of this.migrations) {
			const storedVersion = meta[`${app}-version`]!
			if (storedVersion < version) {
				console.log(`running offline db migration for ${app} from ${storedVersion} to ${version}`)
				await migrate(storage, sqlCipherFacade)
				console.log("migration finished")
				await storage.setStoredModelVersion(app, version)
			}
		}

		// Check that all the necessary migrations have been run, at least to the point where we are compatible.
		meta = await storage.dumpMetadata()
		for (const app of typedKeys(this.modelInfos)) {
			const compatibleSince = this.modelInfos[app].compatibleSince
			let metaVersion = meta[`${app}-version`]!
			if (metaVersion < compatibleSince) {
				throw new ProgrammingError(`You forgot to migrate your databases! ${app}.version should be >= ${this.modelInfos[app].compatibleSince} but in db it is ${metaVersion}`)
			}
		}
	}

	/**
	 * update the metadata table to initialize the row of the app with the given model version
	 */
	private async prepopulateVersionIfNecessary(app: VersionMetadataBaseKey, version: number, meta: Partial<OfflineDbMeta>, storage: OfflineStorage) {
		const key = `${app}-version` as const
		const storedVersion = meta[key]
		if (storedVersion == null) {
			meta[key] = version
			await storage.setStoredModelVersion(app, version)
		}
	}
}