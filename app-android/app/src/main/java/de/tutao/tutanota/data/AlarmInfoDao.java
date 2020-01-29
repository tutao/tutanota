package de.tutao.tutanota.data;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;

import java.util.List;

import de.tutao.tutanota.alarms.AlarmInfo;
import de.tutao.tutanota.alarms.AlarmNotification;

import static androidx.room.OnConflictStrategy.REPLACE;

@Dao
public interface AlarmInfoDao {
	@Insert(onConflict = REPLACE)
	void insertAlarmNotification(AlarmNotification alarmNotification);

	@Query("SELECT * FROM AlarmNotification")
	List<AlarmNotification> getAlarmNotifications();

	@Query("DELETE FROM AlarmNotification WHERE identifier = :identifier")
	void deleteAlarmNotification(String identifier);

	@Query("DELETE FROM AlarmNotification")
	void clear();
}
