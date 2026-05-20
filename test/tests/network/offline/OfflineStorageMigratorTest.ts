import o, { verify } from "@tutao/otest"
import {
	assertLastMigrationConsistentVersion,
	createOfflineStorageMigrations,
	CURRENT_OFFLINE_VERSION,
	OfflineStorageMigrator,
} from "../../../../src/app-kit/local-store/OfflineStorageMigrator.js"
import { OfflineStorage } from "../../../../src/app-kit/local-store/OfflineStorage.js"
import { func, instance, matchers, object, when } from "testdouble"
import { ProgrammingError } from "../../../../src/platform-kit/app-env"
import { maxBy } from "../../../../src/platform-kit/utils"
import { ApplicationTypesFacade } from "../../../../src/platform-kit/instance-pipeline/ApplicationTypesFacade"
import { SqlCipherFacade } from "../../../../src/app-kit/native-bridge/common/generatedipc/types/SqlCipherFacade.js"
import { OfflineMigration } from "../../../../src/app-kit/local-store/OfflineMigration"

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
		migrator = new OfflineStorageMigrator(migrations)
		sqlCipherFacade = object()
	})

	o.test("when there's an empty database the current model versions are written and migrations are not run", async function () {
		when(storage.dumpMetadata()).thenResolve({})
		const migration: OfflineMigration = {
			version: CURRENT_OFFLINE_VERSION,
			migrate: func() as OfflineMigration["migrate"],
		}
		migrations.push(migration)

		await migrator.migrate(storage)
		verify(storage.setCurrentOfflineSchemaVersion(CURRENT_OFFLINE_VERSION))
		verify(migration.migrate(matchers.anything()), { times: 0 })
	})

	o.test("when the model version is written it is not overwritten", async function () {
		when(storage.dumpMetadata()).thenResolve({ "offline-version": 5 })

		await migrator.migrate(storage)

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

		await migrator.migrate(storage)

		verify(migration.migrate(storage))
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

		await o.check(() => migrator.migrate(storage)).asyncThrows(ProgrammingError)

		verify(migration.migrate(matchers.anything()), { times: 0 })
		verify(storage.setCurrentOfflineSchemaVersion(matchers.anything()), { times: 0 })
	})

	o.test("real migration list: consistent with the latest version", async function () {
		assertLastMigrationConsistentVersion(createOfflineStorageMigrations(sqlCipherFacade, applicationTypesFacadeMock))
	})

	o("ensure CURRENT_OFFLINE_VERSION matches the greatest registered migration", async function () {
		const greatestMigration = maxBy(createOfflineStorageMigrations(sqlCipherFacade, applicationTypesFacadeMock), (item: OfflineMigration) => item.version)
		o(CURRENT_OFFLINE_VERSION).equals(greatestMigration?.version)
	})
})
