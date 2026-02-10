import o from "@tutao/otest"
import {
	assertLastMigrationConsistentVersion,
	CURRENT_OFFLINE_VERSION,
	OFFLINE_STORAGE_MIGRATIONS,
	OfflineMigration,
	OfflineStorageMigrator,
} from "../../../../../src/common/api/worker/offline/OfflineStorageMigrator.js"
import { OfflineStorage } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"
import { func, instance, matchers, object, when } from "testdouble"
import { verify } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade.js"
import { maxBy } from "@tutao/tutanota-utils"
import { ApplicationTypesFacade } from "../../../../../src/common/api/worker/facades/ApplicationTypesFacade"

o.spec("OfflineStorageMigrator", function () {
	let migrations: OfflineMigration[]
	let migrator: OfflineStorageMigrator
	let storage: OfflineStorage
	let sqlCipherFacade: SqlCipherFacade
	let applicationTypesFacadeMock: ApplicationTypesFacade

	o.beforeEach(function () {
		migrations = []
		storage = instance(OfflineStorage)
		applicationTypesFacadeMock = object()
		migrator = new OfflineStorageMigrator(migrations, applicationTypesFacadeMock)
		sqlCipherFacade = object()
	})

	o.test("when there's an empty database the current model versions are written and migrations are not run", async function () {
		when(storage.dumpMetadata()).thenResolve({})
		const migration: OfflineMigration = {
			version: CURRENT_OFFLINE_VERSION,
			migrate: func() as OfflineMigration["migrate"],
		}
		migrations.push(migration)

		await migrator.migrate(storage, sqlCipherFacade)
		verify(storage.setCurrentOfflineSchemaVersion(CURRENT_OFFLINE_VERSION))
		verify(migration.migrate(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
	})

	o.test("when the model version is written it is not overwritten", async function () {
		when(storage.dumpMetadata()).thenResolve({ "offline-version": 5 })

		await migrator.migrate(storage, sqlCipherFacade)

		verify(storage.setCurrentOfflineSchemaVersion(matchers.anything()), { times: 0 })
	})

	o.test("when migration exists and the version is incompatible the migration is run", async function () {
		// stored is older than current so we actually "migrate" something
		when(storage.dumpMetadata()).thenResolve({ "offline-version": 4 }, { "offline-version": CURRENT_OFFLINE_VERSION })
		const migration: OfflineMigration = {
			version: CURRENT_OFFLINE_VERSION,
			migrate: func() as OfflineMigration["migrate"],
		}
		migrations.push(migration)

		await migrator.migrate(storage, sqlCipherFacade)

		verify(migration.migrate(storage, sqlCipherFacade, applicationTypesFacadeMock))
		verify(storage.setCurrentOfflineSchemaVersion(CURRENT_OFFLINE_VERSION))
	})

	o.test("when the last migration has inconsistent version it throws", async function () {
		// stored is older than current so we actually "migrate" something
		when(storage.dumpMetadata()).thenResolve({ "offline-version": 4 }, { "offline-version": CURRENT_OFFLINE_VERSION })
		const migration: OfflineMigration = {
			version: CURRENT_OFFLINE_VERSION - 1,
			migrate: func() as OfflineMigration["migrate"],
		}
		migrations.push(migration)

		await o.check(() => migrator.migrate(storage, sqlCipherFacade)).asyncThrows(ProgrammingError)

		verify(migration.migrate(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		verify(storage.setCurrentOfflineSchemaVersion(matchers.anything()), { times: 0 })
	})

	o.test("real migration list: consistent with the latest version", async function () {
		assertLastMigrationConsistentVersion(OFFLINE_STORAGE_MIGRATIONS)
	})

	o("ensure CURRENT_OFFLINE_VERSION matches the greatest registered migration", async function () {
		const greatestMigration = maxBy(OFFLINE_STORAGE_MIGRATIONS, (item: OfflineMigration) => item.version)
		o(CURRENT_OFFLINE_VERSION).equals(greatestMigration?.version)
	})
})
