package de.tutao.tutanota.data;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

import de.tutao.tutanota.alarms.AlarmNotification;

@Database(version = 1, entities = {KeyValue.class, PushIdentifierKey.class, AlarmNotification.class, User.class})
public abstract class AppDatabase extends RoomDatabase {
	public static AppDatabase getDatabase(Context context, boolean allowMainThreadAccess) {
		Builder<AppDatabase> builder = Room.databaseBuilder(context, AppDatabase.class, "tuta-db")
				// This is important because we access db across processes!
				.enableMultiInstanceInvalidation();
		if (allowMainThreadAccess) {
			builder.allowMainThreadQueries();
		}
		return builder.build();
	}

	public abstract KeyValueDao keyValueDao();

	public abstract UserInfoDao userInfoDao();

	public abstract AlarmInfoDao getAlarmInfoDao();
}
