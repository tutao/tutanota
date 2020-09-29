package de.tutao.tutanota.alarms;

import android.util.Log;

import androidx.annotation.Nullable;

import java.security.KeyStoreException;
import java.security.UnrecoverableEntryException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TimeZone;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.CryptoError;
import de.tutao.tutanota.OperationType;
import de.tutao.tutanota.R;
import de.tutao.tutanota.Utils;
import de.tutao.tutanota.push.LocalNotificationsFacade;
import de.tutao.tutanota.push.SseStorage;

public class AlarmNotificationsManager {
	// Default Android 10 limit is 500 but Samsung has such limit 200 since earlier versions and it's lower
	public static final int ALARM_LIMIT = 180;

	private static final String TAG = "AlarmNotificationsMngr";
	private final SseStorage sseStorage;
	private final Crypto crypto;
	private final SystemAlarmFacade systemAlarmFacade;
	private final PushKeyResolver pushKeyResolver;
	private final LocalNotificationsFacade localNotificationsFacade;

	public AlarmNotificationsManager(SseStorage sseStorage, Crypto crypto, SystemAlarmFacade systemAlarmFacade,
									 LocalNotificationsFacade localNotificationsFacade) {
		this.sseStorage = sseStorage;
		this.crypto = crypto;
		this.systemAlarmFacade = systemAlarmFacade;
		this.pushKeyResolver = new PushKeyResolver(sseStorage);
		this.localNotificationsFacade = localNotificationsFacade;
	}

	public void reScheduleAlarms() {
		PushKeyResolver pushKeyResolver = new PushKeyResolver(sseStorage);
		List<AlarmNotification> alarmInfos = sseStorage.readAlarmNotifications();
		List<AlarmOccurrence> occurrences = new ArrayList<>(alarmInfos.size());
		for (AlarmNotification alarmNotification : alarmInfos) {
			byte[] sessionKey = this.resolveSessionKey(alarmNotification, pushKeyResolver);
			if (sessionKey != null) {
				occurrences.addAll(getOccurrences(alarmNotification, sessionKey));
			} else {
				Log.d(TAG, "Failed to resolve session key for saved alarm notification: " + alarmNotification);
			}
		}
		// We sort all alarms to get the most recent ones to schedule
		Collections.sort(occurrences, (o1, o2) -> Long.compare(o1.alarmTime.getTime(), o2.alarmTime.getTime()));
		for (int i = 0; i < occurrences.size(); i++) {
			if (i == ALARM_LIMIT) {
				break;
			}
			AlarmOccurrence occurrence = occurrences.get(i);
			Log.d(TAG, "Re-scheduling alarm " + occurrence.identifier + "#" + occurrence.occurrence + " at " + occurrence.alarmTime);
			systemAlarmFacade.cancelAlarm(occurrence.identifier, occurrence.occurrence);
			systemAlarmFacade.scheduleAlarmOccurrenceWithSystem(occurrence.alarmTime, occurrence.occurrence, occurrence.identifier, occurrence.summary,
					occurrence.eventStart, occurrence.userId);
		}
	}

	public byte[] resolveSessionKey(AlarmNotification notification, PushKeyResolver pushKeyResolver) {
		AlarmNotification.NotificationSessionKey notificationSessionKey = notification.getNotificationSessionKey();
		if (notificationSessionKey == null) {
			return null;
		}
		try {
			byte[] pushIdentifierSessionKey = pushKeyResolver.resolvePushSessionKey(notificationSessionKey.getPushIdentifier().getElementId());
			if (pushIdentifierSessionKey != null) {
				byte[] encNotificationSessionKeyKey = Utils.base64ToBytes(notificationSessionKey.getPushIdentifierSessionEncSessionKey());
				return this.crypto.decryptKey(pushIdentifierSessionKey, encNotificationSessionKeyKey);
			}
		} catch (UnrecoverableEntryException | KeyStoreException | CryptoError e) {
			Log.w(TAG, "could not decrypt session key", e);
		}
		return null;
	}

	public void processAlarmNotifications(List<AlarmNotification> alarmNotifications) {
		for (AlarmNotification alarmNotification : alarmNotifications) {
			if (alarmNotification.getOperation() == OperationType.CREATE) {
				byte[] sessionKey = this.resolveSessionKey(alarmNotification, pushKeyResolver);
				if (sessionKey == null) {
					Log.d(TAG, "Failed to resolve session key for " + alarmNotification);
					return;
				}
				sseStorage.insertAlarmNotification(alarmNotification);
			} else {
				this.cancelScheduledAlarm(alarmNotification, pushKeyResolver);
				sseStorage.deleteAlarmNotification(alarmNotification.getAlarmInfo().getIdentifier());
			}
		}
		// If there are new alarms, we want to unschedule existing ones and schedule the most recent ones again to not go over the alarm limit
		reScheduleAlarms();
	}

	/**
	 * Deletes user alarms for a given user. If user is null then all scheduled alarms will be removed.
	 */
	public void unscheduleAlarms(@Nullable String userId) {
		List<AlarmNotification> alarmNotifications = sseStorage.readAlarmNotifications();
		for (AlarmNotification alarmNotification : alarmNotifications) {
			if (userId == null || alarmNotification.getUser().equals(userId)) {
				this.cancelSavedAlarm(alarmNotification, pushKeyResolver);
				sseStorage.deleteAlarmNotification(alarmNotification.getAlarmInfo().getIdentifier());
			}
		}
	}

	private List<AlarmOccurrence> getOccurrences(AlarmNotification alarmNotification, byte[] sessionKey) {
		try {
			String trigger = alarmNotification.getAlarmInfo().getTriggerDec(crypto, sessionKey);
			AlarmTrigger alarmTrigger = AlarmTrigger.get(trigger);
			String summary = alarmNotification.getSummaryDec(crypto, sessionKey);
			String identifier = alarmNotification.getAlarmInfo().getIdentifier();
			Date eventStart = alarmNotification.getEventStartDec(crypto, sessionKey);

			if (alarmNotification.getRepeatRule() == null) {
				Date alarmTime = AlarmModel.calculateAlarmTime(eventStart, null, alarmTrigger);
				Date now = new Date();
				if (alarmTime.after(now)) {
					return Collections.singletonList(new AlarmOccurrence(identifier, 0, alarmTime, eventStart, summary, alarmNotification.getUser()));
				} else {
					Log.d(TAG, "Alarm " + identifier + " at " + alarmTime + " is before " + now + ", skipping");
				}
			} else {
				List<AlarmOccurrence> occurrences = new ArrayList<>();
				this.iterateAlarmOccurrences(alarmNotification, crypto, sessionKey, (alarmTime, occurrence, eventStartTime) -> {
					occurrences.add(new AlarmOccurrence(identifier, occurrence, alarmTime, eventStart, summary, alarmNotification.getUser()));
				});
				return occurrences;
			}
		} catch (CryptoError cryptoError) {
			Log.w(TAG, "Error when decrypting alarmNotificaiton", cryptoError);
		} catch (Exception e) {
			Log.e(TAG, "Error when scheduling alarm", e);
			localNotificationsFacade.showErrorNotification(R.string.wantToSendReport_msg, e);
		}
		return Collections.emptyList();
	}

	/**
	 * Cancel scheduled alarm with the system
	 *
	 * @param alarmNotification may come from the server or may be a saved one
	 */
	private void cancelScheduledAlarm(AlarmNotification alarmNotification,
									  PushKeyResolver pushKeyResolver) {
		// The DELETE notification we receive from the server has only placeholder fields and no keys. We must use our saved alarm to cancel notifications.
		List<AlarmNotification> alarmNotifications = sseStorage.readAlarmNotifications();
		int indexOfExistingAlarm = alarmNotifications.indexOf(alarmNotification);
		if (indexOfExistingAlarm == -1) {
			Log.d(TAG, "Cancelling alarm " + alarmNotification.getAlarmInfo().getIdentifier());
			systemAlarmFacade.cancelAlarm(alarmNotification.getAlarmInfo().getIdentifier(), 0);
		} else {
			cancelSavedAlarm(alarmNotifications.get(indexOfExistingAlarm), pushKeyResolver);
		}
	}

	private void cancelSavedAlarm(AlarmNotification savedAlarmNotification, PushKeyResolver pushKeyResolver) {
		if (savedAlarmNotification.getRepeatRule() != null) {
			byte[] sessionKey = resolveSessionKey(savedAlarmNotification, pushKeyResolver);
			if (sessionKey == null) {
				Log.w(TAG, "Failed to resolve session key to cancel alarm " + savedAlarmNotification);
			} else {
				try {
					this.iterateAlarmOccurrences(savedAlarmNotification, crypto, sessionKey, (alarmTime, occurrence, eventStartTime) -> {
						Log.d(TAG, "Cancelling alarm " + savedAlarmNotification.getAlarmInfo().getIdentifier() + " # " + occurrence);
						systemAlarmFacade.cancelAlarm(savedAlarmNotification.getAlarmInfo().getIdentifier(), occurrence);
					});
				} catch (CryptoError cryptoError) {
					Log.w(TAG, "Failed to decrypt notification to cancel alarm " + savedAlarmNotification, cryptoError);
				}
			}
		} else {
			Log.d(TAG, "Cancelling alarm " + savedAlarmNotification.getAlarmInfo().getIdentifier());
			systemAlarmFacade.cancelAlarm(savedAlarmNotification.getAlarmInfo().getIdentifier(), 0);
		}
	}


	private void iterateAlarmOccurrences(AlarmNotification alarmNotification, Crypto crypto,
										 byte[] sessionKey,
										 AlarmModel.AlarmIterationCallback callback
	) throws CryptoError {
		RepeatRule repeatRule = Objects.requireNonNull(alarmNotification.getRepeatRule());
		TimeZone timeZone = repeatRule.getTimeZoneDec(crypto, sessionKey);

		Date eventStart = alarmNotification.getEventStartDec(crypto, sessionKey);
		Date eventEnd = alarmNotification.getEventEndDec(crypto, sessionKey);
		RepeatPeriod frequency = repeatRule.getFrequencyDec(crypto, sessionKey);
		int interval = repeatRule.getIntervalDec(crypto, sessionKey);
		EndType endType = repeatRule.getEndTypeDec(crypto, sessionKey);
		long endValue = repeatRule.getEndValueDec(crypto, sessionKey);
		AlarmTrigger alarmTrigger = AlarmTrigger.get(
				alarmNotification.getAlarmInfo().getTriggerDec(crypto, sessionKey));

		AlarmModel.iterateAlarmOccurrences(new Date(),
				timeZone, eventStart, eventEnd, frequency, interval, endType,
				endValue, alarmTrigger, TimeZone.getDefault(), callback);
	}


	private static class PushKeyResolver {
		private final SseStorage sseStorage;
		private final Map<String, byte[]> pushIdentifierToResolvedSessionKey = new HashMap<>();

		private PushKeyResolver(SseStorage sseStorage) {
			this.sseStorage = sseStorage;
		}

		@Nullable
		byte[] resolvePushSessionKey(String pushIdentifierId) throws UnrecoverableEntryException,
				KeyStoreException, CryptoError {
			byte[] resolved = pushIdentifierToResolvedSessionKey.get(pushIdentifierId);
			if (resolved != null) {
				return resolved;
			} else {
				byte[] pushIdentifierSessionKey = sseStorage.getPushIdentifierSessionKey(pushIdentifierId);
				if (pushIdentifierSessionKey == null) {
					return null;
				}
				pushIdentifierToResolvedSessionKey.put(pushIdentifierId, pushIdentifierSessionKey);
				return pushIdentifierSessionKey;
			}
		}
	}

	private static final class AlarmOccurrence {
		final String identifier;
		final int occurrence;
		final Date alarmTime;
		final Date eventStart;
		final String summary;
		final String userId;

		private AlarmOccurrence(String identifier, int occurrence, Date alarmTime, Date eventStart, String summary, String userId) {
			this.occurrence = occurrence;
			this.identifier = identifier;
			this.alarmTime = alarmTime;
			this.eventStart = eventStart;
			this.summary = summary;
			this.userId = userId;
		}

		@Override
		public String toString() {
			return "AlarmOccurrence{" +
					"identifier='" + identifier + '\'' +
					", occurrence=" + occurrence +
					", alarmTime=" + alarmTime +
					", eventStart=" + eventStart +
					", summary='" + summary + '\'' +
					", userId='" + userId + '\'' +
					'}';
		}
	}
}
