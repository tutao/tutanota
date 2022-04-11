import o from "ospec"
import {OfflineDbFacade, OfflineDbFactory} from "../../../../src/desktop/db/OfflineDbFacade"
import {object, when} from "testdouble"
import {verify} from "@tutao/tutanota-test-utils"
import {OfflineDb} from "../../../../src/desktop/db/OfflineDb"

o.spec("OfflineDbFacade", function () {
	let factory: OfflineDbFactory
	let facade: OfflineDbFacade
	const userId = "123"
	const databaseKey = [1, 2, 3]
	let db: OfflineDb

	o.beforeEach(function () {
		factory = object()
		facade = new OfflineDbFacade(factory)
		db = object<OfflineDb>()
		when(factory.create(userId, databaseKey)).thenResolve(db)
	})

	o("when opening database for the first time, it is created", async function () {
		await facade.openDatabaseForUser(userId, databaseKey)

		verify(factory.create(userId, databaseKey))
	})

	o("when opening database after everytime after the first time, it is not created", async function () {
		await facade.openDatabaseForUser(userId, databaseKey)
		await facade.openDatabaseForUser(userId, databaseKey)

		verify(factory.create(userId, databaseKey), {times: 1})
	})

	o("when closing database which was opened once, it is closed", async function () {
		await facade.openDatabaseForUser(userId, databaseKey)
		await facade.closeDatabaseForUser(userId)

		verify(db.close())
	})

	o("when closing database which was opened more than once, it is not closed", async function () {
		await facade.openDatabaseForUser(userId, databaseKey)
		await facade.openDatabaseForUser(userId, databaseKey)
		await facade.closeDatabaseForUser(userId)

		verify(db.close(), {times: 0})
	})

	o("when closing database twice which was opened twice, it is closed", async function () {
		await facade.openDatabaseForUser(userId, databaseKey)
		await facade.openDatabaseForUser(userId, databaseKey)
		await facade.closeDatabaseForUser(userId)
		await facade.closeDatabaseForUser(userId)

		verify(db.close(), {times: 1})
	})

	o("when reopening database, it is created", async function () {
		await facade.openDatabaseForUser(userId, databaseKey)
		await facade.closeDatabaseForUser(userId)
		await facade.openDatabaseForUser(userId, databaseKey)

		verify(factory.create(userId, databaseKey), {times: 2})
	})
})