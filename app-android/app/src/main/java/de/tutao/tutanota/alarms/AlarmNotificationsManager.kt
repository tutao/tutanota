package de.tutao.tutanota.alarms

import android.util.Log
import de.tutao.tutanota.*
import de.tutao.tutanota.alarms.AlarmModel.AlarmIterationCallback
import de.tutao.tutanota.push.LocalNotificationsFacade
import de.tutao.tutanota.push.SseStorage
import java.security.KeyStoreException
import java.security.UnrecoverableEntryException
import java.util.*
import java.util.concurrent.TimeUnit

class AlarmNotificationsManager(
		private val sseStorage: SseStorage,
		private val crypto: Crypto,
		private val systemAlarmFacade: SystemAlarmFacade,
		private val localNotificationsFacade: LocalNotificationsFacade,
) {
	private val pushKeyResolver: PushKeyResolver = PushKeyResolver(sseStorage)

	fun reScheduleAlarms() {
		val pushKeyResolver = PushKeyResolver(sseStorage)
		val alarmInfos = sseStorage.readAlarmNotifications()
		for (alarmNotification in alarmInfos) {
			val sessionKey = resolveSessionKey(alarmNotification, pushKeyResolver)
			if (sessionKey != null) {
				schedule(alarmNotification, sessionKey)
			} else {
				Log.d(TAG, "Failed to resolve session key for saved alarm notification")
			}
		}
	}

	private fun resolveSessionKey(notification: AlarmNotification, pushKeyResolver: PushKeyResolver): ByteArray? {
		val notificationSessionKey = notification.notificationSessionKey ?: return null
		try {
			val pushIdentifierSessionKey = pushKeyResolver
					.resolvePushSessionKey(notificationSessionKey.pushIdentifier.elementId)
			if (pushIdentifierSessionKey != null) {
				val encNotificationSessionKeyKey =
						notificationSessionKey.pushIdentifierSessionEncSessionKey.base64ToBytes()
				return crypto.decryptKey(pushIdentifierSessionKey, encNotificationSessionKeyKey)
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

	fun scheduleNewAlarms(alarmNotifications: List<AlarmNotification>) {
		for (alarmNotification in alarmNotifications) {
			if (alarmNotification.operation == OperationType.CREATE) {
				val sessionKey = resolveSessionKey(alarmNotification, pushKeyResolver)
				if (sessionKey == null) {
					Log.d(TAG, "Failed to resolve session key for alarm notification")
					return
				}
				schedule(alarmNotification, sessionKey)
				sseStorage.insertAlarmNotification(alarmNotification)
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

	private fun schedule(alarmNotification: AlarmNotification, sessionKey: ByteArray) {
		try {
			val trigger = alarmNotification.alarmInfo.getTriggerDec(crypto, sessionKey)
			val alarmTrigger: AlarmTrigger = AlarmTrigger[trigger]
			val summary = alarmNotification.getSummaryDec(crypto, sessionKey)
			val identifier = alarmNotification.alarmInfo.identifier
			val eventStart = alarmNotification.getEventStartDec(crypto, sessionKey)
			if (alarmNotification.repeatRule == null) {
				val alarmTime = AlarmModel.calculateAlarmTime(eventStart, null, alarmTrigger)
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
								summary,
								eventStart,
								alarmNotification.user!!
						)
					}
					else -> {
						Log.d(TAG, "Alarm $identifier is before $now, skipping")
					}
				}
			} else {
				iterateAlarmOccurrences(
						alarmNotification,
						crypto,
						sessionKey
				) { alarmTime, occurrence, eventStartTime ->
					if (occurrenceIsTooFar(alarmTime)) {
						Log.d(TAG, "Alarm occurrence $identifier $occurrence is too far in the future, skipping")
					} else {
						systemAlarmFacade.scheduleAlarmOccurrenceWithSystem(
								alarmTime, occurrence, identifier, summary, eventStartTime,
								alarmNotification.user!!
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
			alarmNotification: AlarmNotification,
			pushKeyResolver: PushKeyResolver,
	) {

		// The DELETE notification we receive from the server has only placeholder fields and no keys. We must use our saved alarm to cancel notifications.
		val savedAlarmNotification = sseStorage.readAlarmNotifications().find { it == alarmNotification }
		if (savedAlarmNotification != null) {
			cancelSavedAlarm(savedAlarmNotification, pushKeyResolver)
		} else {
			Log.d(TAG, "Cancelling alarm " + alarmNotification.alarmInfo.identifier)
			systemAlarmFacade.cancelAlarm(alarmNotification.alarmInfo.identifier, 0)
		}
	}

	private fun cancelSavedAlarm(savedAlarmNotification: AlarmNotification, pushKeyResolver: PushKeyResolver) {
		if (savedAlarmNotification.repeatRule != null) {
			val sessionKey = resolveSessionKey(savedAlarmNotification, pushKeyResolver)
			if (sessionKey == null) {
				Log.w(TAG, "Failed to resolve session key to cancel alarm ")
			} else {
				try {
					iterateAlarmOccurrences(savedAlarmNotification, crypto, sessionKey) { _, occurrence, _ ->
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
			crypto: Crypto,
			sessionKey: ByteArray,
			callback: AlarmIterationCallback,
	) {
		val repeatRule = alarmNotification.repeatRule!!
		val timeZone = repeatRule.getTimeZoneDec(crypto, sessionKey)
		val eventStart = alarmNotification.getEventStartDec(crypto, sessionKey)
		val eventEnd = alarmNotification.getEventEndDec(crypto, sessionKey)
		val frequency = repeatRule.getFrequencyDec(crypto, sessionKey)
		val interval = repeatRule.getIntervalDec(crypto, sessionKey)
		val endType = repeatRule.getEndTypeDec(crypto, sessionKey)
		val endValue = repeatRule.getEndValueDec(crypto, sessionKey)
		val alarmTrigger: AlarmTrigger = AlarmTrigger[alarmNotification.alarmInfo.getTriggerDec(crypto, sessionKey)]
		AlarmModel.iterateAlarmOccurrences(
				Date(),
				timeZone, eventStart, eventEnd, frequency, interval, endType,
				endValue, alarmTrigger, TimeZone.getDefault(), callback
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

