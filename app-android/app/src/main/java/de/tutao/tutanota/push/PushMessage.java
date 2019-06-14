package de.tutao.tutanota.push;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import de.tutao.tutanota.AlarmNotification;

final class PushMessage {
    private static final String TITLE_KEY = "title";
    private static final String ADDRESS_KEY = "address";
    private static final String COUNTER_KEY = "counter";
    private static final String USER_ID_KEY = "userId";
    private static final String NOTIFICATIONS_KEY = "notificationInfos";
    private static final String CONFIRMATION_ID_KEY = "confirmationId";
    private static final String ALARM_INFOS_KEY = "alarmInfos";
    private static final String ALARM_NOTIFICATIONS_KEY = "alarmNotifications";

    private final String title;
    private final String confirmationId;
    private final List<NotificationInfo> notificationInfos;
    private final List<AlarmNotification> alarmInfos;

    public static PushMessage fromJson(String json) throws JSONException {
        JSONObject jsonObject = new JSONObject(json);
        String title = jsonObject.getString(TITLE_KEY);
        String confirmationId = jsonObject.getString(CONFIRMATION_ID_KEY);
        JSONArray recipientInfosJsonArray = jsonObject.getJSONArray(NOTIFICATIONS_KEY);
        List<NotificationInfo> notificationInfos = new ArrayList<>(recipientInfosJsonArray.length());
        for (int i = 0; i < recipientInfosJsonArray.length(); i++) {
            JSONObject itemObject = recipientInfosJsonArray.getJSONObject(i);
            String address = itemObject.getString(ADDRESS_KEY);
            int counter = itemObject.getInt(COUNTER_KEY);
            String userId = itemObject.getString(USER_ID_KEY);
            notificationInfos.add(new NotificationInfo(address, counter, userId));
        }
        JSONArray alarmInfosJsonArray = jsonObject.getJSONArray(ALARM_NOTIFICATIONS_KEY);
        List<AlarmNotification> alarmNotifications = new ArrayList<>();
        for (int i = 0; i < alarmInfosJsonArray.length(); i++) {
            JSONObject itemObject = alarmInfosJsonArray.getJSONObject(i);
            alarmNotifications.add(AlarmNotification.fromJson(itemObject));
        }
        return new PushMessage(title, confirmationId, notificationInfos, alarmNotifications);
    }

    private PushMessage(String title, String confirmationId,
                        List<NotificationInfo> notificationInfos,
                        List<AlarmNotification> alarmInfos) {
        this.title = title;
        this.confirmationId = confirmationId;
        this.notificationInfos = notificationInfos;
        this.alarmInfos = alarmInfos;
    }

    public String getTitle() {
        return title;
    }

    public List<NotificationInfo> getNotificationInfos() {
        return notificationInfos;
    }

    public String getConfirmationId() {
        return confirmationId;
    }

    public List<AlarmNotification> getAlarmInfos() {
        return alarmInfos;
    }

    final static class NotificationInfo {
        private final String address;
        private final int counter;
        private String userId;

        NotificationInfo(String address, int counter, String userId) {
            this.address = address;
            this.counter = counter;
            this.userId = userId;
        }

        public String getAddress() {
            return address;
        }

        public int getCounter() {
            return counter;
        }

        public String getUserId() {
            return userId;
        }
    }
}
