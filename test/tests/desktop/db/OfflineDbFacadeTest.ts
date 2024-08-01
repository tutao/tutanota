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

	o("ranges database is locked when writing/reading to/from it", async function () {
		const listId = "listId"

		await offlineDbRefCounter.getOrCreateDb(userId, new Uint8Array())

		// Hold the lock for the ranges database until @param defer is resolved.
		async function holdRangesDbLock(promise: Promise<void> | null, startId: number): Promise<number> {
			await offlineDbRefCounter.lockRangesDbAccess(userId, listId)
			await promise
			await offlineDbRefCounter.unlockRangesDbAccess(userId, listId)
			return startId
		}

		const finishOrder: Array<number> = []
		// Delay Task 1
		const longRunningTask1 = delay(100)

		// Task 1
		let task1 = holdRangesDbLock(longRunningTask1, 1).then((startId) => {
			finishOrder.push(startId)
		})
		// Task 2
		let task2 = holdRangesDbLock(null, 2).then((startId) => {
			finishOrder.push(startId)
		})
		await Promise.all([task1, task2])

		// Assert that task 1 finishes before task 2
		o(finishOrder).deepEquals([1, 2])
	})
})
