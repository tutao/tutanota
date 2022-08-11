import o from "ospec"
import {object, when} from "testdouble"
import {verify} from "@tutao/tutanota-test-utils"
import {OfflineDbFactory, OfflineDbManager} from "../../../../src/desktop/db/PerWindowSqlCipherFacade.js"
import {DesktopSqlCipher} from "../../../../src/desktop/DesktopSqlCipher.js"

o.spec("OfflineDbFacade", function () {
	let factory: OfflineDbFactory
	let offlineDbManager: OfflineDbManager
	const userId = "123"
	const databaseKey = new Uint8Array([1, 2, 3])
	let db: DesktopSqlCipher

	o.beforeEach(function () {
		factory = object()
		offlineDbManager = new OfflineDbManager(factory)
		db = object<DesktopSqlCipher>()
		when(factory.create(userId, databaseKey)).thenResolve(db)
	})

	o("when opening database for the first time, it is created", async function () {
		await offlineDbManager.getOrCreateDb(userId, databaseKey)

		verify(factory.create(userId, databaseKey))
	})

	o("when opening database after everytime after the first time, it is not created", async function () {
		await offlineDbManager.getOrCreateDb(userId, databaseKey)
		await offlineDbManager.getOrCreateDb(userId, databaseKey)

		verify(factory.create(userId, databaseKey), {times: 1})
	})

	o("when closing database which was opened once, it is closed", async function () {
		await offlineDbManager.getOrCreateDb(userId, databaseKey)
		await offlineDbManager.disposeDb(userId)

		verify(db.closeDb())
	})

	o("when closing database which was opened more than once, it is not closed", async function () {
		await offlineDbManager.getOrCreateDb(userId, databaseKey)
		await offlineDbManager.getOrCreateDb(userId, databaseKey)
		await offlineDbManager.disposeDb(userId)

		verify(db.closeDb(), {times: 0})
	})

	o("when closing database twice which was opened twice, it is closed", async function () {
		await offlineDbManager.getOrCreateDb(userId, databaseKey)
		await offlineDbManager.getOrCreateDb(userId, databaseKey)
		await offlineDbManager.disposeDb(userId)
		await offlineDbManager.disposeDb(userId)

		verify(db.closeDb(), {times: 1})
	})

	o("when reopening database, it is created", async function () {
		await offlineDbManager.getOrCreateDb(userId, databaseKey)
		await offlineDbManager.disposeDb(userId)
		await offlineDbManager.getOrCreateDb(userId, databaseKey)

		verify(factory.create(userId, databaseKey), {times: 2})
	})
})