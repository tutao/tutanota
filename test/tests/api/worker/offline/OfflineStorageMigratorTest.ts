import o from "@tutao/otest"
import { OfflineMigration, OfflineStorageMigrator } from "../../../../../src/common/api/worker/offline/OfflineStorageMigrator.js"
import { OfflineStorage } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"
import { func, instance, matchers, object, when } from "testdouble"
import { assertThrows, verify } from "@tutao/tutanota-test-utils"
import { ModelInfos } from "../../../../../src/common/api/common/EntityFunctions.js"
import { typedEntries } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError.js"
import { SqlCipherFacade } from "../../../../../src/common/native/common/generatedipc/SqlCipherFacade.js"
import { OutOfSyncError } from "../../../../../src/common/api/common/error/OutOfSyncError.js"

o.spec("OfflineStorageMigrator", function () {
	const modelInfos: ModelInfos = {
		base: {
			version: 1,
			compatibleSince: 0,
		},
		sys: {
			version: 1,
			compatibleSince: 0,
		},
		tutanota: {
			version: 42,
			compatibleSince: 41,
		},
		storage: {
			version: 1,
			compatibleSince: 0,
		},
		accounting: {
			version: 1,
			compatibleSince: 0,
		},
		gossip: {
			version: 1,
			compatibleSince: 0,
		},
		monitor: {
			version: 1,
			compatibleSince: 0,
		},
		usage: {
			version: 1,
			compatibleSince: 0,
		},
	}
	let migrations: OfflineMigration[]
	let migrator: OfflineStorageMigrator
	let storage: OfflineStorage
	let sqlCipherFacade: SqlCipherFacade

	o.beforeEach(function () {
		migrations = []
		storage = instance(OfflineStorage)
		migrator = new OfflineStorageMigrator(migrations, modelInfos)
		sqlCipherFacade = object()
	})

	o("when there's an empty database the current model versions are written", async function () {
		when(storage.dumpMetadata()).thenResolve({})

		await migrator.migrate(storage, sqlCipherFacade)

		for (const [app, data] of typedEntries(modelInfos)) {
			verify(storage.setStoredModelVersion(app, data.version))
		}
	})

	o("when the model version is written it is not overwritten", async function () {
		when(storage.dumpMetadata()).thenResolve({ "tutanota-version": 42 })

		await migrator.migrate(storage, sqlCipherFacade)

		verify(storage.setStoredModelVersion("tutanota", matchers.anything()), { times: 0 })
	})

	o("when migration exists and it the version is incompatible the migration is run", async function () {
		// stored is older than current so we actually "migrate" something
		when(storage.dumpMetadata()).thenResolve({ "tutanota-version": 40 }, { "tutanota-version": 42 })
		const migration: OfflineMigration = {
			app: "tutanota",
			version: 42,
			migrate: func() as OfflineMigration["migrate"],
		}
		migrations.push(migration)

		await migrator.migrate(storage, sqlCipherFacade)

		verify(migration.migrate(storage, sqlCipherFacade))
		verify(storage.setStoredModelVersion("tutanota", 42))
	})

	o("when migration is missing and the version is incompatible it throws", async function () {
		// stored is older than current so we actually "migrate" something
		when(storage.dumpMetadata()).thenResolve({ "tutanota-version": 40 })

		await assertThrows(ProgrammingError, () => migrator.migrate(storage, sqlCipherFacade))

		verify(storage.setStoredModelVersion("tutanota", matchers.anything()), { times: 0 })
	})

	o("when the stored version is newer than the runtime version throw OutOfSyncError", async function () {
		// stored is new than the current
		const currentModelVersion = modelInfos.tutanota.version
		when(storage.dumpMetadata()).thenResolve({ "tutanota-version": currentModelVersion + 1 })
		const migration: OfflineMigration = {
			app: "tutanota",
			version: modelInfos.tutanota.compatibleSince,
			migrate: func() as OfflineMigration["migrate"],
		}
		migrations.push(migration)
		await assertThrows(OutOfSyncError, () => migrator.migrate(storage, sqlCipherFacade))

		verify(migration.migrate(storage, sqlCipherFacade), { times: 0 })
		verify(storage.setStoredModelVersion("tutanota", matchers.anything()), { times: 0 })
	})
})
