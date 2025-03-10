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
		},
		sys: {
			version: 1,
		},
		tutanota: {
			version: 42,
		},
		storage: {
			version: 1,
		},
		accounting: {
			version: 1,
		},
		gossip: {
			version: 1,
		},
		monitor: {
			version: 1,
		},
		usage: {
			version: 1,
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
})
