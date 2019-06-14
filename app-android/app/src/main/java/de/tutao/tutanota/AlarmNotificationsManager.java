package de.tutao.tutanota;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.preference.PreferenceManager;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.security.KeyStoreException;
import java.security.UnrecoverableEntryException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.TimeZone;

import de.tutao.tutanota.push.SseInfo;
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
        List<AlarmNotification> alarmInfos = this.readSavedAlarmNotifications();
        for (AlarmNotification alarmNotification : alarmInfos) {
            byte[] sessionKey = this.resolveSessionKey(alarmNotification);
            if (sessionKey != null) {
                this.schedule(alarmNotification, sessionKey);
            }
        }
    }

    public byte[] resolveSessionKey(AlarmNotification notification) {
        for (AlarmNotification.NotificationSessionKey notificationSessionKey : notification.getNotificationSessionKeys()) {
            SseInfo sseInfo = this.sseStorage.getSseInfo();
            String deviceEncPushIdentifierSessionKey = sseInfo.getPushIdentifierToSessionKey().get(notificationSessionKey.getPushIdentifier().getElementId());
            if (deviceEncPushIdentifierSessionKey != null) {
                try {
                    byte[] pushIdentifierSessionKey = this.keyStoreFacade.decryptKey(deviceEncPushIdentifierSessionKey);
                    byte[] encNotificationSessionKeyKey = Utils.base64ToBytes(notificationSessionKey.getPushIdentifierSessionEncSessionKey());
                    return this.crypto.decryptKey(pushIdentifierSessionKey, encNotificationSessionKeyKey);
                } catch (UnrecoverableEntryException | KeyStoreException | CryptoError e) {
                    Log.d(TAG, "could not decrypt session key", e);
                    return null;
                }
            }
        }
        return null;
    }

    public void scheduleNewAlarms(List<AlarmNotification> alarmNotifications) {
        byte[] sessionKey = this.resolveSessionKey(alarmNotifications.get(0));
        if (sessionKey == null) {
            return;
        }
        List<AlarmNotification> savedInfos = this.readSavedAlarmNotifications();
        for (AlarmNotification alarmNotification : alarmNotifications) {
            if (alarmNotification.getOperation() == OperationType.CREATE) {
                this.schedule(alarmNotification, sessionKey);
                if (alarmNotification.getRepeatRule() != null) {
                    savedInfos.add(alarmNotification);
                }
            } else {
                this.cancelScheduledAlarm(alarmNotification);
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
        String trigger;
        AlarmInterval alarmInterval;
        String summary;
        Date eventStart;
        String identifier = alarmInfAlarmNotification.getAlarmInfo().identifier;
        try {
            trigger = alarmInfAlarmNotification.getAlarmInfo().getTrigger(crypto, sessionKey);
            alarmInterval = AlarmInterval.byValue(trigger);
            summary = alarmInfAlarmNotification.getSummary(crypto, sessionKey);
            eventStart = alarmInfAlarmNotification.getEventStart(crypto, sessionKey);
        } catch (CryptoError cryptoError) {
            Log.w(TAG, "Error when decrypting alarmNotificaiton", cryptoError);
            return;
        }

        if (alarmInfAlarmNotification.getRepeatRule() == null) {
            // TODO: check for all-day event
            Date alarmTime = calculateAlarmTime(eventStart, null, alarmInterval);
            scheduleAlarmOccurrenceWithSystem(alarmTime, 0, identifier, summary, eventStart);
        } else {
            this.iterateAlarmOccurrences(alarmInfAlarmNotification, (time, occurrence) -> {
                // TODO: fix times here
                this.scheduleAlarmOccurrenceWithSystem(time, occurrence, identifier, summary, time);
            });
        }
    }

    private void iterateAlarmOccurrences(AlarmNotification alarmNotification, AlarmIterationCallback callback) {
        Objects.requireNonNull(alarmNotification.getRepeatRule());
        // TODO: Timezone should be local for all-day events?
        Calendar calendar = Calendar.getInstance(alarmNotification.getRepeatRule().timeZone);
        long now = System.currentTimeMillis();
        int occurrences = 0;
        int futureOccurrences = 0;
        while (futureOccurrences < 10
                && (alarmNotification.getRepeatRule().endType != EndType.COUNT
                || occurrences < alarmNotification.getRepeatRule().endValue)) {
            // TODO: increment time
            //calendar.setTime(alarmNotification.getAlarmInfo().trigger); // reset time to the initial
            incrementByRepeatPeriod(calendar, alarmNotification.getRepeatRule().frequency,
                    alarmNotification.getRepeatRule().interval * occurrences);

            // TODO: All-day events
            if (alarmNotification.getRepeatRule().endType == EndType.UNTIL
                    && calendar.getTimeInMillis() > alarmNotification.getRepeatRule().endValue) {
                break;
            }

            if (calendar.getTimeInMillis() >= now) {
                callback.call(calendar.getTime(), occurrences);
                futureOccurrences++;
            }
            occurrences++;
        }
    }

    private void scheduleAlarmOccurrenceWithSystem(Date alarmTime, int occurrence, String identifier, String summary, Date eventDate) {
        Log.d(TAG, "Scheduled notificaiton at" + alarmTime);
        AlarmManager alarmManager = getAlarmManager();
        // TODO: check how to identify occurrence uniquely
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

    private void cancelScheduledAlarm(AlarmNotification alarmInfo) {
        if (alarmInfo.getRepeatRule() == null) {
            PendingIntent pendingIntent = makeAlarmPendingIntent(0, alarmInfo.getAlarmInfo().identifier, "", new Date());
            getAlarmManager().cancel(pendingIntent);
        } else {
            this.iterateAlarmOccurrences(alarmInfo, (time, occurrence) -> {
                getAlarmManager().cancel(makeAlarmPendingIntent(0, alarmInfo.getAlarmInfo().identifier, "", new Date()));
            });
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
}
