package de.tutao.tutashared.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import de.tutao.tutashared.alarms.EncryptedAlarmNotificationEntity


@Dao
interface AlarmInfoDao {
	@Insert(onConflict = OnConflictStrategy.REPLACE)
	fun insertAlarmNotification(alarmNotification: EncryptedAlarmNotificationEntity)

	@Query("SELECT * FROM AlarmNotification")
	fun alarmNotifications(): List<EncryptedAlarmNotificationEntity>

	@Query("DELETE FROM AlarmNotification WHERE identifier = :identifier")
	fun deleteAlarmNotification(identifier: String)

	@Query("DELETE FROM AlarmNotification")
	fun clear()
}