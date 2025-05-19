import o from "@tutao/otest"
import { object, when } from "testdouble"
import { verify } from "@tutao/tutanota-test-utils"
import { OfflineDbFactory } from "../../../../src/common/desktop/db/PerWindowSqlCipherFacade.js"
import { delay } from "@tutao/tutanota-utils"
import { DesktopSqlCipher } from "../../../../src/common/desktop/db/DesktopSqlCipher.js"
import { OfflineDbRefCounter } from "../../../../src/common/desktop/db/OfflineDbRefCounter.js"

o.spec("OfflineDbFacade", function () {
	let factory: OfflineDbFactory
	let offlineDbRefCounter: OfflineDbRefCounter
	const userId = "123"
	const databaseKey = new Uint8Array([1, 2, 3])
	let db: DesktopSqlCipher

	o.beforeEach(function () {
		factory = object()
		offlineDbRefCounter = new OfflineDbRefCounter(factory)
		db = object<DesktopSqlCipher>()
		when(factory.create(userId, databaseKey)).thenResolve(db)
	})

	o("when opening database for the first time, it is created", async function () {
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)

		verify(factory.create(userId, databaseKey))
	})

	o("when opening database after everytime after the first time, it is not created", async function () {
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)

		verify(factory.create(userId, databaseKey), { times: 1 })
	})

	o("when closing database which was opened once, it is closed", async function () {
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)
		await offlineDbRefCounter.disposeDb(userId)

		verify(db.closeDb())
	})

	o("when closing database which was opened more than once, it is not closed", async function () {
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)
		await offlineDbRefCounter.disposeDb(userId)

		verify(db.closeDb(), { times: 0 })
	})

	o("when closing database twice which was opened twice, it is closed", async function () {
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)
		await offlineDbRefCounter.disposeDb(userId)
		await offlineDbRefCounter.disposeDb(userId)

		verify(db.closeDb(), { times: 1 })
	})

	o("when reopening database, it is created", async function () {
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)
		await offlineDbRefCounter.disposeDb(userId)
		await offlineDbRefCounter.getOrCreateDb(userId, databaseKey)

		verify(factory.create(userId, databaseKey), { times: 2 })
	})
})
