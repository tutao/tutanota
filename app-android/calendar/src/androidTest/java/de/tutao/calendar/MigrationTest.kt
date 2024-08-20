package de.tutao.calendar

import androidx.room.Room
import androidx.room.testing.MigrationTestHelper
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.io.IOException

@RunWith(AndroidJUnit4::class)
class MigrationTest {
	private val TEST_DB = "migration-test"


	@get:Rule
	val helper: MigrationTestHelper = MigrationTestHelper(
		InstrumentationRegistry.getInstrumentation(),
		AppDatabase::class.java,
		listOf(),
	)

	@Test
	@Throws(IOException::class)
	fun migrateAll() {
		// Create earliest version of the database.
		helper.createDatabase(TEST_DB, 1).apply {
			close()
		}

		// Open latest version of the database. Room will validate the schema
		// once all migrations execute.
		Room.databaseBuilder(
			InstrumentationRegistry.getInstrumentation().targetContext,
			AppDatabase::class.java,
			TEST_DB
		).build().apply {
			openHelper.writableDatabase.close()
		}
	}
}