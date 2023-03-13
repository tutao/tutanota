package de.tutao.tutanota.alarms

import android.util.Log
import de.tutao.tutanota.*
import de.tutao.tutanota.ipc.EncryptedAlarmNotification
import de.tutao.tutanota.push.LocalNotificationsFacade
import de.tutao.tutanota.push.SseStorage
import java.security.KeyStoreException
import java.security.UnrecoverableEntryException
import java.util.*
import java.util.concurrent.TimeUnit

class AlarmNotificationsManager(
		private val sseStorage: SseStorage,
		private val crypto: AndroidNativeCryptoFacade,
		private val systemAlarmFacade: SystemAlarmFacade,
		private val localNotificationsFacade: LocalNotificationsFacade,
) {
	private val pushKeyResolver: PushKeyResolver = PushKeyResolver(sseStorage)

	fun reScheduleAlarms() {
		val pushKeyResolver = PushKeyResolver(sseStorage)
		val alarmInfos = sseStorage.readAlarmNotifications()
		for (alarmNotification in alarmInfos) {
			val sessionKey = resolveNotificationSessionKey(alarmNotification, pushKeyResolver)
			if (sessionKey != null) {
				schedule(alarmNotification.decrypt(crypto, sessionKey))
			} else {
				Log.d(TAG, "Failed to resolve session key for saved alarm notification")
			}
		}
	}

	private fun resolveNotificationSessionKey(notification: AlarmNotificationEntity, pushKeyResolver: PushKeyResolver): ByteArray? {
		val encNotificationSessionKey = notification.notificationSessionKey ?: return null
		try {
			val pushIdentifierSessionKey = pushKeyResolver
					.resolvePushSessionKey(encNotificationSessionKey.pushIdentifier.elementId)
			if (pushIdentifierSessionKey != null) {
				val pushIdentifierSessionEncSessionKey =
						encNotificationSessionKey.pushIdentifierSessionEncSessionKey.base64ToBytes()
				return crypto.decryptKey(pushIdentifierSessionKey, pushIdentifierSessionEncSessionKey)
			}
		} catch (e: UnrecoverableEntryException) {
			Log.w(TAG, "could not decrypt session key", e)
		} catch (e: KeyStoreException) {
			Log.w(TAG, "could not decrypt session key", e)
		} catch (e: CryptoError) {
			Log.w(TAG, "could not decrypt session key", e)
		}
		return null
	}

	fun scheduleNewAlarms(alarmNotifications: List<EncryptedAlarmNotification>) {
		for (alarmNotification in alarmNotifications) {
			if (alarmNotification.operation == OperationType.CREATE) {
				val alarmNotificationEntity = alarmNotification.toEntity()
				val sessionKey = resolveNotificationSessionKey(alarmNotificationEntity, pushKeyResolver)
				if (sessionKey == null) {
					Log.d(TAG, "Failed to resolve session key for alarm notification")
					return
				}
				schedule(alarmNotificationEntity.decrypt(crypto, sessionKey))
				sseStorage.insertAlarmNotification(alarmNotificationEntity)
			} else {
				cancelScheduledAlarm(alarmNotification, pushKeyResolver)
				sseStorage.deleteAlarmNotification(alarmNotification.alarmInfo.identifier)
			}
		}
	}

	/**
	 * Deletes user alarms for a given user. If user is null then all scheduled alarms will be removed.
	 */
	fun unscheduleAlarms(userId: String?) {
		val alarmNotifications = sseStorage.readAlarmNotifications()
		for (alarmNotification in alarmNotifications) {
			if (userId == null || alarmNotification.user == userId) {
				cancelSavedAlarm(alarmNotification, pushKeyResolver)
				sseStorage.deleteAlarmNotification(alarmNotification.alarmInfo.identifier)
			}
		}
	}

	private fun schedule(alarmNotification: AlarmNotification) {
		try {
			val identifier = alarmNotification.alarmInfo.alarmIdentifier
			if (alarmNotification.repeatRule == null) {
				val alarmTime = AlarmModel.calculateAlarmTime(alarmNotification.eventStart, null, alarmNotification.alarmInfo.trigger)
				val now = Date()
				when {
					occurrenceIsTooFar(alarmTime) -> {
						Log.d(TAG, "Alarm $identifier is too far in the future, skipping")
					}
					alarmTime.after(now) -> {
						systemAlarmFacade.scheduleAlarmOccurrenceWithSystem(
								alarmTime,
								0,
								identifier,
								alarmNotification.summary,
								alarmNotification.eventStart,
								alarmNotification.user
						)
					}
					else -> {
						Log.d(TAG, "Alarm $identifier is before $now, skipping")
					}
				}
			} else {
				iterateAlarmOccurrences(alarmNotification) { alarmTime, occurrence, eventStartTime ->
					if (occurrenceIsTooFar(alarmTime)) {
						Log.d(TAG, "Alarm occurrence $identifier $occurrence is too far in the future, skipping")
					} else {
						systemAlarmFacade.scheduleAlarmOccurrenceWithSystem(
								alarmTime, occurrence, identifier, alarmNotification.summary, eventStartTime,
								alarmNotification.user
						)
					}
				}
			}
		} catch (cryptoError: CryptoError) {
			Log.w(TAG, "Error when decrypting alarmNotification", cryptoError)
		} catch (e: Exception) {
			Log.e(TAG, "Error when scheduling alarm", e)
			localNotificationsFacade.showErrorNotification(R.string.wantToSendReport_msg, e)
		}
	}

	private fun occurrenceIsTooFar(alarmTime: Date): Boolean {
		return alarmTime.time > System.currentTimeMillis() + TIME_IN_THE_FUTURE_LIMIT_MS
	}

	/**
	 * Cancel scheduled alarm with the system
	 *
	 * @param alarmNotification may come from the server or may be a saved one
	 */
	private fun cancelScheduledAlarm(
			alarmNotification: EncryptedAlarmNotification,
			pushKeyResolver: PushKeyResolver,
	) {

		// The DELETE notification we receive from the server has only placeholder fields and no keys. We must use our saved alarm to cancel notifications.
		val savedAlarmNotification = sseStorage.readAlarmNotifications().find {
			it.alarmInfo.identifier == alarmNotification.alarmInfo.identifier
		}
		if (savedAlarmNotification != null) {
			cancelSavedAlarm(savedAlarmNotification, pushKeyResolver)
		} else {
			Log.d(TAG, "Cancelling alarm " + alarmNotification.alarmInfo.identifier)
			systemAlarmFacade.cancelAlarm(alarmNotification.alarmInfo.identifier, 0)
		}
	}

	private fun cancelSavedAlarm(savedAlarmNotification: AlarmNotificationEntity, pushKeyResolver: PushKeyResolver) {
		if (savedAlarmNotification.repeatRule != null) {
			val sessionKey = resolveNotificationSessionKey(savedAlarmNotification, pushKeyResolver)
			if (sessionKey == null) {
				Log.w(TAG, "Failed to resolve session key to cancel alarm ")
			} else {
				val alarmNotification: AlarmNotification = savedAlarmNotification.decrypt(crypto, sessionKey)
				try {
					iterateAlarmOccurrences(alarmNotification) { _, occurrence, _ ->
						Log.d(
								TAG,
								"Cancelling alarm " + savedAlarmNotification.alarmInfo.identifier + " # " + occurrence
						)
						systemAlarmFacade.cancelAlarm(savedAlarmNotification.alarmInfo.identifier, occurrence)
					}
				} catch (cryptoError: CryptoError) {
					Log.w(TAG, "Failed to decrypt notification to cancel alarm ", cryptoError)
				}
			}
		} else {
			Log.d(TAG, "Cancelling alarm " + savedAlarmNotification.alarmInfo.identifier)
			systemAlarmFacade.cancelAlarm(savedAlarmNotification.alarmInfo.identifier, 0)
		}
	}

	@Throws(CryptoError::class)
	private fun iterateAlarmOccurrences(
			alarmNotification: AlarmNotification,
			callback: AlarmModel.AlarmIterationCallback,
	) {
		val repeatRule = alarmNotification.repeatRule!!
		val timeZone = repeatRule.timeZone
		val eventStart = alarmNotification.eventStart
		val eventEnd = alarmNotification.eventEnd
		val frequency = repeatRule.frequency
		val interval = repeatRule.interval
		val endType = repeatRule.endType
		val endValue = repeatRule.endValue
		val excludedDates = repeatRule.excludedDates
		val alarmTrigger: AlarmTrigger = alarmNotification.alarmInfo.trigger
		AlarmModel.iterateAlarmOccurrences(
				Date(),
				timeZone, eventStart, eventEnd, frequency, interval, endType,
				endValue, alarmTrigger, TimeZone.getDefault(), excludedDates, callback
		)
	}

	class PushKeyResolver(private val sseStorage: SseStorage) {
		private val pushIdentifierToResolvedSessionKey: MutableMap<String?, ByteArray> = HashMap()

		@Throws(UnrecoverableEntryException::class, KeyStoreException::class, CryptoError::class)
		fun resolvePushSessionKey(pushIdentifierId: String): ByteArray? {
			val resolved = pushIdentifierToResolvedSessionKey[pushIdentifierId]
			return if (resolved != null) {
				resolved
			} else {
				val pushIdentifierSessionKey = sseStorage.getPushIdentifierSessionKey(pushIdentifierId) ?: return null
				pushIdentifierToResolvedSessionKey[pushIdentifierId] = pushIdentifierSessionKey
				pushIdentifierSessionKey
			}
		}
	}


	companion object {
		@JvmField
		val TIME_IN_THE_FUTURE_LIMIT_MS = TimeUnit.DAYS.toMillis(14)
		private const val TAG = "AlarmNotificationsMngr"
	}
}

