package de.tutao.tutashared

import androidx.core.database.getStringOrNull
import androidx.room.testing.MigrationTestHelper
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.data.AppDatabaseMigration5to6
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith


private const val TEST_DB = "migration-test"

@RunWith(AndroidJUnit4::class)
class AppDatabaseMigrationTest {

	@get:Rule
	val helper: MigrationTestHelper = MigrationTestHelper(
		InstrumentationRegistry.getInstrumentation(),
		AppDatabase::class.java
	)

	@Test
	fun migrate5to6() {
		helper.createDatabase(TEST_DB, 5).apply {
			createAlarmInfo(
				"1",
				RepeatRuleData(
					frequency = "1",
					interval = "1",
					timeZone = "1",
					endType = "1",
					endValue = "1",
					excludedDates = "1",
					advancedRules = null
				)
			)
			createAlarmInfo("2", null)
			createAlarmInfo(
				"3",
				RepeatRuleData(
					frequency = "2",
					interval = "2",
					timeZone = "2",
					endType = "2",
					endValue = "2",
					excludedDates = "2",
					advancedRules = "2"
				)
			)

			close()
		}
		helper.runMigrationsAndValidate(TEST_DB, 6, true, AppDatabaseMigration5to6).use { db ->
			val results = mutableListOf<Triple<String, String?, String?>>()
			db.query("SELECT identifier, frequency, advancedRules FROM AlarmNotification").use { stmt ->
				while (stmt.moveToNext()) {
					val identifier = stmt.getString(0)
					val frequency = stmt.getStringOrNull(1)
					val advancedRules = stmt.getStringOrNull(2)
					results.add(Triple(identifier, frequency, advancedRules))
				}
			}
			assertEquals(listOf(Triple("1", "1", ""), Triple("2", null, null), Triple("3", "2", "2")), results)
		}
	}

	private data class RepeatRuleData(
		val frequency: String,
		val interval: String,
		val timeZone: String,
		val endType: String,
		val endValue: String?,
		val excludedDates: String,
		val advancedRules: String?
	)

	private fun SupportSQLiteDatabase.createAlarmInfo(
		identifier: String,
		repeatRuleData: RepeatRuleData?
	) {
		val stmt =
			compileStatement("INSERT INTO AlarmNotification (operation, summary, eventStart, eventEnd, trigger, identifier, frequency, interval, timeZone, endType, endValue, excludedDates, advancedRules, keylistId, keyelementId, keypushIdentifierSessionEncSessionKey, user ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").apply {
				bindNull(1)
				bindString(2, "summary Val")
				bindNull(3)
				bindNull(4)
				bindString(5, "trigger Val")
				bindString(6, identifier)

				if (repeatRuleData != null) {
					bindString(7, repeatRuleData.frequency)
					bindString(8, repeatRuleData.interval)
					bindString(9, repeatRuleData.timeZone)
					bindString(10, repeatRuleData.endType)
					if (repeatRuleData.endValue != null) {
						bindString(11, repeatRuleData.endValue)
					} else {
						bindNull(11)
					}
					bindString(12, repeatRuleData.excludedDates)
					if (repeatRuleData.advancedRules != null) {
						bindString(13, repeatRuleData.advancedRules)
					} else {
						bindNull(13) // AdvancedRules
					}
				} else {
					bindNull(7)
					bindNull(8)
					bindNull(9)
					bindNull(10)
					bindNull(11)
					bindNull(12)
					bindNull(13)
				}

				bindString(14, "keylistId Val")
				bindString(15, "keyelementId Val")
				bindString(16, "keypushIdentifierSessionEncSessionKey Val")

				bindNull(17)
			}

		stmt.executeInsert()
	}
}