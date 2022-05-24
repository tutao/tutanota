package de.tutao.tutanota.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import de.tutao.tutanota.alarms.AlarmNotification
import de.tutao.tutanota.data.AppDatabase

@Database(version = 1, entities = [KeyValue::class, PushIdentifierKey::class, AlarmNotification::class, User::class])
abstract class AppDatabase : RoomDatabase() {
	abstract fun keyValueDao(): KeyValueDao
	abstract fun userInfoDao(): UserInfoDao
	abstract fun alarmInfoDao(): AlarmInfoDao

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