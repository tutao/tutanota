package de.tutao.tutanota.data

import android.content.Context
import androidx.room.AutoMigration
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import de.tutao.tutanota.alarms.AlarmNotificationEntity
import de.tutao.tutanota.credentials.PersistedCredentialsDao
import de.tutao.tutanota.credentials.PersistedCredentialsEntity

@Database(
	version = 2, entities = [
		KeyValue::class,
		PushIdentifierKey::class,
		AlarmNotificationEntity::class,
		PersistedCredentialsEntity::class,
		User::class
	], autoMigrations = [
		AutoMigration(from = 1, to = 2)
	]
)
abstract class AppDatabase : RoomDatabase() {
	abstract fun keyValueDao(): KeyValueDao
	abstract fun userInfoDao(): UserInfoDao
	abstract fun alarmInfoDao(): AlarmInfoDao
	abstract fun PersistedCredentialsDao(): PersistedCredentialsDao

	companion object {
		fun getDatabase(context: Context, allowMainThreadAccess: Boolean): AppDatabase {
			val builder = Room.databaseBuilder(
				context,
				AppDatabase::class.java,
				"tuta-db"
			) // This is important because we access db across processes!
				.enableMultiInstanceInvalidation()
			if (allowMainThreadAccess) {
				builder.allowMainThreadQueries()
			}
			return builder.build()
		}
	}
}