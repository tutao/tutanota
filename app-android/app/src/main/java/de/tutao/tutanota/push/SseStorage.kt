package de.tutao.tutanota.push

import androidx.annotation.WorkerThread
import androidx.lifecycle.LiveData
import de.tutao.tutanota.AndroidKeyStoreFacade
import de.tutao.tutanota.CryptoError
import de.tutao.tutanota.Utils
import de.tutao.tutanota.alarms.AlarmNotification
import de.tutao.tutanota.data.AppDatabase
import de.tutao.tutanota.data.PushIdentifierKey
import de.tutao.tutanota.data.User
import java.security.KeyStoreException
import java.security.UnrecoverableEntryException
import java.util.*

class SseStorage(
	private val db: AppDatabase,
	private val keyStoreFacade: AndroidKeyStoreFacade,
) {
	val pushIdentifier: String?
		get() = db.keyValueDao().getString(DEVICE_IDENTIFIER)

	fun storePushIdentifier(identifier: String, sseOrigin: String) {
		db.keyValueDao().putString(DEVICE_IDENTIFIER, identifier)
		db.keyValueDao().putString(SSE_ORIGIN, sseOrigin)
	}

	fun clear() {
		lastMissedNotificationCheckTime = null
		db.userInfoDao().clear()
		db.alarmInfoDao.clear()
	}

	@Throws(KeyStoreException::class, CryptoError::class)
	fun storePushIdentifierSessionKey(
		userId: String,
		pushIdentifierId: String,
		pushIdentifierSessionKeyB64: String,
	) {
		val deviceEncSessionKey = keyStoreFacade.encryptKey(Utils.base64ToBytes(pushIdentifierSessionKeyB64))
		db.userInfoDao().insertPushIdentifierKey(PushIdentifierKey(pushIdentifierId, deviceEncSessionKey))
		db.userInfoDao().insertUser(User(userId))
	}

	@Throws(UnrecoverableEntryException::class, KeyStoreException::class, CryptoError::class)
	fun getPushIdentifierSessionKey(pushIdentifierId: String): ByteArray? {
		val userInfo = db.userInfoDao().getPushIdentifierKey(pushIdentifierId) ?: return null
		return keyStoreFacade.decryptKey(userInfo.deviceEncPushIdentifierKey)
	}

	fun observeUsers(): LiveData<List<User>> {
		return db.userInfoDao().observeUsers()
	}

	fun readAlarmNotifications(): List<AlarmNotification> {
		return db.alarmInfoDao.alarmNotifications
	}

	fun insertAlarmNotification(alarmNotification: AlarmNotification) {
		db.alarmInfoDao.insertAlarmNotification(alarmNotification)
	}

	fun deleteAlarmNotification(alarmIdentifier: String) {
		db.alarmInfoDao.deleteAlarmNotification(alarmIdentifier)
	}

	@get:WorkerThread
	@set:WorkerThread
	var lastProcessedNotificationId: String?
		get() = db.keyValueDao().getString(LAST_PROCESSED_NOTIFICATION_ID)
		set(id) {
			db.keyValueDao().putString(LAST_PROCESSED_NOTIFICATION_ID, id)
		}

	@get:WorkerThread
	@set:WorkerThread
	var lastMissedNotificationCheckTime: Date?
		get() {
			val value = db.keyValueDao().getLong(LAST_MISSED_NOTIFICATION_CHECK_TIME)
			return if (value == 0L) {
				null
			} else Date(value)
		}
		set(date) {
			db.keyValueDao().putLong(LAST_MISSED_NOTIFICATION_CHECK_TIME, date?.time ?: 0L)
		}
	val sseOrigin: String?
		get() = db.keyValueDao().getString(SSE_ORIGIN)
	var connectTimeoutInSeconds: Long
		get() = db.keyValueDao().getLong(CONNECT_TIMEOUT_SEC)
		set(connectTimeout) {
			db.keyValueDao().putLong(CONNECT_TIMEOUT_SEC, connectTimeout)
		}

	fun removeUser(userId: String) {
		db.userInfoDao().deleteUser(userId)
	}

	val users: List<User>
		get() = db.userInfoDao().users

	companion object {
		private const val LAST_PROCESSED_NOTIFICATION_ID = "lastProcessedNotificationId"
		private const val LAST_MISSED_NOTIFICATION_CHECK_TIME = "'lastMissedNotificationCheckTime'"
		private const val DEVICE_IDENTIFIER = "deviceIdentifier"
		private const val SSE_ORIGIN = "sseOrigin"
		const val CONNECT_TIMEOUT_SEC = "connectTimeoutSec"
	}
}