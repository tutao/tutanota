package de.tutao.tutashared.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import de.tutao.tutashared.alarms.AlarmNotificationEntity


@Dao
interface AlarmInfoDao {
	@Insert(onConflict = OnConflictStrategy.REPLACE)
	fun insertAlarmNotification(alarmNotification: AlarmNotificationEntity)

	@Query("SELECT * FROM AlarmNotification")
	fun alarmNotifications(): List<AlarmNotificationEntity>

	@Query("DELETE FROM AlarmNotification WHERE identifier = :identifier")
	fun deleteAlarmNotification(identifier: String)

	@Query("DELETE FROM AlarmNotification")
	fun clear()
}