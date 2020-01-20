package de.tutao.tutanota.alarms;

import android.support.annotation.Nullable;
import android.util.Log;

import java.io.IOException;
import java.security.KeyStoreException;
import java.security.UnrecoverableEntryException;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TimeZone;

import de.tutao.tutanota.AndroidKeyStoreFacade;
import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.CryptoError;
import de.tutao.tutanota.OperationType;
import de.tutao.tutanota.Utils;
import de.tutao.tutanota.push.SseStorage;

public class AlarmNotificationsManager {
	private static final String TAG = "AlarmNotificationsMngr";
	private final AndroidKeyStoreFacade keyStoreFacade;
	private final SseStorage sseStorage;
	private final Crypto crypto;
	private final SystemAlarmFacade systemAlarmFacade;

	public AlarmNotificationsManager(AndroidKeyStoreFacade androidKeyStoreFacade, SseStorage sseStorage, Crypto crypto, SystemAlarmFacade systemAlarmFacade) {
		keyStoreFacade = androidKeyStoreFacade;
		this.sseStorage = sseStorage;
		this.crypto = crypto;
		this.systemAlarmFacade = systemAlarmFacade;
	}

	public void reScheduleAlarms() {
		try {
			PushKeyResolver pushKeyResolver =
					new PushKeyResolver(keyStoreFacade, sseStorage.getPushIdentifierKeys());
			List<AlarmNotification> alarmInfos = sseStorage.readSavedAlarmNotifications();
			for (AlarmNotification alarmNotification : alarmInfos) {
				byte[] sessionKey = this.resolveSessionKey(alarmNotification, pushKeyResolver);
				if (sessionKey != null) {
					this.schedule(alarmNotification, sessionKey);
				}
			}
		} catch (IOException e) {
			Log.w(TAG, "Could not read pushIdentifierKeys", e);
		}
	}

	public byte[] resolveSessionKey(AlarmNotification notification, PushKeyResolver pushKeyResolver) {
		for (AlarmNotification.NotificationSessionKey notificationSessionKey : notification.getNotificationSessionKeys()) {
			try {
				byte[] pushIdentifierSessionKey = pushKeyResolver
						.resolvePushSessionKey(notificationSessionKey.getPushIdentifier().getElementId());
				if (pushIdentifierSessionKey != null) {

					byte[] encNotificationSessionKeyKey = Utils.base64ToBytes(notificationSessionKey.getPushIdentifierSessionEncSessionKey());
					return this.crypto.decryptKey(pushIdentifierSessionKey, encNotificationSessionKeyKey);
				}
			} catch (UnrecoverableEntryException | KeyStoreException | CryptoError e) {
				Log.w(TAG, "could not decrypt session key", e);
				return null;
			}
		}
		return null;
	}

	public void scheduleNewAlarms(List<AlarmNotification> alarmNotifications) {
		PushKeyResolver pushKeyResolver;
		try {
			pushKeyResolver = new PushKeyResolver(keyStoreFacade, sseStorage.getPushIdentifierKeys());
		} catch (IOException e) {
			Log.w(TAG, "Failed to read pushIdentifierKeys", e);
			return;
		}
		List<AlarmNotification> savedInfos = sseStorage.readSavedAlarmNotifications();
		for (AlarmNotification alarmNotification : alarmNotifications) {
			if (alarmNotification.getOperation() == OperationType.CREATE) {
				byte[] sessionKey = this.resolveSessionKey(alarmNotification, pushKeyResolver);
				if (sessionKey == null) {
					Log.d(TAG, "Failed to resolve session key for " + alarmNotification);
					return;
				}
				this.schedule(alarmNotification, sessionKey);
				if (!savedInfos.contains(alarmNotification)) {
					savedInfos.add(alarmNotification);
				}
			} else {
				this.cancelScheduledAlarm(alarmNotification, pushKeyResolver);
				savedInfos.remove(alarmNotification);
			}
		}
		sseStorage.writeAlarmInfos(savedInfos);
	}

	public void unscheduleAlarms(String userId) {
		List<AlarmNotification> alarmNotifications = sseStorage.readSavedAlarmNotifications();
		PushKeyResolver pushKeyResolver;
		try {
			pushKeyResolver = new PushKeyResolver(keyStoreFacade, sseStorage.getPushIdentifierKeys());
		} catch (IOException e) {
			Log.w(TAG, "Failed to read pushIdentifierKeys", e);
			return;
		}
		Iterator<AlarmNotification> savedAlarmsIterator = alarmNotifications.iterator();
		while (savedAlarmsIterator.hasNext()) {
			AlarmNotification alarmNotification = savedAlarmsIterator.next();
			if (alarmNotification.getUser().equals(userId)) {
				this.cancelSavedAlarm(alarmNotification, pushKeyResolver);
				savedAlarmsIterator.remove();
			}
		}
		sseStorage.writeAlarmInfos(alarmNotifications);
	}

	private void schedule(AlarmNotification alarmNotification, byte[] sessionKey) {
		try {
			String trigger = alarmNotification.getAlarmInfo().getTrigger(crypto, sessionKey);
			AlarmTrigger alarmTrigger = AlarmTrigger.get(trigger);
			String summary = alarmNotification.getSummary(crypto, sessionKey);
			String identifier = alarmNotification.getAlarmInfo().getIdentifier();
			Date eventStart = alarmNotification.getEventStart(crypto, sessionKey);

			if (alarmNotification.getRepeatRule() == null) {
				Date alarmTime = AlarmModel.calculateAlarmTime(eventStart, null, alarmTrigger);
				Date now = new Date();
				if (alarmTime.after(now)) {
					systemAlarmFacade.scheduleAlarmOccurrenceWithSystem(alarmTime, 0, identifier, summary, eventStart, alarmNotification.getUser());
				} else {
					Log.d(TAG, "Alarm " + identifier + " at " + alarmTime + " is before " + now + ", skipping");
				}
			} else {
				this.iterateAlarmOccurrences(alarmNotification, crypto, sessionKey, (alarmTime, occurrence, eventStartTime) ->
						systemAlarmFacade.scheduleAlarmOccurrenceWithSystem(alarmTime, occurrence, identifier, summary, eventStartTime,
								alarmNotification.getUser()));
			}
		} catch (CryptoError cryptoError) {
			Log.w(TAG, "Error when decrypting alarmNotificaiton", cryptoError);
		}
	}


	/**
	 * Cancel scheduled alarm with the system
	 *
	 * @param alarmNotification may come from the server or may be a saved one
	 */
	private void cancelScheduledAlarm(AlarmNotification alarmNotification,
									  PushKeyResolver pushKeyResolver) {
		// The DELETE notification we receive from the server has only placeholder fields and no keys. We must use our saved alarm to cancel notifications.
		List<AlarmNotification> alarmNotifications = sseStorage.readSavedAlarmNotifications();
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
			systemAlarmFacade.cancelAlarm(savedAlarmNotification.getAlarmInfo().getIdentifier(), 0);
		}
	}


	private void iterateAlarmOccurrences(AlarmNotification alarmNotification, Crypto crypto,
										 byte[] sessionKey,
										 AlarmModel.AlarmIterationCallback callback
	) throws CryptoError {
		RepeatRule repeatRule = Objects.requireNonNull(alarmNotification.getRepeatRule());
		TimeZone timeZone = repeatRule.getTimeZone(crypto, sessionKey);

		Date eventStart = alarmNotification.getEventStart(crypto, sessionKey);
		Date eventEnd = alarmNotification.getEventEnd(crypto, sessionKey);
		RepeatPeriod frequency = repeatRule.getFrequency(crypto, sessionKey);
		int interval = repeatRule.getInterval(crypto, sessionKey);
		EndType endType = repeatRule.getEndType(crypto, sessionKey);
		long endValue = repeatRule.getEndValue(crypto, sessionKey);
		AlarmTrigger alarmTrigger = AlarmTrigger.get(
				alarmNotification.getAlarmInfo().getTrigger(crypto, sessionKey));

		AlarmModel.iterateAlarmOccurrences(new Date(),
				timeZone, eventStart, eventEnd, frequency, interval, endType,
				endValue, alarmTrigger, TimeZone.getDefault(), callback);
	}

	private static class PushKeyResolver {
		private AndroidKeyStoreFacade keyStoreFacade;
		private final Map<String, String> pushIdentifierToEncSessionKey;
		private final Map<String, byte[]> pushIdentifierToResolvedSessionKey = new HashMap<>();

		private PushKeyResolver(AndroidKeyStoreFacade keyStoreFacade, Map<String, String> pushIdentifierToEncSessionKey) {
			this.keyStoreFacade = keyStoreFacade;
			this.pushIdentifierToEncSessionKey = pushIdentifierToEncSessionKey;
		}

		@Nullable
		byte[] resolvePushSessionKey(String pushIdentifierId) throws UnrecoverableEntryException,
				KeyStoreException, CryptoError {
			byte[] resolved = pushIdentifierToResolvedSessionKey.get(pushIdentifierId);
			if (resolved != null) {
				return resolved;
			} else {
				String encryptedSessionKey = pushIdentifierToEncSessionKey.get(pushIdentifierId);
				if (encryptedSessionKey == null) {
					return null;
				}
				byte[] decryptedSessionKey = keyStoreFacade.decryptKey(encryptedSessionKey);
				pushIdentifierToResolvedSessionKey.put(pushIdentifierId, decryptedSessionKey);
				return decryptedSessionKey;
			}
		}
	}
}
