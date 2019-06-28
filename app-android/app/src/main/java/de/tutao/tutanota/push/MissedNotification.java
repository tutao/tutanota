package de.tutao.tutanota.push;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import de.tutao.tutanota.alarms.AlarmNotification;

public final class MissedNotification {
    private final List<AlarmNotification> alarmNotifications;

    public static MissedNotification fromJson(JSONObject jsonObject) throws JSONException {
        JSONArray alarmNotificationsJson = jsonObject.getJSONArray("alarmNotifications");
        List<AlarmNotification> alarmNotifications = new ArrayList<>(alarmNotificationsJson.length());
        for (int i = 0; i < alarmNotificationsJson.length(); i++) {
            alarmNotifications.add(AlarmNotification.fromJson(alarmNotificationsJson.getJSONObject(i)));
        }
        return new MissedNotification(alarmNotifications);
    }

    private MissedNotification(List<AlarmNotification> alarmNotifications) {
        this.alarmNotifications = alarmNotifications;
    }

    public List<AlarmNotification> getAlarmNotifications() {
        return alarmNotifications;
    }
}
