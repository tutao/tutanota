package de.tutao.tutanota.alarms

import android.util.Log
import de.tutao.tutanota.R
import de.tutao.tutanota.push.LocalNotificationsFacade
import de.tutao.tutasdk.ApiCallException
import de.tutao.tutasdk.ByRule
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.CryptoError
import de.tutao.tutashared.DateProvider
import de.tutao.tutashared.OperationType
import de.tutao.tutashared.alarms.AlarmInterval
import de.tutao.tutashared.alarms.AlarmModel
import de.tutao.tutashared.alarms.AlarmNotification
import de.tutao.tutashared.alarms.EncryptedAlarmNotification
import de.tutao.tutashared.alarms.EncryptedAlarmNotificationEntity
import de.tutao.tutashared.alarms.SystemAlarmFacade
import de.tutao.tutashared.alarms.decrypt
import de.tutao.tutashared.alarms.toEntity
import de.tutao.tutashared.base64ToBytes
import de.tutao.tutashared.isAllDayEventByTimes
import de.tutao.tutashared.push.SseStorage
import java.security.KeyStoreException
import java.security.UnrecoverableEntryException
import java.util.Date
import java.util.TimeZone
import java.util.concurrent.TimeUnit

class AlarmNotificationsManager(
	private val sseStorage: SseStorage,
	private val crypto: AndroidNativeCryptoFacade,
	private val systemAlarmFacade: SystemAlarmFacade,
	private val localNotificationsFacade: LocalNotificationsFacade,
	private val dateProvider: DateProvider,
	private val timeZone: TimeZone
) {
	private val pushKeyResolver: PushKeyResolver = PushKeyResolver(sseStorage)

	fun reScheduleAlarms() {
		val pushKeyResolver = PushKeyResolver(sseStorage)
		val alarmInfos = sseStorage.readAlarmNotifications()
		for (alarmNotification in alarmInfos) {
			val sessionKey = resolveNotificationSessionKey(alarmNotification, pushKeyResolver)
			if (sessionKey != null) {
				val decryptedAlarmNotification: AlarmNotification = try {
					alarmNotification.decrypt(crypto, sessionKey)
				} catch (cryptoError: CryptoError) {
					Log.e(TAG, "Failed to decrypt notification to reschedule alarm ", cryptoError)
					continue
				} catch (exception: IllegalArgumentException) {
					Log.e(TAG, "Invalid argument/value inside the alarm notification", exception)
					// there is an invalid value inside the decrypted alarm notification  e.g. "" instead of 0 or null
					// In these case we never scheduled the alarm, so we can safely remove the alarm notification from sseStorage.
					this.sseStorage.deleteAlarmNotification(alarmNotification.alarmInfo.identifier)
					continue
				}
				schedule(decryptedAlarmNotification)
			} else {
				Log.d(TAG, "Failed to resolve session key for saved alarm notification")
			}
		}
	}

	private fun resolveNotificationSessionKey(
		notification: EncryptedAlarmNotificationEntity,
		pushKeyResolver: PushKeyResolver
	): ByteArray? {
		val encNotificationSessionKey = notification.notificationSessionKey ?: return null
		try {
			val pushIdentifierSessionKey = pushKeyResolver
				.resolvePushSessionKey(encNotificationSessionKey.pushIdentifier.elementId)
			if (pushIdentifierSessionKey != null) {
				val pushIdentifierSessionEncSessionKey =
					encNotificationSessionKey.pushIdentifierSessionEncSessionKey.base64ToBytes()
				return crypto.decryptKey(
					encryptionKey = pushIdentifierSessionKey,
					encryptedKeyWithoutIV = pushIdentifierSessionEncSessionKey
				)
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

	fun scheduleNewAlarms(alarmNotifications: List<EncryptedAlarmNotification>, newDeviceSessionKey: ByteArray?) {
		for (alarmNotification in alarmNotifications) {
			if (alarmNotification.operation == OperationType.CREATE) {
				val alarmNotificationEntity = alarmNotification.toEntity()
				val sessionKey =
					newDeviceSessionKey ?: resolveNotificationSessionKey(alarmNotificationEntity, pushKeyResolver)
				if (sessionKey == null) {
					Log.d(TAG, "Failed to resolve session key for alarm notification.")
					continue
				}
				val decryptedAlarmNotificationEntity = try {
					alarmNotificationEntity.decrypt(crypto, sessionKey)
				} catch (e: Exception) {
					Log.e(TAG, "Unable to decrypt alarmNotification, skipp schedule new alarm.", e)
					continue
				}

				schedule(decryptedAlarmNotificationEntity)
				Log.d(TAG, "storing alarm in sseStorage: $alarmNotificationEntity")
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

			val pushIdentifier = this.sseStorage.getPushIdentifier()
			val canReceiveCalendarNotifications =
				this.sseStorage.getReceiveCalendarNotificationConfig(pushIdentifier ?: "")

			// We don't need to check from which device type the identifier comes from, only Mobile Mail App is allowed to set this ReceiveCalendarNotificationConfig
			if (!canReceiveCalendarNotifications) {
				Log.d(
					TAG,
					"Skipping alarm scheduling - alarmIdentifier: $identifier"
				)
				return
			}

			if (alarmNotification.repeatRule == null) {
				val isAllDayEvent = isAllDayEventByTimes(alarmNotification.eventStart, alarmNotification.eventEnd)
				val localizedEventStartTime = if (isAllDayEvent) {
					AlarmModel.getAllDayDateLocal(alarmNotification.eventStart, timeZone)
				} else {
					alarmNotification.eventStart
				}

				val alarmTime = AlarmModel.calculateAlarmTime(
					localizedEventStartTime,
					timeZone,
					alarmNotification.alarmInfo.trigger
				)

				val now = dateProvider.now
				when {
					occurrenceIsTooFar(alarmTime) -> {
						Log.d(TAG, "Alarm $identifier is too far in the future, skipping")
					}

					alarmTime.toInstant().isAfter(now) -> {
						systemAlarmFacade.scheduleAlarmOccurrenceWithSystem(
							alarmTime,
							0,
							identifier,
							alarmNotification.summary,
							alarmNotification.eventStart,
							alarmNotification.user,
							isAllDayEventByTimes(alarmNotification.eventStart, alarmNotification.eventEnd)
						)
					}

					else -> {
						Log.d(TAG, "Alarm $identifier is before ${now.atZone(timeZone.toZoneId())}, skipping")
					}
				}
			} else {
				iterateAlarmOccurrences(alarmNotification) { alarmTime, occurrence, eventStartTime ->
					if (occurrenceIsTooFar(alarmTime)) {
						Log.d(TAG, "Alarm occurrence $identifier $occurrence is too far in the future, skipping")
					} else {
						systemAlarmFacade.scheduleAlarmOccurrenceWithSystem(
							alarmTime, occurrence, identifier, alarmNotification.summary, eventStartTime,
							alarmNotification.user,
							isAllDayEventByTimes(alarmNotification.eventStart, alarmNotification.eventEnd)
						)
					}
				}
			}
		} catch (e: Exception) {
			Log.e(TAG, "Error when scheduling alarm", e)
			localNotificationsFacade.showErrorNotification(R.string.wantToSendReport_msg, e)
		}
	}

	private fun occurrenceIsTooFar(alarmTime: Date): Boolean {
		return alarmTime.time > dateProvider.now.toEpochMilli().plus(TIME_IN_THE_FUTURE_LIMIT_MS)
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

	private fun cancelSavedAlarm(
		savedAlarmNotification: EncryptedAlarmNotificationEntity,
		pushKeyResolver: PushKeyResolver
	) {
		if (savedAlarmNotification.repeatRule != null) {
			val sessionKey = resolveNotificationSessionKey(savedAlarmNotification, pushKeyResolver)
			if (sessionKey == null) {
				Log.w(TAG, "Failed to resolve session key to cancel alarm ")
			} else {
				val alarmNotification: AlarmNotification = try {
					savedAlarmNotification.decrypt(crypto, sessionKey)
				} catch (cryptoError: CryptoError) {
					Log.e(TAG, "Failed to decrypt notification to cancel alarm ", cryptoError)
					return
				} catch (exception: IllegalArgumentException) {
					Log.e(TAG, "Failed to decrypt notification to cancel alarm ", exception)
					return
				} catch (exception: NumberFormatException) {
					Log.e(TAG, "Failed to decrypt notification to cancel alarm ", exception)
					return
				}

				try {
					iterateAlarmOccurrences(alarmNotification) { _, occurrence, _ ->
						Log.d(
							TAG,
							"Cancelling alarm " + savedAlarmNotification.alarmInfo.identifier + " # " + occurrence
						)
						systemAlarmFacade.cancelAlarm(savedAlarmNotification.alarmInfo.identifier, occurrence)
					}
				} catch (e: Exception) {
					Log.e(
						TAG,
						"Error when trying to cancel saved alarm, this could be a source of duplicated or ghost alarms!",
						e
					)
					localNotificationsFacade.showErrorNotification(R.string.wantToSendReport_msg, e)
				}
			}
		} else {
			Log.d(TAG, "Cancelling alarm " + savedAlarmNotification.alarmInfo.identifier)
			systemAlarmFacade.cancelAlarm(savedAlarmNotification.alarmInfo.identifier, 0)
		}
	}

	@Throws(CryptoError::class, ApiCallException::class)
	private fun iterateAlarmOccurrences(
		alarmNotification: AlarmNotification,
		callback: AlarmModel.AlarmIterationCallback,
	) {
		val repeatRule = alarmNotification.repeatRule!!
		val eventTimeZone = repeatRule.timeZone
		val eventStart = alarmNotification.eventStart
		val eventEnd = alarmNotification.eventEnd
		val frequency = repeatRule.frequency
		val interval = repeatRule.interval
		val endType = repeatRule.endType
		val endValue = repeatRule.endValue
		val excludedDates = repeatRule.excludedDates
		val alarmTrigger: AlarmInterval = alarmNotification.alarmInfo.trigger
		val byRules: List<ByRule> = alarmNotification.repeatRule?.advancedRules ?: listOf()

		AlarmModel.iterateAlarmOccurrences(
			Date.from(dateProvider.now),
			eventTimeZone, eventStart, eventEnd, frequency, interval, endType,
			endValue, alarmTrigger, timeZone, excludedDates, byRules, callback
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

