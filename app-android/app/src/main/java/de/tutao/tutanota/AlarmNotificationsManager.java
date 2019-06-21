package de.tutao.tutanota;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.preference.PreferenceManager;
import android.support.annotation.Nullable;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.security.KeyStoreException;
import java.security.UnrecoverableEntryException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TimeZone;

import de.tutao.tutanota.push.SseStorage;

public class AlarmNotificationsManager {
    private static final String TAG = "AlarmNotificationsMngr";
    private static final String RECURRING_ALARMS_PREF_NAME = "RECURRING_ALARMS";
    private final Context context;
    private final AndroidKeyStoreFacade keyStoreFacade;
    private final SseStorage sseStorage;
    private final Crypto crypto;

    public AlarmNotificationsManager(Context context, SseStorage sseStorage) {
        this.context = context;
        this.sseStorage = sseStorage;
        this.keyStoreFacade = new AndroidKeyStoreFacade(context);
        crypto = new Crypto(context);
    }

    public void reScheduleAlarms() {
        try {
            PushKeyResolver pushKeyResolver = new PushKeyResolver(keyStoreFacade, sseStorage.getPushIdentifierKeys());
            List<AlarmNotification> alarmInfos = this.readSavedAlarmNotifications();
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
                byte[] pushIdentifierSessionKey = pushKeyResolver.resolvePushSessionKey(notificationSessionKey.getPushIdentifier().getElementId());
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
        List<AlarmNotification> savedInfos = this.readSavedAlarmNotifications();
        for (AlarmNotification alarmNotification : alarmNotifications) {
            if (alarmNotification.getOperation() == OperationType.CREATE) {
                byte[] sessionKey = this.resolveSessionKey(alarmNotification, pushKeyResolver);
                if (sessionKey == null) {
                    Log.d(TAG, "Failed to resolve session key for " + alarmNotification);
                    return;
                }
                this.schedule(alarmNotification, sessionKey);
                if (alarmNotification.getRepeatRule() != null) {
                    savedInfos.add(alarmNotification);
                }
            } else {
                this.cancelScheduledAlarm(alarmNotification, pushKeyResolver);
                savedInfos.remove(alarmNotification);
            }
        }
        this.writeAlarmInfos(savedInfos);
    }

    private List<AlarmNotification> readSavedAlarmNotifications() {
        String jsonString = PreferenceManager.getDefaultSharedPreferences(context)
                .getString(RECURRING_ALARMS_PREF_NAME, "[]");
        ArrayList<AlarmNotification> alarmInfos = new ArrayList<>();
        try {
            JSONArray jsonArray = new JSONArray(jsonString);
            for (int i = 0; i < jsonArray.length(); i++) {
                alarmInfos.add(AlarmNotification.fromJson(jsonArray.getJSONObject(i)));
            }
        } catch (JSONException e) {
            alarmInfos = new ArrayList<>();
        }
        return alarmInfos;
    }

    private void writeAlarmInfos(List<AlarmNotification> alarmNotifications) {
        List<JSONObject> jsonObjectList = new ArrayList<>(alarmNotifications.size());
        for (AlarmNotification alarmNotification : alarmNotifications) {
            jsonObjectList.add(alarmNotification.toJSON());
        }
        String jsonString = JSONObject.wrap(jsonObjectList).toString();
        PreferenceManager.getDefaultSharedPreferences(context)
                .edit()
                .putString(RECURRING_ALARMS_PREF_NAME, jsonString)
                .apply();
    }

    private void schedule(AlarmNotification alarmInfAlarmNotification, byte[] sessionKey) {
        try {
            String trigger = alarmInfAlarmNotification.getAlarmInfo().getTrigger(crypto, sessionKey);
            AlarmInterval alarmInterval = AlarmInterval.byValue(trigger);
            String summary = alarmInfAlarmNotification.getSummary(crypto, sessionKey);
            String identifier = alarmInfAlarmNotification.getAlarmInfo().getIdentifier();
            Date eventStart = alarmInfAlarmNotification.getEventStart(crypto, sessionKey);

            if (alarmInfAlarmNotification.getRepeatRule() == null) {
                Date alarmTime = calculateAlarmTime(eventStart, null, alarmInterval);
                if (alarmTime.after(new Date())) {
                    scheduleAlarmOccurrenceWithSystem(alarmTime, 0, identifier, summary, eventStart);
                }
            } else {
                this.iterateAlarmOccurrences(alarmInfAlarmNotification, crypto, sessionKey, (time, occurrence) -> {
                    this.scheduleAlarmOccurrenceWithSystem(time, occurrence, identifier, summary, time);
                });
            }
        } catch (CryptoError cryptoError) {
            Log.w(TAG, "Error when decrypting alarmNotificaiton", cryptoError);
        }
    }

    private void iterateAlarmOccurrences(AlarmNotification alarmNotification, Crypto crypto, byte[] sessionKey, AlarmIterationCallback callback) throws CryptoError {
        RepeatRule repeatRule = Objects.requireNonNull(alarmNotification.getRepeatRule());
        TimeZone timeZone = repeatRule.getTimeZone(crypto, sessionKey);
        Calendar calendar = Calendar.getInstance(timeZone);
        long now = System.currentTimeMillis();
        int occurrences = 0;
        int futureOccurrences = 0;

        Date eventStart = alarmNotification.getEventStart(crypto, sessionKey);
        RepeatPeriod frequency = repeatRule.getFrequency(crypto, sessionKey);
        int interval = repeatRule.getInterval(crypto, sessionKey);
        EndType endType = repeatRule.getEndType(crypto, sessionKey);
        int endValue = repeatRule.getEndValue(crypto, sessionKey);
        AlarmInterval alarmInterval = AlarmInterval.byValue(
                alarmNotification.getAlarmInfo().getTrigger(crypto, sessionKey));

        while (futureOccurrences < 10
                && (endType != EndType.COUNT
                || occurrences < endValue)) {

            calendar.setTime(eventStart);
            incrementByRepeatPeriod(calendar, frequency, interval * occurrences);

            if (endType == EndType.UNTIL && calendar.getTimeInMillis() > endValue) {
                break;
            }
            Date alarmTime = calculateAlarmTime(calendar.getTime(), timeZone, alarmInterval);

            if (calendar.getTimeInMillis() >= now) {
                callback.call(alarmTime, occurrences);
                futureOccurrences++;
            }
            occurrences++;
        }
    }

    private void scheduleAlarmOccurrenceWithSystem(Date alarmTime, int occurrence, String identifier, String summary, Date eventDate) {
        Log.d(TAG, "Scheduled notification at: " + alarmTime);
        AlarmManager alarmManager = getAlarmManager();
        PendingIntent pendingIntent = makeAlarmPendingIntent(occurrence, identifier, summary, eventDate);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarmTime.getTime(), pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, alarmTime.getTime(), pendingIntent);
        }
    }

    private AlarmManager getAlarmManager() {
        return (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    }

    private void cancelScheduledAlarm(AlarmNotification alarmNotification, PushKeyResolver pushKeyResolver) {
        // Read saved alarm because the sent one doesn't have a session key
        List<AlarmNotification> alarmNotifications = this.readSavedAlarmNotifications();
        int indexOfExistingAlarm = alarmNotifications.indexOf(alarmNotification);

        if (indexOfExistingAlarm == -1) {
            PendingIntent pendingIntent = makeAlarmPendingIntent(0, alarmNotification.getAlarmInfo().getIdentifier(), "", new Date());
            getAlarmManager().cancel(pendingIntent);
        } else {
            AlarmNotification savedAlarmNotification = alarmNotifications.get(indexOfExistingAlarm);
            byte[] sessionKey = resolveSessionKey(alarmNotification, pushKeyResolver);
            if (sessionKey != null) {
                try {
                    this.iterateAlarmOccurrences(alarmNotification, crypto, sessionKey, (time, occurrence) -> {
                        getAlarmManager().cancel(makeAlarmPendingIntent(0, alarmNotification.getAlarmInfo().getIdentifier(), "", new Date()));
                    });
                } catch (CryptoError cryptoError) {
                    Log.w(TAG, "Failed to decrypt notification to cancel alarm " + savedAlarmNotification, cryptoError);
                }
            } else {
                Log.w(TAG, "Failed to resolve session key to cancel alarm " + savedAlarmNotification);
            }

        }
    }

    private PendingIntent makeAlarmPendingIntent(int occurrence, String identifier, String summary, Date eventDate) {
        Intent intent = AlarmBroadcastReceiver.makeAlarmIntent(occurrence, identifier, summary, eventDate);
        return PendingIntent.getBroadcast(context, 1, intent, 0);
    }

    private void incrementByRepeatPeriod(Calendar calendar, RepeatPeriod period,
                                         int interval) {
        int field;
        switch (period) {
            case DAILY:
                field = Calendar.DAY_OF_MONTH;
                break;
            case WEEKLY:
                field = Calendar.WEEK_OF_YEAR;
                break;
            case MONTHLY:
                field = Calendar.MONTH;
                break;
            case ANNUALLY:
                field = Calendar.YEAR;
                break;
            default:
                throw new AssertionError("Unknown repeatPeriod: " + period);
        }
        calendar.add(field, interval);
    }

    private Date calculateAlarmTime(Date eventStart, TimeZone timeZone,
                                    AlarmInterval alarmInterval) {
        Calendar calendar;
        if (timeZone != null) {
            calendar = Calendar.getInstance(timeZone);
        } else {
            calendar = Calendar.getInstance();
        }
        calendar.setTime(eventStart);
        switch (alarmInterval) {
            case FIVE_MINUTES:
                calendar.add(Calendar.MINUTE, -5);
                break;
            case TEN_MINUTES:
                calendar.add(Calendar.MINUTE, -10);
                break;
            case THIRTY_MINUTES:
                calendar.add(Calendar.MINUTE, -30);
                break;
            case ONE_HOUR:
                calendar.add(Calendar.HOUR, -1);
                break;
            case ONE_DAY:
                calendar.add(Calendar.DAY_OF_MONTH, -1);
                break;
            case TWO_DAYS:
                calendar.add(Calendar.DAY_OF_MONTH, -2);
                break;
            case THREE_DAYS:
                calendar.add(Calendar.DAY_OF_MONTH, -3);
                break;
            case ONE_WEEK:
                calendar.add(Calendar.WEEK_OF_MONTH, -1);
                break;
        }
        return calendar.getTime();
    }

    private interface AlarmIterationCallback {
        void call(Date time, int occurrence);
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
        public byte[] resolvePushSessionKey(String pushIdentifierId) throws UnrecoverableEntryException, KeyStoreException, CryptoError {
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
