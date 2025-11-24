package de.tutao.tutashared.data

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/**
 * There is an issue with automatic migration from 4 to 5. advancedRules can only be null if the rest of the repeat rule
 * is null. Unfortunately this information is missing from the database schema and is only present in the entity types
 * and the generated code so the field is simply nullable in the schema. When the auto migration did run it simply
 * populated advancedRules with null, even though in some cases empty string should have been used instead. This led
 * to a runtime issue when trying to read the migrated fields.
 *
 * see https://github.com/tutao/tutanota/issues/9980
 */
object AppDatabaseMigration5to6 : Migration(5, 6) {
	override fun migrate(db: SupportSQLiteDatabase) {
		db.execSQL("""UPDATE AlarmNotification SET advancedRules = "" WHERE frequency IS NOT NULL AND advancedRules IS NULL""")
	}}