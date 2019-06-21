package de.tutao.tutanota.alarms;

import android.support.annotation.Nullable;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Objects;

import de.tutao.tutanota.Crypto;
import de.tutao.tutanota.CryptoError;
import de.tutao.tutanota.EncryptionUtils;
import de.tutao.tutanota.IdTuple;
import de.tutao.tutanota.OperationType;

public class AlarmNotification {

    private OperationType operation;
    private String summary;
    private String eventStart;
    private AlarmInfo alarmInfo;
    private RepeatRule repeatRule;
    private List<NotificationSessionKey> notificationSessionKeys;

    public AlarmNotification(OperationType operation, String summaryEnc, String eventStart, AlarmInfo alarmInfo, RepeatRule repeatRule, List<NotificationSessionKey> notificationSessionKeys) {
        this.operation = operation;
        this.summary = summaryEnc;
        this.eventStart = eventStart;
        this.alarmInfo = alarmInfo;
        this.repeatRule = repeatRule;
        this.notificationSessionKeys = notificationSessionKeys;
    }

    public static AlarmNotification fromJson(JSONObject jsonObject) throws JSONException {
        OperationType operationType = OperationType.values()[jsonObject.getInt("operation")];
        String summaryEnc = jsonObject.getString("summary");
        String eventStartEnc = jsonObject.getString("eventStart");
        RepeatRule repeatRule;
        if (jsonObject.isNull("repeatRule")) {
            repeatRule = null;
        } else {
            repeatRule = RepeatRule.fromJson(jsonObject.getJSONObject("repeatRule"));
        }
        AlarmInfo alarmInfo = AlarmInfo.fromJson(jsonObject.getJSONObject("alarmInfo"));
        JSONArray notificationSessionKeysJSON = jsonObject.getJSONArray("notificationSessionKeys");
        List<NotificationSessionKey> notificationSessionKeys = new ArrayList<>();
        for (int i = 0; i < notificationSessionKeysJSON.length(); i++) {
            notificationSessionKeys.add(NotificationSessionKey.fromJson(notificationSessionKeysJSON.getJSONObject(i)));
        }
        return new AlarmNotification(operationType, summaryEnc, eventStartEnc, alarmInfo, repeatRule, notificationSessionKeys);
    }

    public JSONObject toJSON() {
        try {
            JSONObject jsonObject = new JSONObject();
            if (this.repeatRule != null) {
                jsonObject.put("repeatRule", this.repeatRule.toJson());
            }
            return jsonObject;
        } catch (JSONException e) {
            throw new RuntimeException(e);
        }
    }

    public OperationType getOperation() {
        return operation;
    }

    public String getEventStart() {
        return eventStart;
    }

    @Nullable
    public Date getEventStart(Crypto crypto, byte[] sessionKey) throws CryptoError {
        return EncryptionUtils.decryptDate(this.eventStart, crypto, sessionKey);

    }

    public String getSummary(Crypto crypto, byte[] sessionKey) throws CryptoError {
        return EncryptionUtils.decryptString(this.summary, crypto, sessionKey);
    }

    public RepeatRule getRepeatRule() {
        return repeatRule;
    }

    public AlarmInfo getAlarmInfo() {
        return alarmInfo;
    }

    public List<NotificationSessionKey> getNotificationSessionKeys() {
        return notificationSessionKeys;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AlarmNotification that = (AlarmNotification) o;
        return Objects.equals(alarmInfo.getIdentifier(), that.alarmInfo.getIdentifier());
    }

    @Override
    public int hashCode() {
        return Objects.hash(alarmInfo.getIdentifier());
    }

    public static class NotificationSessionKey {
        private final IdTuple pushIdentifier;
        private final String pushIdentifierSessionEncSessionKey;

        public static NotificationSessionKey fromJson(JSONObject jsonObject) throws JSONException {
            JSONArray id = jsonObject.getJSONArray("pushIdentifier");
            return new NotificationSessionKey(
                    new IdTuple(id.getString(0), id.getString(1)),
                    jsonObject.getString("pushIdentifierSessionEncSessionKey")
            );
        }

        public NotificationSessionKey(IdTuple pushIdentifier, String pushIdentifierSessionEncSessionKey) {
            this.pushIdentifier = pushIdentifier;
            this.pushIdentifierSessionEncSessionKey = pushIdentifierSessionEncSessionKey;
        }

        public JSONObject toJson() throws JSONException {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("pushIdentifier", pushIdentifier);
            jsonObject.put("pushIdentifierSessionEncSessionKey", pushIdentifierSessionEncSessionKey);
            return jsonObject;
        }

        public IdTuple getPushIdentifier() {
            return pushIdentifier;
        }

        public String getPushIdentifierSessionEncSessionKey() {
            return pushIdentifierSessionEncSessionKey;
        }
    }
}
